import { ApiProperty } from '@nestjs/swagger';
import { createResponseDto } from '../../../common/dto/base-response.dto';
import { PayoutStatus, PayoutType } from '../../../common/enums/payout.enums';

/**
 * Payout creation result DTO
 */
export class PayoutCreationResultDto {
  @ApiProperty({ description: 'Created payout ID', example: '507f1f77bcf86cd799439011' })
  payoutId!: string;

  @ApiProperty({ description: 'Payout reference', example: 'PO1642320000ABC123' })
  reference!: string;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status!: PayoutStatus;

  @ApiProperty({ description: 'Payout type', enum: PayoutType })
  type!: PayoutType;

  @ApiProperty({ description: 'Net amount to be paid', example: 481 })
  netAmount!: number;

  @ApiProperty({ description: 'Expected payout date', example: '2024-01-16T10:00:00Z' })
  payoutDate!: Date;

  @ApiProperty({
    description: 'Expected arrival date',
    example: '2024-01-19T10:00:00Z',
    required: false,
  })
  expectedArrival?: Date;
}

/**
 * Payout cancellation result DTO
 */
export class PayoutCancellationResultDto {
  @ApiProperty({ description: 'Cancelled payout ID', example: '507f1f77bcf86cd799439011' })
  payoutId!: string;

  @ApiProperty({ description: 'Previous status', enum: PayoutStatus })
  previousStatus!: PayoutStatus;

  @ApiProperty({ description: 'New status', enum: PayoutStatus })
  newStatus!: PayoutStatus;

  @ApiProperty({ description: 'Cancellation reason', example: 'Cancelled by host request' })
  reason!: string;

  @ApiProperty({ description: 'Cancelled at', example: '2024-01-16T10:00:00Z' })
  cancelledAt!: Date;
}

/**
 * Payout method deletion result DTO
 */
export class PayoutMethodDeletionResultDto {
  @ApiProperty({ description: 'Deleted payout method ID', example: '507f1f77bcf86cd799439011' })
  payoutMethodId!: string;

  @ApiProperty({ description: 'Method nickname', example: 'My Main Bank Account' })
  nickname!: string;

  @ApiProperty({ description: 'Deleted at', example: '2024-01-16T10:00:00Z' })
  deletedAt!: Date;
}

/**
 * Payout retry result DTO
 */
export class PayoutRetryResultDto {
  @ApiProperty({ description: 'Payout ID', example: '507f1f77bcf86cd799439011' })
  payoutId!: string;

  @ApiProperty({ description: 'Retry attempt number', example: 2 })
  retryAttempt!: number;

  @ApiProperty({ description: 'New status', enum: PayoutStatus })
  status!: PayoutStatus;

  @ApiProperty({
    description: 'Next retry scheduled at',
    example: '2024-01-17T10:00:00Z',
    required: false,
  })
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Retry message', example: 'Payout retry initiated successfully' })
  message!: string;
}

/**
 * Batch payout processing result DTO
 */
export class BatchPayoutResultDto {
  @ApiProperty({ description: 'Total hosts processed', example: 25 })
  totalProcessed!: number;

  @ApiProperty({ description: 'Successful payouts created', example: 22 })
  successful!: number;

  @ApiProperty({ description: 'Failed payouts', example: 3 })
  failed!: number;

  @ApiProperty({ description: 'Skipped payouts (below minimum)', example: 5 })
  skipped!: number;

  @ApiProperty({ description: 'Total amount processed', example: 15000 })
  totalAmount!: number;

  @ApiProperty({
    description: 'Processing errors',
    type: [String],
    example: ['Host 123: Invalid payout method'],
  })
  errors!: string[];

  @ApiProperty({ description: 'Batch processing ID', example: 'BATCH-20240116-001' })
  batchId!: string;

  @ApiProperty({ description: 'Processing started at', example: '2024-01-16T01:00:00Z' })
  startedAt!: Date;

  @ApiProperty({ description: 'Processing completed at', example: '2024-01-16T01:05:00Z' })
  completedAt!: Date;
}

// Create response DTOs using factory pattern
export const PayoutCreationResponse = createResponseDto(PayoutCreationResultDto);
export const PayoutCancellationResponse = createResponseDto(PayoutCancellationResultDto);
export const PayoutMethodDeletionResponse = createResponseDto(PayoutMethodDeletionResultDto);
export const PayoutRetryResponse = createResponseDto(PayoutRetryResultDto);
export const BatchPayoutResponse = createResponseDto(BatchPayoutResultDto);

// Type aliases for better code readability
export type PayoutCreationResponseType = InstanceType<typeof PayoutCreationResponse>;
export type PayoutCancellationResponseType = InstanceType<typeof PayoutCancellationResponse>;
export type PayoutMethodDeletionResponseType = InstanceType<typeof PayoutMethodDeletionResponse>;
export type PayoutRetryResponseType = InstanceType<typeof PayoutRetryResponse>;
export type BatchPayoutResponseType = InstanceType<typeof BatchPayoutResponse>;
