import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  PaymentProvider,
  PaymentTransactionStatus,
  CurrencyCode,
} from '../../../common/enums/payment.enums';
import { IsPriceField, IsTextAreaField } from '../../../common/validators/standardized-validators';

export class RefundPaymentDto {
  @IsPriceField({ required: false, example: 50.0 })
  amount?: number;

  @IsTextAreaField({ required: false, example: 'Customer requested refund' })
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, string | number | boolean>;
}

export class TransactionAmountDto {
  @ApiProperty({ description: 'Transaction amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code', enum: CurrencyCode })
  currency: CurrencyCode;
}

export class PaymentTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  _id: string;

  @ApiProperty({ description: 'Payment intent ID' })
  paymentIntentId: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId?: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ description: 'Transaction amount', type: TransactionAmountDto })
  amount: TransactionAmountDto;

  @ApiProperty({ description: 'Transaction status', enum: PaymentTransactionStatus })
  status: PaymentTransactionStatus;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Provider transaction ID' })
  providerTransactionId?: string;

  @ApiProperty({ description: 'Provider response data' })
  providerResponse: Record<string, string | number | boolean>;

  @ApiProperty({ description: 'Payment method ID' })
  paymentMethodId?: string;

  @ApiProperty({ description: 'Failure reason if failed' })
  failureReason?: string;

  @ApiProperty({ description: 'Failure code if failed' })
  failureCode?: string;

  @ApiProperty({ description: 'Transaction metadata' })
  metadata: Record<string, string | number | boolean>;

  @ApiProperty({ description: 'Refund amount if refunded' })
  refundAmount?: number;

  @ApiProperty({ description: 'Refund date if refunded' })
  refundDate?: Date;

  @ApiProperty({ description: 'Refund reason if refunded' })
  refundReason?: string;

  @ApiProperty({ description: 'Provider refund ID' })
  providerRefundId?: string;

  @ApiProperty({ description: 'Processing fee' })
  processingFee?: number;

  @ApiProperty({ description: 'Net amount after fees' })
  netAmount?: number;

  @ApiProperty({ description: 'Risk score' })
  riskScore?: number;

  @ApiProperty({ description: 'Risk level' })
  riskLevel?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PaymentTransactionListResponseDto extends BaseResponseDto<{
  transactions: PaymentTransactionResponseDto[];
  total: number;
  page: number;
  pages: number;
}> {
  @ApiProperty({
    description: 'Payment transactions data',
    type: 'object',
    properties: {
      transactions: {
        type: 'array',
        items: { $ref: '#/components/schemas/PaymentTransactionResponseDto' },
      },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
    },
  })
  declare data: {
    transactions: PaymentTransactionResponseDto[];
    total: number;
    page: number;
    pages: number;
  };
}
