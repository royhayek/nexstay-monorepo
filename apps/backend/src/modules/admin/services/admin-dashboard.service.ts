import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../../analytics/analytics.service';
import { AdminCoreService } from './admin-core.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { AdminDashboardFiltersDto } from '../dto/admin-filters.dto';

/**
 * Admin Dashboard Service
 * Handles dashboard-specific operations and data aggregation
 */
@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly adminCoreService: AdminCoreService,
  ) {}

  /**
   * Get comprehensive dashboard overview
   */
  async getDashboardOverview(filters?: AdminDashboardFiltersDto): Promise<{
    adminStats: any;
    lastUpdated: Date;
    dateRange: { start: Date; end: Date; days: number };
    filters: AdminDashboardFiltersDto | null;
    performanceMetrics?: any;
    userMetrics?: any;
  }> {
    try {
      const [analyticsOverview, adminStats] = await Promise.all([
        this.analyticsService.getDashboardOverview(),
        this.adminCoreService.getAdminStats(),
      ]);

      // Apply filters if provided
      const dateRange = this.buildDateRange(filters);

      // Get additional metrics if requested
      const enhancedData: {
        adminStats: any;
        lastUpdated: Date;
        dateRange: { start: Date; end: Date; days: number };
        filters: AdminDashboardFiltersDto | null;
        performanceMetrics?: any;
        userMetrics?: any;
        [key: string]: any;
      } = {
        ...analyticsOverview,
        adminStats,
        lastUpdated: DateUtils.now(),
        dateRange,
        filters: filters || null,
      };

      // Add performance metrics if requested
      if (filters?.includePerformance) {
        enhancedData.performanceMetrics = this.getPerformanceOverview();
      }

      // Add detailed user metrics if requested
      if (filters?.includeUserMetrics) {
        enhancedData.userMetrics = this.getDetailedUserMetrics(dateRange);
      }

      LoggingUtil.log('Dashboard overview retrieved successfully', 'AdminDashboardService', {
        metadata: {
          hasFilters: !!filters,
          dateRangeDays: dateRange.days,
          includePerformance: !!filters?.includePerformance,
          includeUserMetrics: !!filters?.includeUserMetrics,
        },
      });

      return enhancedData;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get dashboard overview',
        error,
        'AdminDashboardService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get booking overview for admin dashboard
   */
  async getBookingOverview() {
    try {
      return await this.analyticsService.getBookingOverview();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get booking overview',
        error,
        'AdminDashboardService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  // Private helper methods for enhanced functionality
  private buildDateRange(filters?: AdminDashboardFiltersDto) {
    const now = DateUtils.now();
    const days = filters?.days || 30;

    return {
      start: filters?.startDate
        ? DateUtils.safeParse(filters.startDate)
        : DateUtils.subtractDays(now, days),
      end: filters?.endDate ? DateUtils.safeParse(filters.endDate) : now,
      days,
    };
  }

  private getPerformanceOverview() {
    try {
      // Mock performance overview - in a real implementation,
      // this would query actual performance monitoring systems
      return {
        responseTime: {
          avg: Math.floor(Math.random() * 100) + 50,
          p95: Math.floor(Math.random() * 200) + 100,
          p99: Math.floor(Math.random() * 300) + 200,
        },
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 2, // 0-2%
        availability: 99.9 - Math.random() * 0.5,
        resourceUtilization: {
          cpu: Math.floor(Math.random() * 30) + 20,
          memory: Math.floor(Math.random() * 40) + 30,
          disk: Math.floor(Math.random() * 20) + 10,
        },
        lastChecked: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get performance overview',
        error,
        'AdminDashboardService',
      );
      return null;
    }
  }

  private getDetailedUserMetrics(dateRange: { start: Date; end: Date; days: number }) {
    try {
      // Mock detailed user metrics - in a real implementation,
      // this would query user analytics data
      return {
        totalUsers: Math.floor(Math.random() * 1000) + 500,
        newUsers: Math.floor(Math.random() * 100) + 20,
        activeUsers: Math.floor(Math.random() * 300) + 150,
        retentionRate: Math.floor(Math.random() * 20) + 70, // 70-90%
        churnRate: Math.random() * 5, // 0-5%
        avgSessionDuration: Math.floor(Math.random() * 30) + 15, // 15-45 minutes
        topUserLocations: [
          { country: 'United States', count: Math.floor(Math.random() * 200) + 100 },
          { country: 'Canada', count: Math.floor(Math.random() * 100) + 50 },
          { country: 'United Kingdom', count: Math.floor(Math.random() * 80) + 40 },
        ],
        userGrowthTrend: Array.from({ length: 7 }, (_, i) => ({
          date: DateUtils.subtractDays(DateUtils.now(), 6 - i),
          newUsers: Math.floor(Math.random() * 20) + 5,
        })),
        dateRange,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get detailed user metrics',
        error,
        'AdminDashboardService',
      );
      return null;
    }
  }
}
