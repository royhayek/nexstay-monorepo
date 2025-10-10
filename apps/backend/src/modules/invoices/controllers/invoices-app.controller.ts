import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { Response } from 'express';
import { BaseController } from '../../../common/controllers/base.controller';
import { InvoicesService } from '../invoices.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { InvoiceStatus, CurrencyCode } from '../../../common/enums/payment.enums';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  SendInvoiceDto,
  InvoiceResponseDto,
} from '../dto/invoice.dto';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * App Controller for Invoices
 * Handles invoice operations for mobile app and website users (hosts and guests)
 */
@Controller('app/invoices')
@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class InvoicesAppController extends BaseController {
  constructor(private readonly invoicesService: InvoicesService) {
    super();
  }

  @Post()
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  @ProtectedEndpoint('Create a new invoice (Host only)')
  async createInvoice(@Body() createDto: CreateInvoiceDto, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const requestWithUser = {
          ...createDto,
          metadata: {
            ...createDto.metadata,
            createdBy: String(user._id),
            creatorEmail: user.email,
          },
        };

        const invoice = await this.invoicesService.createInvoice(requestWithUser);
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Create invoice',
      'Invoice Created',
      'Invoice created successfully',
      'Failed to create invoice',
    );
  }

  @Put(':id')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  @ProtectedEndpoint('Update invoice by ID (Host only)')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 403, description: 'Forbidden - Host role required' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateInvoice(@Param('id') id: string, @Body() updateDto: UpdateInvoiceDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const invoice = await this.invoicesService.updateInvoice(id, updateDto);
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Update invoice',
      'Invoice Updated',
      'Invoice updated successfully',
      'Failed to update invoice',
    );
  }

  @Get(':id')
  @ProtectedEndpoint('Get invoice by ID')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async getInvoice(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const invoice = await this.invoicesService.getInvoiceById(id);
        if (!invoice) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Get invoice',
      'Invoice Details',
      'Invoice retrieved successfully',
      'Failed to get invoice',
    );
  }

  @Get('number/:invoiceNumber')
  @ProtectedEndpoint('Get invoice by invoice number')
  @ApiParam({ name: 'invoiceNumber', description: 'Invoice number' })
  async getInvoiceByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const invoice = await this.invoicesService.getInvoiceByNumber(invoiceNumber);
        if (!invoice) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(InvoiceResponseDto, invoice.toObject());
      },
      'Get invoice by number',
      'Invoice by Number',
      'Invoice retrieved successfully',
      'Failed to get invoice',
    );
  }

  @Get()
  @ProtectedEndpoint('Search user invoices with filters')
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InvoiceStatus,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'customerId', required: false, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'bookingId', required: false, description: 'Filter by booking ID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'amountFrom', required: false, description: 'Filter from amount' })
  @ApiQuery({ name: 'amountTo', required: false, description: 'Filter to amount' })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: CurrencyCode,
    description: 'Filter by currency',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search text' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  async searchInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('customerId') customerId?: string,
    @Query('bookingId') bookingId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('amountFrom') amountFrom?: number,
    @Query('amountTo') amountTo?: number,
    @Query('currency') currency?: CurrencyCode,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = {
          status,
          customerId,
          bookingId,
          dateFrom: dateFrom ? DateUtils.create(dateFrom) : undefined,
          dateTo: dateTo ? DateUtils.create(dateTo) : undefined,
          amountFrom,
          amountTo,
          currency,
          search,
        };

        const result = await this.invoicesService.searchInvoices(filters, page, limit);

        return {
          invoices: result.invoices.map((invoice) =>
            plainToInstance(InvoiceResponseDto, invoice.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
        };
      },
      'Search invoices',
      'Invoices',
      'Invoices retrieved successfully',
      'Failed to search invoices',
    );
  }

  @Post(':id/send')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  @ProtectedEndpoint('Send invoice via email (Host only)')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  async sendInvoice(@Param('id') id: string, @Body() sendDto: SendInvoiceDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.invoicesService.sendInvoice(id, sendDto);
        return { sent: true };
      },
      'Send invoice',
      'Invoice Sent',
      'Invoice sent successfully',
      'Failed to send invoice',
    );
  }

  @Get(':id/pdf')
  @ProtectedEndpoint('Download invoice as PDF')
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({ name: 'template', required: false, description: 'Template to use' })
  async downloadInvoicePDF(
    @Param('id') id: string,
    @Query('template') template?: string,
    @Res() res?: Response,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const invoice = await this.invoicesService.getInvoiceById(id);
        if (!invoice) {
          throw new Error('NOT_FOUND');
        }

        const pdf = await this.invoicesService.generatePDF(invoice, {
          format: 'pdf',
          template,
          includePaymentInfo: true,
        });

        if (res) {
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
            'Content-Length': pdf.length.toString(),
          });
          res.send(pdf);
        }

        return pdf;
      },
      'Generate invoice PDF',
      'PDF Generated',
      'PDF generated successfully',
      'Failed to generate PDF',
    );
  }

  @Get('metrics/dashboard')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  @ProtectedEndpoint(
    'Get invoice metrics for dashboard (Host only)',
    'Retrieve invoice analytics and metrics for host dashboard',
    undefined,
  )
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: CurrencyCode,
    description: 'Filter by currency',
  })
  async getInvoiceMetrics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('currency') currency?: CurrencyCode,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.invoicesService.getInvoiceMetrics(
          dateFrom ? DateUtils.create(dateFrom) : undefined,
          dateTo ? DateUtils.create(dateTo) : undefined,
          currency,
        );
      },
      'Get invoice metrics',
      'Invoice Metrics',
      'Invoice metrics retrieved successfully',
      'Failed to get invoice metrics',
    );
  }
}
