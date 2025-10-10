import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { AdminFacadeService } from '../services/admin-facade.service';
import { I18nService } from 'nestjs-i18n';
import { SystemHealthMetricsDto } from '../dto/admin-operation-response.dto';
import { AdminDashboardFiltersDto, AdminSystemHealthFiltersDto } from '../dto/admin-filters.dto';

/**
 * Admin Dashboard Controller
 * Handles dashboard overview, system health, and key metrics
 * Focused on high-level administrative insights
 */
@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@ApiExtraModels(SystemHealthMetricsDto)
export class AdminDashboardController extends BaseController {
  constructor(
    private readonly adminService: AdminFacadeService,
    i18nService?: I18nService,
  ) {
    super(i18nService);
  }

  @Get()
  @AdminEndpoint(
    'Get complete admin dashboard data',
    'Returns comprehensive dashboard overview with analytics and admin statistics for the admin panel including user metrics, booking statistics, revenue data, and system performance indicators',
  )
  async getDashboard(@Query() filters?: AdminDashboardFiltersDto): Promise<
    StandardResponse<{
      adminStats: any;
      lastUpdated: Date;
      dateRange: { start: Date; end: Date; days: number };
      filters: AdminDashboardFiltersDto | null;
      performanceMetrics?: any;
      userMetrics?: any;
    }>
  > {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getDashboardOverview(filters),
      'Get admin dashboard',
      'Dashboard Retrieved',
      'Admin dashboard data retrieved successfully',
      'Failed to retrieve admin dashboard data',
    );
  }

  @Get('stats')
  @AdminEndpoint(
    'Get admin statistics only',
    'Returns key administrative statistics without the full dashboard data for lightweight requests',
  )
  async getStats(): Promise<StandardResponse<any>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getAdminStats(),
      'Get admin stats',
      'Statistics Retrieved',
      'Admin statistics retrieved successfully',
      'Failed to retrieve admin statistics',
    );
  }

  @Get('bookings/overview')
  @AdminEndpoint(
    'Get booking overview for admin dashboard',
    'Returns booking overview with statistics, trends, and recent booking data for the admin dashboard widget',
  )
  async getBookingOverview(): Promise<StandardResponse<any>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getBookingOverview(),
      'Get booking overview',
      'Booking Overview Retrieved',
      'Booking overview data retrieved successfully',
      'Failed to retrieve booking overview data',
    );
  }

  @Get('system/health')
  @AdminEndpoint(
    'Get system health status',
    'Returns comprehensive system health and status information including database connectivity, memory usage, CPU load, uptime, and external service dependencies',
  )
  async getSystemHealth(
    @Query() filters?: AdminSystemHealthFiltersDto,
  ): Promise<StandardResponse<SystemHealthMetricsDto>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getSystemHealthMetrics(filters),
      'Get system health',
      'System Health Retrieved',
      'System health information retrieved successfully',
      'Failed to retrieve system health information',
    );
  }

  @Get('system/status')
  @AdminEndpoint(
    'Get simplified system status',
    'Returns basic system status indicators for quick health checks without detailed metrics',
  )
  async getSystemStatus(): Promise<StandardResponse<any>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getSystemHealth(),
      'Get system status',
      'System Status Retrieved',
      'System status retrieved successfully',
      'Failed to retrieve system status',
    );
  }
}
