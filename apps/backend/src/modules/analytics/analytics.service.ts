import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { Booking, BookingDocument } from '../../database/schemas/booking.schema';
import { Invoice, InvoiceDocument } from '../../database/schemas/invoice.schema';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../../database/schemas/payment-transaction.schema';
import { DeviceToken, DeviceTokenDocument } from '../../database/schemas/device-token.schema';
import { Review, ReviewDocument } from '../../database/schemas/review.schema';
import { Property, PropertyDocument } from '../../database/schemas/property.schema';
import {
  DashboardOverviewDto,
  MetricCardDto,
  PlatformDistributionDto,
  RegionalDataDto,
  TimeSeriesDataDto,
  TopHostDto,
  InvoiceOverviewDto,
} from './dto/dashboard-overview.dto';
import {
  BookingOverviewDto,
  BookingStatisticsDto,
  CustomerReviewDto,
  NewestBookingDto,
  BookingDetailDto,
} from './dto/booking-overview.dto';
import {
  AnalyticsTimeframe,
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
} from './interfaces/analytics.interfaces';

// Type interfaces for MongoDB populated results with virtual fields

interface PlatformStats {
  _id: string;
  count: number;
}

interface RegionalStats {
  _id: string;
  count: number;
  countryCode: string;
}

interface RevenueStatsResult {
  totalRevenue: number;
  averageBookingValue: number;
  totalBookings: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  averageTransaction: number;
  transactionCount?: number;
}

interface YearlyStatsData {
  _id: number;
  statuses: Array<{
    status: string;
    count: number;
  }>;
}

interface StatusMap {
  [status: string]: number;
}

interface StatGroup {
  _id: string;
  count: number;
}

