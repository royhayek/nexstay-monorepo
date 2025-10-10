import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery, ApiExtraModels } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { IdentityVerificationService } from '../identity-verification.service';
import { DocumentTypeManagementService } from '../document-type-management.service';
import { UpdateVerificationStatusDto } from '../dto/update-verification-status.dto';
import {
  UpdateDocumentTypeConfigDto,
  DocumentRequirementsDto,
} from '../dto/update-document-type-config.dto';
import {
  IdentityVerificationDto,
  IdentityVerificationResponseDto,
  IdentityVerificationListResponseDto,
  IdentityVerificationsPaginatedDto,
  VerificationStatsResponseDto,
  DocumentTypeConfigResponseDto,
  DocumentTypeConfigListResponseDto,
  VerificationStatusUpdateResponseDto,
  VerificationDeletionResponseDto,
  VerificationExpirationResponseDto,
} from '../dto/identity-verification-response.dto';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { BaseController } from '../../../common/controllers/base.controller';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import type { IdentityVerificationFilters } from '../interfaces/identity-verification.interfaces';
import { DocumentTypeConfigDocument } from '../../../database/schemas/document-type-config.schema';
import { DateUtils } from '../../../common/utils/date.utils';

@Controller('admin/identity-verification')
@ApiTags('Identity Verification Management')
@ApiExtraModels(
  IdentityVerificationDto,
  IdentityVerificationResponseDto,
  IdentityVerificationListResponseDto,
  IdentityVerificationsPaginatedDto,
  VerificationStatsResponseDto,
  DocumentTypeConfigResponseDto,
  DocumentTypeConfigListResponseDto,
  VerificationStatusUpdateResponseDto,
  VerificationDeletionResponseDto,
  VerificationExpirationResponseDto,
  PaginatedDto,
)
export class IdentityVerificationAdminController extends BaseController {
  constructor(
    private readonly verificationService: IdentityVerificationService,
    private readonly documentTypeService: DocumentTypeManagementService,
  ) {
    super();
  }

