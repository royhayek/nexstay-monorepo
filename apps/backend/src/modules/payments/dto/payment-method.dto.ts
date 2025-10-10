import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';
import { PaymentProvider, PaymentMethodType } from '../../../common/enums/payment.enums';
import {
  IsEnumField,
  IsBooleanField,
  IsNameField,
} from '../../../common/validators/standardized-validators';

export class CreatePaymentMethodDto {
  @IsEnumField(PaymentMethodType, {
    required: true,
    description: 'Payment method type',
    example: PaymentMethodType.CARD,
  })
  type: PaymentMethodType;

  @IsEnumField(PaymentProvider, {
    required: true,
    description: 'Payment provider',
    example: PaymentProvider.APS,
  })
  provider: PaymentProvider;

  @IsNameField({
    required: true,
    description: 'Provider method ID from payment provider',
    example: 'pm_1234567890',
  })
  providerMethodId: string;

  @ApiPropertyOptional({ description: 'Payment method details' })
  @IsObject()
  details?: Record<string, any>;

  @IsBooleanField({
    description: 'Whether this should be the default payment method',
  })
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ description: 'Payment method details' })
  @IsObject()
  details?: Record<string, any>;

  @IsBooleanField({
    description: 'Whether this should be the default payment method',
  })
  isDefault?: boolean;

  @IsBooleanField({
    description: 'Whether this payment method is active',
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, any>;
}

export class PaymentMethodResponseDto {
  @ApiProperty({ description: 'Payment method ID' })
  _id: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Payment method type', enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Provider method ID' })
  providerMethodId: string;

  @ApiProperty({ description: 'Payment method details' })
  details: Record<string, any>;

  @ApiProperty({ description: 'Is default payment method' })
  isDefault: boolean;

  @ApiProperty({ description: 'Is payment method active' })
  isActive: boolean;

  @ApiProperty({ description: 'Payment method metadata' })
  metadata: Record<string, any>;

  @ApiPropertyOptional({ description: 'Last used date' })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

// Create a concrete paginated DTO for payment methods to ensure proper Swagger generation
export class PaymentMethodsPaginatedDto extends PaginatedDto<PaymentMethodResponseDto> {
  @ApiProperty({ type: [PaymentMethodResponseDto], description: 'Array of payment method items' })
  @Type(() => PaymentMethodResponseDto)
  declare items: PaymentMethodResponseDto[];
}

export class PaymentMethodListResponseDto extends BaseResponseDto<PaymentMethodsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated payment methods data',
    type: PaymentMethodsPaginatedDto,
  })
  declare data: PaymentMethodsPaginatedDto;
}

export class SinglePaymentMethodResponseDto extends BaseResponseDto<PaymentMethodResponseDto> {
  @ApiProperty({
    description: 'Payment method data',
    type: PaymentMethodResponseDto,
  })
  declare data: PaymentMethodResponseDto;
}
