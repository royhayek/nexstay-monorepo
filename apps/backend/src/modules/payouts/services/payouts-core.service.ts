import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import { DynamicConfigService } from '../../config/config.service';
import { Payout, PayoutDocument } from '../../../database/schemas/payout.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { OtpNotificationMethod, User, UserDocument } from '../../../database/schemas/user.schema';
import { PayoutMethodDocument } from '../../../database/schemas/payout-method.schema';
import { PayoutsAccountsIntegrationService } from './payouts-accounts-integration.service';
import {
  PayoutStatus,
  PayoutType,
  PayoutProvider,
  PayoutFrequency,
  PayoutTrigger,
  PayoutMethodType,
} from '../../../common/enums/payout.enums';
import { TransactionType } from '../../../database/schemas/transaction.schema';
import { CurrencyCode } from '../../../common/enums/payment.enums';
import { UpdatePayoutPreferencesDto } from '../dto/payout-preferences.dto';
import {
  EligibleEarningsData,
  PayoutPreferencesResponse,
} from '../interfaces/payout-types.interface';
import {
  PayoutSearchFilters,
  PayoutPaginationOptions,
  PaginatedPayoutResult,
} from '../interfaces/payout-service.interface';
import {
  PayoutFeeBreakdown,
  PayoutBookingReference,
} from '../../../database/schemas/payout.schema';
import { PayoutErrorCode } from '../enums/payout-error.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

// Create a specific service interface for core operations
interface IPayoutsCoreService {
  createPayout(userId: string, data: CreatePayoutData): Promise<PayoutDocument>;
  cancelPayout(userId: string, payoutId: string, reason?: string): Promise<PayoutDocument>;
  getPayouts(
    filters: PayoutSearchFilters,
    pagination: PayoutPaginationOptions,
  ): Promise<PaginatedPayoutResult>;
  getPayoutById(payoutId: string, userId?: string): Promise<PayoutDocument>;
  getEligibleEarnings(userId: string): Promise<EligibleEarningsData>;
  updatePayoutPreferences(
    userId: string,
    dto: UpdatePayoutPreferencesDto,
  ): Promise<PayoutPreferencesResponse>;
  getPayoutPreferences(userId: string): Promise<PayoutPreferencesResponse>;
}

interface CreatePayoutData {
  payoutMethodId: string;
  type: PayoutType;
  payoutMethod: PayoutMethodDocument;
  grossAmount: number;
  fees: PayoutFeeBreakdown;
  netAmount: number;
  bookings: PayoutBookingReference[];
  description?: string;
}

/**
 * Core service for payout operations
 * Handles the main payout CRUD operations and business logic
 */
@Injectable()
export class PayoutsCoreService implements IPayoutsCoreService {
  constructor(
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: DynamicConfigService,
    private accountsIntegration: PayoutsAccountsIntegrationService,
  ) {}

