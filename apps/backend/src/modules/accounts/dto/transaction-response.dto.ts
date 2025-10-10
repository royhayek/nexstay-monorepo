import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TransactionType, TransactionStatus } from '../../../database/schemas/transaction.schema';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';
import { AccountDataDto } from './account-response.dto';

export class TransactionAmountDto {
  @ApiProperty({ description: 'Transaction amount in cents', example: 5000 })
  @Expose()
  value: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @Expose()
  currency: string;
}

export class TransactionReferenceDto {
  @ApiProperty({ description: 'Reference type', example: 'Booking' })
  @Expose()
  type: string;

  @ApiProperty({ description: 'Reference ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Reference code', required: false })
  @Expose()
  code?: string;
}

export class TransactionMetadataDto {
  @ApiProperty({ description: 'Booking ID', example: '507f1f77bcf86cd799439011', required: false })
  @Expose()
  bookingId?: string;

  @ApiProperty({ description: 'Guest ID', example: '507f1f77bcf86cd799439011', required: false })
  @Expose()
  guestId?: string;

  @ApiProperty({ description: 'Host ID', example: '507f1f77bcf86cd799439011', required: false })
  @Expose()
  hostId?: string;

  @ApiProperty({ description: 'Platform fee rate', example: 0.15, required: false })
  @Expose()
  platformFeeRate?: number;

  @ApiProperty({ description: 'Fast Pay fee amount', example: 75, required: false })
  @Expose()
  fastPayFee?: number;

  @ApiProperty({ description: 'Payout method', enum: ['STANDARD', 'FAST_PAY'], required: false })
  @Expose()
  payoutMethod?: string;
}

export class TransactionDataDto {
  @ApiProperty({ description: 'Transaction ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  _id: string;

  @ApiProperty({
    description: 'Unique transaction identifier',
    example: 'TXN-1642275600000-abc123def',
  })
  @Expose()
  transactionId: string;

  @ApiProperty({ description: 'Source account ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  fromAccountId: string;

  @ApiProperty({ description: 'Destination account ID', example: '507f1f77bcf86cd799439012' })
  @Expose()
  toAccountId: string;

  @ApiProperty({ description: 'Transaction amount', type: TransactionAmountDto })
  @Expose()
  @Type(() => TransactionAmountDto)
  amount: TransactionAmountDto;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.BOOKING_PAYMENT,
  })
  @Expose()
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  @Expose()
  status: TransactionStatus;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Booking payment held in escrow',
  })
  @Expose()
  description: string;

  @ApiProperty({ description: 'User-friendly narrative', required: false })
  @Expose()
  narrative?: string;

  @ApiProperty({
    description: 'Transaction reference',
    type: TransactionReferenceDto,
    required: false,
  })
  @Expose()
  @Type(() => TransactionReferenceDto)
  reference?: TransactionReferenceDto;

  @ApiProperty({
    description: 'Transaction metadata',
    type: TransactionMetadataDto,
    required: false,
  })
  @Expose()
  @Type(() => TransactionMetadataDto)
  metadata?: TransactionMetadataDto;

  @ApiProperty({ description: 'Source account details', type: AccountDataDto, required: false })
  @Expose()
  @Type(() => AccountDataDto)
  fromAccount?: AccountDataDto;

  @ApiProperty({
    description: 'Destination account details',
    type: AccountDataDto,
    required: false,
  })
  @Expose()
  @Type(() => AccountDataDto)
  toAccount?: AccountDataDto;

  @ApiProperty({ description: 'Scheduled release timestamp', required: false })
  @Expose()
  scheduledReleaseAt?: Date;

  @ApiProperty({ description: 'Processing timestamp', required: false })
  @Expose()
  processedAt?: Date;

  @ApiProperty({ description: 'Failed timestamp', required: false })
  @Expose()
  failedAt?: Date;

  @ApiProperty({ description: 'Failure reason', required: false })
  @Expose()
  failureReason?: string;

  @ApiProperty({ description: 'Source account balance before transaction', required: false })
  @Expose()
  fromAccountBalanceBefore?: number;

  @ApiProperty({ description: 'Source account balance after transaction', required: false })
  @Expose()
  fromAccountBalanceAfter?: number;

  @ApiProperty({ description: 'Destination account balance before transaction', required: false })
  @Expose()
  toAccountBalanceBefore?: number;

  @ApiProperty({ description: 'Destination account balance after transaction', required: false })
  @Expose()
  toAccountBalanceAfter?: number;

