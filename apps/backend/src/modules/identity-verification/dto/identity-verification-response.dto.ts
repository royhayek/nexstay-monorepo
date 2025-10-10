import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  VerificationStatus,
  DocumentType,
  VerificationRejectionReason,
} from '../../../database/schemas/identity-verification.schema';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

export class VerificationStatusHistoryDto {
  @ApiProperty({
    description: 'Verification status',
    enum: VerificationStatus,
  })
  status!: VerificationStatus;

  @ApiProperty({
    description: 'Date when status was changed',
    type: Date,
  })
  changedAt!: Date;

  @ApiProperty({
    description: 'ID of user who changed the status',
    required: false,
  })
  changedBy?: string;

  @ApiProperty({
    description: 'Comment about the status change',
    required: false,
  })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, any>;
}

export class UserSummaryDto {
  @ApiProperty({ description: 'User ID' })
  _id!: string;

  @ApiProperty({ description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({ description: 'Email address', required: false })
  email?: string;
}

export class IdentityVerificationDto {
  @ApiProperty({ description: 'Verification ID' })
  _id!: string;

  @ApiProperty({ description: 'User ID' })
  userId!: string;

  @ApiProperty({
    description: 'Current verification status',
    enum: VerificationStatus,
  })
  status!: VerificationStatus;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
  })
  documentType!: DocumentType;

  @ApiProperty({ description: 'Document number' })
  documentNumber!: string;

  @ApiProperty({ description: 'Issuing country' })
  issuingCountry!: string;

  @ApiProperty({ description: 'Issuing state', required: false })
  issuingState?: string;

  @ApiProperty({ description: 'Document expiration date', type: Date })
  expirationDate!: Date;

  @ApiProperty({ description: 'First name' })
  firstName!: string;

  @ApiProperty({ description: 'Last name' })
  lastName!: string;

  @ApiProperty({ description: 'Middle name', required: false })
  middleName?: string;

  @ApiProperty({ description: 'Date of birth', type: Date })
  dateOfBirth!: Date;

  @ApiProperty({ description: 'Place of birth', required: false })
  placeOfBirth?: string;

  @ApiProperty({ description: 'Nationality', required: false })
  nationality?: string;

  @ApiProperty({ description: 'Gender', required: false })
  gender?: string;

  @ApiProperty({ description: 'Document front image URL' })
  documentFrontImageUrl!: string;

  @ApiProperty({ description: 'Document back image URL', required: false })
  documentBackImageUrl?: string;

  @ApiProperty({ description: 'Selfie image URL', required: false })
  selfieImageUrl?: string;

  @ApiProperty({ description: 'Proof of address image URL', required: false })
  proofOfAddressImageUrl?: string;

  @ApiProperty({ description: 'Submission date', type: Date, required: false })
  submittedAt?: Date;

  @ApiProperty({ description: 'Review date', type: Date, required: false })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Reviewer user info', type: UserSummaryDto, required: false })
  reviewedBy?: UserSummaryDto;

  @ApiProperty({
    description: 'Rejection reason',
    enum: VerificationRejectionReason,
    required: false,
  })
  rejectionReason?: VerificationRejectionReason;

  @ApiProperty({ description: 'Rejection comment', required: false })
  rejectionComment?: string;

  @ApiProperty({ description: 'Verification completion date', type: Date, required: false })
  verifiedAt?: Date;

  @ApiProperty({ description: 'Verification expiry date', type: Date, required: false })
  expiresAt?: Date;

  @ApiProperty({ description: 'Number of attempts', type: Number })
  attemptCount!: number;

  @ApiProperty({ description: 'Is verification active', type: Boolean })
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Verification metadata',
    type: 'object',
    additionalProperties: true,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Status change history',
    type: [VerificationStatusHistoryDto],
  })
  @Type(() => VerificationStatusHistoryDto)
  statusHistory!: VerificationStatusHistoryDto[];

  @ApiProperty({ description: 'Creation date', type: Date })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update date', type: Date })
  updatedAt!: Date;

  // Lebanon-specific fields
  @ApiProperty({ description: 'Lebanese civil registry number', required: false })
  qaidNumber?: string;

  @ApiProperty({ description: 'Municipality code', required: false })
  municipalityCode?: string;

  @ApiProperty({ description: 'Residency status in Lebanon', required: false })
  residencyStatus?: string;

  // Populated user info
  @ApiProperty({ description: 'User information', type: UserSummaryDto, required: false })
  user?: UserSummaryDto;
}

export class VerificationStatsDto {
  @ApiProperty({ description: 'Total verifications', type: Number })
  total!: number;

  @ApiProperty({ description: 'Pending verifications', type: Number })
  pending!: number;

