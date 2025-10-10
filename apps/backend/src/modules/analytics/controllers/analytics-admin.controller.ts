import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiExtraModels, ApiBearerAuth } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { AnalyticsFacadeService } from '../services/analytics-facade.service';
import {
  AdminAnalyticsFiltersDto,
  MetricsPeriodDto,
  DashboardFiltersDto,
} from '../dto/analytics-filters.dto';
import {
  DashboardOverviewResponseDto,
  BookingOverviewResponseDto,
  UserAnalyticsResponseDto,
  BookingAnalyticsResponseDto,
  FinancialAnalyticsResponseDto,
  PropertyAnalyticsResponseDto,
  BookingDetailsResponseDto,
  TopHostsAnalyticsResponseDto,
  CustomerReviewsAnalyticsResponseDto,
  ToursAvailabilityResponseDto,
  UserAnalyticsDataDto,
  BookingAnalyticsDataDto,
  FinancialAnalyticsDataDto,
  BookingDetailsPaginatedDataDto,
} from '../dto/analytics-response.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * Admin Controller for Analytics
 * Handles comprehensive analytics and reporting operations for admin dashboard
 * Provides advanced analytics, filtering, and administrative insights
 */
@Controller('admin/analytics')
@ApiTags('Analytics Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
@ApiExtraModels(
  UserAnalyticsDataDto,
  BookingAnalyticsDataDto,
  FinancialAnalyticsDataDto,
  BookingDetailsPaginatedDataDto,
)
export class AnalyticsAdminController extends BaseController {
  constructor(private readonly analyticsFacadeService: AnalyticsFacadeService) {
    super();
  }

  @Get('dashboard/overview')
  @AdminEndpoint(
    'Get comprehensive dashboard overview with key metrics',
    'Retrieve comprehensive dashboard overview including user metrics, booking statistics, revenue data, platform distribution, regional analytics, and key performance indicators for administrative analysis and decision making',
    DashboardOverviewResponseDto,
  )
  async getDashboardOverview(
    @Query() _filters?: DashboardFiltersDto,
  ): Promise<DashboardOverviewResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.analyticsFacadeService.getDashboardOverview();
      },
      'Get dashboard overview',
      'Dashboard Overview Retrieved',
      'Comprehensive dashboard overview retrieved successfully',
      'Failed to retrieve dashboard overview',
    );
  }

  @Get('users/metrics')
  @AdminEndpoint(
    'Get comprehensive user analytics metrics',
    'Retrieve detailed user analytics including registration trends, active users, user behavior patterns, role distribution, regional breakdown, and growth metrics for administrative insights and user management',
    UserAnalyticsResponseDto,
  )
  async getUserMetrics(@Query() query: MetricsPeriodDto): Promise<UserAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getUserMetrics(query.period);
        return metrics as UserAnalyticsDataDto;
      },
      'Get user analytics metrics',
      'User Analytics Retrieved',
      'Comprehensive user analytics metrics retrieved successfully',
      'Failed to retrieve user analytics metrics',
    );
  }

  @Get('bookings/metrics')
  @AdminEndpoint(
    'Get comprehensive booking analytics metrics',
    'Retrieve detailed booking analytics including booking counts, status breakdown, conversion rates, cancellation analysis, revenue trends, and booking performance metrics for administrative oversight and optimization',
    BookingAnalyticsResponseDto,
  )
  async getBookingMetrics(@Query() query: MetricsPeriodDto): Promise<BookingAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getBookingMetrics(query.period);
        return metrics as BookingAnalyticsDataDto;
      },
      'Get booking analytics metrics',
      'Booking Analytics Retrieved',
      'Comprehensive booking analytics metrics retrieved successfully',
      'Failed to retrieve booking analytics metrics',
    );
  }

  @Get('revenue/metrics')
  @AdminEndpoint(
    'Get comprehensive financial analytics metrics',
    'Retrieve detailed financial analytics including total revenue, host earnings breakdown, platform commission analysis, pending payouts, growth rates, and transaction analytics for financial oversight and strategic planning',
    FinancialAnalyticsResponseDto,
  )
  async getRevenueMetrics(
    @Query() query: MetricsPeriodDto,
  ): Promise<FinancialAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const metrics = await this.analyticsFacadeService.getRevenueMetrics(query.period);
        return metrics as FinancialAnalyticsDataDto;
      },
      'Get financial analytics metrics',
      'Financial Analytics Retrieved',
      'Comprehensive financial analytics metrics retrieved successfully',
      'Failed to retrieve financial analytics metrics',
    );
  }

  @Get('properties/metrics')
  @AdminEndpoint(
    'Get comprehensive property analytics metrics',
    'Retrieve detailed property analytics including total properties, active listings, occupancy rates, performance metrics, availability analysis, and property optimization insights for administrative management and strategic decisions',
    PropertyAnalyticsResponseDto,
  )
  async getPropertyMetrics(@Query() query: MetricsPeriodDto): Promise<any> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.analyticsFacadeService.getPropertyMetrics(query.period);
      },
      'Get property analytics metrics',
      'Property Analytics Retrieved',
      'Comprehensive property analytics metrics retrieved successfully',
      'Failed to retrieve property analytics metrics',
    );
  }

  @Get('bookings/overview')
  @AdminEndpoint(
    'Get comprehensive booking overview with statistics and trends',
    'Retrieve comprehensive booking overview including booking statistics, yearly trends, recent bookings data, customer reviews, tours availability, and key booking insights for administrative dashboard and decision making',
    BookingOverviewResponseDto,
  )
  async getBookingOverview(): Promise<BookingOverviewResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.analyticsFacadeService.getBookingOverview();
      },
      'Get booking overview',
      'Booking Overview Retrieved',
      'Comprehensive booking overview retrieved successfully',
      'Failed to retrieve booking overview',
    );
  }

  @Get('bookings/details')
  @AdminEndpoint(
    'Get paginated booking details with advanced filtering',
    'Retrieve detailed booking information with comprehensive filtering options, pagination support, and sorting capabilities for administrative review, management, and analysis',
    BookingDetailsResponseDto,
  )
  async getBookingDetails(
    @Query() filters: AdminAnalyticsFiltersDto,
    @Query() pagination: PaginationDto,
  ): Promise<BookingDetailsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.analyticsFacadeService.getBookingDetails(filters, pagination);

        return {
          items: result.bookings,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNextPage: result.page < result.totalPages,
            hasPreviousPage: result.page > 1,
            nextPage: result.page < result.totalPages ? result.page + 1 : undefined,
            previousPage: result.page > 1 ? result.page - 1 : undefined,
          },
        } as BookingDetailsPaginatedDataDto;
      },
      'Get booking details',
      'Booking Details Retrieved',
      'Comprehensive booking details retrieved successfully',
      'Failed to retrieve booking details',
    );
  }

  @Get('hosts/top')
  @AdminEndpoint(
    'Get top performing hosts analytics',
    'Retrieve top performing hosts with detailed analytics including revenue, bookings, ratings, and performance metrics for administrative insights and host management',
    TopHostsAnalyticsResponseDto,
  )
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top hosts to retrieve (default: 10, max: 50)',
  })
  async getTopHosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<TopHostsAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Implementation would use admin service to get paginated top hosts
        return Promise.resolve({
          items: [],
          pagination: {
            page: 1,
            limit: Math.min(limit, 50),
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      },
      'Get top hosts analytics',
      'Top Hosts Retrieved',
      'Top performing hosts analytics retrieved successfully',
      'Failed to retrieve top hosts analytics',
    );
  }

  @Get('reviews/analytics')
  @AdminEndpoint(
    'Get customer reviews analytics',
    'Retrieve customer reviews with analytics context including sentiment analysis, rating trends, and review insights for quality management and customer satisfaction analysis',
    CustomerReviewsAnalyticsResponseDto,
  )
  async getReviewsAnalytics(
    @Query() pagination: PaginationDto,
  ): Promise<CustomerReviewsAnalyticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Implementation would use admin service to get reviews analytics
        return Promise.resolve({
          items: [],
          pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      },
      'Get reviews analytics',
      'Reviews Analytics Retrieved',
      'Customer reviews analytics retrieved successfully',
      'Failed to retrieve reviews analytics',
    );
  }

  @Get('tours/availability')
  @AdminEndpoint(
    'Get tours availability analytics',
    'Retrieve tours and properties availability analytics including occupancy rates, availability trends, and capacity management insights for operational optimization',
    ToursAvailabilityResponseDto,
  )
  async getToursAvailability(): Promise<ToursAvailabilityResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // This would be implemented in the facade service
        return Promise.resolve({
          total: 0,
          active: 0,
          inactive: 0,
          soldOut: 0,
          available: 0,
          occupancyRate: 0,
        });
      },
      'Get tours availability',
      'Tours Availability Retrieved',
      'Tours availability analytics retrieved successfully',
      'Failed to retrieve tours availability analytics',
    );
  }
}
