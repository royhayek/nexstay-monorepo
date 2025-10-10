import { Controller, Get, Post, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { plainToInstance } from 'class-transformer';
import type { Response } from 'express';
import { BaseController } from '../../../common/controllers/base.controller';
import { InvoicesService } from '../invoices.service';
import type { InvoiceDocument } from '../../../database/schemas/invoice.schema';
import { InvoiceStatus } from '../../../common/enums/payment.enums';
import { InvoiceResponseDto } from '../dto/invoice.dto';
import { AdminInvoiceFiltersDto } from '../dto/admin-invoice.dto';
import {
  InvoiceListResponseDto,
  SingleInvoiceResponseDto,
  InvoiceDeletionResponseDto,
  InvoiceMetricsResponseDto,
  InvoiceExportResponseDto,
  BulkSendResultResponseDto,
} from '../dto/invoice-operation-response.dto';
import type {
  BulkSendRequest,
  BulkSendResult,
  InvoicePaymentData,
} from '../../../common/interfaces/invoice.interfaces';

/**
 * Admin Controller for Invoices
 * Handles administrative invoice operations
 */
@ApiTags('Invoices Management')
@Controller('admin/invoices')
export class InvoicesAdminController extends BaseController {
  constructor(private readonly invoicesService: InvoicesService) {
    super();
  }

  @Get('all')
  @AdminEndpoint(
    'Get all invoices for admin with advanced filters',
    'Retrieve invoices with advanced filtering capabilities for administrators',
    InvoiceListResponseDto,
  )
  async getAllInvoices(@Query() filters: AdminInvoiceFiltersDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.invoicesService.getAllInvoicesForAdmin(filters);

        return {
          invoices: result.invoices.map((invoice) =>
            plainToInstance(InvoiceResponseDto, invoice.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        };
      },
      'Get admin invoices',
      'Admin Invoices List',
      'Invoices retrieved successfully',
      'Failed to get invoices',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get invoice by ID (Admin)',
    'Retrieve detailed invoice information by ID for administrators',
    SingleInvoiceResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async getInvoiceById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const invoice = await this.invoicesService.getInvoiceById(id);
        if (!invoice) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Get invoice by ID',
      'Invoice Details',
      'Invoice retrieved successfully',
      'Failed to get invoice',
    );
  }

  @Delete(':id')
  @AdminEndpoint(
    'Delete invoice (Admin only)',
    'Permanently delete an invoice from the system',
    InvoiceDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async deleteInvoice(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.invoicesService.deleteInvoice(id);
        return { deleted: true };
      },
      'Delete invoice',
      'Invoice Deleted',
      'Invoice deleted successfully',
      'Failed to delete invoice',
    );
  }

  @Get('metrics/advanced')
  @AdminEndpoint(
    'Get advanced invoice metrics for admin dashboard',
    'Retrieve comprehensive invoice analytics and metrics for administrative reporting',
    InvoiceMetricsResponseDto,
  )
  async getAdvancedInvoiceMetrics(@Query() filters: AdminInvoiceFiltersDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.invoicesService.getAdvancedInvoiceMetrics(filters);
        return metrics;
      },
      'Get advanced invoice metrics',
      'Invoice Analytics Dashboard',
      'Advanced invoice metrics retrieved successfully',
      'Failed to get invoice metrics',
    );
  }

  @Get('export/csv')
  @AdminEndpoint(
    'Export invoices to CSV for admin',
    'Export filtered invoice data to CSV format for analysis',
    InvoiceExportResponseDto,
  )
  async exportInvoices(@Query() filters: AdminInvoiceFiltersDto, @Res() res?: Response) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.invoicesService.getAllInvoicesForAdmin({
          ...filters,
          limit: 10000, // Export up to 10k records
        });

        const csvData = this.generateInvoiceCSV(result.invoices);

        if (res) {
          res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="invoices-export-${DateUtils.toISO(DateUtils.now()).split('T')[0]}.csv"`,
          });
          res.send(csvData);
        }

        return csvData;
      },
      'Export invoices',
      'Invoice Export',
      'Invoice export generated successfully',
      'Failed to export invoices',
    );
  }

  @Post(':id/mark-paid')
  @AdminEndpoint(
    'Mark invoice as paid (Admin only)',
    'Manually mark an invoice as paid with payment details',
    SingleInvoiceResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async markInvoiceAsPaid(@Param('id') id: string, @Body() body: InvoicePaymentData) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const paymentInfo: InvoicePaymentData = {
          paidAmount: body.paidAmount,
          paidAt: body.paidAt || DateUtils.now(),
          paymentMethod: body.paymentMethod || 'manual',
          paymentProvider: 'admin',
          notes: body.notes,
        };

        const invoice = await this.invoicesService.markAsPaid(id, paymentInfo);
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Mark invoice as paid',
      'Mark Invoice as Paid',
      'Invoice marked as paid successfully',
      'Failed to mark invoice as paid',
    );
  }

  @Post('bulk-send')
  @AdminEndpoint(
    'Bulk send invoices (Admin only)',
    'Send multiple invoices via email in batch processing',
    BulkSendResultResponseDto,
  )
  async bulkSendInvoices(@Body() body: BulkSendRequest) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        let invoiceIds = body.invoiceIds;

        // If filters provided instead of specific IDs, get invoices matching filters
        if (!invoiceIds.length && body.filters) {
          const result = await this.invoicesService.getAllInvoicesForAdmin({
            ...body.filters,
            status: InvoiceStatus.DRAFT, // Only send draft invoices
            limit: 1000,
          });
          invoiceIds = result.invoices.map((inv) => String(inv._id));
        }

        const results: BulkSendResult[] = [];
        for (const invoiceId of invoiceIds) {
          try {
            await this.invoicesService.sendInvoice(
              invoiceId,
              body.emailOptions || { to: [], attachPdf: true },
            );
            results.push({ invoiceId, status: 'sent' });
          } catch (error) {
            results.push({
              invoiceId,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return {
          totalProcessed: results.length,
          successful: results.filter((r) => r.status === 'sent').length,
          failed: results.filter((r) => r.status === 'failed').length,
          results,
        };
      },
      'Bulk send invoices',
      'Bulk Send Invoices',
      'Invoices processed successfully',
      'Failed to process bulk send',
    );
  }

  private generateInvoiceCSV(invoices: InvoiceDocument[]): string {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Customer Email',
      'Amount',
      'Currency',
      'Status',
      'Created Date',
      'Due Date',
      'Paid Date',
      'Booking ID',
      'Notes',
    ];

    const rows = invoices.map((invoice) => [
      invoice.invoiceNumber,
      invoice.toAddress?.name || '',
      invoice.toAddress?.email || '',
      invoice.pricing?.totalAmount || 0,
      invoice.pricing?.currency || '',
      invoice.status,
      invoice.createdAt ? DateUtils.toISO(invoice.createdAt).split('T')[0] : '',
      invoice.dueDate ? DateUtils.toISO(invoice.dueDate).split('T')[0] : '',
      invoice.paymentInfo?.paidAt ? DateUtils.toISO(invoice.paymentInfo.paidAt).split('T')[0] : '',
      invoice.bookingId?.toString() || '',
      invoice.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
