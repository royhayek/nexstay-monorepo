import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../../database/schemas/audit-log.schema';
import { ConfigCacheHelper } from '../../config/config-cache.helper';

/**
 * Service for scheduled cleanup of old audit logs
 * Runs daily at 2 AM to remove audit logs older than retention period
 */
@Injectable()
export class AuditLogCleanupService {
  private readonly logger = new Logger(AuditLogCleanupService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly configCache: ConfigCacheHelper,
  ) {}

  /**
   * Scheduled job to clean up old audit logs
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'audit-log-cleanup',
    timeZone: 'UTC',
  })
  async cleanupOldAuditLogs(): Promise<void> {
    this.logger.log('Starting scheduled audit log cleanup');

    try {
      // Load retention period from dynamic config
      const retentionDays = await this.configCache.getNumber('AUDIT_LOG_RETENTION_DAYS', 90);

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      this.logger.log(
        `Deleting audit logs older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
      );

      // Delete old audit logs
      const result = await this.auditLogModel
        .deleteMany({
          createdAt: { $lt: cutoffDate },
        })
        .exec();

      this.logger.log(
        `Audit log cleanup completed: ${result.deletedCount} logs deleted (retention: ${retentionDays} days)`,
      );

      // Log the cleanup action in audit logs (meta: we're logging that we cleaned logs)
      if (result.deletedCount > 0) {
        await this.auditLogModel.create({
          userId: null, // System action
          action: 'SYSTEM_CLEANUP' as any,
          result: 'SUCCESS' as any,
          severity: 'LOW' as any,
          description: `Automatic audit log cleanup: ${result.deletedCount} logs deleted (older than ${retentionDays} days)`,
          metadata: {
            deletedCount: result.deletedCount,
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to clean up audit logs', {
        error: error.message,
        stack: error.stack,
      });

      // Log the failure in audit logs
      try {
        await this.auditLogModel.create({
          userId: null, // System action
          action: 'SYSTEM_CLEANUP' as any,
          result: 'FAILURE' as any,
          severity: 'HIGH' as any,
          description: 'Failed to perform automatic audit log cleanup',
          errorMessage: error.message,
          metadata: {
            error: error.message,
          },
        });
      } catch {
        // If we can't even log the error, just swallow it to prevent infinite loops
        this.logger.error('Failed to log cleanup failure to audit logs');
      }
    }
  }

  /**
   * Manual cleanup method that can be called on-demand
   * Useful for testing or admin-triggered cleanup
   */
  async manualCleanup(retentionDays?: number): Promise<{ deletedCount: number }> {
    this.logger.log(`Manual audit log cleanup triggered (retention: ${retentionDays || 'default'} days)`);

    // Load retention period from parameter or dynamic config
    const days = retentionDays ?? (await this.configCache.getNumber('AUDIT_LOG_RETENTION_DAYS', 90));

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Delete old audit logs
    const result = await this.auditLogModel
      .deleteMany({
        createdAt: { $lt: cutoffDate },
      })
      .exec();

    this.logger.log(
      `Manual audit log cleanup completed: ${result.deletedCount} logs deleted`,
    );

    // Log the manual cleanup action
    if (result.deletedCount > 0) {
      await this.auditLogModel.create({
        userId: null, // System action
        action: 'MANUAL_CLEANUP' as any,
        result: 'SUCCESS' as any,
        severity: 'MEDIUM' as any,
        description: `Manual audit log cleanup: ${result.deletedCount} logs deleted (older than ${days} days)`,
        metadata: {
          deletedCount: result.deletedCount,
          retentionDays: days,
          cutoffDate: cutoffDate.toISOString(),
        },
      });
    }

    return { deletedCount: result.deletedCount };
  }
}