  @ApiProperty({ description: 'Verifications under review', type: Number })
  underReview!: number;

  @ApiProperty({ description: 'Approved verifications', type: Number })
  approved!: number;

  @ApiProperty({ description: 'Rejected verifications', type: Number })
  rejected!: number;

  @ApiProperty({ description: 'Expired verifications', type: Number })
  expired!: number;

  @ApiProperty({ description: 'Average processing time in milliseconds', type: Number })
  averageProcessingTime!: number;
}

export class DocumentTypeInfoDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
  })
  type!: DocumentType;

  @ApiProperty({ description: 'Display name' })
  displayName!: string;

  @ApiProperty({ description: 'Description' })
  description!: string;

  @ApiProperty({ description: 'Requires back image', type: Boolean })
  requiresBackImage!: boolean;

  @ApiProperty({ description: 'Supported countries', type: [String] })
  supportedCountries!: string[];

  @ApiProperty({ description: 'Example image URL', required: false })
  exampleImageUrl?: string;
}

// Create a concrete paginated DTO for identity verifications to ensure proper Swagger generation
export class IdentityVerificationsPaginatedDto extends PaginatedDto<IdentityVerificationDto> {
  @ApiProperty({ type: [IdentityVerificationDto], description: 'Array of verification items' })
  @Type(() => IdentityVerificationDto)
  declare items: IdentityVerificationDto[];
}

// Response DTOs
export class IdentityVerificationResponseDto extends BaseResponseDto<IdentityVerificationDto> {
  @ApiProperty({ description: 'Verification data', type: IdentityVerificationDto })
  @Type(() => IdentityVerificationDto)
  declare data: IdentityVerificationDto;
}

export class IdentityVerificationListResponseDto extends BaseResponseDto<IdentityVerificationsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated verification list',
    type: IdentityVerificationsPaginatedDto,
  })
  declare data: IdentityVerificationsPaginatedDto;
}

export class VerificationStatsResponseDto extends BaseResponseDto<VerificationStatsDto> {
  @ApiProperty({ description: 'Verification statistics', type: VerificationStatsDto })
  @Type(() => VerificationStatsDto)
  declare data: VerificationStatsDto;
}

export class DocumentTypesResponseDto extends BaseResponseDto<DocumentTypeInfoDto[]> {
  @ApiProperty({
    description: 'Supported document types',
    type: [DocumentTypeInfoDto],
  })
  @Type(() => DocumentTypeInfoDto)
  declare data: DocumentTypeInfoDto[];
}

// Additional operation-specific response DTOs
export class DocumentRequirementsResponseDto extends BaseResponseDto<any> {
  @ApiProperty({
    description: 'Document requirements data',
    type: 'object',
    additionalProperties: true,
  })
  declare data: any;
}

export class VerificationCancellationResponseDto extends BaseResponseDto<IdentityVerificationDto> {
  @ApiProperty({
    description: 'Cancelled verification data',
    type: IdentityVerificationDto,
  })
  @Type(() => IdentityVerificationDto)
  declare data: IdentityVerificationDto;
}

export class VerificationSubmissionResponseDto extends BaseResponseDto<IdentityVerificationDto> {
  @ApiProperty({
    description: 'Submitted verification data',
    type: IdentityVerificationDto,
  })
  @Type(() => IdentityVerificationDto)
  declare data: IdentityVerificationDto;
}

// Admin-specific response DTOs
export class DocumentTypeConfigResponseDto extends BaseResponseDto<any> {
  @ApiProperty({
    description: 'Document type configuration data',
    type: 'object',
    additionalProperties: true,
  })
  declare data: any;
}

export class DocumentTypeConfigListResponseDto extends BaseResponseDto<any[]> {
  @ApiProperty({
    description: 'List of document type configurations',
    type: 'array',
    items: { type: 'object' },
  })
  declare data: any[];
}

export class VerificationStatusUpdateResponseDto extends BaseResponseDto<IdentityVerificationDto> {
  @ApiProperty({
    description: 'Updated verification data',
    type: IdentityVerificationDto,
  })
  @Type(() => IdentityVerificationDto)
  declare data: IdentityVerificationDto;
}

export class VerificationDeletionResponseDto extends BaseResponseDto<any> {
  @ApiProperty({
    description: 'Verification deletion result',
    type: 'object',
    additionalProperties: true,
  })
  declare data: any;
}

export class VerificationExpirationResponseDto extends BaseResponseDto<{ expiredCount: number }> {
  @ApiProperty({
    description: 'Verification expiration result',
    type: 'object',
    properties: {
      expiredCount: { type: 'number', description: 'Number of expired verifications' },
    },
  })
  declare data: { expiredCount: number };
}
