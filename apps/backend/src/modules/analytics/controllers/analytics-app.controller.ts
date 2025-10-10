import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiExtraModels, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../../common/controllers/base.controller';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { AnalyticsFacadeService } from '../services/analytics-facade.service';
import { MetricsPeriodDto } from '../dto/analytics-filters.dto';
import {
  UserAnalyticsResponseDto,
  BookingAnalyticsResponseDto,
  FinancialAnalyticsResponseDto,
  UserAnalyticsDataDto,
  BookingAnalyticsDataDto,
  FinancialAnalyticsDataDto,
} from '../dto/analytics-response.dto';
import { I18nService } from 'nestjs-i18n';

/**
 * App Controller for Analytics
 * Handles analytics operations for authenticated users (hosts/guests)
 * Provides user-specific analytics and insights
 */
@Controller('app/analytics')
@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(UserAnalyticsDataDto, BookingAnalyticsDataDto, FinancialAnalyticsDataDto)
export class AnalyticsAppController extends BaseController {
  constructor(
    private readonly analyticsFacadeService: AnalyticsFacadeService,
    i18nService?: I18nService,
  ) {
    super(i18nService);
  }

  @Get('users/metrics')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get user analytics metrics for hosts',
    'Retrieve user analytics including user engagement, registration trends, and activity metrics for host dashboard insights',
  )
  async getUserMetrics(
    @Query() query: MetricsPeriodDto,
    @CurrentUser() _user: UserDocument,
  ): Promise<UserAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getUserMetrics(query.period);
        return metrics as UserAnalyticsDataDto;
      },
      'Get user analytics metrics',
      'User Analytics Retrieved',
      'User analytics metrics retrieved successfully',
      'Failed to retrieve user analytics metrics',
    );
  }

  @Get('bookings/metrics')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get booking analytics metrics for hosts',
    'Retrieve booking analytics including booking trends, conversion rates, and performance metrics for host properties',
  )
  async getBookingMetrics(
    @Query() query: MetricsPeriodDto,
    @CurrentUser() _user: UserDocument,
  ): Promise<BookingAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getBookingMetrics(query.period);
        return metrics as BookingAnalyticsDataDto;
      },
      'Get booking analytics metrics',
      'Booking Analytics Retrieved',
      'Booking analytics metrics retrieved successfully',
      'Failed to retrieve booking analytics metrics',
    );
  }

  @Get('revenue/metrics')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get revenue analytics metrics for hosts',
    'Retrieve financial analytics including revenue trends, earnings breakdown, and financial performance metrics for host properties',
  )
  async getRevenueMetrics(
    @Query() query: MetricsPeriodDto,
    @CurrentUser() _user: UserDocument,
  ): Promise<FinancialAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getRevenueMetrics(query.period);
        return metrics as FinancialAnalyticsDataDto;
      },
      'Get revenue analytics metrics',
      'Revenue Analytics Retrieved',
      'Revenue analytics metrics retrieved successfully',
      'Failed to retrieve revenue analytics metrics',
    );
  }

  @Get('properties/metrics')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get property analytics metrics for hosts',
    'Retrieve property performance analytics including occupancy rates, property rankings, and listing optimization insights',
  )
  async getPropertyMetrics(
    @Query() query: MetricsPeriodDto,
    @CurrentUser() _user: UserDocument,
  ): Promise<StandardResponse<Record<string, unknown>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.analyticsFacadeService.getPropertyMetrics(query.period);
      },
      'Get property analytics metrics',
      'Property Analytics Retrieved',
      'Property analytics metrics retrieved successfully',
      'Failed to retrieve property analytics metrics',
    );
  }

  @Get('dashboard/summary')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get host dashboard summary',
    'Retrieve condensed analytics summary for host dashboard including key performance indicators and recent activity',
  )
  async getHostDashboardSummary(
    @CurrentUser() user: UserDocument,
  ): Promise<StandardResponse<Record<string, unknown>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Implementation pending - host-specific dashboard summary
        // This would filter analytics based on the host's properties and bookings
        const [userMetrics, bookingMetrics, revenueMetrics] = await Promise.all([
          this.analyticsFacadeService.getUserMetrics('7d'),
          this.analyticsFacadeService.getBookingMetrics('7d'),
          this.analyticsFacadeService.getRevenueMetrics('7d'),
        ]);

        return {
          userMetrics: {
            totalUsers: userMetrics.totalUsers,
            activeUsers: userMetrics.activeUsers,
            userGrowthRate: userMetrics.userGrowthRate,
          },
          bookingMetrics: {
            totalBookings: bookingMetrics.totalBookings,
            confirmedBookings: bookingMetrics.confirmedBookings,
            revenue: bookingMetrics.revenue,
            averageBookingValue: bookingMetrics.averageBookingValue,
          },
          revenueMetrics: {
            totalRevenue: revenueMetrics.totalRevenue,
            hostEarnings: revenueMetrics.hostEarnings,
            revenueGrowthRate: revenueMetrics.revenueGrowthRate,
          },
          lastUpdated: new Date(),
          userId: String(user._id),
        };
      },
      'Get host dashboard summary',
      'Dashboard Summary Retrieved',
      'Host dashboard summary retrieved successfully',
      'Failed to retrieve dashboard summary',
    );
  }

  @Get('performance/insights')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get performance insights for hosts',
    'Retrieve actionable insights and recommendations based on property performance analytics and market trends',
  )
  async getPerformanceInsights(
    @CurrentUser() _user: UserDocument,
  ): Promise<StandardResponse<Record<string, unknown>>> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Implementation pending - AI-driven insights and recommendations
        // This would analyze host performance and provide actionable insights
        return Promise.resolve({
          insights: [
            {
              category: 'Revenue Optimization',
              title: 'Consider adjusting pricing for peak seasons',
              description:
                'Your properties could benefit from dynamic pricing during high-demand periods',
              priority: 'high',
              impact: 'revenue_increase',
              action: 'review_pricing',
            },
            {
              category: 'Guest Experience',
              title: 'Response time improvement opportunity',
              description: 'Faster response times could improve your booking conversion rate',
              priority: 'medium',
              impact: 'booking_increase',
              action: 'improve_communication',
            },
          ],
          recommendations: [
            {
              type: 'pricing',
              message: 'Consider seasonal pricing adjustments',
              potentialIncrease: '15%',
            },
            {
              type: 'listing',
              message: 'Add more photos to increase booking rates',
              potentialIncrease: '8%',
            },
          ],
          benchmarks: {
            occupancyRate: 75,
            averageRating: 4.7,
            responseTime: '2 hours',
            industryAverages: {
              occupancyRate: 68,
              averageRating: 4.5,
              responseTime: '4 hours',
            },
          },
          generatedAt: new Date(),
        });
      },
      'Get performance insights',
      'Performance Insights Retrieved',
      'Performance insights retrieved successfully',
      'Failed to retrieve performance insights',
    );
  }

  @Get('trends/analysis')
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get market trends analysis',
    'Retrieve market trends and competitive analysis relevant to host properties and target markets',
  )
  async getTrendsAnalysis(
    @Query() query: MetricsPeriodDto,
    @CurrentUser() _user: UserDocument,
  ): Promise<StandardResponse<Record<string, unknown>>> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Implementation pending - market trends and competitive analysis
        // This would analyze market data and provide trend insights
        return Promise.resolve({
          marketTrends: {
            demandForecast: 'increasing',
            seasonalPatterns: {
              peak: ['June', 'July', 'August', 'December'],
              low: ['January', 'February', 'March'],
            },
            pricetrends: {
              currentQuarter: 'stable',
              nextQuarter: 'expected_increase',
              yearOverYear: '+5.2%',
            },
          },
          competitiveAnalysis: {
            marketPosition: 'above_average',
            priceCompetitiveness: 'competitive',
            occupancyRank: 'top_quartile',
          },
          opportunities: [
            {
              type: 'seasonal_demand',
              description: 'Summer bookings are 30% higher in your area',
              actionable: true,
            },
            {
              type: 'market_gap',
              description: 'Pet-friendly properties have 20% less competition',
              actionable: true,
            },
          ],
          period: query.period,
          analyzedAt: new Date(),
        });
      },
      'Get trends analysis',
      'Trends Analysis Retrieved',
      'Market trends analysis retrieved successfully',
      'Failed to retrieve trends analysis',
    );
  }
}
