import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { TemplateUtils } from '../../common/utils/file.utils';
import {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceSearchFilters,
  InvoicePrintOptions,
  InvoiceEmailOptions,
  InvoiceMetrics,
  AdminInvoiceFilters,
  AdvancedInvoiceMetrics,
  InvoiceSearchQuery,
  InvoicePaymentData,
  InvoiceLineItem,
  InvoiceTax,
  InvoiceDiscount,
  InvoicePricing,
  MetricsAggregationResult,
  StatusBreakdownResult,
  MonthlyRevenueResult,
  CurrencyBreakdownResult,
  TopCustomerResult,
} from '../../common/interfaces/invoice.interfaces';
import { InvoiceStatus, CurrencyCode } from '../../common/enums/payment.enums';
import { Invoice, InvoiceDocument } from '../../database/schemas/invoice.schema';
import { NotificationHelperService } from '../notifications/helpers/notification-helper.service';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  async createInvoice(request: CreateInvoiceRequest): Promise<InvoiceDocument> {
    try {
      // Calculate pricing
      const pricing = this.calculatePricing(request.lineItems, request.taxes, request.discounts);

      const invoice = new this.invoiceModel({
        bookingId: request.bookingId,
        customerId: request.metadata?.customerId as string | undefined,
        fromAddress: request.fromAddress,
        toAddress: request.toAddress,
        lineItems: request.lineItems.map((item) => ({
          ...item,
          metadata: item.metadata || {},
        })),
        pricing,
        status: InvoiceStatus.DRAFT,
        notes: request.notes,
        dueDate: request.dueDate,
        metadata: request.metadata || {},
      });

      const savedInvoice = await invoice.save();
      LoggingUtil.log(`Invoice created: ${savedInvoice.invoiceNumber}`, 'InvoicesService');

      return savedInvoice;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to create invoice', error, 'InvoicesService');
      throw error;
    }
  }

  async updateInvoice(id: string, request: UpdateInvoiceRequest): Promise<InvoiceDocument> {
    try {
      const invoice = await this.invoiceModel.findById(id).exec();
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      // Prevent updates to paid/cancelled invoices except for status changes
      if (
        (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) &&
        request.status !== invoice.status
      ) {
        throw new BadRequestException(`Cannot update ${invoice.status} invoice`);
      }

      // Update fields
      if (request.fromAddress) invoice.fromAddress = request.fromAddress;
      if (request.toAddress) invoice.toAddress = request.toAddress;
      if (request.notes) invoice.notes = request.notes;
      if (request.dueDate) invoice.dueDate = request.dueDate;
      if (request.status) invoice.status = request.status;
      if (request.metadata) invoice.metadata = { ...invoice.metadata, ...request.metadata };

      // Recalculate pricing if line items changed
      if (request.lineItems || request.taxes || request.discounts) {
        const lineItems = request.lineItems || invoice.lineItems;
        const taxes = request.taxes || invoice.pricing.taxes;
        const discounts = request.discounts || invoice.pricing.discounts;
        invoice.pricing = this.calculatePricing(lineItems, taxes, discounts);
        if (request.lineItems) {
          invoice.lineItems = request.lineItems.map((item) => ({
            ...item,
            metadata: item.metadata || {},
          }));
        }
      }

      const updatedInvoice = await invoice.save();
      LoggingUtil.log(`Invoice updated: ${updatedInvoice.invoiceNumber}`, 'InvoicesService');

      return updatedInvoice;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to update invoice', error, 'InvoicesService');
      throw error;
    }
  }

  async getInvoiceById(id: string): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel
      .findById(id)
      .populate('booking', 'confirmation_code check_in check_out')
      .populate('customer', 'firstName lastName email')
      .exec();

    if (invoice) {
      // Track view
      invoice.viewCount += 1;
      invoice.lastViewedAt = DateUtils.now();
      await invoice.save();
    }

    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDocument | null> {
    const invoice = await this.invoiceModel
      .findOne({ invoiceNumber })
      .populate('booking', 'confirmation_code check_in check_out')
      .populate('customer', 'firstName lastName email')
      .exec();

    if (invoice) {
      // Track view
      invoice.viewCount += 1;
      invoice.lastViewedAt = DateUtils.now();
      await invoice.save();
    }

    return invoice;
  }

  async searchInvoices(
    filters: InvoiceSearchFilters,
    page = 1,
    limit = 20,
  ): Promise<{
    invoices: InvoiceDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    const query = this.buildSearchQuery(filters);

    const [invoices, total] = await Promise.all([
      this.invoiceModel
        .find(query)
        .populate('booking', 'confirmation_code')
        .populate('customer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .exec(),
      this.invoiceModel.countDocuments(query),
    ]);

    return {
      invoices,
      total,
      page: validPage,
      pages: Math.ceil(total / validLimit),
    };
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoice = await this.invoiceModel.findById(id).exec();
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot delete a paid invoice');
    }

    await this.invoiceModel.findByIdAndDelete(id).exec();
    LoggingUtil.log(`Invoice deleted: ${invoice.invoiceNumber}`, 'InvoicesService');
  }

  async sendInvoice(id: string, emailOptions: InvoiceEmailOptions): Promise<void> {
    try {
      const invoice = await this.getInvoiceById(id);
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      let pdfBuffer: Buffer | undefined;
      if (emailOptions.attachPdf) {
        pdfBuffer = await this.generatePDF(invoice, { format: 'pdf' });
      }

      this.notificationHelper.sendInvoiceEmail(invoice, emailOptions, pdfBuffer);

      // Update invoice
      invoice.emailSent = true;
      invoice.emailSentAt = DateUtils.now();
      invoice.emailSentTo = emailOptions.to.join(', ');
      if (invoice.status === InvoiceStatus.DRAFT) {
        invoice.status = InvoiceStatus.SENT;
        invoice.sentAt = DateUtils.now();
      }
      await invoice.save();

      LoggingUtil.log(`Invoice sent: ${invoice.invoiceNumber}`, 'InvoicesService');
    } catch (error) {
      LoggingUtil.errorWithException('Failed to send invoice', error, 'InvoicesService');
      throw error;
    }
  }

  async markAsPaid(id: string, paymentInfo: InvoicePaymentData): Promise<InvoiceDocument> {
    try {
      const invoice = await this.invoiceModel.findById(id).exec();
      if (!invoice) {
        throw new NotFoundException(`Invoice ${id} not found`);
      }

      invoice.status = InvoiceStatus.PAID;
      invoice.paymentInfo = {
        paymentIntentId: paymentInfo.paymentIntentId
          ? new Types.ObjectId(paymentInfo.paymentIntentId)
          : undefined,
        transactionId: paymentInfo.transactionId
          ? new Types.ObjectId(paymentInfo.transactionId)
          : undefined,
        paidAmount: paymentInfo.paidAmount,
        paidAt: paymentInfo.paidAt,
        paymentMethod: paymentInfo.paymentMethod,
        paymentProvider: paymentInfo.paymentProvider,
      };
      const updatedInvoice = await invoice.save();

      LoggingUtil.log(`Invoice marked as paid: ${updatedInvoice.invoiceNumber}`, 'InvoicesService');
      return updatedInvoice;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to mark invoice as paid', error, 'InvoicesService');
      throw error;
    }
  }

  async generatePDF(invoice: InvoiceDocument, options: InvoicePrintOptions): Promise<Buffer> {
    try {
      const html = await this.generateHTML(invoice, options);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      await browser.close();
      return Buffer.from(pdfUint8Array);
    } catch (error) {
      LoggingUtil.errorWithException('Failed to generate PDF', error, 'InvoicesService');
      throw error;
    }
  }

  async generateHTML(invoice: InvoiceDocument, options: InvoicePrintOptions): Promise<string> {
    try {
      const templatePath = join(
        process.cwd(),
        '../../../src/common/templates/invoice',
        `${options.template || 'default'}.hbs`,
      );

      const defaultTemplatePath = join(
        process.cwd(),
        '../../../src/common/templates/invoice/default.hbs',
      );

      const templateContent = await TemplateUtils.readTemplate(templatePath, defaultTemplatePath);

      const template = handlebars.compile(templateContent);

      const templateData = {
        invoice: invoice.toObject() as Record<string, unknown>,
        options: options.customFields || {},
        includePaymentInfo: options.includePaymentInfo,
        formatCurrency: (amount: number, currency: string) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(amount);
        },
        formatDate: (date: Date) => {
          return new Intl.DateTimeFormat('en-US').format(date);
        },
      };

      // Register helpers
      handlebars.registerHelper('formatCurrency', templateData.formatCurrency);
      handlebars.registerHelper('formatDate', templateData.formatDate);

      return template(templateData);
    } catch (error) {
      LoggingUtil.errorWithException('Failed to generate HTML', error, 'InvoicesService');
      throw error;
    }
  }

  async getInvoiceMetrics(
    dateFrom?: Date,
    dateTo?: Date,
    currency?: CurrencyCode,
  ): Promise<InvoiceMetrics> {
    try {
      const matchStage: Partial<InvoiceSearchQuery> = {};

      if (dateFrom || dateTo) {
        matchStage.createdAt = {};
        if (dateFrom) matchStage.createdAt.$gte = dateFrom;
        if (dateTo) matchStage.createdAt.$lte = dateTo;
      }

      if (currency) {
        matchStage['pricing.currency'] = currency;
      }

      const [totalStats, statusBreakdown, monthlyRevenue] = await Promise.all([
        this.invoiceModel.aggregate<MetricsAggregationResult>([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalInvoices: { $sum: 1 },
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
              paidInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, 1, 0] },
              },
              overdueInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.OVERDUE] }, 1, 0] },
              },
              averagePaymentTime: { $avg: '$paymentInfo.paidAt' }, // This needs proper calculation
            },
          },
        ]),
        this.invoiceModel.aggregate<StatusBreakdownResult>([
          { $match: matchStage },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        this.invoiceModel.aggregate<MonthlyRevenueResult>([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              revenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
              invoiceCount: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
      ]);

      const stats: MetricsAggregationResult = totalStats[0] || {
        _id: null,
        totalInvoices: 0,
        totalRevenue: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        averagePaymentTime: 0,
      };

      const statusBreakdownFormatted = statusBreakdown.map((item) => ({
        status: item._id,
        count: item.count,
        percentage: (item.count / stats.totalInvoices) * 100,
      }));

      const monthlyRevenueFormatted = monthlyRevenue.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        revenue: item.revenue,
        invoiceCount: item.invoiceCount,
      }));

      return {
        totalInvoices: stats.totalInvoices,
        totalRevenue: stats.totalRevenue,
        paidInvoices: stats.paidInvoices,
        overdueInvoices: stats.overdueInvoices,
        averagePaymentTime: stats.averagePaymentTime || 0,
        statusBreakdown: statusBreakdownFormatted,
        monthlyRevenue: monthlyRevenueFormatted,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get invoice metrics', error, 'InvoicesService');
      throw error;
    }
  }

  private calculatePricing(
    lineItems: InvoiceLineItem[],
    taxes: InvoiceTax[] = [],
    discounts: InvoiceDiscount[] = [],
  ): InvoicePricing {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const totalDiscountAmount = discounts.reduce((sum, discount) => {
      if (discount.type === 'percentage') {
        return sum + (subtotal * discount.value) / 100;
      }
      return sum + discount.value;
    }, 0);

    const discountedSubtotal = subtotal - totalDiscountAmount;

    const totalTaxAmount = taxes.reduce((sum, tax) => {
      return sum + (discountedSubtotal * tax.rate) / 100;
    }, 0);

    const totalAmount = discountedSubtotal + totalTaxAmount;

    return {
      subtotal,
      discounts: discounts.map((discount) => ({
        ...discount,
        amount: discount.type === 'percentage' ? (subtotal * discount.value) / 100 : discount.value,
      })),
      taxes: taxes.map((tax) => ({
        ...tax,
        amount: (discountedSubtotal * tax.rate) / 100,
      })),
      totalAmount,
      currency: CurrencyCode.USD, // This should be dynamic
    };
  }

  private buildSearchQuery(filters: InvoiceSearchFilters): InvoiceSearchQuery {
    return QueryBuilder.create()
      .addEnumFilter('status', filters.status)
      .addStringFilter('customerId', filters.customerId)
      .addStringFilter('bookingId', filters.bookingId)
      .addDateRangeFilter(
        'createdAt',
        filters.dateFrom ? DateUtils.toISO(filters.dateFrom) : undefined,
        filters.dateTo ? DateUtils.toISO(filters.dateTo) : undefined,
      )
      .addNumberRangeFilter('pricing.totalAmount', filters.amountFrom, filters.amountTo)
      .addStringFilter('pricing.currency', filters.currency)
      .addSearchFilter(filters.search, {
        fields: ['invoiceNumber', 'toAddress.name', 'toAddress.email', 'fromAddress.name', 'notes'],
        caseSensitive: false,
        exactMatch: false,
      })
      .build();
  }

  async getAllInvoicesForAdmin(filters: AdminInvoiceFilters): Promise<{
    invoices: InvoiceDocument[];
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const { page, limit, skip } = validatePagination({
      page: filters.page || 1,
      limit: filters.limit || 20,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addEnumFilter('status', filters.status)
      .addStringFilter('pricing.currency', filters.currency)
      .addStringFilter('customerId', filters.customerId)
      .addStringFilter('bookingId', filters.bookingId)
      .addDateRangeFilter(
        'createdAt',
        filters.dateFrom ? DateUtils.toISO(filters.dateFrom) : undefined,
        filters.dateTo ? DateUtils.toISO(filters.dateTo) : undefined,
      )
      .addDateRangeFilter(
        'dueDate',
        filters.dueDateFrom ? DateUtils.toISO(filters.dueDateFrom) : undefined,
        filters.dueDateTo ? DateUtils.toISO(filters.dueDateTo) : undefined,
      )
      .addNumberRangeFilter('pricing.totalAmount', filters.amountFrom, filters.amountTo)
      .addBooleanFilter('emailSent', filters.emailSent);

    // Handle special overdue filter
    if (filters.overdueOnly) {
      queryBuilder.addCustomFilter('dueDate', { $lt: DateUtils.now() });
      queryBuilder.addCustomFilter('status', { $in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] });
    }

    // Add search filter
    queryBuilder.addSearchFilter(filters.search, {
      fields: ['invoiceNumber', 'toAddress.name', 'toAddress.email', 'fromAddress.name', 'notes'],
      caseSensitive: false,
      exactMatch: false,
    });

    const query = queryBuilder.build();

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    if (filters.sortBy) {
      const sortField = filters.sortBy === 'totalAmount' ? 'pricing.totalAmount' : filters.sortBy;
      sort[sortField] = filters.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const [invoices, total] = await Promise.all([
      this.invoiceModel
        .find(query)
        .populate('customer', 'firstName lastName email')
        .populate('booking', 'confirmation_code check_in check_out')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.invoiceModel.countDocuments(query),
    ]);

    const paginationResult = buildPaginatedResult(invoices, total, page, limit);

    return {
      invoices: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      pages: paginationResult.totalPages,
      hasNext: paginationResult.hasNextPage,
      hasPrev: paginationResult.hasPrevPage,
    };
  }

  async getAdvancedInvoiceMetrics(filters: AdminInvoiceFilters): Promise<AdvancedInvoiceMetrics> {
    const matchStage: Partial<InvoiceSearchQuery> = {};

    if (filters.dateFrom || filters.dateTo) {
      matchStage.createdAt = {};
      if (filters.dateFrom) matchStage.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) matchStage.createdAt.$lte = filters.dateTo;
    }

    if (filters.currency) matchStage['pricing.currency'] = filters.currency;

    const [overallStats, statusBreakdown, monthlyRevenue, currencyBreakdown, topCustomers] =
      await Promise.all([
        // Overall statistics
        this.invoiceModel.aggregate<MetricsAggregationResult>([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalInvoices: { $sum: 1 },
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
              paidInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, 1, 0] },
              },
              overdueInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.OVERDUE] }, 1, 0] },
              },
              draftInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.DRAFT] }, 1, 0] },
              },
              cancelledInvoices: {
                $sum: { $cond: [{ $eq: ['$status', InvoiceStatus.CANCELLED] }, 1, 0] },
              },
              averageAmount: { $avg: '$pricing.totalAmount' },
              averagePaymentTime: { $avg: '$paymentInfo.paidAt' }, // Needs proper calculation
            },
          },
        ]),
        // Status breakdown with revenue
        this.invoiceModel.aggregate<StatusBreakdownResult>([
          { $match: matchStage },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              revenue: { $sum: '$pricing.totalAmount' },
            },
          },
        ]),
        // Monthly revenue trend
        this.invoiceModel.aggregate<MonthlyRevenueResult>([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              revenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
              invoiceCount: { $sum: 1 },
              averageValue: { $avg: '$pricing.totalAmount' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 12 }, // Last 12 months
        ]),
        // Currency breakdown
        this.invoiceModel.aggregate<CurrencyBreakdownResult>([
          { $match: matchStage },
          {
            $group: {
              _id: '$pricing.currency',
              count: { $sum: 1 },
              revenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
            },
          },
        ]),
        // Top customers
        this.invoiceModel.aggregate<TopCustomerResult>([
          { $match: { ...matchStage, customerId: { $ne: null } } },
          {
            $group: {
              _id: '$customerId',
              invoiceCount: { $sum: 1 },
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$status', InvoiceStatus.PAID] }, '$pricing.totalAmount', 0],
                },
              },
            },
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'customer',
            },
          },
          { $unwind: '$customer' },
          {
            $project: {
              customerId: '$_id',
              customerName: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
              customerEmail: '$customer.email',
              invoiceCount: 1,
              totalRevenue: 1,
            },
          },
        ]),
      ]);

    const stats: MetricsAggregationResult = overallStats[0] || {
      _id: null,
      totalInvoices: 0,
      totalRevenue: 0,
      paidInvoices: 0,
      overdueInvoices: 0,
      draftInvoices: 0,
      cancelledInvoices: 0,
      averageAmount: 0,
      averagePaymentTime: 0,
    };

    return {
      totalInvoices: stats.totalInvoices,
      totalRevenue: stats.totalRevenue,
      paidInvoices: stats.paidInvoices,
      overdueInvoices: stats.overdueInvoices,
      draftInvoices: stats.draftInvoices,
      cancelledInvoices: stats.cancelledInvoices,
      averagePaymentTime: stats.averagePaymentTime || 0,
      collectionRate:
        stats.totalInvoices > 0 ? (stats.paidInvoices / stats.totalInvoices) * 100 : 0,
      statusBreakdown: statusBreakdown.map((item) => ({
        status: item._id,
        count: item.count,
        percentage: stats.totalInvoices > 0 ? (item.count / stats.totalInvoices) * 100 : 0,
        revenue: item.revenue,
      })),
      monthlyRevenue: monthlyRevenue.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        revenue: item.revenue,
        invoiceCount: item.invoiceCount,
        averageValue: item.averageValue || 0,
      })),
      currencyBreakdown: currencyBreakdown.map((item) => ({
        currency: item._id,
        count: item.count,
        revenue: item.revenue,
      })),
      topCustomers: topCustomers.map((item) => ({
        customerId: item._id,
        customerName: `${item.customer.firstName} ${item.customer.lastName}`,
        customerEmail: item.customer.email,
        invoiceCount: item.invoiceCount,
        totalRevenue: item.totalRevenue,
      })),
    };
  }
}
