import { ApiProperty } from '@nestjs/swagger';
import { PayoutStatus, PayoutType, PayoutProvider } from '../../../common/enums/payout.enums';
import { CurrencyCode } from '../../../common/enums/payment.enums';
import { createResponseDto } from '../../../common/dto/base-response.dto';

class PayoutAmountDto {
  @ApiProperty({ description: 'Amount', example: 500 })
  amount: number;

  @ApiProperty({ description: 'Currency', enum: CurrencyCode })
  currency: CurrencyCode;
}

class PayoutFeeBreakdownDto {
  @ApiProperty({ description: 'Platform fee', example: 15 })
  platformFee: number;

  @ApiProperty({ description: 'Processing fee', example: 2.5 })
  processingFee: number;

  @ApiProperty({ description: 'Withdrawal fee', example: 1.5 })
  withdrawalFee: number;

  @ApiProperty({ description: 'Tax withholding', example: 0 })
  taxWithholding: number;

  @ApiProperty({ description: 'Total fees', example: 19 })
  totalFees: number;
}

class PayoutBookingReferenceDto {
  @ApiProperty({ description: 'Booking ID', example: '507f1f77bcf86cd799439012' })
  bookingId: string;

  @ApiProperty({ description: 'Booking amount', example: 200 })
  bookingAmount: number;

  @ApiProperty({ description: 'Host earning from booking', example: 194 })
  hostEarning: number;

  @ApiProperty({ description: 'Check-out date', example: '2024-01-15T11:00:00Z' })
  checkOutDate: Date;

  @ApiProperty({ description: 'Property name', example: 'Beautiful Downtown Apartment' })
  propertyName: string;
}

export class PayoutResponseDto {
  @ApiProperty({ description: 'Payout ID', example: '507f1f77bcf86cd799439013' })
  id: string;

  @ApiProperty({ description: 'Host ID', example: '507f1f77bcf86cd799439010' })
  hostId: string;

  @ApiProperty({ description: 'Payout method ID', example: '507f1f77bcf86cd799439011' })
  payoutMethodId: string;

  @ApiProperty({ description: 'Payout type', enum: PayoutType })
  type: PayoutType;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status: PayoutStatus;

  @ApiProperty({ description: 'Gross amount before fees', type: PayoutAmountDto })
  grossAmount: PayoutAmountDto;

  @ApiProperty({ description: 'Fee breakdown', type: PayoutFeeBreakdownDto })
  fees: PayoutFeeBreakdownDto;

  @ApiProperty({ description: 'Net amount after fees', type: PayoutAmountDto })
  netAmount: PayoutAmountDto;

  @ApiProperty({ description: 'Associated bookings', type: [PayoutBookingReferenceDto] })
  bookings: PayoutBookingReferenceDto[];

  @ApiProperty({ description: 'Payment provider', enum: PayoutProvider })
  provider: PayoutProvider;

  @ApiProperty({
    description: 'Provider payout ID',
    example: 'aps_po_1234567890',
    required: false,
  })
  providerPayoutId?: string;

  @ApiProperty({ description: 'Payout date', example: '2024-01-16T10:00:00Z' })
  payoutDate: Date;

  @ApiProperty({
    description: 'Expected arrival date',
    example: '2024-01-19T10:00:00Z',
    required: false,
  })
  expectedArrival?: Date;

  @ApiProperty({ description: 'Completion date', example: '2024-01-19T08:30:00Z', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Failure date', example: '2024-01-18T10:00:00Z', required: false })
  failedAt?: Date;

  @ApiProperty({ description: 'Failure reason', example: 'Insufficient funds', required: false })
  failureReason?: string;

  @ApiProperty({ description: 'Failure code', example: 'INSUFFICIENT_FUNDS', required: false })
  failureCode?: string;

  @ApiProperty({ description: 'Number of retry attempts', example: 1, required: false })
  retryAttempts?: number;

  @ApiProperty({
    description: 'Next retry scheduled time',
    example: '2024-01-18T14:00:00Z',
    required: false,
  })
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Unique reference', example: 'PO1642320000ABC123' })
  reference: string;

  @ApiProperty({
    description: 'Payout description',
    example: 'Host payout for 3 booking(s)',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T12:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-19T08:30:00Z' })
  updatedAt: Date;
}

export class EligibleEarningsDataDto {
  @ApiProperty({ description: 'Total eligible earnings', example: 485 })
  totalEarnings!: number;

  @ApiProperty({ description: 'Currency', enum: CurrencyCode })
  currency!: CurrencyCode;

  @ApiProperty({ description: 'Number of bookings included', example: 3 })
  bookingsCount!: number;

  @ApiProperty({ description: 'Booking details', type: [PayoutBookingReferenceDto] })
  bookings!: PayoutBookingReferenceDto[];
}

// Create response DTOs using factory pattern
export const PayoutResponse = createResponseDto(PayoutResponseDto);
export const EligibleEarningsResponse = createResponseDto(EligibleEarningsDataDto);

// Type aliases for better code readability
export type PayoutResponseType = InstanceType<typeof PayoutResponse>;
export type EligibleEarningsResponseType = InstanceType<typeof EligibleEarningsResponse>;

// Keep the original exports for backward compatibility
export { EligibleEarningsDataDto as EligibleEarningsResponseDto };
