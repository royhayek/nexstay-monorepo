import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsObject, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  PaymentProvider,
  PaymentIntentStatus,
  CurrencyCode,
} from '../../../common/enums/payment.enums';
import {
  IsPriceField,
  IsEnumField,
  IsUuidField,
  IsUrlField,
} from '../../../common/validators/standardized-validators';

export class PaymentAmountDto {
  @IsPriceField({
    required: true,
    description: 'Payment amount',
    example: 299.99,
    minValue: 0.01,
    maxValue: 999999.99,
  })
  amount: number;

  @IsEnumField(CurrencyCode, {
    required: true,
    description: 'Currency code',
    example: CurrencyCode.USD,
  })
  currency: CurrencyCode;
}

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Payment amount', type: PaymentAmountDto })
  @IsObject()
  @ValidateNested()
  @Type(() => PaymentAmountDto)
  amount: PaymentAmountDto;

  @IsEnumField(PaymentProvider, {
    required: true,
    description: 'Payment provider',
    example: PaymentProvider.APS,
  })
  provider: PaymentProvider;

  @IsUuidField({
    description: 'Customer ID (automatically set from authenticated user if not provided)',
    example: '507f1f77bcf86cd799439011',
  })
  customerId?: string;

  @IsUuidField({
    description: 'Booking ID for payment intent linked to a booking',
    example: '507f1f77bcf86cd799439013',
  })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Payment method ID from payment provider',
    example: 'pm_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'validation.MUST_BE_STRING' })
  paymentMethodId?: string;

  @IsUrlField({
    description: 'Return URL after successful payment (supports deep links for mobile apps)',
    example: 'https://example.com/payment/success',
    allowCustomSchemes: true,
  })
  returnUrl?: string;

  @IsUrlField({
    description: 'Cancel URL if payment is cancelled (supports deep links for mobile apps)',
    example: 'https://example.com/payment/cancel',
    allowCustomSchemes: true,
  })
  cancelUrl?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, string | number | boolean>;
}

export class ConfirmPaymentIntentDto {
  @ApiPropertyOptional({
    description: 'Payment method ID from payment provider',
    example: 'pm_1234567890abcdef',
  })
  @IsOptional()
  @IsString({ message: 'validation.MUST_BE_STRING' })
  paymentMethodId?: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty({ description: 'Payment intent ID' })
  _id: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId?: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ description: 'Payment amount', type: PaymentAmountDto })
  amount: PaymentAmountDto;

  @ApiProperty({ description: 'Payment intent status', enum: PaymentIntentStatus })
  status: PaymentIntentStatus;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Provider intent ID' })
  providerIntentId?: string;

  @ApiProperty({ description: 'Client secret for frontend integration' })
  clientSecret?: string;

  @ApiProperty({ description: 'Payment method ID' })
  paymentMethodId?: string;

  @ApiProperty({ description: 'Metadata' })
  metadata: Record<string, string | number | boolean>;

  @ApiProperty({ description: 'Return URL' })
  returnUrl?: string;

  @ApiProperty({ description: 'Cancel URL' })
  cancelUrl?: string;

  @ApiProperty({ description: 'Provider-specific data' })
  providerData: Record<string, string | number | boolean>;

  @ApiProperty({ description: 'Failure reason if failed' })
  failureReason?: string;

  @ApiProperty({ description: 'Confirmation date' })
  confirmedAt?: Date;

  @ApiProperty({ description: 'Cancellation date' })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PaymentIntentListResponseDto extends BaseResponseDto<{
  intents: PaymentIntentResponseDto[];
  total: number;
  page: number;
  pages: number;
}> {
  @ApiProperty({
    description: 'Payment intents data',
    type: 'object',
    properties: {
      intents: { type: 'array', items: { $ref: '#/components/schemas/PaymentIntentResponseDto' } },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
    },
  })
  declare data: {
    intents: PaymentIntentResponseDto[];
    total: number;
    page: number;
    pages: number;
  };
}

export class EnabledProvidersDataDto {
  @ApiProperty({
    description: 'List of enabled payment providers',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        displayName: { type: 'string' },
        supportedCurrencies: { type: 'array', items: { type: 'string' } },
        isEnabled: { type: 'boolean' },
      },
    },
  })
  providers: Array<{
    name: string;
    displayName: string;
    supportedCurrencies: string[];
    isEnabled: boolean;
  }>;
}

export class EnabledProvidersResponseDto extends BaseResponseDto<EnabledProvidersDataDto> {
  @ApiProperty({ type: EnabledProvidersDataDto })
  declare data: EnabledProvidersDataDto;
}
