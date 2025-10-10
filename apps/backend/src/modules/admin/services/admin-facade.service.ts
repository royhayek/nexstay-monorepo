import { Injectable } from '@nestjs/common';
import { AdminCoreService } from './admin-core.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminSystemService } from './admin-system.service';
import { AdminActivityService } from './admin-activity.service';
import { LoggingUtil } from '../../../common/utils/logging.util';
import {
  AdminActivityFiltersDto,
  AdminDashboardFiltersDto,
  AdminSystemHealthFiltersDto,
  BulkActionDto,
  AdminActivityTypeEnum,
  ActivitySeverityEnum,
} from '../dto/admin-filters.dto';
import {
  AdminActivitiesPaginatedDto,
  BulkOperationResultDto,
  SystemHealthMetricsDto,
  AdminNotificationDto,
  AuditLogEntryDto,
} from '../dto/admin-operation-response.dto';

/**
 * Admin Facade Service
 * Coordinates all admin-related operations and provides a unified interface
 * This service follows the Facade pattern to simplify admin module interactions
 * Enhanced with comprehensive admin functionality following architectural guidelines
 */
@Injectable()
export class AdminFacadeService {
  constructor(
    private readonly coreService: AdminCoreService,
    private readonly dashboardService: AdminDashboardService,
    private readonly systemService: AdminSystemService,
    private readonly activityService: AdminActivityService,
  ) {}

