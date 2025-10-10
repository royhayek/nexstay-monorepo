import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../common/controllers/base.controller';
import { AdminEndpoint } from '../../common/decorators/api-endpoint.decorator';
import { AdminFacadeService } from './services/admin-facade.service';
import { AdminDashboardFiltersDto } from './dto/admin-filters.dto';
import {
  AdminDashboardResponseDto,
  BookingOverviewResponseDto,
  SystemHealthDataResponseDto,
} from './dto/admin-controller-response.dto';

@ApiTags('Admin Dashboard')
@Controller('admin')
export class AdminController extends BaseController {
  constructor(private readonly adminService: AdminFacadeService) {
    super();
  }

  @Get('dashboard')
  @AdminEndpoint(
    'Get complete admin dashboard data',
    'Returns comprehensive dashboard overview with analytics and admin statistics for the admin panel',
    AdminDashboardResponseDto,
  )
  async getDashboard(): Promise<
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
      () => this.adminService.getDashboardOverview(),
      'Get admin dashboard',
      'Dashboard Retrieved',
      'Admin dashboard data retrieved successfully',
      'Failed to retrieve admin dashboard data',
    );
  }

  @Get('bookings/overview')
  @AdminEndpoint(
    'Get booking overview for admin dashboard',
    'Returns booking overview with statistics and recent booking data for the admin dashboard',
    BookingOverviewResponseDto,
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
    'Returns comprehensive system health and status information including database connectivity, memory usage, and uptime',
    SystemHealthDataResponseDto,
  )
  async getSystemHealth(): Promise<StandardResponse<any>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getSystemHealth(),
      'Get system health',
      'System Health Retrieved',
      'System health information retrieved successfully',
      'Failed to retrieve system health information',
    );
  }
}
