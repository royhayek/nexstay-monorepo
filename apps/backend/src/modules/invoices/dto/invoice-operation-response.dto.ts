import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { InvoiceResponseDto } from './invoice.dto';

// Data DTOs
export class InvoiceDeletionDataDto {
  @ApiProperty({ description: 'Deletion status', example: true })
  deleted: boolean;
}

export class InvoiceMetricsDataDto {
  @ApiProperty({ description: 'Total invoices', example: 1250 })
  totalInvoices: number;

  @ApiProperty({ description: 'Paid invoices', example: 800 })
  paidInvoices: number;

  @ApiProperty({ description: 'Pending invoices', example: 350 })
  pendingInvoices: number;

  @ApiProperty({ description: 'Overdue invoices', example: 100 })
  overdueInvoices: number;

  @ApiProperty({ description: 'Total revenue', example: 125000.5 })
  totalRevenue: number;

  @ApiProperty({ description: 'Pending amount', example: 45000.75 })
  pendingAmount: number;

  @ApiProperty({ description: 'Overdue amount', example: 12500.25 })
  overdueAmount: number;
}

export class InvoiceListDataDto {
  @ApiProperty({ description: 'Array of invoices', type: [InvoiceResponseDto] })
  invoices: InvoiceResponseDto[];

  @ApiProperty({ description: 'Total number of invoices', example: 1250 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of pages', example: 63 })
  pages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
}

export class BulkSendResultDataDto {
  @ApiProperty({ description: 'Total invoices processed', example: 50 })
  totalProcessed: number;

  @ApiProperty({ description: 'Successfully sent invoices', example: 45 })
  successful: number;

  @ApiProperty({ description: 'Failed invoices', example: 5 })
  failed: number;

  @ApiProperty({ description: 'Detailed results per invoice' })
  results: Array<{
    invoiceId: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

// Response DTOs
export class InvoiceDeletionResponseDto extends BaseResponseDto<InvoiceDeletionDataDto> {
  @ApiProperty({ type: InvoiceDeletionDataDto })
  declare data: InvoiceDeletionDataDto;
}

export class InvoiceMetricsResponseDto extends BaseResponseDto<InvoiceMetricsDataDto> {
  @ApiProperty({ type: InvoiceMetricsDataDto })
  declare data: InvoiceMetricsDataDto;
}

export class InvoiceListResponseDto extends BaseResponseDto<InvoiceListDataDto> {
  @ApiProperty({ type: InvoiceListDataDto })
  declare data: InvoiceListDataDto;
}

export class SingleInvoiceResponseDto extends BaseResponseDto<InvoiceResponseDto> {
  @ApiProperty({ type: InvoiceResponseDto })
  declare data: InvoiceResponseDto;
}

export class BulkSendResultResponseDto extends BaseResponseDto<BulkSendResultDataDto> {
  @ApiProperty({ type: BulkSendResultDataDto })
  declare data: BulkSendResultDataDto;
}

export class InvoiceExportResponseDto extends BaseResponseDto<string> {
  @ApiProperty({
    description: 'CSV export data',
    example: 'Invoice Number,Customer Name,Amount...',
  })
  declare data: string;
}