  // Dashboard Operations
  async getDashboardOverview(filters?: AdminDashboardFiltersDto) {
    try {
      const result = await this.dashboardService.getDashboardOverview(filters);
      LoggingUtil.log('Dashboard overview retrieved', 'AdminFacadeService', {
        metadata: { filters },
      });
      return result;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get dashboard overview',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  async getBookingOverview() {
    try {
      const result = await this.dashboardService.getBookingOverview();
      LoggingUtil.log('Booking overview retrieved', 'AdminFacadeService');
      return result;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get booking overview', error, 'AdminFacadeService');
      throw error;
    }
  }

  // System Operations
  getSystemHealth() {
    try {
      const result = this.systemService.getSystemHealth();
      LoggingUtil.log('System health retrieved', 'AdminFacadeService');
      return result;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get system health', error, 'AdminFacadeService');
      throw error;
    }
  }

  async getSystemHealthMetrics(
    filters?: AdminSystemHealthFiltersDto,
  ): Promise<SystemHealthMetricsDto> {
    try {
      const result = await this.systemService.getSystemHealthMetrics(filters);
      LoggingUtil.log('System health metrics retrieved', 'AdminFacadeService', {
        metadata: { filters },
      });
      return result;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get system health metrics',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  // Core Admin Operations
  async getAdminStats() {
    try {
      const result = await this.coreService.getAdminStats();
      LoggingUtil.log('Admin stats retrieved', 'AdminFacadeService');
      return result;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get admin stats', error, 'AdminFacadeService');
      throw error;
    }
  }

  getRecentActivities(): Promise<AdminActivitiesPaginatedDto> {
    try {
      const activities = this.activityService.getRecentActivities(20);
      const result: AdminActivitiesPaginatedDto = {
        items: activities,
        total: activities.length,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      LoggingUtil.log('Recent activities retrieved', 'AdminFacadeService', {
        metadata: { count: activities.length },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get recent activities',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  // Activity Management
  getActivitiesWithFilters(filters: AdminActivityFiltersDto): Promise<AdminActivitiesPaginatedDto> {
    try {
      const result = this.activityService.findActivitiesWithFilters(filters);
      LoggingUtil.log('Activities retrieved with filters', 'AdminFacadeService', {
        metadata: { filters, totalResults: result.total },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get activities with filters',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  getActivityById(activityId: string) {
    try {
      // This would typically call the activity service to get a specific activity
      const result = this.activityService.getRecentActivities(1);
      LoggingUtil.log('Activity retrieved by ID', 'AdminFacadeService', {
        metadata: { activityId },
      });
      return result[0]; // Return first activity as mock
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get activity by ID', error, 'AdminFacadeService');
      throw error;
    }
  }

  // Bulk Operations
  async executeBulkAction(bulkAction: BulkActionDto): Promise<BulkOperationResultDto> {
    try {
      const result = await this.coreService.executeBulkAction(bulkAction);

      // Log the bulk action for audit trail
      this.activityService.logActivity(
        AdminActivityTypeEnum.SYSTEM_ACTIONS,
        `Bulk action executed: ${bulkAction.action}`,
        'system', // This would be the actual admin user ID
        undefined,
        'bulk_operation',
        ActivitySeverityEnum.HIGH,
        {
          action: bulkAction.action,
          targetCount: bulkAction.targetIds?.length || 0,
          reason: bulkAction.reason,
        },
      );

      LoggingUtil.log('Bulk action executed', 'AdminFacadeService', {
        metadata: {
          action: bulkAction.action,
          targetCount: bulkAction.targetIds?.length || 0,
          successful: result.successful,
          failed: result.failed,
        },
      });

      return result;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to execute bulk action', error, 'AdminFacadeService');
      throw error;
    }
  }

  // Notification Management
  getAdminNotifications(includeRead?: boolean, limit?: number): Promise<AdminNotificationDto[]> {
    try {
      const result = this.activityService.getAdminNotifications(includeRead, limit);
      LoggingUtil.log('Admin notifications retrieved', 'AdminFacadeService', {
        metadata: {
          count: result.length,
          includeRead,
          limit,
        },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get admin notifications',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  markNotificationAsRead(notificationId: string): Promise<AdminNotificationDto> {
    try {
      const result = this.activityService.markNotificationAsRead(notificationId);
      LoggingUtil.log('Notification marked as read', 'AdminFacadeService', {
        metadata: { notificationId },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to mark notification as read',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  deleteNotification(notificationId: string): Promise<AdminNotificationDto> {
    try {
      // Mock implementation - in real scenario, this would delete from database
      const result = this.activityService.markNotificationAsRead(notificationId);
      LoggingUtil.log('Notification deleted', 'AdminFacadeService', {
        metadata: { notificationId },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException('Failed to delete notification', error, 'AdminFacadeService');
      throw error;
    }
  }

  // Audit Trail Management
  getAuditLogs(filters: AdminActivityFiltersDto): Promise<AuditLogEntryDto[]> {
    try {
      // Mock implementation - would typically call a dedicated audit service
      const result: AuditLogEntryDto[] = [];
      LoggingUtil.log('Audit logs retrieved', 'AdminFacadeService', { metadata: { filters } });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get audit logs', error, 'AdminFacadeService');
      throw error;
    }
  }

  exportAuditLogs(filters: AdminActivityFiltersDto, format: 'csv' | 'pdf'): Promise<any> {
    try {
      // Mock implementation - would generate export file
      const result = {
        downloadUrl: `https://example.com/exports/audit_logs_${Date.now()}.${format}`,
        fileName: `audit_logs_${Date.now()}.${format}`,
        generatedAt: new Date(),
      };

      LoggingUtil.log('Audit logs exported', 'AdminFacadeService', {
        metadata: { filters, format },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException('Failed to export audit logs', error, 'AdminFacadeService');
      throw error;
    }
  }

  // System Management
  async triggerSystemMaintenance(): Promise<BulkOperationResultDto> {
    try {
      const result = await this.systemService.triggerSystemMaintenance();

      // Log maintenance activity
      this.activityService.logActivity(
        AdminActivityTypeEnum.SYSTEM_ACTIONS,
        'System maintenance triggered',
        'system',
        undefined,
        'system_maintenance',
        ActivitySeverityEnum.HIGH,
        {
          maintenanceTasks: result.successful,
          executionTime: result.executionTime,
        },
      );

      LoggingUtil.log('System maintenance triggered', 'AdminFacadeService', {
        metadata: {
          successful: result.successful,
          failed: result.failed,
          executionTime: result.executionTime,
        },
      });

      return result;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to trigger system maintenance',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }

  getPerformanceMetrics(period: '1h' | '24h' | '7d' | '30d'): Promise<any> {
    try {
      const result = this.systemService.getPerformanceMetrics(period);
      LoggingUtil.log('Performance metrics retrieved', 'AdminFacadeService', {
        metadata: { period },
      });
      return Promise.resolve(result);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get performance metrics',
        error,
        'AdminFacadeService',
      );
      throw error;
    }
  }
}