interface BookingTotalStatsResult {
  total: number;
  sold: number;
  canceled: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(PaymentTransaction.name) private paymentModel: Model<PaymentTransactionDocument>,
    @InjectModel(DeviceToken.name) private deviceTokenModel: Model<DeviceTokenDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
  ) {}

  async getDashboardOverview(): Promise<DashboardOverviewDto> {
    const timeframe: AnalyticsTimeframe = {
      startDate: DateUtils.create(DateUtils.nowTimestamp() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate: DateUtils.now(),
      period: '7d',
    };

    const [metrics, platformDistribution, regionalData, monthlyTrends, topHosts, recentInvoices] =
      await Promise.all([
        this.getMetrics(timeframe),
        this.getPlatformDistribution(),
        this.getRegionalData(),
        this.getMonthlyTrends(),
        this.getTopHosts(),
        this.getRecentInvoices(),
      ]);

    return {
      metrics,
      platformDistribution,
      regionalData,
      monthlyTrends,
      topHosts,
      recentInvoices,
      lastUpdated: DateUtils.now(),
    };
  }

  private async getMetrics(timeframe: AnalyticsTimeframe): Promise<MetricCardDto[]> {
    const [
      currentUserStats,
      previousUserStats,
      currentBookingStats,
      previousBookingStats,
      currentRevenueStats,
      previousRevenueStats,
    ] = await Promise.all([
      this.getUserAnalytics(timeframe),
      this.getUserAnalytics(this.getPreviousTimeframe(timeframe)),
      this.getBookingAnalytics(timeframe),
      this.getBookingAnalytics(this.getPreviousTimeframe(timeframe)),
      this.getFinancialAnalytics(timeframe),
      this.getFinancialAnalytics(this.getPreviousTimeframe(timeframe)),
    ]);

    return [
      {
        label: 'Total active users',
        value: currentUserStats.activeUsers,
        change: this.calculateChangePercentage(
          currentUserStats.activeUsers,
          previousUserStats.activeUsers,
        ),
        changeType: this.getChangeType(currentUserStats.activeUsers, previousUserStats.activeUsers),
        period: 'last 7 days',
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
        period: 'last 7 days',
      },
      {
        label: 'Total revenue',
        value: currentRevenueStats.totalRevenue,
        change: this.calculateChangePercentage(
          currentRevenueStats.totalRevenue,
          previousRevenueStats.totalRevenue,
        ),
        changeType: this.getChangeType(
          currentRevenueStats.totalRevenue,
          previousRevenueStats.totalRevenue,
        ),
        period: 'last 7 days',
        unit: 'USD',
      },
    ];
  }

  private async getUserAnalytics(timeframe: AnalyticsTimeframe): Promise<UserAnalytics> {
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
      this.userModel.aggregate([
        { $match: { deletedAt: null } },
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } },
      ]),
    ]);

    interface RoleGroup {
      _id: string;
      count: number;
    }
    const rolesObj = (usersByRole as RoleGroup[]).reduce(
      (acc: Record<string, number>, role: RoleGroup) => {
        acc[role._id] = role.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalUsers,
      activeUsers,
      newUsers,
      usersByRole: rolesObj,
      usersByRegion: {}, // Implementation pending - requires user address/geolocation data
      userGrowthRate: 0, // Implementation pending - requires time-series comparison logic
    };
  }

  private async getBookingAnalytics(timeframe: AnalyticsTimeframe): Promise<BookingAnalytics> {
    const [bookingStats, revenueStats] = await Promise.all([
      this.bookingModel.aggregate([
        {
          $match: {
            createdAt: { $gte: timeframe.startDate, $lte: timeframe.endDate },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]),
      this.bookingModel.aggregate([
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
            totalBookings: { $sum: 1 },
          },
        },
      ]),
    ]);

    interface StatGroup {
      _id: string;
      count: number;
    }
    const statusCounts = (bookingStats as StatGroup[]).reduce(
      (acc: Record<string, number>, stat: StatGroup) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const revenue: RevenueStatsResult = (revenueStats[0] as RevenueStatsResult) || {
      totalRevenue: 0,
      averageBookingValue: 0,
      totalBookings: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      averageTransaction: 0,
    };

    return {
      totalBookings: revenue.totalBookings,
      confirmedBookings: statusCounts.confirmed || 0,
      pendingBookings: statusCounts.pending || 0,
      cancelledBookings: statusCounts.cancelled || 0,
      revenue: revenue.totalRevenue,
      averageBookingValue: revenue.averageBookingValue,
      bookingGrowthRate: 0, // Implementation pending - requires time-series booking analysis
    };
  }

  private async getFinancialAnalytics(timeframe: AnalyticsTimeframe): Promise<FinancialAnalytics> {
    const revenueStats = await this.paymentModel.aggregate([
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

    const stats: RevenueStatsResult = (revenueStats[0] as RevenueStatsResult) || {
      totalRevenue: 0,
      averageTransaction: 0,
      transactionCount: 0,
      averageBookingValue: 0,
      totalBookings: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
    };

    return {
      totalRevenue: stats.totalRevenue,
      hostEarnings: stats.totalRevenue * 0.97, // Assuming 3% platform fee
      platformCommission: stats.totalRevenue * 0.03,
      pendingPayouts: 0, // Implementation pending - requires payout status aggregation
      revenueGrowthRate: 0, // Implementation pending - requires time-series revenue comparison
      averageTransactionValue: stats.averageTransaction,
    };
  }

  private async getPlatformDistribution(): Promise<PlatformDistributionDto[]> {
    const platformStats = await this.deviceTokenModel.aggregate<PlatformStats>([
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

    const totalDevices = platformStats.reduce((sum, stat) => sum + stat.count, 0);

    if (totalDevices === 0) {
      return [];
    }

    // Map device platforms to display names and colors
    const platformMapping: Record<string, { name: string; color: string }> = {
      ios: { name: 'iOS', color: '#34D399' },
      android: { name: 'Android', color: '#10B981' },
      web: { name: 'Web', color: '#6EE7B7' },
    };

    return platformStats.map((stat) => ({
      platform: platformMapping[stat._id]?.name || stat._id,
      value: stat.count,
      percentage: Math.round((stat.count / totalDevices) * 100),
      color: platformMapping[stat._id]?.color || '#A7F3D0',
    }));
  }

  private async getRegionalData(): Promise<RegionalDataDto[]> {
    const regionalStats = await this.bookingModel.aggregate<RegionalStats>([
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

    return regionalStats.map((stat) => ({
      region: stat._id || 'Unknown',
      value: stat.count,
      code: stat.countryCode?.toUpperCase() || 'XX',
    }));
  }

  private async getMonthlyTrends(): Promise<TimeSeriesDataDto[]> {
    const currentYear = DateUtils.now().getFullYear();
    const months: TimeSeriesDataDto[] = [];

    for (let i = 0; i < 12; i++) {
      const startDate = DateUtils.create(new Date(currentYear, i, 1));
      const endDate = DateUtils.create(new Date(currentYear, i + 1, 0));

      const bookingCount = await this.bookingModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      months.push({
        period: new Intl.DateTimeFormat('en', { month: 'short' }).format(startDate),
        value: bookingCount,
      });
    }

    return months;
  }

  private async getTopHosts(): Promise<TopHostDto[]> {
    const topHosts = await this.userModel.aggregate([
      {
        $match: {
          roles: 'host',
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'properties',
          localField: '_id',
          foreignField: 'hostId',
          as: 'properties',
        },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'properties._id',
          foreignField: 'propertyId',
          as: 'bookings',
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'revieweeId',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          totalBookings: { $size: '$bookings' },
          totalRevenue: {
            $sum: {
              $map: {
                input: '$bookings',
                as: 'booking',
                in: '$$booking.totalAmount',
              },
            },
          },
          averageRating: { $avg: '$reviews.overallRating' },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          name: { $concat: ['$firstName', ' ', '$lastName'] },
          avatar: '$profileImage',
          totalBookings: 1,
          totalRevenue: 1,
          rating: { $round: ['$averageRating', 1] },
          responseRate: 95, // Implementation pending - requires message response analytics
          joinDate: '$createdAt',
        },
      },
    ]);

    return topHosts as TopHostDto[];
  }

  private async getRecentInvoices(): Promise<InvoiceOverviewDto[]> {
    const invoices = await this.invoiceModel
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return invoices.map((invoice) => ({
      id: invoice.invoiceNumber,
      category: invoice.bookingId ? 'Booking' : 'General',
      amount: invoice.pricing.totalAmount,
      currency: invoice.pricing.currency,
      status: invoice.status as 'paid' | 'pending' | 'overdue' | 'cancelled',
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate || invoice.createdAt,
    }));
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

  private getPreviousTimeframe(timeframe: AnalyticsTimeframe): AnalyticsTimeframe {
    const duration = timeframe.endDate.getTime() - timeframe.startDate.getTime();
    return {
      startDate: DateUtils.create(timeframe.startDate.getTime() - duration),
      endDate: DateUtils.create(timeframe.startDate.getTime()),
      period: timeframe.period,
    };
  }

  async getBookingOverview(): Promise<BookingOverviewDto> {
    const [totalStats, yearlyStats, customerReviews, newestBookings, toursData] = await Promise.all(
      [
        this.getBookingTotalStats(),
        this.getYearlyBookingStatistics(),
        this.getCustomerReviews(),
        this.getNewestBookings(),
        this.getToursAvailability(),
      ],
    );

    return {
      totalBookings: totalStats.total,
      soldBookings: totalStats.sold,
      canceledBookings: totalStats.canceled,
      yearlyStatistics: yearlyStats,
      customerReviews,
      newestBookings,
      toursAvailable: toursData.total,
      soldOutTours: toursData.soldOut,
      availableTours: toursData.available,
      lastUpdated: DateUtils.now(),
    };
  }

  private async getBookingTotalStats(): Promise<BookingTotalStatsResult> {
    const stats = await this.bookingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: StatusMap = (stats as StatGroup[]).reduce((acc: StatusMap, stat: StatGroup) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as StatusMap);

    return {
      total: (stats as StatGroup[]).reduce((sum: number, stat: StatGroup) => sum + stat.count, 0),
      sold: (statsMap.confirmed || 0) + (statsMap.completed || 0),
      canceled: statsMap.cancelled || 0,
    };
  }

  private async getYearlyBookingStatistics(): Promise<BookingStatisticsDto[]> {
    const currentYear = DateUtils.now().getFullYear();
    const startYear = currentYear - 5; // Last 6 years including current

    const yearlyStats = await this.bookingModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: DateUtils.create(new Date(startYear, 0, 1)),
            $lte: DateUtils.create(new Date(currentYear, 11, 31)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.year',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return (yearlyStats as YearlyStatsData[]).map((yearData: YearlyStatsData) => {
      const statusMap: StatusMap = yearData.statuses.reduce((acc: StatusMap, status) => {
        acc[status.status] = status.count;
        return acc;
      }, {} as StatusMap);

      return {
        year: yearData._id,
        sold: (statusMap.confirmed || 0) + (statusMap.completed || 0),
        canceled: statusMap.cancelled || 0,
      };
    });
  }

  private async getCustomerReviews(): Promise<CustomerReviewDto[]> {
    const reviews = await this.reviewModel
      .find({ deletedAt: null })
      .populate('reviewer', 'firstName lastName profileImage')
      .populate('property', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Strategic use of any - MongoDB aggregation with populate returns complex nested structures
    return reviews.map((review) => {
      const populatedReview = review as unknown as {
        _id: string;
        reviewer: { firstName?: string; lastName?: string; profileImage?: string };
        property: { name?: string };
        publicReview?: string;
        overallRating?: number;
        createdAt?: Date;
      };
      return {
        id: String(populatedReview._id || ''),
        customerName:
          `${populatedReview.reviewer?.firstName || ''} ${populatedReview.reviewer?.lastName || ''}`.trim(),
        customerAvatar: populatedReview.reviewer?.profileImage,
        content: populatedReview.publicReview || '',
        rating: populatedReview.overallRating || 0,
        postedAt: populatedReview.createdAt || DateUtils.now(),
        tags: this.generateReviewTags(populatedReview.overallRating || 0),
        propertyName: populatedReview.property?.name,
        status: 'approved', // Assuming all fetched reviews are approved
      };
    });
  }

  private generateReviewTags(rating: number): string[] {
    const tags: string[] = [];
    if (rating >= 4) {
      tags.push('Great service', 'Recommended');
      if (rating === 5) tags.push('Best price');
    }
    return tags;
  }

  private async getNewestBookings(): Promise<NewestBookingDto[]> {
    const bookings = await this.bookingModel
      .find({ deletedAt: null })
      .populate('guest', 'firstName lastName profileImage')
      .populate('property', 'name images')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    // Strategic use of any - MongoDB aggregation with populate returns complex nested structures
    return bookings.map((booking) => {
      const populatedBooking = booking as unknown as {
        _id: string;
        guest: { firstName?: string; lastName?: string; profileImage?: string };
        property: { name?: string; images?: Array<{ url?: string }> };
        createdAt?: Date;
        nights?: number;
        guests?: { totalGuests?: number };
        pricing?: { totalAmount?: number; currency?: string };
        status?: string;
      };
      return {
        id: (booking._id as { toString(): string })?.toString() || '',
        customerName:
          `${populatedBooking.guest?.firstName || ''} ${populatedBooking.guest?.lastName || ''}`.trim(),
        customerAvatar: populatedBooking.guest?.profileImage,
        bookingDate: populatedBooking.createdAt || DateUtils.now(),
        nights: booking.nights || 0,
        guests: booking.guests?.totalGuests || 0,
        destination: populatedBooking.property?.name || 'Unknown Property',
        propertyImage: populatedBooking.property?.images?.[0]?.url,
        totalAmount: booking.pricing?.totalAmount || 0,
        currency: booking.pricing?.currency || 'USD',
        status: populatedBooking.status || 'unknown',
      };
    });
  }

  private async getToursAvailability() {
    // For now, we'll calculate based on property availability
    // In a real system, this might be a separate Tours collection
    const totalProperties = await this.propertyModel.countDocuments({
      deletedAt: null,
      isActive: true,
    });

    // Mock calculation - could be enhanced with real availability logic
    const soldOut = Math.floor(totalProperties * 0.65); // 65% sold out
    const available = totalProperties - soldOut;

    return {
      total: totalProperties,
      soldOut,
      available,
    };
  }

  async getBookingDetails(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    bookings: BookingDetailDto[];
    total: number;
    totalPages: number;
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

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find({ deletedAt: null })
        .populate('guest', 'firstName lastName phone')
        .populate('property', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean(),
      this.bookingModel.countDocuments({ deletedAt: null }),
    ]);

    // Strategic use of any - MongoDB aggregation with populate returns complex nested structures
    const bookingDetails = bookings.map((booking) => {
      const populatedBooking = booking as unknown as {
        _id: string;
        guest: { firstName?: string; lastName?: string; phone?: string };
        property: { name?: string; images?: Array<{ url?: string }> };
        checkIn?: Date;
        checkOut?: Date;
        status?: string;
        pricing?: { totalAmount?: number; currency?: string };
        nights?: number;
        guests?: { totalGuests?: number };
      };
      return {
        id: (booking._id as { toString(): string })?.toString() || '',
        destination: populatedBooking.property?.name || 'Unknown Property',
        propertyImage: populatedBooking.property?.images?.[0]?.url,
        customerName:
          `${populatedBooking.guest?.firstName || ''} ${populatedBooking.guest?.lastName || ''}`.trim(),
        customerPhone: populatedBooking.guest?.phone,
        checkIn: populatedBooking.checkIn || DateUtils.now(),
        checkOut: populatedBooking.checkOut || DateUtils.now(),
        status: populatedBooking.status || 'unknown',
        totalAmount: populatedBooking.pricing?.totalAmount || 0,
        currency: populatedBooking.pricing?.currency || 'USD',
        nights: booking.nights || 0,
        guests: booking.guests?.totalGuests || 0,
      };
    });

    const paginationResult = buildPaginatedResult(bookingDetails, total, validPage, validLimit);

    return {
      bookings: paginationResult.data,
      total: paginationResult.total,
      totalPages: paginationResult.totalPages,
    };
  }

  async getUserMetrics(period: string = '7d') {
    // Implementation pending - detailed user metrics with time-series analysis
    return Promise.resolve({
      message: 'User metrics endpoint - implementation pending detailed analytics',
      period,
    });
  }

  async getBookingMetrics(period: string = '7d') {
    // Implementation pending - detailed booking metrics with trend analysis
    return Promise.resolve({
      message: 'Booking metrics endpoint - implementation pending detailed analytics',
      period,
    });
  }

  async getRevenueMetrics(period: string = '7d') {
    // Implementation pending - detailed revenue metrics with forecasting
    return Promise.resolve({
      message: 'Revenue metrics endpoint - implementation pending detailed analytics',
      period,
    });
  }

  async getPropertyMetrics(period: string = '7d') {
    // Implementation pending - detailed property metrics with performance analysis
    return Promise.resolve({
      message: 'Property metrics endpoint - implementation pending detailed analytics',
      period,
    });
  }
}
