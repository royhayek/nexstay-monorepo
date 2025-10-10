import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { BookingStatusAggregationResult } from '../interfaces/mongodb-aggregation.interfaces';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { Invoice, InvoiceDocument } from '../../../database/schemas/invoice.schema';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../../../database/schemas/payment-transaction.schema';
import { DeviceToken, DeviceTokenDocument } from '../../../database/schemas/device-token.schema';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import {
  AnalyticsTimeframe,
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
  MetricCalculationResult,
} from '../interfaces/analytics.interfaces';

/**
 * Core Analytics Service
 * Handles basic analytics calculations and data aggregation operations
 */
@Injectable()
export class AnalyticsCoreService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(DeviceToken.name) private readonly deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  /**
   * Get comprehensive user analytics for a given timeframe
   */
  async getUserAnalytics(timeframe: AnalyticsTimeframe): Promise<UserAnalytics> {
    try {
      ValidationUtils.validateDateRange(timeframe.startDate, timeframe.endDate, {
        context: 'AnalyticsCoreService',
      });

      const [totalUsers, activeUsers, newUsers, usersByRole] = await Promise.all([
        this.userModel.countDocuments({ deletedAt: null }),
        this.userModel.countDocuments({
          deletedAt: null,
          lastActiveAt: { $gte: timeframe.startDate },
        }),
        this.userModel.countDocuments({
          deletedAt: null,
          createdAt: { $gte: timeframe.startDate, $lte: timeframe.endDate },
        }),
        this.aggregateUsersByRole(),
      ]);

      return {
        totalUsers,
        activeUsers,
        newUsers,
        usersByRole,
        usersByRegion: {}, // Implementation pending - requires user address/geolocation data
        userGrowthRate: this.calculateGrowthRate(newUsers, totalUsers - newUsers),
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating user analytics for timeframe ${timeframe.period}:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  /**
   * Get comprehensive booking analytics for a given timeframe
   */
  async getBookingAnalytics(timeframe: AnalyticsTimeframe): Promise<BookingAnalytics> {
    try {
      ValidationUtils.validateDateRange(timeframe.startDate, timeframe.endDate, {
        context: 'AnalyticsCoreService',
      });

      const [bookingStats, revenueStats] = await Promise.all([
        this.aggregateBookingsByStatus(timeframe),
        this.aggregateRevenueStats(timeframe),
      ]);

      const confirmedBookings = bookingStats.confirmed || 0;
      const pendingBookings = bookingStats.pending || 0;
      const cancelledBookings = bookingStats.cancelled || 0;
      const totalBookings = confirmedBookings + pendingBookings + cancelledBookings;

      return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        revenue: revenueStats.totalRevenue,
        averageBookingValue: revenueStats.averageBookingValue,
        bookingGrowthRate: 0, // Implementation pending - requires time-series booking analysis
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating booking analytics for timeframe ${timeframe.period}:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  /**
   * Get comprehensive financial analytics for a given timeframe
   */
  async getFinancialAnalytics(timeframe: AnalyticsTimeframe): Promise<FinancialAnalytics> {
    try {
      ValidationUtils.validateDateRange(timeframe.startDate, timeframe.endDate, {
        context: 'AnalyticsCoreService',
      });

      const revenueStats = await this.paymentModel.aggregate<{
        totalRevenue: number;
        averageTransaction: number;
        transactionCount: number;
      }>([
        {
          $match: {
            createdAt: { $gte: timeframe.startDate, $lte: timeframe.endDate },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount.amount' },
            averageTransaction: { $avg: '$amount.amount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]);

      const stats: { totalRevenue: number; averageTransaction: number; transactionCount: number } =
        revenueStats[0] || {
          totalRevenue: 0,
          averageTransaction: 0,
          transactionCount: 0,
        };

      return {
        totalRevenue: stats.totalRevenue || 0,
        hostEarnings: (stats.totalRevenue || 0) * 0.97, // Assuming 3% platform fee
        platformCommission: (stats.totalRevenue || 0) * 0.03,
        pendingPayouts: 0, // Implementation pending - requires payout status aggregation
        revenueGrowthRate: 0, // Implementation pending - requires time-series revenue comparison
        averageTransactionValue: stats.averageTransaction || 0,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating financial analytics for timeframe ${timeframe.period}:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  /**
   * Calculate metrics comparison between current and previous periods
   */
  async calculateMetricsComparison(
    current: AnalyticsTimeframe,
    previous: AnalyticsTimeframe,
  ): Promise<MetricCalculationResult[]> {
    try {
      const [currentUserStats, previousUserStats, currentBookingStats, previousBookingStats] =
        await Promise.all([
          this.getUserAnalytics(current),
          this.getUserAnalytics(previous),
          this.getBookingAnalytics(current),
          this.getBookingAnalytics(previous),
        ]);

      return [
        {
          label: 'Total active users',
          value: currentUserStats.activeUsers,
          change: this.calculateChangePercentage(
            currentUserStats.activeUsers,
            previousUserStats.activeUsers,
          ),
          changeType: this.getChangeType(
            currentUserStats.activeUsers,
            previousUserStats.activeUsers,
          ),
          period: current.period,
        },
        {
          label: 'Total bookings',
          value: currentBookingStats.totalBookings,
          change: this.calculateChangePercentage(
            currentBookingStats.totalBookings,
            previousBookingStats.totalBookings,
          ),
          changeType: this.getChangeType(
            currentBookingStats.totalBookings,
            previousBookingStats.totalBookings,
          ),
          period: current.period,
        },
      ];
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating metrics comparison:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  /**
   * Get platform distribution statistics
   */
  async getPlatformDistribution(): Promise<Array<{ platform: string; count: number }>> {
    try {
      const platformStats = await this.deviceTokenModel.aggregate<BookingStatusAggregationResult>([
        {
          $match: {
            is_active: true,
          },
        },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
          },
        },
      ]);

      return platformStats.map((stat: BookingStatusAggregationResult) => ({
        platform: stat._id,
        count: stat.count,
      }));
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating platform distribution:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  /**
   * Get regional booking distribution
   */
  async getRegionalDistribution(): Promise<
    Array<{ region: string; count: number; code?: string }>
  > {
    try {
      const regionalStats = await this.bookingModel.aggregate<BookingStatusAggregationResult>([
        {
          $lookup: {
            from: 'properties',
            localField: 'propertyId',
            foreignField: '_id',
            as: 'property',
          },
        },
        {
          $unwind: '$property',
        },
        {
          $group: {
            _id: '$property.address.country',
            count: { $sum: 1 },
            countryCode: { $first: '$property.address.country_code' },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      return regionalStats.map((stat: BookingStatusAggregationResult) => ({
        region: stat._id || 'Unknown',
        count: stat.count,
        code: (stat as { countryCode?: string }).countryCode?.toUpperCase(),
      }));
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating regional distribution:`,
        error,
        'AnalyticsCoreService',
      );
      throw error;
    }
  }

  // Private helper methods

  private async aggregateUsersByRole(): Promise<Record<string, number>> {
    const roleStats = await this.userModel.aggregate<BookingStatusAggregationResult>([
      { $match: { deletedAt: null } },
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
    ]);

    return roleStats.reduce(
      (acc: Record<string, number>, role: BookingStatusAggregationResult) => {
        acc[role._id] = role.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async aggregateBookingsByStatus(
    timeframe: AnalyticsTimeframe,
  ): Promise<Record<string, number>> {
    const bookingStats = await this.bookingModel.aggregate<BookingStatusAggregationResult>([
      {
        $match: {
          createdAt: { $gte: timeframe.startDate, $lte: timeframe.endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return bookingStats.reduce(
      (acc: Record<string, number>, stat: BookingStatusAggregationResult) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async aggregateRevenueStats(
    timeframe: AnalyticsTimeframe,
  ): Promise<{ totalRevenue: number; averageBookingValue: number }> {
    const revenueStats = await this.bookingModel.aggregate<{
      totalRevenue: number;
      averageBookingValue: number;
    }>([
      {
        $match: {
          createdAt: { $gte: timeframe.startDate, $lte: timeframe.endDate },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' },
        },
      },
    ]);

    return (
      revenueStats[0] || {
        totalRevenue: 0,
        averageBookingValue: 0,
      }
    );
  }

  private calculateChangePercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private getChangeType(current: number, previous: number): 'increase' | 'decrease' | 'neutral' {
    if (current > previous) return 'increase';
    if (current < previous) return 'decrease';
    return 'neutral';
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  /**
   * Generate a previous timeframe for comparison
   */
  createPreviousTimeframe(timeframe: AnalyticsTimeframe): AnalyticsTimeframe {
    const duration = timeframe.endDate.getTime() - timeframe.startDate.getTime();
    return {
      startDate: DateUtils.create(timeframe.startDate.getTime() - duration),
      endDate: DateUtils.create(timeframe.startDate.getTime()),
      period: timeframe.period,
    };
  }
}
