import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import {
  SecurityDeposit,
  SecurityDepositDocument,
} from '../../../database/schemas/security-deposit.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import {
  SecurityDepositStatus,
  SecurityDepositReleaseReason,
} from '../../../common/enums/security-deposit.enums';
import { MultiCurrencyService } from '../../multi-currency/services/multi-currency.service';
import { SecurityDepositProcessingService } from './security-deposit-processing.service';
import {
  CreateSecurityDepositRequest,
  SecurityDepositFilters,
  SecurityDepositStatsAggregationResult,
  SecurityDepositsPaginatedResponse,
} from '../interfaces/security-deposit.interfaces';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class SecurityDepositService {
  constructor(
    @InjectModel(SecurityDeposit.name)
    private readonly securityDepositModel: Model<SecurityDepositDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly multiCurrencyService: MultiCurrencyService,
    private readonly processingService: SecurityDepositProcessingService,
  ) {}

  /**
   * Create a security deposit for a booking
   */
  async createSecurityDeposit(request: CreateSecurityDepositRequest): Promise<SecurityDeposit> {
    const {
      bookingId,
      propertyId,
      guestId,
      hostId,
      amount,
      currency,
      autoReleaseAfterDays = 14,
    } = request;

    // Verify booking exists
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if security deposit already exists
    const existing = await this.securityDepositModel.findOne({ bookingId }).exec();
    if (existing) {
      throw new BadRequestException('Security deposit already exists for this booking');
    }

    // Validate currency and convert if needed
    const isValidCurrency = await this.multiCurrencyService.validateCurrency(currency);
    if (!isValidCurrency) {
      throw new BadRequestException(`Unsupported currency: ${currency}`);
    }

    // Convert to primary currency if needed
    const primaryCurrency = this.multiCurrencyService.getPrimaryCurrency();
    let depositAmount = {
      amount,
      currency,
      originalAmount: amount,
      originalCurrency: currency,
    };

    if (currency !== primaryCurrency) {
      const conversion = await this.multiCurrencyService.convertCurrency(
        amount,
        currency,
        primaryCurrency,
      );

      depositAmount = {
        amount: conversion.convertedAmount,
        currency: primaryCurrency,
        originalAmount: amount,
        originalCurrency: currency,
      };
    }

    // Calculate release date
    const releaseScheduledAt = DateUtils.now();
    releaseScheduledAt.setDate(releaseScheduledAt.getDate() + autoReleaseAfterDays);

    const securityDeposit = new this.securityDepositModel({
      bookingId: new Types.ObjectId(bookingId),
      propertyId: new Types.ObjectId(propertyId),
      guestId: new Types.ObjectId(guestId),
      hostId: new Types.ObjectId(hostId),
      depositAmount,
      status: SecurityDepositStatus.PENDING,
      releaseScheduledAt,
      autoReleaseAfterDays,
      claims: [],
      totalClaimedAmount: 0,
      hasActiveClaims: false,
      requiresAdminReview: false,
    });

    const saved = await securityDeposit.save();

    LoggingUtil.log(
      `Created security deposit ${String(saved._id)} for booking ${bookingId}, amount: ${amount} ${currency}`,
      'SecurityDepositService',
    );

    return saved;
  }

  /**
   * Get security deposit by ID
   */
  async getSecurityDepositById(depositId: string): Promise<SecurityDepositDocument> {
    const deposit = await this.securityDepositModel
      .findById(depositId)
      .populate('booking')
      .populate('property')
      .populate('guest')
      .populate('host')
      .exec();

    if (!deposit) {
      throw new NotFoundException('Security deposit not found');
    }

    return deposit;
  }

  /**
   * Get security deposit by booking ID
   */
  async getSecurityDepositByBookingId(bookingId: string): Promise<SecurityDeposit | null> {
    return this.securityDepositModel
      .findOne({ bookingId: new Types.ObjectId(bookingId) })
      .populate('booking')
      .populate('property')
      .populate('guest')
      .populate('host')
      .exec();
  }

  /**
   * Get security deposits with filters
   */
  async getSecurityDeposits(
    filters: SecurityDepositFilters = {},
    page = 1,
    limit = 20,
  ): Promise<SecurityDepositsPaginatedResponse> {
    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addEnumFilter('status', filters.status)
      .addObjectIdFilter('hostId', filters.hostId)
      .addObjectIdFilter('guestId', filters.guestId)
      .addObjectIdFilter('propertyId', filters.propertyId)
      .addBooleanFilter('hasActiveClaims', filters.hasActiveClaims)
      .addBooleanFilter('requiresAdminReview', filters.requiresAdminReview)
      .addDateRangeFilter(
        'createdAt',
        filters.createdAfter ? DateUtils.toISO(filters.createdAfter) : undefined,
        filters.createdBefore ? DateUtils.toISO(filters.createdBefore) : undefined,
      );

    // Add custom filter for release due date
    if (filters.releaseDueBefore) {
      queryBuilder.addCustomFilter('releaseScheduledAt', { $lte: filters.releaseDueBefore });
    }

    const query = queryBuilder.build();

    const [deposits, total] = await Promise.all([
      this.securityDepositModel
        .find(query)
        .populate('booking')
        .populate('property')
        .populate('guest')
        .populate('host')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .exec(),
      this.securityDepositModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(deposits, total, validPage, validLimit);

    return {
      deposits: paginationResult.data,
      total: paginationResult.total,
      pages: paginationResult.totalPages,
    };
  }

  /**
   * Hold security deposit (authorize payment)
   */
  async holdSecurityDeposit(
    depositId: string,
    paymentMethodId: string,
  ): Promise<SecurityDepositDocument> {
    const deposit = await this.getSecurityDepositById(depositId);

    if (deposit.status !== SecurityDepositStatus.PENDING) {
      throw new BadRequestException(`Cannot hold deposit with status: ${deposit.status}`);
    }

    return this.processingService.holdDeposit(deposit, paymentMethodId);
  }

  /**
   * Release security deposit back to guest
   */
  async releaseSecurityDeposit(
    depositId: string,
    releaseReason: SecurityDepositReleaseReason,
    adminNotes?: string,
    releasedBy?: string,
  ): Promise<SecurityDeposit> {
    const deposit = await this.getSecurityDepositById(depositId);

    if (
      ![SecurityDepositStatus.HELD, SecurityDepositStatus.PARTIALLY_CLAIMED].includes(
        deposit.status,
      )
    ) {
      throw new BadRequestException(`Cannot release deposit with status: ${deposit.status}`);
    }

    if (deposit.hasActiveClaims) {
      throw new BadRequestException('Cannot release deposit with active claims');
    }

    return this.processingService.releaseDeposit(deposit, releaseReason, adminNotes, releasedBy);
  }

  /**
   * Update security deposit status
   */
  async updateSecurityDepositStatus(
    depositId: string,
    status: SecurityDepositStatus,
    notes?: string,
    updatedBy?: string,
  ): Promise<SecurityDeposit> {
    const deposit = await this.getSecurityDepositById(depositId);

    deposit.status = status;
    if (notes) {
      deposit.adminNotes = notes;
    }
    if (updatedBy) {
      deposit.processedBy = new Types.ObjectId(updatedBy);
      deposit.processedAt = DateUtils.now();
    }

    const updated = await this.securityDepositModel
      .findByIdAndUpdate(depositId, deposit, { new: true })
      .exec();

    LoggingUtil.log(
      `Updated security deposit ${depositId} status to ${status}`,
      'SecurityDepositService',
    );

    return updated!;
  }

  /**
   * Get deposits due for auto-release
   */
  async getDepositsForAutoRelease(): Promise<SecurityDepositDocument[]> {
    const cutoffDate = DateUtils.now();

    return this.securityDepositModel
      .find({
        status: SecurityDepositStatus.HELD,
        releaseScheduledAt: { $lte: cutoffDate },
        hasActiveClaims: false,
        requiresAdminReview: false,
      })
      .exec();
  }

  /**
   * Scheduled job to auto-release eligible deposits
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processAutoReleases(): Promise<void> {
    LoggingUtil.log('Starting auto-release processing', 'SecurityDepositService');

    try {
      const eligibleDeposits = await this.getDepositsForAutoRelease();

      for (const deposit of eligibleDeposits) {
        try {
          await this.releaseSecurityDeposit(
            String(deposit._id),
            SecurityDepositReleaseReason.AUTO_RELEASE,
            'Automatic release after grace period',
            'system',
          );
        } catch (error: unknown) {
          LoggingUtil.error(
            `Failed to auto-release deposit ${String(deposit._id)}:`,
            error instanceof Error ? error.message : 'Unknown error',
            'SecurityDepositService',
          );
        }
      }

      LoggingUtil.log(
        `Auto-release processing completed. Processed ${eligibleDeposits.length} deposits`,
        'SecurityDepositService',
      );
    } catch (error: unknown) {
      LoggingUtil.error(
        'Auto-release processing failed:',
        error instanceof Error ? error.message : 'Unknown error',
        'SecurityDepositService',
      );
    }
  }

  /**
   * Get security deposit statistics
   */
  async getSecurityDepositStats(hostId?: string): Promise<{
    total: number;
    byStatus: { [status: string]: number };
    totalAmount: number;
    averageAmount: number;
    activeClaimsCount: number;
  }> {
    const matchQuery: { hostId?: Types.ObjectId } = {};
    if (hostId) {
      matchQuery.hostId = new Types.ObjectId(hostId);
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$depositAmount.amount' },
          statuses: { $push: '$status' },
          activeClaimsCount: {
            $sum: { $cond: [{ $eq: ['$hasActiveClaims', true] }, 1, 0] },
          },
        },
      },
    ];

    const result = await this.securityDepositModel.aggregate(pipeline);
    const stats: SecurityDepositStatsAggregationResult =
      (result[0] as SecurityDepositStatsAggregationResult) || {
        _id: null,
        total: 0,
        totalAmount: 0,
        statuses: [],
        activeClaimsCount: 0,
      };

    // Calculate status distribution
    const byStatus: { [status: string]: number } = {};
    for (const status of Object.values(SecurityDepositStatus)) {
      byStatus[status] = 0;
    }
    stats.statuses.forEach((status: string) => {
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total: stats.total,
      byStatus,
      totalAmount: stats.totalAmount,
      averageAmount: stats.total > 0 ? stats.totalAmount / stats.total : 0,
      activeClaimsCount: stats.activeClaimsCount,
    };
  }
}
