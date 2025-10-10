import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { PaginationConfig } from '../../../common/interfaces/database.interfaces';
import { AnalyticsCoreService } from './analytics-core.service';
import { AnalyticsAdminService } from './analytics-admin.service';
import {
  AnalyticsTimeframe,
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
} from '../interfaces/analytics.interfaces';
import {
  DashboardOverviewDto,
  MetricCardDto,
  PlatformDistributionDto,
  RegionalDataDto,
  TimeSeriesDataDto,
  TopHostDto,
  InvoiceOverviewDto,
} from '../dto/dashboard-overview.dto';
import {
  BookingOverviewDto,
  BookingStatisticsDto,
  CustomerReviewDto,
  NewestBookingDto,
  BookingDetailDto,
} from '../dto/booking-overview.dto';
import {
  AdminAnalyticsFiltersDto,
  BookingDetailAnalyticsDto,
  YearlyBookingStatisticsDto,
  CustomerReviewAnalyticsDto,
} from '../dto/analytics-admin.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Analytics Facade Service
 * Orchestrates analytics operations by coordinating between core and admin services
 * Implements proper separation of concerns with comprehensive error handling and business logic
 */
@Injectable()
export class AnalyticsFacadeService {
  constructor(
    private readonly analyticsCoreService: AnalyticsCoreService,
    private readonly analyticsAdminService: AnalyticsAdminService,
  ) {}

  // ========================================
  // DASHBOARD ANALYTICS OPERATIONS
  // ========================================

