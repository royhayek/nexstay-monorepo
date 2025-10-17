import { IsOptional } from 'class-validator';
import { IsEnumField, IsNumberField } from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Verification Queue Item DTO
 * Enhanced verification item with queue-specific metadata
 */
export class VerificationQueueItemDto {
  @ApiProperty({ description: 'Verification ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439012' })
  userId!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  userName!: string;

  @ApiProperty({
    description: 'Document type',
    example: 'passport',
    enum: ['passport', 'national_id', 'drivers_license', 'residence_permit'],
  })
  documentType!: string;

  @ApiProperty({
    description: 'Issuing country',
    example: 'US',
  })
  issuingCountry!: string;

  @ApiProperty({
    description: 'Verification status',
    example: 'pending',
    enum: ['pending', 'under_review', 'approved', 'rejected', 'expired'],
  })
  status!: string;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2025-10-10T14:30:00.000Z',
  })
  submittedAt!: Date;

  @ApiProperty({
    description: 'Hours since submission',
    example: 36.5,
  })
  hoursSinceSubmission!: number;

  @ApiProperty({
    description: 'Priority level based on aging',
    example: 'high',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  priority!: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'Previous attempt count',
    example: 1,
  })
  attemptCount!: number;

  @ApiProperty({
    description: 'Has selfie image',
    example: true,
  })
  hasSelfie!: boolean;

  @ApiProperty({
    description: 'Has proof of address',
    example: false,
  })
  hasProofOfAddress!: boolean;

  @ApiProperty({
    description: 'Risk score (if available)',
    example: 0.15,
    required: false,
  })
  riskScore?: number;

  @ApiProperty({
    description: 'Fraud detection flags',
    example: [],
    required: false,
  })
  fraudFlags?: string[];
}

/**
 * Aging Alert Item DTO
 * Verification requiring immediate attention
 */
export class AgingAlertItemDto {
  @ApiProperty({ description: 'Verification ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439012' })
  userId!: string;

  @ApiProperty({ description: 'User name', example: 'Jane Smith' })
  userName!: string;

  @ApiProperty({ description: 'User email', example: 'jane@example.com' })
  userEmail!: string;

  @ApiProperty({
    description: 'Document type',
    example: 'national_id',
  })
  documentType!: string;

  @ApiProperty({
    description: 'Submission timestamp',
    example: '2025-10-05T10:00:00.000Z',
  })
  submittedAt!: Date;

  @ApiProperty({
    description: 'Days since submission',
    example: 7,
  })
  daysSinceSubmission!: number;

  @ApiProperty({
    description: 'Alert level',
    example: 'critical',
    enum: ['warning', 'urgent', 'critical'],
  })
  alertLevel!: 'warning' | 'urgent' | 'critical';

  @ApiProperty({
    description: 'Alert reason',
    example: 'Verification pending for more than 7 days',
  })
  alertReason!: string;

  @ApiProperty({
    description: 'Previous attempt count',
    example: 2,
  })
  attemptCount!: number;
}

/**
 * Query parameters for verification queue
 */
export class VerificationQueueQueryDto {
  @IsNumberField({
    required: false,
    minValue: 1,
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  page?: number;

  @IsNumberField({
    required: false,
    minValue: 1,
    maxValue: 100,
    description: 'Items per page',
    example: 20,
  })
  @IsOptional()
  limit?: number;

  @IsEnumField({
    enum: ['low', 'medium', 'high', 'critical'],
    required: false,
    description: 'Filter by priority level',
    example: 'high',
  })
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsEnumField({
    enum: ['passport', 'national_id', 'drivers_license', 'residence_permit'],
    required: false,
    description: 'Filter by document type',
    example: 'passport',
  })
  @IsOptional()
  documentType?: string;

  @IsEnumField({
    enum: ['oldest', 'newest', 'priority', 'risk'],
    required: false,
    description: 'Sort order',
    example: 'priority',
  })
  @IsOptional()
  sortBy?: 'oldest' | 'newest' | 'priority' | 'risk';
}

/**
 * Query parameters for aging alerts
 */
export class AgingAlertsQueryDto {
  @IsEnumField({
    enum: ['warning', 'urgent', 'critical'],
    required: false,
    description: 'Filter by alert level',
    example: 'critical',
  })
  @IsOptional()
  alertLevel?: 'warning' | 'urgent' | 'critical';

  @IsNumberField({
    required: false,
    minValue: 1,
    description: 'Minimum days since submission',
    example: 3,
  })
  @IsOptional()
  minDays?: number;
}

/**
 * Response DTOs
 */
export class VerificationQueueResponseDto {
  @ApiProperty({
    type: [VerificationQueueItemDto],
    description: 'Queue items',
  })
  items!: VerificationQueueItemDto[];

  @ApiProperty({ description: 'Total items', example: 42 })
  total!: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  totalPages!: number;

  @ApiProperty({
    description: 'Priority counts',
    example: { low: 10, medium: 15, high: 12, critical: 5 },
  })
  priorityCounts!: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export class AgingAlertsResponseDto {
  @ApiProperty({
    type: [AgingAlertItemDto],
    description: 'Aging alert items',
  })
  items!: AgingAlertItemDto[];

  @ApiProperty({ description: 'Total alerts', example: 15 })
  total!: number;

  @ApiProperty({
    description: 'Alert level counts',
    example: { warning: 8, urgent: 5, critical: 2 },
  })
  alertLevelCounts!: {
    warning: number;
    urgent: number;
    critical: number;
  };
}

export type VerificationQueueWrapperResponseDto = BaseResponseDto<VerificationQueueResponseDto>;
export type AgingAlertsWrapperResponseDto = BaseResponseDto<AgingAlertsResponseDto>;