  /**
   * Create a new payout
   */
  async createPayout(userId: string, data: CreatePayoutData): Promise<PayoutDocument> {
    try {
      // Get default currency from configuration
      const defaultCurrency = await this.getDefaultCurrency();

      // Determine currency from payout method or use default
      const currency = data.payoutMethod?.currency || defaultCurrency;

      // Determine provider from payout method
      const provider = this.determinePayoutProvider(data.payoutMethod);

      // Update booking payout status
      const bookingIds = data.bookings.map((b) => b.bookingId);
      await this.bookingModel.updateMany(
        { _id: { $in: bookingIds } },
        { $set: { payout_status: 'pending' } },
      );

      // Create payout document
      const payout = new this.payoutModel({
        hostId: userId,
        payoutMethodId: data.payoutMethodId,
        type: data.type,
        status: PayoutStatus.PENDING,
        grossAmount: {
          amount: data.grossAmount,
          currency,
        },
        fees: data.fees,
        netAmount: {
          amount: data.netAmount,
          currency,
        },
        bookings: data.bookings,
        provider,
        payoutDate: DateUtils.now(),
        reference: this.generateReference('PO'),
        description: data.description || `Host payout for ${data.bookings.length} booking(s)`,
        trigger: PayoutTrigger.MANUAL_REQUEST,
      });

      await payout.save();
      LoggingUtil.log(
        `Payout created for host ${userId}: ${String(payout._id)}`,
        'PayoutsCoreService',
      );

      return payout;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error creating payout for host ${userId}:`,
        error,
        'PayoutsCoreService',
      );
      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to create payout',
      });
    }
  }

  /**
   * Cancel a payout
   */
  async cancelPayout(userId: string, payoutId: string, reason?: string): Promise<PayoutDocument> {
    const payout = await this.payoutModel.findOne({
      _id: payoutId,
      hostId: userId,
    });

    if (!payout) {
      throw new NotFoundException({
        code: PayoutErrorCode.PAYOUT_NOT_FOUND,
        message: 'Payout not found',
      });
    }

    if (![PayoutStatus.PENDING, PayoutStatus.PENDING_APPROVAL].includes(payout.status)) {
      throw new BadRequestException({
        code: PayoutErrorCode.PAYOUT_INVALID_STATUS,
        message: 'Payout cannot be cancelled in current status',
      });
    }

    payout.status = PayoutStatus.CANCELLED;
    payout.failureReason = reason || 'Cancelled by host';
    payout.failedAt = DateUtils.now();

    // Update booking payout status
    const bookingIds = payout.bookings.map((b) => b.bookingId);
    await this.bookingModel.updateMany(
      { _id: { $in: bookingIds } },
      { $set: { payout_status: 'unpaid' } },
    );

    await payout.save();
    LoggingUtil.log(`Payout cancelled: ${payoutId}`, 'PayoutsCoreService');

    return payout;
  }

  /**
   * Get paginated payouts
   */
  async getPayouts(
    filters: PayoutSearchFilters,
    pagination: PayoutPaginationOptions,
  ): Promise<PaginatedPayoutResult> {
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addStringFilter('hostId', filters.hostId)
      .addStringFilter('payoutMethodId', filters.payoutMethodId)
      .addEnumFilter('provider', filters.provider)
      .addDateRangeFilter(
        'payoutDate',
        filters.fromDate ? DateUtils.toISO(filters.fromDate) : undefined,
        filters.toDate ? DateUtils.toISO(filters.toDate) : undefined,
      )
      .addNumberRangeFilter('grossAmount.amount', filters.minAmount, filters.maxAmount);

    // Handle status filter (can be array or single value)
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.addCustomFilter('status', { $in: filters.status });
      } else {
        queryBuilder.addEnumFilter('status', filters.status);
      }
    }

    const query = queryBuilder.build();

    const { sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      this.payoutModel
        .find(query)
        .populate('payoutMethod')
        .populate('host', 'profile.firstName profile.lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.payoutModel.countDocuments(query),
    ]);

    const paginationResult = buildPaginatedResult(items, total, page, limit);

    return {
      items: paginationResult.data,
      pagination: {
        page: paginationResult.page,
        limit: paginationResult.limit,
        total: paginationResult.total,
        totalPages: paginationResult.totalPages,
        hasNextPage: paginationResult.hasNextPage,
        hasPreviousPage: paginationResult.hasPrevPage,
        nextPage: paginationResult.hasNextPage ? paginationResult.page + 1 : undefined,
        previousPage: paginationResult.hasPrevPage ? paginationResult.page - 1 : undefined,
      },
    };
  }

  /**
   * Get payout by ID
   */
  async getPayoutById(payoutId: string, userId?: string): Promise<PayoutDocument> {
    const query: Record<string, any> = { _id: payoutId };
    if (userId) query.hostId = userId;

    const payout = await this.payoutModel
      .findOne(query)
      .populate('payoutMethod')
      .populate('host', 'profile.firstName profile.lastName email');

    if (!payout) {
      throw new NotFoundException({
        code: PayoutErrorCode.PAYOUT_NOT_FOUND,
        message: 'Payout not found',
      });
    }

    return payout;
  }

  /**
   * Get eligible earnings for a host
   * Now uses accounts module as single source of truth for balances
   */
  async getEligibleEarnings(userId: string): Promise<EligibleEarningsData> {
    // Get earnings from accounts module (single source of truth)
    const hostEarnings = await this.accountsIntegration.getHostEarningsFromAccounts(userId);

    // Get recent transactions for details
    const recentTransactions = await this.accountsIntegration.getHostTransactionHistory(userId, 20);

    // Get default currency
    const defaultCurrency = await this.getDefaultCurrency();

    // Map transactions to booking-like structure for backward compatibility
    const bookings = recentTransactions
      .filter(
        (tx) =>
          tx.type === TransactionType.ESCROW_RELEASE || tx.type === TransactionType.HOST_PAYOUT,
      )
      .slice(0, 10)
      .map((tx) => ({
        bookingId: String(tx.reference?.id || tx._id),
        propertyName: tx.description || 'Property',
        totalAmount: tx.amount.value,
        hostEarning: tx.amount.value,
        checkOutDate: tx.createdAt,
        guestName: 'Guest',
      }));

    return {
      totalEarnings: hostEarnings.availableBalance,
      currency: (hostEarnings.currency || defaultCurrency) as CurrencyCode,
      bookingsCount: bookings.length,
      bookings,
    };
  }

  /**
   * Update payout preferences
   */
  async updatePayoutPreferences(
    userId: string,
    dto: UpdatePayoutPreferencesDto,
  ): Promise<PayoutPreferencesResponse> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Initialize preferences if not exists
    const userWithPrefs = user as typeof user & {
      preferences: {
        payout?: {
          autoPayoutEnabled?: boolean;
          frequency?: string;
          minimumAmount?: number;
          preferredMethodId?: string;
        };
      };
    };

    if (!userWithPrefs.preferences) {
      userWithPrefs.preferences = {
        otpNotificationMethod: OtpNotificationMethod.EMAIL,
        language: 'en',
        timezone: 'UTC',
      };
    }
    if (!userWithPrefs.preferences?.payout) {
      userWithPrefs.preferences.payout = {
        frequency: PayoutFrequency.WEEKLY,
        minimumAmount: 100,
        autoPayoutEnabled: false,
      };
    }

    // Update preferences
    if (dto.frequency !== undefined) {
      userWithPrefs.preferences.payout.frequency = dto.frequency;
    }
    if (dto.minimumAmount !== undefined) {
      userWithPrefs.preferences.payout.minimumAmount = dto.minimumAmount;
    }
    if (dto.preferredMethodId !== undefined) {
      const payoutPrefs = userWithPrefs.preferences.payout as {
        frequency: PayoutFrequency;
        minimumAmount: number;
        autoPayoutEnabled: boolean;
        preferredMethodId?: Types.ObjectId;
        lastAutoPayoutDate?: Date;
      };
      payoutPrefs.preferredMethodId = new Types.ObjectId(dto.preferredMethodId);
    }
    if (dto.autoPayoutEnabled !== undefined) {
      userWithPrefs.preferences.payout.autoPayoutEnabled = dto.autoPayoutEnabled;
    }

    await user.save();

    return this.formatPayoutPreferences(user);
  }

  /**
   * Get payout preferences
   */
  async getPayoutPreferences(userId: string): Promise<PayoutPreferencesResponse> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatPayoutPreferences(user);
  }

  /**
   * Format payout preferences for response
   */
  private formatPayoutPreferences(user: UserDocument): PayoutPreferencesResponse {
    const preferences = user.preferences?.payout || {
      frequency: PayoutFrequency.MANUAL,
      minimumAmount: 100,
      autoPayoutEnabled: false,
    };

    const nextScheduledPayout = preferences.autoPayoutEnabled
      ? this.calculateNextPayoutDate(preferences.frequency, preferences.lastAutoPayoutDate)
      : null;

    return {
      frequency: preferences.frequency || PayoutFrequency.MANUAL,
      minimumAmount: preferences.minimumAmount || 100,
      preferredMethodId: preferences.preferredMethodId?.toString(),
      autoPayoutEnabled: preferences.autoPayoutEnabled || false,
      lastAutoPayoutDate: preferences.lastAutoPayoutDate,
      nextScheduledPayout,
    };
  }

  /**
   * Calculate next payout date based on frequency
   */
  private calculateNextPayoutDate(frequency: PayoutFrequency, lastDate?: Date): Date | null {
    if (frequency === PayoutFrequency.MANUAL) return null;

    const baseDate = lastDate || DateUtils.now();
    const nextDate = DateUtils.create(baseDate);

    switch (frequency) {
      case PayoutFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case PayoutFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case PayoutFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Get default currency from configuration
   */
  private async getDefaultCurrency(): Promise<CurrencyCode> {
    try {
      const defaultCurrencyStr = await this.configService.get('DEFAULT_CURRENCY_DISPLAY', 'USD');
      // Validate that the currency exists in our enum
      if (Object.values(CurrencyCode).includes(defaultCurrencyStr as CurrencyCode)) {
        return defaultCurrencyStr as CurrencyCode;
      }
      LoggingUtil.warn(
        `Invalid currency '${defaultCurrencyStr}' from config, using USD as fallback`,
        'PayoutsCoreService',
      );
      return CurrencyCode.USD;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to get default currency from config, using USD as fallback`,
        error,
        'PayoutsCoreService',
      );
      return CurrencyCode.USD;
    }
  }

  /**
   * Determine payout provider from payout method
   */
  private determinePayoutProvider(payoutMethod: PayoutMethodDocument): PayoutProvider {
    if (!payoutMethod) {
      LoggingUtil.warn(
        'No payout method provided, using APS as default provider',
        'PayoutsCoreService',
      );
      return PayoutProvider.APS;
    }

    // Use explicit provider if set in the payout method
    if (payoutMethod.provider) {
      return payoutMethod.provider;
    }

    // Fall back to mapping payout method types to providers
    switch (payoutMethod.type) {
      case PayoutMethodType.BANK_ACCOUNT:
        return PayoutProvider.BANK_TRANSFER;
      case PayoutMethodType.DEBIT_CARD:
      case PayoutMethodType.WALLET:
        // For electronic payment methods, use APS as the primary provider
        // This could be extended to support multiple providers based on region/preferences
        return PayoutProvider.APS;
      default:
        LoggingUtil.warn(
          `Unknown payout method type '${String(payoutMethod.type)}', using APS as default`,
          'PayoutsCoreService',
        );
        return PayoutProvider.APS;
    }
  }

  /**
   * Generate unique reference
   */
  private generateReference(prefix: string): string {
    const timestamp = DateUtils.nowTimestamp();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}
