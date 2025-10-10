import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { InvoiceStatus, CurrencyCode } from '../../../common/enums/payment.enums';
import {
  IsEmailField,
  IsNameField,
  IsPhoneField,
  IsTextAreaField,
  IsDateField,
  IsEnumField,
  IsUuidField,
  IsPriceField,
  IsNumberField,
  IsBooleanField,
  IsStringArrayField,
} from '../../../common/validators/standardized-validators';

export class InvoiceAddressDto {
  @IsNameField({ required: true, example: 'John Doe' })
  name: string;

  @IsEmailField({ required: true })
  email: string;

  @IsPhoneField({ required: false })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address details' })
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export class InvoiceLineItemDto {
  @IsTextAreaField({ required: true, example: 'Accommodation for 3 nights' })
  description: string;

  @IsNumberField({ required: true, minValue: 1, example: 3 })
  quantity: number;

  @IsPriceField({ required: true, example: 150.0 })
  unitPrice: number;

  @IsPriceField({ required: true, example: 450.0 })
  amount: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class InvoiceTaxDto {
  @IsNameField({ required: true, example: 'VAT' })
  name: string;

  @IsNumberField({ required: true, minValue: 0, maxValue: 100, example: 15 })
  rate: number;

  @IsPriceField({ required: true, example: 67.5 })
  amount: number;
}

enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export class InvoiceDiscountDto {
  @IsEnumField(DiscountType, { required: true, example: DiscountType.PERCENTAGE })
  type: DiscountType;

  @IsNumberField({ required: true, minValue: 0, example: 10 })
  value: number;

  @IsPriceField({ required: true, example: 45.0 })
  amount: number;

  @IsTextAreaField({ required: false, example: 'Early bird discount' })
  description?: string;
}

export class CreateInvoiceDto {
  @IsUuidField({ required: false })
  bookingId?: string;

  @ApiProperty({ description: 'From address (sender)', type: InvoiceAddressDto })
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  fromAddress: InvoiceAddressDto;

  @ApiProperty({ description: 'To address (recipient)', type: InvoiceAddressDto })
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  toAddress: InvoiceAddressDto;

  @ApiProperty({ description: 'Invoice line items', type: [InvoiceLineItemDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  @ApiPropertyOptional({ description: 'Tax items', type: [InvoiceTaxDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceTaxDto)
  taxes?: InvoiceTaxDto[];

  @ApiPropertyOptional({ description: 'Discount items', type: [InvoiceDiscountDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceDiscountDto)
  discounts?: InvoiceDiscountDto[];

  @IsTextAreaField({ required: false, example: 'Payment due upon receipt' })
  notes?: string;

  @IsDateField({ required: false })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ description: 'From address (sender)', type: InvoiceAddressDto })
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  fromAddress?: InvoiceAddressDto;

  @ApiPropertyOptional({ description: 'To address (recipient)', type: InvoiceAddressDto })
  @ValidateNested()
  @Type(() => InvoiceAddressDto)
  toAddress?: InvoiceAddressDto;

  @ApiPropertyOptional({ description: 'Invoice line items', type: [InvoiceLineItemDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems?: InvoiceLineItemDto[];

  @ApiPropertyOptional({ description: 'Tax items', type: [InvoiceTaxDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceTaxDto)
  taxes?: InvoiceTaxDto[];

  @ApiPropertyOptional({ description: 'Discount items', type: [InvoiceDiscountDto] })
  @ValidateNested({ each: true })
  @Type(() => InvoiceDiscountDto)
  discounts?: InvoiceDiscountDto[];

  @IsTextAreaField({ required: false, example: 'Payment due upon receipt' })
  notes?: string;

  @IsDateField({ required: false })
  dueDate?: Date;

  @IsEnumField(InvoiceStatus, { required: false, example: InvoiceStatus.DRAFT })
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class SendInvoiceDto {
  @IsStringArrayField({
    required: true,
    example: ['customer@example.com'],
    description: 'Recipient email addresses',
    maxItems: 10,
  })
  to: string[];

  @IsStringArrayField({
    required: false,
    example: ['manager@example.com'],
    description: 'CC email addresses',
    maxItems: 10,
  })
  cc?: string[];

  @IsStringArrayField({
    required: false,
    example: ['accounting@example.com'],
    description: 'BCC email addresses',
    maxItems: 10,
  })
  bcc?: string[];

  @IsNameField({ required: false, example: 'Invoice for your recent booking' })
  subject?: string;

  @IsTextAreaField({ required: false, example: 'Please find attached your invoice' })
  message?: string;

  @IsBooleanField({ required: false, example: true })
  attachPdf?: boolean;

  @IsNameField({ required: false, example: 'invoice-standard' })
  template?: string;
}

export class InvoicePricingResponseDto {
  @ApiProperty({ description: 'Subtotal amount' })
  subtotal: number;

  @ApiProperty({ description: 'Discounts applied', type: [InvoiceDiscountDto] })
  discounts: InvoiceDiscountDto[];

  @ApiProperty({ description: 'Taxes applied', type: [InvoiceTaxDto] })
  taxes: InvoiceTaxDto[];

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency', enum: CurrencyCode })
  currency: CurrencyCode;
}

export class InvoicePaymentInfoResponseDto {
  @ApiProperty({ description: 'Payment intent ID' })
  paymentIntentId?: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiProperty({ description: 'Paid amount' })
  paidAmount?: number;

  @ApiProperty({ description: 'Payment date' })
  paidAt?: Date;

  @ApiProperty({ description: 'Payment method' })
  paymentMethod?: string;

  @ApiProperty({ description: 'Payment provider' })
  paymentProvider?: string;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  _id: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Booking ID' })
  bookingId?: string;

  @ApiProperty({ description: 'Customer ID' })
  customerId?: string;

  @ApiProperty({ description: 'From address', type: InvoiceAddressDto })
  fromAddress: InvoiceAddressDto;

  @ApiProperty({ description: 'To address', type: InvoiceAddressDto })
  toAddress: InvoiceAddressDto;

  @ApiProperty({ description: 'Line items', type: [InvoiceLineItemDto] })
  lineItems: InvoiceLineItemDto[];

  @ApiProperty({ description: 'Pricing details', type: InvoicePricingResponseDto })
  pricing: InvoicePricingResponseDto;

  @ApiProperty({ description: 'Invoice status', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Due date' })
  dueDate?: Date;

  @ApiProperty({ description: 'Sent date' })
  sentAt?: Date;

  @ApiProperty({ description: 'Payment information', type: InvoicePaymentInfoResponseDto })
  paymentInfo?: InvoicePaymentInfoResponseDto;

  @ApiProperty({ description: 'Metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Template used' })
  template: string;

  @ApiProperty({ description: 'Custom fields' })
  customFields: Record<string, any>;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Last viewed date' })
  lastViewedAt?: Date;

  @ApiProperty({ description: 'Email sent status' })
  emailSent: boolean;

  @ApiProperty({ description: 'Email sent date' })
  emailSentAt?: Date;

  @ApiProperty({ description: 'Email sent to' })
  emailSentTo?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class InvoiceListResponseDto extends BaseResponseDto<{
  invoices: InvoiceResponseDto[];
  total: number;
  page: number;
  pages: number;
}> {
  @ApiProperty({
    description: 'Invoice list data',
    type: 'object',
    properties: {
      invoices: { type: 'array', items: { $ref: '#/components/schemas/InvoiceResponseDto' } },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
    },
  })
  declare data: {
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    pages: number;
  };
}
