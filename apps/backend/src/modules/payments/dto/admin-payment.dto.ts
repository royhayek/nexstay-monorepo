import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  CurrencyCode,
} from '../../../common/enums/payment.enums';
import { PaymentIntentResponseDto } from './payment-intent.dto';
import { PaymentTransactionResponseDto } from './payment-transaction.dto';
import {
  IsEnumField,
  IsUuidField,
  IsSearchField,
  IsDateField,
  IsPriceField,
  IsPageField,
  IsLimitField,
} from '../../../common/validators/standardized-validators';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';

enum PaymentSortField {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amount',
  STATUS = 'status',
  PROVIDER = 'provider',
}

export class AdminPaymentFiltersDto {
  @IsEnumField(PaymentProvider, { required: false, example: PaymentProvider.APS })
  provider?: PaymentProvider;

  @IsEnumField(PaymentIntentStatus, { required: false, example: PaymentIntentStatus.PROCESSING })
  status?: PaymentIntentStatus;

  @IsEnumField(PaymentTransactionStatus, {
    required: false,
    example: PaymentTransactionStatus.SUCCESS,
  })
  transactionStatus?: PaymentTransactionStatus;

  @IsEnumField(CurrencyCode, { required: false, example: CurrencyCode.USD })
  currency?: CurrencyCode;

  @IsUuidField({ required: false })
  customerId?: string;

  @IsUuidField({ required: false })
  bookingId?: string;

  @IsSearchField({ required: false })
  search?: string;

  @IsDateField({ required: false })
  dateFrom?: Date;

  @IsDateField({ required: false })
  dateTo?: Date;

  @IsPriceField({ required: false, example: 100.0 })
  amountFrom?: number;

  @IsPriceField({ required: false, example: 5000.0 })
  amountTo?: number;

  @IsEnumField(PaymentSortField, { required: false, example: PaymentSortField.CREATED_AT })
  sortBy?: PaymentSortField;

  @IsEnumField(SortDirectionEnum, { required: false, example: SortDirectionEnum.DESC })
  sortOrder?: SortDirectionEnum;

  @IsPageField({ required: false })
  page?: number;

  @IsLimitField({ required: false })
  limit?: number;
}

export class AdminPaymentIntentListResponseDto extends BaseResponseDto<{
  intents: PaymentIntentResponseDto[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  @ApiPropertyOptional({
    description: 'Admin payment intents data with pagination',
    type: 'object',
    properties: {
      intents: { type: 'array', items: { $ref: '#/components/schemas/PaymentIntentResponseDto' } },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
      hasNext: { type: 'boolean' },
      hasPrev: { type: 'boolean' },
    },
  })
  declare data: {
    intents: PaymentIntentResponseDto[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class AdminPaymentTransactionListResponseDto extends BaseResponseDto<{
  transactions: PaymentTransactionResponseDto[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  @ApiPropertyOptional({
    description: 'Admin payment transactions data with pagination',
    type: 'object',
    properties: {
      transactions: {
        type: 'array',
        items: { $ref: '#/components/schemas/PaymentTransactionResponseDto' },
      },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
      hasNext: { type: 'boolean' },
      hasPrev: { type: 'boolean' },
    },
  })
  declare data: {
    transactions: PaymentTransactionResponseDto[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaymentMetricsDto {
  @ApiPropertyOptional({ description: 'Total payment volume' })
  totalVolume: number;

  @ApiPropertyOptional({ description: 'Total number of payments' })
  totalPayments: number;

  @ApiPropertyOptional({ description: 'Successful payments count' })
  successfulPayments: number;

  @ApiPropertyOptional({ description: 'Failed payments count' })
  failedPayments: number;

  @ApiPropertyOptional({ description: 'Success rate percentage' })
  successRate: number;

  @ApiPropertyOptional({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiPropertyOptional({ description: 'Total refunds amount' })
  totalRefunds: number;

  @ApiPropertyOptional({ description: 'Refund rate percentage' })
  refundRate: number;

  @ApiPropertyOptional({ description: 'Payment breakdown by provider' })
  providerBreakdown: Array<{
    provider: PaymentProvider;
    count: number;
    volume: number;
    successRate: number;
  }>;

  @ApiPropertyOptional({ description: 'Payment breakdown by status' })
  statusBreakdown: Array<{
    status: PaymentIntentStatus;
    count: number;
    percentage: number;
  }>;

  @ApiPropertyOptional({ description: 'Daily payment volume trend' })
  dailyTrend: Array<{
    date: string;
    volume: number;
    count: number;
  }>;
}

export class PaymentProvidersConfigDataDto {
  @ApiPropertyOptional({
    description: 'Payment providers configuration',
    type: 'object',
    properties: {
      providers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            isEnabled: { type: 'boolean' },
            settings: { type: 'object' },
          },
        },
      },
      activeProvider: { type: 'string' },
    },
  })
  providers: Array<{
    name: string;
    isEnabled: boolean;
    settings: Record<string, unknown>;
  }>;

  @ApiPropertyOptional({ description: 'Active payment provider name' })
  activeProvider: string;
}

export class PaymentProvidersConfigResponseDto extends BaseResponseDto<PaymentProvidersConfigDataDto> {
  @ApiPropertyOptional({ type: PaymentProvidersConfigDataDto })
  declare data: PaymentProvidersConfigDataDto;
}
