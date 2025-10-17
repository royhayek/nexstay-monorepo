import { IsArray, IsOptional, ArrayMinSize, IsMongoId } from 'class-validator';
import {
  IsEnumField,
  IsTextAreaField,
} from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { VerificationRejectionReason } from '../../../database/schemas/identity-verification.schema';

/**
 * Bulk Approve Verifications DTO
 */
export class BulkApproveVerificationsDto {
  @ApiProperty({
    description: 'Array of verification IDs to approve',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one verification ID is required' })
  @IsMongoId({ each: true, message: 'Each verification ID must be a valid MongoDB ObjectId' })
  verificationIds!: string[];

  @IsTextAreaField({
    required: false,
    minLength: 5,
    maxLength: 500,
    description: 'Optional comment for bulk approval',
    example: 'Batch approval of valid documents',
  })
  @IsOptional()
  comment?: string;
}

/**
 * Bulk Reject Verifications DTO
 */
export class BulkRejectVerificationsDto {
  @ApiProperty({
    description: 'Array of verification IDs to reject',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one verification ID is required' })
  @IsMongoId({ each: true, message: 'Each verification ID must be a valid MongoDB ObjectId' })
  verificationIds!: string[];

  @IsEnumField({
    enum: VerificationRejectionReason,
    required: true,
    description: 'Rejection reason (same for all)',
    example: VerificationRejectionReason.POOR_IMAGE_QUALITY,
  })
  rejectionReason!: VerificationRejectionReason;

  @IsTextAreaField({
    required: true,
    minLength: 10,
    maxLength: 1000,
    description: 'Rejection comment (required for bulk rejection)',
    example: 'All documents in this batch have poor image quality. Please resubmit with clearer images.',
  })
  comment!: string;
}

/**
 * Bulk Operation Result Item DTO
 */
export class BulkOperationResultItemDto {
  @ApiProperty({
    description: 'Verification ID',
    example: '507f1f77bcf86cd799439011',
  })
  verificationId!: string;

  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Error message if operation failed',
    example: 'Verification not found',
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'User ID associated with verification',
    example: '507f1f77bcf86cd799439012',
    required: false,
  })
  userId?: string;
}

/**
 * Bulk Operation Result DTO
 */
export class BulkOperationResultDto {
  @ApiProperty({
    description: 'Total verifications processed',
    example: 10,
  })
  totalProcessed!: number;

  @ApiProperty({
    description: 'Successfully processed count',
    example: 8,
  })
  successCount!: number;

  @ApiProperty({
    description: 'Failed count',
    example: 2,
  })
  failedCount!: number;

  @ApiProperty({
    type: [BulkOperationResultItemDto],
    description: 'Detailed results for each verification',
  })
  results!: BulkOperationResultItemDto[];

  @ApiProperty({
    description: 'Operation timestamp',
    example: '2025-10-12T10:30:00.000Z',
  })
  processedAt!: Date;

  @ApiProperty({
    description: 'Reviewer who performed the operation',
    example: '507f1f77bcf86cd799439013',
  })
  reviewedBy!: string;
}

/**
 * Response DTOs using BaseResponseDto factory
 */
export type BulkApproveResponseDto = BaseResponseDto<BulkOperationResultDto>;
export type BulkRejectResponseDto = BaseResponseDto<BulkOperationResultDto>;
