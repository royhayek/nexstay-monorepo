import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import {
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
} from '../../common/enums/payment.enums';
import {
  PaymentProviderInterface,
  CreateCustomerRequest,
  RefundRequest,
  PaymentProviderConfig,
  CreatePaymentIntentRequest,
} from '../../common/interfaces/payment.interfaces';
import {
  PaymentIntent as PaymentIntentModel,
  PaymentIntentDocument,
} from '../../database/schemas/payment-intent.schema';
import {
  PaymentTransaction as PaymentTransactionModel,
  PaymentTransactionDocument,
} from '../../database/schemas/payment-transaction.schema';
import {
  PaymentCustomer as PaymentCustomerModel,
  PaymentCustomerDocument,
} from '../../database/schemas/payment-customer.schema';
import { APSProvider } from './providers/aps.provider';
import { DynamicConfigService } from '../config/config.service';
import { PaymentAccountsIntegrationService } from './services/payment-accounts-integration.service';
import {
  PaymentIntentFilters,
  PaymentTransactionFilters,
  MongoSort,
  PaginatedPaymentIntentsResult,
  PaginatedPaymentTransactionsResult,
  PaginatedResponse,
} from './interfaces/payment-filters.interface';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class PaymentsService {
  private readonly providers = new Map<PaymentProvider, PaymentProviderInterface>();

  constructor(
    @InjectModel(PaymentIntentModel.name)
    private readonly paymentIntentModel: Model<PaymentIntentDocument>,
    @InjectModel(PaymentTransactionModel.name)
    private readonly paymentTransactionModel: Model<PaymentTransactionDocument>,
    @InjectModel(PaymentCustomerModel.name)
    private readonly paymentCustomerModel: Model<PaymentCustomerDocument>,
    private readonly configService: DynamicConfigService,
    private readonly apsProvider: APSProvider,
    private readonly paymentAccountsIntegration: PaymentAccountsIntegrationService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set(PaymentProvider.APS, this.apsProvider);
    LoggingUtil.log('Payment providers initialized', 'PaymentsService');
  }

  async getEnabledProviders(): Promise<PaymentProviderConfig[]> {
    const configs: PaymentProviderConfig[] = [];

    for (const [provider] of this.providers) {
      const isEnabled = await this.configService.getBoolean(
        `PAYMENT_PROVIDER_${provider.toUpperCase()}_ENABLED`,
        false,
      );

      if (isEnabled) {
        configs.push({
          provider,
          isEnabled,
          config: {}, // Don't expose sensitive config
        });
      }
    }

    return configs;
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentDocument> {
    try {
      // Validate provider is enabled
      const isEnabled = await this.isProviderEnabled(request.provider);
      if (!isEnabled) {
        throw new BadRequestException(`Payment provider ${request.provider} is not enabled`);
      }

      const provider = this.getProvider(request.provider);
      const intent = await provider.createPaymentIntent(request);

      // Save to database
      const paymentIntent = new this.paymentIntentModel({
        customerId: request.customerId,
        bookingId: request.bookingId ? String(request.bookingId) : undefined,
        amount: intent.amount,
        status: intent.status,
        provider: intent.provider,
        providerIntentId: intent.providerIntentId,
        clientSecret: intent.clientSecret,
        paymentMethodId: request.paymentMethodId,
        metadata: intent.metadata,
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        providerData: {},
      });

      const savedIntent = await paymentIntent.save();
      LoggingUtil.log(`Payment intent created: ${String(savedIntent._id)}`, 'PaymentsService');

      return savedIntent;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to create payment intent', error, 'PaymentsService');
      throw error;
    }
  }

  async confirmPaymentIntent(
    intentId: string,
    paymentMethodId?: string,
  ): Promise<PaymentIntentDocument> {
    try {
      const savedIntent = await this.paymentIntentModel.findById(intentId).exec();
      if (!savedIntent) {
        throw new NotFoundException(`Payment intent ${intentId} not found`);
      }

      const provider = this.getProvider(savedIntent.provider);

      // Convert saved intent to PaymentIntent interface for mock usage
      const actualIntentData = {
        id: String(savedIntent._id),
        amount: savedIntent.amount,
        status: savedIntent.status,
        provider: savedIntent.provider,
        customerId: savedIntent.customerId,
        providerIntentId: savedIntent.providerIntentId,
        clientSecret: savedIntent.clientSecret,
        metadata: savedIntent.metadata,
        createdAt: savedIntent.createdAt,
        updatedAt: savedIntent.updatedAt,
      };

      const confirmedIntent = await provider.confirmPaymentIntent(
        savedIntent.providerIntentId!,
        paymentMethodId,
        actualIntentData,
      );

      // Update database
      savedIntent.status = confirmedIntent.status;
      savedIntent.confirmedAt =
        confirmedIntent.status === PaymentIntentStatus.SUCCEEDED ? DateUtils.now() : undefined;
      await savedIntent.save();

      // Create transaction record and process through accounts if successful
      if (confirmedIntent.status === PaymentIntentStatus.SUCCEEDED) {
        const transaction = await this.createTransactionRecord(
          savedIntent,
          PaymentTransactionStatus.SUCCESS,
        );

        // Use integration service as primary bridge to accounts module
        await this.paymentAccountsIntegration.processCompletePaymentFlow(transaction, savedIntent);
      }

      LoggingUtil.log(`Payment intent confirmed: ${intentId}`, 'PaymentsService');
      return savedIntent;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to confirm payment intent', error, 'PaymentsService');
      throw error;
    }
  }

  async cancelPaymentIntent(intentId: string): Promise<PaymentIntentDocument> {
    try {
      const savedIntent = await this.paymentIntentModel.findById(intentId).exec();
      if (!savedIntent) {
        throw new NotFoundException(`Payment intent ${intentId} not found`);
      }

      const provider = this.getProvider(savedIntent.provider);
      await provider.cancelPaymentIntent(savedIntent.providerIntentId!);

      // Update database
      savedIntent.status = PaymentIntentStatus.CANCELLED;
      savedIntent.cancelledAt = DateUtils.now();
      await savedIntent.save();

      LoggingUtil.log(`Payment intent cancelled: ${intentId}`, 'PaymentsService');
      return savedIntent;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to cancel payment intent', error, 'PaymentsService');
      throw error;
    }
  }

  async refundPayment(request: RefundRequest): Promise<PaymentTransactionDocument> {
    try {
      const transaction = await this.paymentTransactionModel.findById(request.transactionId).exec();
      if (!transaction) {
        throw new NotFoundException(`Transaction ${request.transactionId} not found`);
      }

      const provider = this.getProvider(transaction.provider);
      const refundTransaction = await provider.refundPayment(
        transaction.providerTransactionId!,
        request.amount,
      );

      // Create refund transaction record
      const refundRecord = new this.paymentTransactionModel({
        paymentIntentId: transaction.paymentIntentId,
        customerId: transaction.customerId,
        bookingId: transaction.bookingId,
        amount: refundTransaction.amount,
        status: PaymentTransactionStatus.REFUNDED,
        provider: transaction.provider,
        providerTransactionId: refundTransaction.providerTransactionId,
        providerResponse: refundTransaction.providerResponse,
        metadata: {
          ...request.metadata,
          originalTransactionId: request.transactionId,
          refundReason: request.reason,
        },
        refundAmount: refundTransaction.amount.amount,
        refundDate: DateUtils.now(),
        refundReason: request.reason,
      });

      const savedRefund = await refundRecord.save();

      // Update original transaction
      transaction.refundAmount = refundTransaction.amount.amount;
      transaction.refundDate = DateUtils.now();
      if (refundTransaction.amount.amount >= transaction.amount.amount) {
        transaction.status = PaymentTransactionStatus.REFUNDED;
      } else {
        transaction.status = PaymentTransactionStatus.PARTIALLY_REFUNDED;
      }
      await transaction.save();

      LoggingUtil.log(`Payment refunded: ${String(savedRefund._id)}`, 'PaymentsService');
      return savedRefund;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to refund payment', error, 'PaymentsService');
      throw error;
    }
  }

  async createCustomer(
    customerData: CreateCustomerRequest,
    provider: PaymentProvider,
  ): Promise<PaymentCustomerDocument> {
    try {
      // Check if customer already exists for this provider
      const existingCustomer = await this.paymentCustomerModel
        .findOne({ userId: customerData.metadata?.userId, provider })
        .exec();

      if (existingCustomer) {
        return existingCustomer;
      }

      const providerInstance = this.getProvider(provider);
      const customer = await providerInstance.createCustomer(customerData);

      // Save to database
      const paymentCustomer = new this.paymentCustomerModel({
        userId: String(customerData.metadata?.userId),
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        provider: customer.provider,
        providerCustomerId: customer.providerCustomerId,
        metadata: customer.metadata,
        isActive: true,
      });

      const savedCustomer = await paymentCustomer.save();
      LoggingUtil.log(`Payment customer created: ${String(savedCustomer._id)}`, 'PaymentsService');

      return savedCustomer;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to create payment customer', error, 'PaymentsService');
      throw error;
    }
  }

  async getPaymentIntentById(id: string): Promise<PaymentIntentDocument | null> {
    return this.paymentIntentModel
      .findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('booking', 'confirmation_code')
      .exec();
  }

  async getPaymentIntentsByCustomer(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedPaymentIntentsResult> {
    const {
      page: validatedPage,
      limit: validatedLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    const [intents, total] = await Promise.all([
      this.paymentIntentModel
        .find({ customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validatedLimit)
        .populate('booking', 'confirmation_code')
        .exec(),
      this.paymentIntentModel.countDocuments({ customerId }),
    ]);

    const paginationResult = buildPaginatedResult(intents, total, validatedPage, validatedLimit);

    return {
      intents: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      pages: paginationResult.totalPages,
    };
  }

  async getTransactionById(id: string): Promise<PaymentTransactionDocument | null> {
    return this.paymentTransactionModel
      .findById(id)
      .populate('paymentIntent')
      .populate('customer', 'firstName lastName email')
      .populate('booking', 'confirmation_code')
      .exec();
  }

  async getTransactionsByCustomer(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedPaymentTransactionsResult> {
    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    const [transactions, total] = await Promise.all([
      this.paymentTransactionModel
        .find({ customerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .populate('paymentIntent')
        .populate('booking', 'confirmation_code')
        .exec(),
      this.paymentTransactionModel.countDocuments({ customerId }),
    ]);

    const paginationResult = buildPaginatedResult(transactions, total, validPage, validLimit);

    return {
      transactions: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      pages: paginationResult.totalPages,
    };
  }

  private async createTransactionRecord(
    intent: PaymentIntentDocument,
    status: PaymentTransactionStatus,
  ): Promise<PaymentTransactionDocument> {
    const transaction = new this.paymentTransactionModel({
      paymentIntentId: intent._id,
      customerId: intent.customerId,
      bookingId: intent.bookingId,
      amount: intent.amount,
      status,
      provider: intent.provider,
      providerTransactionId: intent.providerIntentId,
      paymentMethodId: intent.paymentMethodId,
      metadata: intent.metadata,
    });

    const savedTransaction = await transaction.save();

    // Payment processing now handled by PaymentAccountsIntegrationService
    // This keeps only the basic transaction record for external provider tracking

    return savedTransaction;
  }

  private getProvider(provider: PaymentProvider): PaymentProviderInterface {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new BadRequestException(`Payment provider ${provider} not supported`);
    }
    return providerInstance;
  }

  async getAllPaymentIntentsForAdmin(
    filters: PaymentIntentFilters,
  ): Promise<PaginatedResponse<PaymentIntentDocument>> {
    const { page, limit, skip } = validatePagination({
      page: filters.page || 1,
      limit: filters.limit || 20,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const query = QueryBuilder.create()
      .addEnumFilter('provider', filters.provider)
      .addEnumFilter('status', filters.status)
      .addStringFilter('amount.currency', filters.currency)
      .addStringFilter('customerId', filters.customerId)
      .addStringFilter('bookingId', filters.bookingId)
      .addDateRangeFilter(
        'createdAt',
        filters.dateFrom ? DateUtils.toISO(filters.dateFrom) : undefined,
        filters.dateTo ? DateUtils.toISO(filters.dateTo) : undefined,
      )
      .addNumberRangeFilter('amount.amount', filters.amountFrom, filters.amountTo)
      .addSearchFilter(filters.search, {
        fields: ['metadata.guestEmail', 'metadata.confirmationCode', 'metadata.description'],
        caseSensitive: false,
        exactMatch: false,
      })
      .build();

    // Build sort
    const sort: MongoSort = {};
    if (filters.sortBy) {
      const sortField = filters.sortBy === 'amount' ? 'amount.amount' : filters.sortBy;
      sort[sortField] = filters.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const [intents, total] = await Promise.all([
      this.paymentIntentModel
        .find(query)
        .populate('customer', 'firstName lastName email')
        .populate('booking', 'confirmation_code')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentIntentModel.countDocuments(query),
    ]);

    const paginationResult = buildPaginatedResult(intents, total, page, limit);

    return {
      data: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      pages: paginationResult.totalPages,
      hasNext: paginationResult.hasNextPage,
      hasPrev: paginationResult.hasPrevPage,
    };
  }

  async getAllTransactionsForAdmin(
    filters: PaymentTransactionFilters,
  ): Promise<PaginatedResponse<PaymentTransactionDocument>> {
    const { page, limit, skip } = validatePagination({
      page: filters.page || 1,
      limit: filters.limit || 20,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const query = QueryBuilder.create()
      .addEnumFilter('provider', filters.provider)
      .addEnumFilter('status', filters.transactionStatus)
      .addStringFilter('amount.currency', filters.currency)
      .addStringFilter('customerId', filters.customerId)
      .addStringFilter('bookingId', filters.bookingId)
      .addDateRangeFilter(
        'createdAt',
        filters.dateFrom ? DateUtils.toISO(filters.dateFrom) : undefined,
        filters.dateTo ? DateUtils.toISO(filters.dateTo) : undefined,
      )
      .addNumberRangeFilter('amount.amount', filters.amountFrom, filters.amountTo)
      .addSearchFilter(filters.search, {
        fields: ['metadata.guestEmail', 'metadata.confirmationCode', 'providerTransactionId'],
        caseSensitive: false,
        exactMatch: false,
      })
      .build();

    // Build sort
    const sort: MongoSort = {};
    if (filters.sortBy) {
      const sortField = filters.sortBy === 'amount' ? 'amount.amount' : filters.sortBy;
      sort[sortField] = filters.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    const [transactions, total] = await Promise.all([
      this.paymentTransactionModel
        .find(query)
        .populate('customer', 'firstName lastName email')
        .populate('booking', 'confirmation_code')
        .populate('paymentIntent')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.paymentTransactionModel.countDocuments(query),
    ]);

    const paginationResult = buildPaginatedResult(transactions, total, page, limit);

    return {
      data: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      pages: paginationResult.totalPages,
      hasNext: paginationResult.hasNextPage,
      hasPrev: paginationResult.hasPrevPage,
    };
  }

  private async isProviderEnabled(provider: PaymentProvider): Promise<boolean> {
    return this.configService.getBoolean(
      `PAYMENT_PROVIDER_${provider.toUpperCase()}_ENABLED`,
      false,
    );
  }

  // Admin method
  async getPaymentProvidersConfig(): Promise<{
    providers: Array<{
      name: string;
      isEnabled: boolean;
      settings: Record<string, unknown>;
    }>;
    activeProvider: string;
  }> {
    try {
      const [apsmerchantId, apsEnv] = await Promise.all([
        this.configService.get('APS_MERCHANT_IDENTIFIER'),
        this.configService.get('APS_ENVIRONMENT', 'sandbox'),
      ]);

      const apsEnabled = await this.isProviderEnabled(PaymentProvider.APS);

      return {
        providers: [
          {
            name: 'APS',
            isEnabled: apsEnabled,
            settings: {
              merchantId: apsmerchantId ? '***' : null,
              environment: apsEnv,
            },
          },
        ],
        activeProvider: apsEnabled ? 'APS' : '',
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error getting payment providers config',
        error,
        'PaymentsService',
      );
      throw new InternalServerErrorException('Failed to get payment providers configuration');
    }
  }
}