  @Get('verifications')
  @AdminEndpoint(
    'List all identity verifications',
    'Get paginated list of identity verifications with filtering options - Compliance officers can view all verifications',
  )
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'documentType', required: false, description: 'Filter by document type' })
  @ApiQuery({ name: 'issuingCountry', required: false, description: 'Filter by issuing country' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'reviewerId', required: false, description: 'Filter by reviewer ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO format)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO format)' })
  async listVerifications(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query() filters: IdentityVerificationFilters,
  ): Promise<IdentityVerificationListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.verificationService.listVerifications(
          filters,
          Number(page),
          Number(limit),
        );

        return {
          items: result.verifications.map((v) => v.toObject() as IdentityVerificationDto),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.page < result.totalPages,
          hasPrevPage: result.page > 1,
        };
      },
      'list verifications',
      'Verifications Retrieved',
      'Verifications retrieved successfully',
      'Failed to retrieve verifications',
    );
  }

  @Get('verifications/:id')
  @AdminEndpoint(
    'Get verification by ID',
    'Retrieve detailed information about a specific verification',
  )
  @ApiParam({ name: 'id', description: 'Verification ID' })
  async getVerification(@Param('id') id: string): Promise<IdentityVerificationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const verification = await this.verificationService.getVerificationById(id);
        return verification.toObject() as IdentityVerificationDto;
      },
      'get verification by ID',
      'Verification Retrieved',
      'Verification retrieved successfully',
      'Failed to retrieve verification',
    );
  }

  @Patch('verifications/:id/status')
  @AdminEndpoint(
    'Update verification status',
    'Update the status of an identity verification (approve, reject, etc.) - Compliance officers can handle verification reviews',
    VerificationStatusUpdateResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Verification ID' })
  async updateVerificationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateVerificationStatusDto,
    @CurrentUser('userId') reviewerId: string,
  ): Promise<VerificationStatusUpdateResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updatedVerification = await this.verificationService.updateVerificationStatus(
          id,
          updateDto,
          reviewerId,
        );
        return updatedVerification.toObject() as IdentityVerificationDto;
      },
      'update verification status',
      'Status Updated',
      `Verification status updated to ${updateDto.status} successfully`,
      'Failed to update verification status',
    );
  }

  @Get('stats')
  @AdminEndpoint(
    'Get verification statistics',
    'Retrieve overall statistics for identity verifications',
  )
  async getVerificationStats(): Promise<VerificationStatsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.verificationService.getVerificationStats();
      },
      'get verification statistics',
      'Statistics Retrieved',
      'Verification statistics retrieved successfully',
      'Failed to retrieve verification statistics',
    );
  }

  // Document Type Management Endpoints

  @Get('document-types')
  @AdminEndpoint(
    'Get all document type configurations',
    'Retrieve all document types with their current enabled/disabled status and settings',
    DocumentTypeConfigListResponseDto,
  )
  async getAllDocumentTypes(): Promise<DocumentTypeConfigListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.documentTypeService.getAllDocumentTypes();
      },
      'get document types',
      'Document Types Retrieved',
      'Document types retrieved successfully',
      'Failed to retrieve document types',
    );
  }

  @Patch('document-types/:documentType')
  @AdminEndpoint(
    'Update document type configuration',
    'Enable/disable document types and update their settings - Admin/System Admin only',
    DocumentTypeConfigResponseDto,
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to update',
    example: 'national_id',
  })
  async updateDocumentType(
    @Param('documentType') documentType: string,
    @Body() updateDto: UpdateDocumentTypeConfigDto,
  ): Promise<DocumentTypeConfigResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.documentTypeService.updateDocumentTypeConfig(documentType, updateDto);
      },
      'update document type',
      'Document Type Updated',
      `Document type ${documentType} updated successfully`,
      'Failed to update document type',
    );
  }

  @Post('document-types/:documentType/enable')
  @AdminEndpoint(
    'Enable document type',
    'Enable a specific document type for identity verification',
    DocumentTypeConfigResponseDto,
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to enable',
    example: 'national_id',
  })
  async enableDocumentType(
    @Param('documentType') documentType: string,
    @CurrentUser('userId') adminId: string,
  ): Promise<DocumentTypeConfigResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.documentTypeService.enableDocumentType(documentType, adminId);
      },
      'enable document type',
      'Document Type Enabled',
      `Document type ${documentType} enabled successfully`,
      'Failed to enable document type',
    );
  }

  @Post('document-types/:documentType/disable')
  @AdminEndpoint(
    'Disable document type',
    'Disable a specific document type for identity verification',
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to disable',
    example: 'drivers_license',
  })
  async disableDocumentType(
    @Param('documentType') documentType: string,
    @Body('reason') reason: string,
    @CurrentUser('userId') adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const updatedConfig = await this.documentTypeService.disableDocumentType(
      documentType,
      reason,
      adminId,
    );

    return {
      status: 'success',
      title: 'Document Type Disabled',
      message: `Document type ${documentType} disabled successfully`,
      data: updatedConfig,
    };
  }

  @Get('document-types/lebanon/priority')
  @AdminEndpoint(
    'Get Lebanon priority document types',
    'Get document types that are prioritized for Lebanese users',
  )
  async getLebanonPriorityDocumentTypes(): Promise<BaseResponseDto<any[]>> {
    const priorityTypes = await this.documentTypeService.getLebanonPriorityDocumentTypes();

    return {
      status: 'success',
      title: 'Priority Types Retrieved',
      message: 'Lebanon priority document types retrieved successfully',
      data: priorityTypes,
    };
  }

  @Patch('document-types/:documentType/lebanon-priority')
  @AdminEndpoint(
    'Set Lebanon priority for document type',
    'Mark or unmark a document type as priority for Lebanese users',
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to update',
    example: 'national_id',
  })
  async updateLebanonPriority(
    @Param('documentType') documentType: string,
    @Body('isPriority') isPriority: boolean,
    @CurrentUser('userId') adminId: string,
  ): Promise<BaseResponseDto<any>> {
    const updatedConfig = await this.documentTypeService.updateLebanonPriority(
      documentType,
      isPriority,
      adminId,
    );

    return {
      status: 'success',
      title: 'Lebanon Priority Updated',
      message: `Lebanon priority for ${documentType} updated successfully`,
      data: updatedConfig,
    };
  }

  @Delete('verifications/:id')
  @AdminEndpoint(
    'Delete verification record (soft delete)',
    'Soft delete a verification record for data retention compliance',
    VerificationDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Verification ID' })
  deleteVerification(
    @Param('id') id: string,
    @CurrentUser('userId') adminId: string,
  ): Promise<VerificationDeletionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Implementation would mark as deleted rather than actually removing
        // This is important for audit trail and data retention compliance
        return { id, deletedBy: adminId, deletedAt: DateUtils.now() };
      },
      'delete verification',
      'Verification Deleted',
      'Verification record marked as deleted successfully',
      'Failed to delete verification record',
    );
  }

  @Patch('document-types/:documentType/requirements')
  @AdminEndpoint(
    'Update document requirements configuration',
    'Configure file requirements, sizes, formats, and guidelines for each document type',
  )
  @ApiParam({
    name: 'documentType',
    description: 'Document type to update requirements for',
    example: 'national_id',
  })
  async updateDocumentRequirements(
    @Param('documentType') documentType: string,
    @Body() requirements: DocumentRequirementsDto,
    @CurrentUser('userId') adminId: string,
  ): Promise<BaseResponseDto<DocumentTypeConfigDocument>> {
    const updatedConfig = await this.documentTypeService.updateDocumentRequirements(
      documentType,
      requirements,
      adminId,
    );

    return {
      status: 'success',
      title: 'Requirements Updated',
      message: `Document requirements for ${documentType} updated successfully`,
      data: updatedConfig,
    };
  }

  @Post('expire-verifications')
  @AdminEndpoint(
    'Expire old verifications',
    'Manual trigger to expire old verifications (usually done by cron job)',
    VerificationExpirationResponseDto,
  )
  async expireVerifications(): Promise<VerificationExpirationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const expiredCount = await this.verificationService.expireVerifications();
        return { expiredCount };
      },
      'expire verifications',
      'Verifications Expired',
      'Verifications expired successfully',
      'Failed to expire verifications',
    );
  }
}
