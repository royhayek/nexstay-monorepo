import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { BaseController, StandardResponse } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { AdminFacadeService } from '../services/admin-facade.service';
import { I18nService } from 'nestjs-i18n';
import {
  AdminActivitiesResponseDto,
  BulkOperationResultResponseDto,
  AdminActivityResponseDto,
  AdminNotificationResponseDto,
  AdminActivitiesPaginatedDto,
  AdminNotificationsPaginatedDto,
  AuditLogsPaginatedDto,
  AdminNotificationDto,
  AuditLogEntryDto,
} from '../dto/admin-operation-response.dto';
import { AdminActivityFiltersDto, BulkActionDto } from '../dto/admin-filters.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

/**
 * Admin Management Controller
 * Handles administrative operations, bulk actions, activity logging, and audit trails
 * Focused on administrative tasks and system management
 */
@ApiTags('Admin Management')
@Controller('admin/management')
@ApiExtraModels(
  AdminActivitiesPaginatedDto,
  AdminNotificationsPaginatedDto,
  AuditLogsPaginatedDto,
  PaginatedDto,
)
export class AdminManagementController extends BaseController {
  constructor(
    private readonly adminService: AdminFacadeService,
    i18nService?: I18nService,
  ) {
    super(i18nService);
  }

  @Get('activities')
  @AdminEndpoint(
    'Get admin activities with filtering',
    'Returns paginated list of admin activities with advanced filtering options including activity type, severity, date range, and search functionality',
  )
  async getActivities(
    @Query() filters: AdminActivityFiltersDto,
  ): Promise<AdminActivitiesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getActivitiesWithFilters(filters),
      'Get admin activities',
      'Activities Retrieved',
      'Admin activities retrieved successfully',
      'Failed to retrieve admin activities',
    );
  }

  @Get('activities/recent')
  @AdminEndpoint(
    'Get recent admin activities',
    'Returns the most recent admin activities from the last 24 hours for quick overview',
  )
  async getRecentActivities(): Promise<AdminActivitiesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getRecentActivities(),
      'Get recent activities',
      'Recent Activities Retrieved',
      'Recent admin activities retrieved successfully',
      'Failed to retrieve recent activities',
    );
  }

  @Get('activities/:id')
  @AdminEndpoint(
    'Get specific admin activity',
    'Returns detailed information about a specific admin activity including full metadata and context',
  )
  async getActivity(@Param('id') activityId: string): Promise<AdminActivityResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getActivityById(activityId),
      'Get admin activity',
      'Activity Retrieved',
      'Admin activity retrieved successfully',
      'Failed to retrieve admin activity',
    );
  }

  @Post('bulk-actions')
  @AdminEndpoint(
    'Execute bulk administrative actions',
    'Performs bulk operations on multiple resources such as user deactivation, property status changes, or booking cancellations with comprehensive result tracking',
  )
  async executeBulkAction(
    @Body() bulkAction: BulkActionDto,
  ): Promise<BulkOperationResultResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.executeBulkAction(bulkAction),
      'Execute bulk action',
      'Bulk Action Completed',
      'Bulk administrative action completed successfully',
      'Failed to execute bulk administrative action',
    );
  }

  @Get('notifications')
  @AdminEndpoint(
    'Get admin notifications',
    'Returns paginated list of admin notifications including system alerts, warnings, and informational messages with read/unread status',
  )
  async getNotifications(
    @Query('includeRead') includeRead?: boolean,
    @Query('limit') limit?: number,
  ): Promise<StandardResponse<AdminNotificationDto[]>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getAdminNotifications(includeRead, limit),
      'Get admin notifications',
      'Notifications Retrieved',
      'Admin notifications retrieved successfully',
      'Failed to retrieve admin notifications',
    );
  }

  @Put('notifications/:id/read')
  @AdminEndpoint(
    'Mark notification as read',
    'Marks a specific admin notification as read and updates the notification status in the system',
  )
  async markNotificationAsRead(
    @Param('id') notificationId: string,
  ): Promise<AdminNotificationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.markNotificationAsRead(notificationId),
      'Mark notification as read',
      'Notification Updated',
      'Notification marked as read successfully',
      'Failed to update notification status',
    );
  }

  @Delete('notifications/:id')
  @AdminEndpoint(
    'Delete admin notification',
    'Permanently removes an admin notification from the system',
  )
  async deleteNotification(
    @Param('id') notificationId: string,
  ): Promise<AdminNotificationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.deleteNotification(notificationId),
      'Delete admin notification',
      'Notification Deleted',
      'Admin notification deleted successfully',
      'Failed to delete admin notification',
    );
  }

  @Get('audit-logs')
  @AdminEndpoint(
    'Get audit logs',
    'Returns comprehensive audit trail with detailed logging of all administrative actions including user changes, system modifications, and security events',
  )
  async getAuditLogs(
    @Query() filters: AdminActivityFiltersDto,
  ): Promise<StandardResponse<AuditLogEntryDto[]>> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getAuditLogs(filters),
      'Get audit logs',
      'Audit Logs Retrieved',
      'Audit logs retrieved successfully',
      'Failed to retrieve audit logs',
    );
  }

  @Get('audit-logs/export')
  @AdminEndpoint(
    'Export audit logs',
    'Exports audit logs to CSV or PDF format for compliance reporting and external analysis',
  )
  async exportAuditLogs(
    @Query() filters: AdminActivityFiltersDto,
    @Query('format') format: 'csv' | 'pdf' = 'csv',
  ): Promise<any> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.exportAuditLogs(filters, format),
      'Export audit logs',
      'Audit Logs Exported',
      `Audit logs exported successfully as ${format.toUpperCase()}`,
      'Failed to export audit logs',
    );
  }

  @Post('system/maintenance')
  @AdminEndpoint(
    'Trigger system maintenance',
    'Initiates system maintenance tasks such as database cleanup, cache clearing, and performance optimization',
  )
  async triggerSystemMaintenance(): Promise<BulkOperationResultResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.triggerSystemMaintenance(),
      'Trigger system maintenance',
      'Maintenance Started',
      'System maintenance tasks initiated successfully',
      'Failed to start system maintenance',
    );
  }

  @Get('system/performance')
  @AdminEndpoint(
    'Get system performance metrics',
    'Returns detailed system performance analytics including response times, throughput, error rates, and resource utilization over time',
  )
  async getPerformanceMetrics(
    @Query('period') period: '1h' | '24h' | '7d' | '30d' = '24h',
  ): Promise<any> {
    return this.executeWithErrorHandlingAndMessage(
      () => this.adminService.getPerformanceMetrics(period),
      'Get performance metrics',
      'Performance Metrics Retrieved',
      'System performance metrics retrieved successfully',
      'Failed to retrieve performance metrics',
    );
  }
}
