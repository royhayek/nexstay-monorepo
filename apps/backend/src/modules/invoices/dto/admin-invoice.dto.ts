import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { InvoiceStatus, CurrencyCode } from '../../../common/enums/payment.enums';
import { InvoiceResponseDto } from './invoice.dto';
import {
  IsEnumField,
  IsUuidField,
  IsSearchField,
  IsDateField,
  IsPriceField,
  IsBooleanField,
  IsPageField,
  IsLimitField,
} from '../../../common/validators/standardized-validators';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';

enum InvoiceSortField {
  CREATED_AT = 'createdAt',
  DUE_DATE = 'dueDate',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'status',
  INVOICE_NUMBER = 'invoiceNumber',
}

export class AdminInvoiceFiltersDto {
  @IsEnumField(InvoiceStatus, { required: false, example: InvoiceStatus.DRAFT })
  status?: InvoiceStatus;

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

  @IsDateField({ required: false })
  dueDateFrom?: Date;

  @IsDateField({ required: false })
  dueDateTo?: Date;

  @IsPriceField({ required: false, example: 100.0 })
  amountFrom?: number;

  @IsPriceField({ required: false, example: 1000.0 })
  amountTo?: number;

  @IsBooleanField({ required: false, example: true })
  emailSent?: boolean;

  @IsBooleanField({ required: false, example: false })
  overdueOnly?: boolean;

  @IsEnumField(InvoiceSortField, { required: false, example: InvoiceSortField.CREATED_AT })
  sortBy?: InvoiceSortField;

  @IsEnumField(SortDirectionEnum, { required: false, example: SortDirectionEnum.DESC })
  sortOrder?: SortDirectionEnum;

  @IsPageField({ required: false })
  page?: number;

  @IsLimitField({ required: false })
  limit?: number;
}

export class AdminInvoiceListResponseDto extends BaseResponseDto<{
  invoices: InvoiceResponseDto[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}> {
  @ApiPropertyOptional({
    description: 'Admin invoices data with pagination',
    type: 'object',
    properties: {
      invoices: { type: 'array', items: { $ref: '#/components/schemas/InvoiceResponseDto' } },
      total: { type: 'number' },
      page: { type: 'number' },
      pages: { type: 'number' },
      hasNext: { type: 'boolean' },
      hasPrev: { type: 'boolean' },
    },
  })
  declare data: {
    invoices: InvoiceResponseDto[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class InvoiceMetricsDto {
  @ApiPropertyOptional({ description: 'Total invoices count' })
  totalInvoices: number;

  @ApiPropertyOptional({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiPropertyOptional({ description: 'Paid invoices count' })
  paidInvoices: number;

  @ApiPropertyOptional({ description: 'Overdue invoices count' })
  overdueInvoices: number;

  @ApiPropertyOptional({ description: 'Draft invoices count' })
  draftInvoices: number;

  @ApiPropertyOptional({ description: 'Cancelled invoices count' })
  cancelledInvoices: number;

  @ApiPropertyOptional({ description: 'Average payment time in days' })
  averagePaymentTime: number;

  @ApiPropertyOptional({ description: 'Collection rate percentage' })
  collectionRate: number;

  @ApiPropertyOptional({ description: 'Invoice status breakdown' })
  statusBreakdown: Array<{
    status: InvoiceStatus;
    count: number;
    percentage: number;
    revenue: number;
  }>;

  @ApiPropertyOptional({ description: 'Monthly revenue trend' })
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
    averageValue: number;
  }>;

  @ApiPropertyOptional({ description: 'Currency breakdown' })
  currencyBreakdown: Array<{
    currency: CurrencyCode;
    count: number;
    revenue: number;
  }>;

  @ApiPropertyOptional({ description: 'Top customers by revenue' })
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    customerEmail: string;
    invoiceCount: number;
    totalRevenue: number;
  }>;
}
