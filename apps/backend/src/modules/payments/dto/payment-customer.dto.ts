import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaymentProvider } from '../../../common/enums/payment.enums';
import {
  IsEnumField,
  IsUuidField,
  IsBooleanField,
  IsEmailField,
  IsNameField,
  IsPhoneField,
} from '../../../common/validators/standardized-validators';

export class CreatePaymentCustomerDto {
  @IsUuidField({
    required: true,
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @IsEmailField({
    required: true,
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  email: string;

  @IsNameField({
    required: true,
    description: 'Customer full name',
    example: 'John Doe',
  })
  name: string;

  @IsPhoneField({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  phone?: string;

  @IsEnumField(PaymentProvider, {
    required: true,
    description: 'Payment provider',
    example: PaymentProvider.APS,
  })
  provider: PaymentProvider;

  @IsNameField({
    required: true,
    description: 'Provider customer ID',
    example: 'cus_1234567890',
  })
  providerCustomerId: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Provider-specific data' })
  @IsObject()
  providerData?: Record<string, any>;
}

export class UpdatePaymentCustomerDto {
  @IsEmailField({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  email?: string;

  @IsNameField({
    description: 'Customer full name',
    example: 'John Doe',
  })
  name?: string;

  @IsPhoneField({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  phone?: string;

  @IsBooleanField({
    description: 'Whether customer is active',
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Provider-specific data' })
  @IsObject()
  providerData?: Record<string, any>;
}

export class PaymentCustomerResponseDto {
  @ApiProperty({ description: 'Payment customer ID' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Customer email address' })
  email: string;

  @ApiProperty({ description: 'Customer full name' })
  name: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  phone?: string;

  @ApiProperty({ description: 'Payment provider', enum: PaymentProvider })
  provider: PaymentProvider;

  @ApiProperty({ description: 'Provider customer ID' })
  providerCustomerId: string;

  @ApiProperty({ description: 'Customer metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Provider-specific data' })
  providerData: Record<string, any>;

  @ApiProperty({ description: 'Is customer active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class SinglePaymentCustomerResponseDto extends BaseResponseDto<PaymentCustomerResponseDto> {
  @ApiProperty({
    description: 'Payment customer data',
    type: PaymentCustomerResponseDto,
  })
  declare data: PaymentCustomerResponseDto;
}