  @ApiProperty({ description: 'Transaction created timestamp', example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Transaction updated timestamp', example: '2024-01-15T10:30:00Z' })
  @Expose()
  updatedAt: Date;
}

// Paginated DTOs following architectural guidelines
export class TransactionsPaginatedDto {
  @ApiProperty({ type: [TransactionDataDto], description: 'Array of transaction items' })
  @Type(() => TransactionDataDto)
  items: TransactionDataDto[];

  @ApiProperty({ description: 'Total number of transactions', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20, minimum: 1 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5, minimum: 0 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrevPage: boolean;
}

// Response DTOs using factory pattern
export const TransactionResponseDto = createResponseDto(TransactionDataDto);
export const TransactionsListResponseDto = createResponseDto(TransactionsPaginatedDto);

// Type aliases for return types
export type TransactionResponse = BaseResponseDto<TransactionDataDto>;
export type TransactionsListResponse = BaseResponseDto<TransactionsPaginatedDto>;

// Operation-specific response DTOs
export class TransactionStatsDataDto {
  @ApiProperty({ description: 'Total number of transactions', example: 150 })
  @Expose()
  totalTransactions: number;

  @ApiProperty({ description: 'Total income in cents', example: 50000 })
  @Expose()
  totalIncome: number;

  @ApiProperty({ description: 'Total expenses in cents', example: 30000 })
  @Expose()
  totalExpenses: number;

  @ApiProperty({ description: 'Net amount in cents', example: 20000 })
  @Expose()
  netAmount: number;

  @ApiProperty({
    description: 'Transaction statistics by type',
    example: {
      BOOKING_PAYMENT: { count: 25, amount: 25000 },
      HOST_PAYOUT: { count: 10, amount: 15000 },
    },
  })
  @Expose()
  byType: Record<string, { count: number; amount: number }>;

  @ApiProperty({
    description: 'Transaction count by status',
    example: {
      COMPLETED: 100,
      PENDING: 15,
      FAILED: 2,
    },
  })
  @Expose()
  byStatus: Record<string, number>;
}

export class EscrowTransactionDataDto {
  @ApiProperty({ description: 'Transaction details', type: TransactionDataDto })
  @Expose()
  @Type(() => TransactionDataDto)
  transaction: TransactionDataDto;

  @ApiProperty({ description: 'Booking ID related to escrow', example: '507f1f77bcf86cd799439011' })
  @Expose()
  bookingId: string;

  @ApiProperty({ description: 'Escrow release date', example: '2024-01-16T10:30:00Z' })
  @Expose()
  releaseDate: Date;

  @ApiProperty({ description: 'Platform fee amount in cents', example: 750 })
  @Expose()
  platformFeeAmount: number;

  @ApiProperty({ description: 'Host earnings amount in cents', example: 4250 })
  @Expose()
  hostEarningsAmount: number;
}

export class PayoutRequestDataDto {
  @ApiProperty({ description: 'Transaction ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  transactionId: string;

  @ApiProperty({ description: 'Payout ID', example: '507f1f77bcf86cd799439012', required: false })
  @Expose()
  payoutId?: string;

  @ApiProperty({ description: 'Payout amount in cents', example: 5000 })
  @Expose()
  amount: number;

  @ApiProperty({ description: 'Fast Pay fee (if applicable)', example: 75, required: false })
  @Expose()
  fastPayFee?: number;

  @ApiProperty({
    description: 'Estimated arrival date',
    example: '2024-01-18T10:30:00Z',
    required: false,
  })
  @Expose()
  estimatedArrival?: Date;
}

export class PayoutInfoDataDto {
  @ApiProperty({ description: 'Available payout amount in cents', example: 10000 })
  @Expose()
  availableAmount: number;

  @ApiProperty({ description: 'Minimum payout amount in cents', example: 50 })
  @Expose()
  minimumPayout: number;

  @ApiProperty({ description: 'Whether user is a new host', example: false })
  @Expose()
  isNewHost: boolean;

  @ApiProperty({
    description: 'Hold until date for new hosts',
    example: '2024-02-15T10:30:00Z',
    required: false,
  })
  @Expose()
  holdUntil?: Date;
}

// Operation response DTOs
export const TransactionStatsResponseDto = createResponseDto(TransactionStatsDataDto);
export const EscrowTransactionResponseDto = createResponseDto(EscrowTransactionDataDto);
export const PayoutRequestResponseDto = createResponseDto(PayoutRequestDataDto);
export const PayoutInfoResponseDto = createResponseDto(PayoutInfoDataDto);

// Operation response type aliases
export type TransactionStatsResponse = BaseResponseDto<TransactionStatsDataDto>;
export type EscrowTransactionResponse = BaseResponseDto<EscrowTransactionDataDto>;
export type PayoutRequestResponse = BaseResponseDto<PayoutRequestDataDto>;
export type PayoutInfoResponse = BaseResponseDto<PayoutInfoDataDto>;