  /**
   * Get comprehensive dashboard overview with all key metrics
   */
  async getDashboardOverview(): Promise<DashboardOverviewDto> {
    try {
      LoggingUtil.log('Generating dashboard overview analytics', 'AnalyticsFacadeService');

      const timeframe: AnalyticsTimeframe = {
        startDate: DateUtils.create(DateUtils.nowTimestamp() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: DateUtils.now(),
        period: '7d',
      };

      const [metrics, platformDistribution, regionalData, monthlyTrends, topHosts, recentInvoices] =
        await Promise.all([
          this.getMetricsCards(timeframe),
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
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error generating dashboard overview:',
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  /**
   * Get comprehensive booking overview with statistics
   */
  async getBookingOverview(): Promise<BookingOverviewDto> {
    try {
      LoggingUtil.log('Generating booking overview analytics', 'AnalyticsFacadeService');

      const [totalStats, yearlyStats, customerReviews, newestBookings, toursData] =
        await Promise.all([
          this.getBookingTotalStats(),
          this.analyticsAdminService.getYearlyBookingStatistics(),
          this.getCustomerReviews(),
          this.getNewestBookings(),
          this.analyticsAdminService.getToursAvailability(),
        ]);

      return {
        totalBookings: totalStats.total,
        soldBookings: totalStats.sold,
        canceledBookings: totalStats.canceled,
        yearlyStatistics: this.transformYearlyStats(yearlyStats),
        customerReviews: this.transformCustomerReviews(customerReviews),
        newestBookings: this.transformNewestBookings(newestBookings),
        toursAvailable: toursData.total,
        soldOutTours: toursData.soldOut,
        availableTours: toursData.available,
        lastUpdated: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error generating booking overview:',
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  // ========================================
  // DETAILED ANALYTICS OPERATIONS
  // ========================================

  /**
   * Get detailed booking analytics with pagination and filtering
   */
  async getBookingDetails(
    filters: AdminAnalyticsFiltersDto,
    pagination: PaginationDto,
  ): Promise<{
    bookings: BookingDetailDto[];
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }> {
    try {
      // Pagination validation is handled by the admin service

      const paginationConfig: PaginationConfig = {
        page: pagination.page ?? 1,
        limit: pagination.limit ?? 20,
      };

      const result = await this.analyticsAdminService.getBookingDetailsWithFilters(
        filters,
        paginationConfig,
      );

      return {
        bookings: this.transformBookingDetails(result.items),
        total: result.total,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching detailed booking analytics:',
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  /**
   * Get user analytics for a specific time period
   */
  async getUserMetrics(period: string = '7d'): Promise<UserAnalytics> {
    try {
      const timeframe = this.createTimeframeFromPeriod(period);
      return await this.analyticsCoreService.getUserAnalytics(timeframe);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching user metrics for period ${period}:`,
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  /**
   * Get booking analytics for a specific time period
   */
  async getBookingMetrics(period: string = '7d'): Promise<BookingAnalytics> {
    try {
      const timeframe = this.createTimeframeFromPeriod(period);
      return await this.analyticsCoreService.getBookingAnalytics(timeframe);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching booking metrics for period ${period}:`,
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  /**
   * Get financial analytics for a specific time period
   */
  async getRevenueMetrics(period: string = '7d'): Promise<FinancialAnalytics> {
    try {
      const timeframe = this.createTimeframeFromPeriod(period);
      return await this.analyticsCoreService.getFinancialAnalytics(timeframe);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching revenue metrics for period ${period}:`,
        error,
        'AnalyticsFacadeService',
      );
      throw error;
    }
  }

  /**
   * Get property analytics metrics (placeholder for future implementation)
   */
  async getPropertyMetrics(period: string = '7d'): Promise<Record<string, unknown>> {
    LoggingUtil.log(
      `Property metrics requested for period ${period} - implementation pending`,
      'AnalyticsFacadeService',
    );

    return Promise.resolve({
      message: 'Property metrics endpoint - implementation pending detailed analytics',
      period,
      timestamp: DateUtils.now(),
    });
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private async getMetricsCards(timeframe: AnalyticsTimeframe): Promise<MetricCardDto[]> {
    const previousTimeframe = this.analyticsCoreService.createPreviousTimeframe(timeframe);

    const metrics = await this.analyticsCoreService.calculateMetricsComparison(
      timeframe,
      previousTimeframe,
    );

    // Add revenue metrics
    const [currentFinancialStats, previousFinancialStats] = await Promise.all([
      this.analyticsCoreService.getFinancialAnalytics(timeframe),
      this.analyticsCoreService.getFinancialAnalytics(previousTimeframe),
    ]);

    const revenueMetric: MetricCardDto = {
      label: 'Total revenue',
      value: currentFinancialStats.totalRevenue,
      change: this.calculateChangePercentage(
        currentFinancialStats.totalRevenue,
        previousFinancialStats.totalRevenue,
      ),
      changeType: this.getChangeType(
        currentFinancialStats.totalRevenue,
        previousFinancialStats.totalRevenue,
      ),
      period: timeframe.period,
      unit: 'USD',
    };

    return [...metrics, revenueMetric];
  }

  private async getPlatformDistribution(): Promise<PlatformDistributionDto[]> {
    const platformStats = await this.analyticsCoreService.getPlatformDistribution();
    const totalDevices = platformStats.reduce((sum, stat) => sum + stat.count, 0);

    if (totalDevices === 0) {
      return [];
    }

    const platformMapping: Record<string, { name: string; color: string }> = {
      ios: { name: 'iOS', color: '#34D399' },
      android: { name: 'Android', color: '#10B981' },
      web: { name: 'Web', color: '#6EE7B7' },
    };

    return platformStats.map((stat) => ({
      platform: platformMapping[stat.platform]?.name || stat.platform,
      value: stat.count,
      percentage: Math.round((stat.count / totalDevices) * 100),
      color: platformMapping[stat.platform]?.color || '#A7F3D0',
    }));
  }

  private async getRegionalData(): Promise<RegionalDataDto[]> {
    const regionalStats = await this.analyticsCoreService.getRegionalDistribution();
    return regionalStats.map((stat) => ({
      region: stat.region,
      value: stat.count,
      code: stat.code || 'XX',
    }));
  }

  private async getMonthlyTrends(): Promise<TimeSeriesDataDto[]> {
    const currentYear = DateUtils.now().getFullYear();
    const months: TimeSeriesDataDto[] = [];

    // This could be optimized with a single aggregation query
    for (let i = 0; i < 12; i++) {
      const timeframe: AnalyticsTimeframe = {
        startDate: DateUtils.create(new Date(currentYear, i, 1)),
        endDate: DateUtils.create(new Date(currentYear, i + 1, 0)),
        period: '30d' as const,
      };

      const bookingStats = await this.analyticsCoreService.getBookingAnalytics(timeframe);

      months.push({
        period: new Intl.DateTimeFormat('en', { month: 'short' }).format(timeframe.startDate),
        value: bookingStats.totalBookings,
      });
    }

    return months;
  }

  private async getTopHosts(): Promise<TopHostDto[]> {
    const adminHosts = await this.analyticsAdminService.getTopHosts();
    return adminHosts.map((host) => ({
      id: host.id,
      name: host.name,
      avatar: host.avatar,
      rating: host.rating,
      totalBookings: host.totalBookings,
      totalRevenue: host.totalRevenue,
      responseRate: host.responseRate,
      joinDate: host.joinDate,
    }));
  }

  private async getRecentInvoices(): Promise<InvoiceOverviewDto[]> {
    const adminInvoices = await this.analyticsAdminService.getRecentInvoices();
    return adminInvoices.map((invoice) => ({
      id: invoice.id,
      category: invoice.category,
      amount: invoice.amount,
      currency: invoice.currency,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
    }));
  }

  private async getBookingTotalStats(): Promise<{
    total: number;
    sold: number;
    canceled: number;
  }> {
    const statusBreakdown = await this.analyticsAdminService.getBookingStatusBreakdown();
    const total = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
    const sold = (statusBreakdown.confirmed || 0) + (statusBreakdown.completed || 0);
    const canceled = statusBreakdown.cancelled || 0;

    return { total, sold, canceled };
  }

  private async getCustomerReviews(): Promise<CustomerReviewAnalyticsDto[]> {
    return await this.analyticsAdminService.getCustomerReviews();
  }

  private async getNewestBookings(): Promise<BookingDetailAnalyticsDto[]> {
    const filters: AdminAnalyticsFiltersDto = {};
    const paginationConfig: PaginationConfig = { page: 1, limit: 8 };
    const result = await this.analyticsAdminService.getBookingDetailsWithFilters(
      filters,
      paginationConfig,
    );
    return result.items;
  }

  // Transform methods for DTO compatibility

  private transformYearlyStats(stats: YearlyBookingStatisticsDto[]): BookingStatisticsDto[] {
    return stats.map((stat) => ({
      year: stat.year,
      sold: stat.sold,
      canceled: stat.cancelled,
    }));
  }

  private transformCustomerReviews(reviews: CustomerReviewAnalyticsDto[]): CustomerReviewDto[] {
    return reviews.map((review) => ({
      id: review.id,
      customerName: review.customerName,
      customerAvatar: review.customerAvatar,
      content: review.content,
      rating: review.rating,
      postedAt: review.postedAt,
      tags: review.tags,
      propertyName: review.propertyName,
      status: review.status,
    }));
  }

  private transformNewestBookings(bookings: BookingDetailAnalyticsDto[]): NewestBookingDto[] {
    return bookings.map((booking) => ({
      id: booking.id,
      customerName: booking.customerName,
      customerAvatar: booking.customerAvatar,
      bookingDate: booking.createdAt,
      nights: booking.nights,
      guests: booking.guests,
      destination: booking.destination,
      propertyImage: booking.propertyImage,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      status: booking.status,
    }));
  }

  private transformBookingDetails(items: BookingDetailAnalyticsDto[]): BookingDetailDto[] {
    return items.map((item) => ({
      id: item.id,
      destination: item.destination,
      propertyImage: item.propertyImage,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      checkIn: item.checkIn,
      checkOut: item.checkOut,
      status: item.status,
      totalAmount: item.totalAmount,
      currency: item.currency,
      nights: item.nights,
      guests: item.guests,
    }));
  }

  // Utility methods

  private createTimeframeFromPeriod(period: string): AnalyticsTimeframe {
    const now = DateUtils.now();
    let startDate: Date;

    switch (period) {
      case '30d':
        startDate = DateUtils.create(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = DateUtils.create(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = DateUtils.create(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // '7d'
        startDate = DateUtils.create(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    return {
      startDate,
      endDate: now,
      period: period as '1d' | '7d' | '30d' | '90d' | '1y' | 'custom',
    };
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
}
