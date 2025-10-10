import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  IsBooleanField,
  IsNameField,
  IsTextAreaField,
  IsNumberField,
  IsStringArrayField,
  IsUrlField,
} from '../../../common/validators/standardized-validators';

export class FileRequirementDto {
  @IsBooleanField({ required: false, example: true })
  required?: boolean;

  @IsNumberField({ required: false, minValue: 1048576, maxValue: 52428800, example: 10485760 })
  maxFileSize?: number;

  @IsStringArrayField({ required: false, example: ['image/jpeg', 'image/png', 'image/webp'] })
  acceptedFormats?: string[];

  @IsTextAreaField({
    required: false,
    maxLength: 200,
    example: 'Clear photo of the front of your document',
  })
  description?: string;

  @IsStringArrayField({
    required: false,
    example: ['Take photo in good lighting', 'Ensure all text is clearly readable'],
  })
  guidelines?: string[];
}

export class DocumentRequirementsDto {
  @ApiProperty({
    description: 'Requirements for document front image',
    type: FileRequirementDto,
  })
  @IsOptional()
  documentFront?: FileRequirementDto;

  @ApiProperty({
    description: 'Requirements for document back image',
    type: FileRequirementDto,
  })
  @IsOptional()
  documentBack?: FileRequirementDto;

  @ApiProperty({
    description: 'Requirements for selfie with document',
    type: FileRequirementDto,
  })
  @IsOptional()
  selfie?: FileRequirementDto;

  @ApiProperty({
    description: 'Requirements for proof of address',
    type: FileRequirementDto,
  })
  @IsOptional()
  proofOfAddress?: FileRequirementDto;

  @IsNameField({
    required: false,
    maxLength: 50,
    example: '1-3 business days',
    description: 'Expected processing time',
  })
  processingTime?: string;

  @IsStringArrayField({
    required: false,
    example: ['Take photos in good lighting', 'Ensure documents are not expired'],
    description: 'General guidelines for all document submissions',
  })
  generalGuidelines?: string[];
}

export class LebanonSpecificConfigDto {
  @IsBooleanField({
    required: false,
    example: true,
    description: 'Whether Lebanon-specific features are enabled for this document type',
  })
  enabled?: boolean;

  @IsStringArrayField({
    required: false,
    example: ['qaidNumber', 'municipalityCode'],
    description: 'Required fields for Lebanese documents',
  })
  requiredFields?: string[];

  @IsStringArrayField({
    required: false,
    example: ['Include both sides of Lebanese ID card', 'Provide Qaid number if available'],
    description: 'Lebanon-specific guidelines',
  })
  guidelines?: string[];
}

export class UpdateDocumentTypeConfigDto {
  @IsBooleanField({ required: false, example: true })
  isEnabled?: boolean;

  @IsNameField({ required: false, maxLength: 100, example: 'Lebanese National ID Card' })
  displayName?: string;

  @IsTextAreaField({
    required: false,
    maxLength: 500,
    example: 'Government-issued Lebanese identity card for citizens and residents',
  })
  description?: string;

  @IsBooleanField({ required: false, example: true })
  requiresBackImage?: boolean;

  @IsStringArrayField({ required: false, example: ['LB', 'US', 'CA'] })
  supportedCountries?: string[];

  @IsUrlField({ required: false, example: 'https://example.com/sample-id.jpg' })
  exampleImageUrl?: string;

  @IsNumberField({
    required: false,
    example: 1,
    minValue: 0,
    maxValue: 1000,
    description: 'Sort order for display (lower numbers appear first)',
  })
  sortOrder?: number;

  @IsBooleanField({
    required: false,
    example: true,
    description: 'Whether this document type is prioritized for Lebanese users',
  })
  isLebanonPriority?: boolean;

  @ApiProperty({
    description: 'Document requirements configuration',
    type: DocumentRequirementsDto,
  })
  @IsOptional()
  requirements?: DocumentRequirementsDto;

  @ApiProperty({
    description: 'Lebanon-specific configuration',
    type: LebanonSpecificConfigDto,
  })
  @IsOptional()
  lebanonSpecific?: LebanonSpecificConfigDto;

  @IsTextAreaField({
    required: false,
    maxLength: 200,
    description: 'Reason for disabling (if applicable)',
  })
  disabledReason?: string;

  @IsTextAreaField({
    required: false,
    maxLength: 500,
    description: 'Additional notes for administrators',
  })
  notes?: string;
}
