import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiParam, ApiQuery, ApiExtraModels } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { IdentityVerificationService } from '../identity-verification.service';
import { CreateIdentityVerificationDto } from '../dto/create-identity-verification.dto';
import {
  IdentityVerificationDto,
  IdentityVerificationResponseDto,
  DocumentTypesResponseDto,
  DocumentTypeInfoDto,
  DocumentRequirementsResponseDto,
  VerificationCancellationResponseDto,
  VerificationSubmissionResponseDto,
} from '../dto/identity-verification-response.dto';
import { BaseController } from '../../../common/controllers/base.controller';
import {
  getDocumentTypeInfo,
  DOCUMENT_TYPE_CONFIG,
} from '../../../common/enums/identity-verification.enums';

@Controller('app/identity-verification')
@ApiTags('Identity Verification')
@ApiExtraModels(
  IdentityVerificationDto,
  IdentityVerificationResponseDto,
  DocumentTypesResponseDto,
  DocumentTypeInfoDto,
  DocumentRequirementsResponseDto,
  VerificationCancellationResponseDto,
  VerificationSubmissionResponseDto,
)
export class IdentityVerificationAppController extends BaseController {
  constructor(private readonly verificationService: IdentityVerificationService) {
    super();
  }

  @Post()
  @ProtectedEndpoint(
    'Submit identity verification request',
    'Upload documents and personal information for identity verification. Supports Lebanese documents with priority.',
    VerificationSubmissionResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'documentFront', maxCount: 1 },
      { name: 'documentBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
      { name: 'proofOfAddress', maxCount: 1 },
    ]),
  )
  async submitVerification(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateIdentityVerificationDto,
    @UploadedFiles()
    files: {
      documentFront?: Express.Multer.File[];
      documentBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      proofOfAddress?: Express.Multer.File[];
    },
  ): Promise<VerificationSubmissionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Validate required files
        if (!files.documentFront || files.documentFront.length === 0) {
          throw new BadRequestException('Document front image is required');
        }

        const fileUpload = {
          documentFront: files.documentFront[0],
          documentBack: files.documentBack?.[0],
          selfie: files.selfie?.[0],
          proofOfAddress: files.proofOfAddress?.[0],
        };

        const verification = await this.verificationService.createVerification(
          userId,
          createDto,
          fileUpload,
          {
            // Metadata can be enhanced with request info
            ipAddress: '0.0.0.0', // Will be extracted from request in real implementation
            userAgent: 'Unknown', // Will be extracted from request headers
          },
        );

        return verification.toObject() as IdentityVerificationDto;
      },
      'submit identity verification',
      'Verification Submitted',
      'Identity verification submitted successfully. Review typically takes 1-3 business days.',
      'Failed to submit verification request',
    );
  }

  @Get('me')
  @ProtectedEndpoint(
    'Get current user verification status',
    "Retrieve the current user's identity verification status and details",
    IdentityVerificationResponseDto,
  )
  async getMyVerification(
    @CurrentUser('userId') userId: string,
  ): Promise<IdentityVerificationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const verification = await this.verificationService.getVerificationByUserId(userId);

        if (!verification) {
          throw new NotFoundException('No verification found for user');
        }

        return verification.toObject() as IdentityVerificationDto;
      },
      'get user verification',
      'Verification Retrieved',
      'Verification status retrieved successfully',
      'Failed to retrieve verification status',
    );
  }

  @Delete('me/cancel')
  @ProtectedEndpoint(
    'Cancel pending verification',
    "Cancel the current user's pending identity verification request",
    VerificationCancellationResponseDto,
  )
  async cancelMyVerification(
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ): Promise<VerificationCancellationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const verification = await this.verificationService.getVerificationByUserId(userId);

        if (!verification) {
          throw new BadRequestException('No verification found to cancel');
        }

        // Use the verification document ID directly
        const cancelledVerification = await this.verificationService.cancelVerification(
          String(verification.id),
          userId,
          reason,
        );

        return cancelledVerification.toObject() as IdentityVerificationDto;
      },
      'cancel verification',
      'Verification Cancelled',
      'Verification cancelled successfully',
      'Failed to cancel verification',
    );
  }

  @Get('document-types')
  @ProtectedEndpoint(
    'Get supported document types',
    'Retrieve list of supported document types, prioritized for Lebanese documents',
    DocumentTypesResponseDto,
  )
  @ApiQuery({
    name: 'country',
    required: false,
    description: 'Filter by country code (e.g., LB for Lebanon)',
    example: 'LB',
  })
  async getSupportedDocumentTypes(
    @Query('country') country?: string,
  ): Promise<DocumentTypesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        const supportedTypes = this.verificationService.getSupportedDocumentTypes(country);

        const documentTypes: DocumentTypeInfoDto[] = supportedTypes.map((type) => {
          const config = getDocumentTypeInfo(type);
          return {
            type: config.type,
            displayName: config.displayName,
            description: config.description,
            requiresBackImage: config.requiresBackImage,
            supportedCountries: config.supportedCountries,
            exampleImageUrl: config.exampleImageUrl,
          };
        });

        // Prioritize Lebanese-specific document types
        if (country === 'LB' || !country) {
          documentTypes.sort((a, b) => {
            const aSupportsLB =
              a.supportedCountries.includes('LB') || a.supportedCountries.includes('*');
            const bSupportsLB =
              b.supportedCountries.includes('LB') || b.supportedCountries.includes('*');

            if (aSupportsLB && !bSupportsLB) return -1;
            if (!aSupportsLB && bSupportsLB) return 1;
            return 0;
          });
        }

        return documentTypes;
      },
      'get supported document types',
      'Document Types Retrieved',
      'Supported document types retrieved successfully',
      'Failed to retrieve document types',
    );
  }

  @Get('requirements/:documentType')
  @ProtectedEndpoint(
    'Get document type requirements',
    'Get specific requirements for a document type, with Lebanese-specific details',
    DocumentRequirementsResponseDto,
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to get requirements for',
    enum: Object.values(DOCUMENT_TYPE_CONFIG).map((config) => config.type),
  })
  async getDocumentRequirements(
    @Param('documentType') documentType: string,
  ): Promise<DocumentRequirementsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        const config = DOCUMENT_TYPE_CONFIG[documentType as keyof typeof DOCUMENT_TYPE_CONFIG];

        if (!config) {
          throw new BadRequestException('Invalid document type');
        }

        const requirements = {
          documentType: config.type,
          displayName: config.displayName,
          description: config.description,
          requiresBackImage: config.requiresBackImage,
          supportedCountries: config.supportedCountries,
          requirements: {
            documentFront: {
              required: true,
              description: 'Clear photo of the front of your document',
              acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
              maxSize: '10MB',
              guidelines: [
                'Take photo in good lighting',
                'Ensure all text is clearly readable',
                'Avoid glare and shadows',
                'Include all corners of the document',
              ],
            },
            documentBack: {
              required: config.requiresBackImage,
              description: config.requiresBackImage
                ? 'Clear photo of the back of your document'
                : 'Not required for this document type',
              acceptedFormats: config.requiresBackImage
                ? ['image/jpeg', 'image/png', 'image/webp']
                : [],
              maxSize: config.requiresBackImage ? '10MB' : undefined,
            },
            selfie: {
              required: false,
              description:
                'Optional: Photo of yourself holding the document (recommended for faster processing)',
              acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
              maxSize: '5MB',
            },
            proofOfAddress: {
              required: false,
              description:
                'Optional: Recent utility bill or bank statement for address verification',
              acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
              maxSize: '10MB',
            },
          },
          lebanonSpecific:
            documentType === 'national_id'
              ? {
                  description: 'For Lebanese Identity Cards, please ensure the following:',
                  guidelines: [
                    'Include both sides of the Lebanese ID card',
                    'Provide Qaid number if available',
                    'Include municipality code for faster processing',
                    'Specify your residency status (citizen/resident)',
                  ],
                  additionalFields: [
                    'qaidNumber: Lebanese civil registry number (optional)',
                    'municipalityCode: Municipality registration code (optional)',
                    'residencyStatus: Your status in Lebanon (citizen/resident/temporary_visitor)',
                  ],
                }
              : null,
        };

        return requirements;
      },
      'get document requirements',
      'Requirements Retrieved',
      'Document requirements retrieved successfully',
      'Failed to retrieve document requirements',
    );
  }
}
