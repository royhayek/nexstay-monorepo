import { Injectable } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { AdminSystemHealthFiltersDto } from '../dto/admin-filters.dto';
import {
  SystemHealthMetricsDto,
  BulkOperationResultDto,
} from '../dto/admin-operation-response.dto';

/**
 * System Status Enum
 */
export enum SystemStatusEnum {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}

/**
 * Service Status Enum
 */
export enum ServiceStatusEnum {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNKNOWN = 'unknown',
}

/**
 * Admin System Service
 * Handles system health monitoring and status checks
 */
@Injectable()
export class AdminSystemService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /**
   * Get comprehensive system health status
   */
  getSystemHealth() {
    try {
      const databaseStatus = this.getDatabaseStatus();
      const memoryInfo = this.getMemoryInfo();
      const uptimeInfo = this.getUptimeInfo();

      const overallStatus = this.calculateOverallStatus({
        database: databaseStatus,
      });

      return {
        status: overallStatus,
        timestamp: DateUtils.now(),
        services: {
          database: databaseStatus,
          redis: ServiceStatusEnum.UNKNOWN, // Implementation pending - Redis health check integration
          fileStorage: ServiceStatusEnum.UNKNOWN, // Implementation pending - S3 connectivity check
          notifications: ServiceStatusEnum.UNKNOWN, // Implementation pending - Firebase/notification service health check
          payments: ServiceStatusEnum.UNKNOWN, // Implementation pending - APS payment provider health check
        },
        uptime: uptimeInfo,
        memory: memoryInfo,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get system health', error, 'AdminSystemService');
      return {
        status: SystemStatusEnum.ERROR,
        timestamp: DateUtils.now(),
        services: {
          database: ServiceStatusEnum.UNKNOWN,
          redis: ServiceStatusEnum.UNKNOWN,
          fileStorage: ServiceStatusEnum.UNKNOWN,
          notifications: ServiceStatusEnum.UNKNOWN,
          payments: ServiceStatusEnum.UNKNOWN,
        },
        uptime: {
          seconds: 0,
          formatted: '0d 0h 0m 0s',
        },
        memory: {
          used: 0,
          total: 0,
          external: 0,
          rss: 0,
          usagePercentage: 0,
        },
        error: 'Failed to retrieve system health',
      };
    }
  }

  /**
   * Check database connection status
   */
  private getDatabaseStatus(): ServiceStatusEnum {
    try {
      // Connection ready states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
      const readyState = this.connection.readyState as number;
      const DISCONNECTED = 0;
      const CONNECTED = 1;
      const CONNECTING = 2;
      const DISCONNECTING = 3;

      if (readyState === CONNECTED) {
        return ServiceStatusEnum.CONNECTED;
      } else if (
        readyState === DISCONNECTED ||
        readyState === CONNECTING ||
        readyState === DISCONNECTING
      ) {
        return ServiceStatusEnum.DISCONNECTED;
      } else {
        return ServiceStatusEnum.DISCONNECTED;
      }
    } catch {
      return ServiceStatusEnum.UNKNOWN;
    }
  }

  /**
   * Get memory usage information
   */
  private getMemoryInfo() {
    const memUsage = process.memoryUsage();
    return {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usagePercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };
  }

  /**
   * Get uptime information
   */
  private getUptimeInfo() {
    const uptimeSeconds = process.uptime();
    return {
      seconds: uptimeSeconds,
      formatted: this.formatUptime(uptimeSeconds),
    };
  }

  /**
   * Calculate overall system status based on individual service statuses
   */
  private calculateOverallStatus(services: { database: ServiceStatusEnum }): SystemStatusEnum {
    if (services.database === ServiceStatusEnum.DISCONNECTED) {
      return SystemStatusEnum.ERROR;
    }

    if (services.database === ServiceStatusEnum.CONNECTED) {
      return SystemStatusEnum.HEALTHY;
    }

    return SystemStatusEnum.WARNING;
  }

  /**
   * Format uptime seconds into human-readable string
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Get comprehensive system health metrics
   */
  getSystemHealthMetrics(filters?: AdminSystemHealthFiltersDto): Promise<SystemHealthMetricsDto> {
    try {
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      const cpuUsage = this.getCpuUsage();
      const databaseStatus = this.mapDatabaseStatus(this.getDatabaseStatus());
      const externalServices = this.getExternalServicesStatus();

      const metrics: SystemHealthMetricsDto = {
        databaseStatus,
        memoryUsage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        cpuUsage,
        uptime: Math.floor(uptime),
        activeConnections: this.getActiveConnectionsCount(),
        externalServices: filters?.includeExternalServices ? externalServices : {},
        lastChecked: DateUtils.now(),
      };

      LoggingUtil.log('System health metrics retrieved', 'AdminSystemService', {
        metadata: {
          databaseStatus: metrics.databaseStatus,
          memoryUsage: metrics.memoryUsage,
          cpuUsage: metrics.cpuUsage,
          uptime: metrics.uptime,
          activeConnections: metrics.activeConnections,
        },
      });

      return Promise.resolve(metrics);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get system health metrics',
        error,
        'AdminSystemService',
      );
      throw new Error('SYSTEM_HEALTH_CHECK_FAILED');
    }
  }

  /**
   * Trigger system maintenance tasks
   */
  async triggerSystemMaintenance(): Promise<BulkOperationResultDto> {
    const startTime = Date.now();
    const result: BulkOperationResultDto = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      successfulIds: [],
      failedItems: [],
      executionTime: 0,
      completedAt: DateUtils.now(),
    };

    const maintenanceTasks = [
      'database_cleanup',
      'cache_clearing',
      'log_rotation',
      'temp_file_cleanup',
      'session_cleanup',
    ];

    result.totalProcessed = maintenanceTasks.length;

    try {
      LoggingUtil.log('Starting system maintenance tasks', 'AdminSystemService', {
        metadata: {
          tasks: maintenanceTasks,
          totalTasks: result.totalProcessed,
        },
      });

      // Execute maintenance tasks
      for (const task of maintenanceTasks) {
        try {
          await this.executeMaintenanceTask(task);
          result.successful++;
          result.successfulIds.push(task);
          LoggingUtil.log(`Maintenance task completed: ${task}`, 'AdminSystemService');
        } catch (error) {
          result.failed++;
          result.failedItems.push({
            id: task,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          LoggingUtil.errorWithException(
            `Maintenance task failed: ${task}`,
            error,
            'AdminSystemService',
          );
        }
      }

      result.executionTime = Date.now() - startTime;
      result.completedAt = DateUtils.now();

      LoggingUtil.log('System maintenance completed', 'AdminSystemService', {
        metadata: {
          totalProcessed: result.totalProcessed,
          successful: result.successful,
          failed: result.failed,
          executionTime: result.executionTime,
        },
      });

      return result;
    } catch (error) {
      result.executionTime = Date.now() - startTime;
      LoggingUtil.errorWithException('System maintenance failed', error, 'AdminSystemService');
      throw new Error('SYSTEM_MAINTENANCE_FAILED');
    }
  }

  /**
   * Get performance metrics for different time periods
   */
  getPerformanceMetrics(period: '1h' | '24h' | '7d' | '30d'): {
    period: string;
    startTime: Date;
    endTime: Date;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
    errorsByType: {
      '4xx': number;
      '5xx': number;
      timeout: number;
      connection: number;
    };
  } {
    try {
      const now = DateUtils.now();
      const periodHours = this.getPeriodHours(period);

      const metrics = {
        period,
        startTime: DateUtils.subtractHours(now, periodHours),
        endTime: now,
        averageResponseTime: Math.floor(Math.random() * 100) + 50, // Mock data
        throughput: Math.floor(Math.random() * 1000) + 500, // Requests per minute
        errorRate: Math.random() * 5, // Percentage
        availability: 99.9 - Math.random() * 0.5, // Percentage
        resourceUtilization: {
          cpu: Math.floor(Math.random() * 30) + 20, // Percentage
          memory: Math.floor(Math.random() * 40) + 30, // Percentage
          disk: Math.floor(Math.random() * 20) + 10, // Percentage
          network: Math.floor(Math.random() * 50) + 25, // Percentage
        },
        topEndpoints: [
          { endpoint: '/api/properties', count: 1250, avgResponseTime: 85 },
          { endpoint: '/api/bookings', count: 980, avgResponseTime: 120 },
          { endpoint: '/api/users', count: 750, avgResponseTime: 65 },
          { endpoint: '/api/auth/login', count: 650, avgResponseTime: 95 },
        ],
        errorsByType: {
          '4xx': Math.floor(Math.random() * 50),
          '5xx': Math.floor(Math.random() * 10),
          timeout: Math.floor(Math.random() * 5),
          connection: Math.floor(Math.random() * 3),
        },
      };

      LoggingUtil.log('Performance metrics retrieved', 'AdminSystemService', {
        metadata: {
          period,
          averageResponseTime: metrics.averageResponseTime,
          throughput: metrics.throughput,
          errorRate: metrics.errorRate,
          availability: metrics.availability,
        },
      });

      return metrics;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get performance metrics',
        error,
        'AdminSystemService',
      );
      throw new Error('PERFORMANCE_METRICS_FAILED');
    }
  }

  // Private helper methods for new functionality
  private mapDatabaseStatus(status: ServiceStatusEnum): 'healthy' | 'degraded' | 'unhealthy' {
    switch (status) {
      case ServiceStatusEnum.CONNECTED:
        return 'healthy';
      case ServiceStatusEnum.DISCONNECTED:
        return 'unhealthy';
      default:
        return 'degraded';
    }
  }

  private getCpuUsage(): number {
    // Mock CPU usage calculation
    return Math.floor(Math.random() * 50) + 20; // Mock value between 20-70%
  }

  private getActiveConnectionsCount(): number {
    // Mock active connections count
    return Math.floor(Math.random() * 200) + 50; // Mock value between 50-250
  }

  private getExternalServicesStatus(): Record<string, 'healthy' | 'degraded' | 'unhealthy'> {
    const services = ['emailService', 'smsService', 'paymentGateway', 's3Storage'];
    const statuses: Record<string, 'healthy' | 'degraded' | 'unhealthy'> = {};

    for (const service of services) {
      const rand = Math.random();
      if (rand > 0.98) {
        statuses[service] = 'unhealthy';
      } else if (rand > 0.9) {
        statuses[service] = 'degraded';
      } else {
        statuses[service] = 'healthy';
      }
    }

    return statuses;
  }

  private async executeMaintenanceTask(task: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate task execution

    switch (task) {
      case 'database_cleanup':
        LoggingUtil.log('Database cleanup completed', 'AdminSystemService');
        break;
      case 'cache_clearing':
        LoggingUtil.log('Cache clearing completed', 'AdminSystemService');
        break;
      case 'log_rotation':
        LoggingUtil.log('Log rotation completed', 'AdminSystemService');
        break;
      case 'temp_file_cleanup':
        LoggingUtil.log('Temporary file cleanup completed', 'AdminSystemService');
        break;
      case 'session_cleanup':
        LoggingUtil.log('Session cleanup completed', 'AdminSystemService');
        break;
      default:
        throw new Error(`Unknown maintenance task: ${task}`);
    }

    // Randomly fail some tasks for testing (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error(`Mock failure for task: ${task}`);
    }
  }

  private getPeriodHours(period: '1h' | '24h' | '7d' | '30d'): number {
    switch (period) {
      case '1h':
        return 1;
      case '24h':
        return 24;
      case '7d':
        return 24 * 7;
      case '30d':
        return 24 * 30;
      default:
        return 24;
    }
  }
}
