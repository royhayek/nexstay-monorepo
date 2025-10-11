import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { AdminFacadeService } from '../services/admin-facade.service';
import { I18nService } from 'nestjs-i18n';
import { SystemHealthMetricsDto } from '../dto/admin-operation-response.dto';
import { AdminDashboardFiltersDto, AdminSystemHealthFiltersDto } from '../dto/admin-filters.dto';
import {
  CleanupMonitoringDto,
  DeviceCleanupStatsDto,
  DeviceCleanupResultDto,
  BookingAutoCancelStatsDto,
  BookingAutoCancelResultDto,
} from '../dto/cleanup-stats.dto';
import { TrustedDeviceCleanupService } from '../../auth/services/trusted-device-cleanup.service';
import { BookingAutoCancelService } from '../../bookings/services/booking-auto-cancel.service';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Admin Dashboard Controller
 * Handles dashboard overview, system health, and key metrics
 * Focused on high-level administrative insights
 */
@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@ApiExtraModels(
  SystemHealthMetricsDto,
  CleanupMonitoringDto,
  DeviceCleanupStatsDto,
  DeviceCleanupResultDto,
  BookingAutoCancelStatsDto,
  BookingAutoCancelResultDto,
)
export class AdminDashboardController extends BaseController {
  constructor(
    private readonly adminService: AdminFacadeService,
    private readonly deviceCleanupService: TrustedDeviceCleanupService,
    private readonly bookingAutoCancelService: BookingAutoCancelService,
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

  @Get('cleanup/monitoring')
  @AdminEndpoint(
    'Get comprehensive cleanup monitoring statistics',
    'Returns combined statistics for device cleanup and booking auto-cancellation, providing overview of automated maintenance tasks',
    CleanupMonitoringDto,
  )
  async getCleanupMonitoring(): Promise<StandardResponse<CleanupMonitoringDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const [deviceCleanup, bookingAutoCancel] = await Promise.all([
          this.deviceCleanupService.getCleanupStats(),
          this.bookingAutoCancelService.getAutoCancelStats(),
        ]);

        return {
          deviceCleanup,
          bookingAutoCancel,
          generatedAt: DateUtils.now(),
        };
      },
      'Get cleanup monitoring',
      'Cleanup Monitoring Retrieved',
      'Cleanup monitoring statistics retrieved successfully',
      'Failed to retrieve cleanup monitoring statistics',
    );
  }

  @Get('cleanup/devices/stats')
  @AdminEndpoint(
    'Get device cleanup statistics',
    'Returns statistics about trusted devices eligible for cleanup without performing actual cleanup',
    DeviceCleanupStatsDto,
  )
  async getDeviceCleanupStats(): Promise<StandardResponse<DeviceCleanupStatsDto>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.deviceCleanupService.getCleanupStats(),
      'Get device cleanup stats',
      'Device Cleanup Stats Retrieved',
      'Device cleanup statistics retrieved successfully',
      'Failed to retrieve device cleanup statistics',
    );
  }

  @Post('cleanup/devices/execute')
  @AdminEndpoint(
    'Manually trigger device cleanup',
    'Manually executes the device cleanup process, deactivating all devices that have been inactive beyond the configured expiry period',
    DeviceCleanupResultDto,
  )
  async executeDeviceCleanup(): Promise<StandardResponse<DeviceCleanupResultDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.deviceCleanupService.cleanupExpiredDevices();
        return {
          ...result,
          message: `Device cleanup completed. Deactivated ${result.deactivatedCount} of ${result.scannedCount} expired devices.`,
        };
      },
      'Execute device cleanup',
      'Device Cleanup Completed',
      'Device cleanup executed successfully',
      'Failed to execute device cleanup',
    );
  }

  @Get('cleanup/bookings/stats')
  @AdminEndpoint(
    'Get booking auto-cancel statistics',
    'Returns statistics about unpaid bookings eligible for auto-cancellation without performing actual cancellation',
    BookingAutoCancelStatsDto,
  )
  async getBookingAutoCancelStats(): Promise<StandardResponse<BookingAutoCancelStatsDto>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.bookingAutoCancelService.getAutoCancelStats(),
      'Get booking auto-cancel stats',
      'Booking Auto-Cancel Stats Retrieved',
      'Booking auto-cancel statistics retrieved successfully',
      'Failed to retrieve booking auto-cancel statistics',
    );
  }

  @Post('cleanup/bookings/execute')
  @AdminEndpoint(
    'Manually trigger booking auto-cancellation',
    'Manually executes the booking auto-cancellation process, cancelling all unpaid bookings that exceed the configured time limit',
    BookingAutoCancelResultDto,
  )
  async executeBookingAutoCancel(): Promise<StandardResponse<BookingAutoCancelResultDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingAutoCancelService.cancelUnpaidBookings();
        return {
          ...result,
          message: `Booking auto-cancellation completed. Cancelled ${result.cancelledCount} of ${result.scannedCount} unpaid bookings.`,
        };
      },
      'Execute booking auto-cancel',
      'Booking Auto-Cancel Completed',
      'Booking auto-cancellation executed successfully',
      'Failed to execute booking auto-cancellation',
    );
  }
}
