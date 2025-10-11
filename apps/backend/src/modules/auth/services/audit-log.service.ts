import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditLogAction,
  AuditLogResult,
  AuditLogSeverity,
} from '../../../database/schemas/audit-log.schema';
import { ConfigCacheHelper } from '../../config/config-cache.helper';

/**
 * Interface for creating audit log entries
 */
export interface CreateAuditLogDto {
  userId: string | Types.ObjectId;
  action: AuditLogAction;
  result: AuditLogResult;
  severity?: AuditLogSeverity;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  description?: string;
}

/**
 * Interface for querying audit logs
 */
export interface AuditLogQuery {
  userId?: string | Types.ObjectId;
  action?: AuditLogAction;
  result?: AuditLogResult;
  severity?: AuditLogSeverity;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  skip?: number;
}

/**
 * Service for managing audit logs
 * Tracks sensitive operations for security and compliance
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly configCache: ConfigCacheHelper,
  ) {}

  /**
   * Create a new audit log entry
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      const auditLog = new this.auditLogModel({
        userId: dto.userId,
        action: dto.action,
        result: dto.result,
        severity: dto.severity || AuditLogSeverity.MEDIUM,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        deviceFingerprint: dto.deviceFingerprint,
        metadata: dto.metadata,
        errorMessage: dto.errorMessage,
        description: dto.description,
      });

      await auditLog.save();

      // Log high/critical severity events to application logs as well
      if (dto.severity === AuditLogSeverity.HIGH || dto.severity === AuditLogSeverity.CRITICAL) {
        this.logger.warn(
          `[${dto.severity.toUpperCase()}] Audit: ${dto.action} - ${dto.result} - User: ${dto.userId}`,
          {
            action: dto.action,
            result: dto.result,
            userId: dto.userId,
            ipAddress: dto.ipAddress,
          },
        );
      }
    } catch (error) {
      // Never throw errors from audit logging to avoid breaking main application flow
      this.logger.error('Failed to create audit log entry', {
        error: error.message,
        action: dto.action,
        userId: dto.userId,
      });
    }
  }

  /**
   * Log successful action
   */
  async logSuccess(
    userId: string | Types.ObjectId,
    action: AuditLogAction,
    options?: Partial<CreateAuditLogDto>,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      result: AuditLogResult.SUCCESS,
      ...options,
    });
  }

  /**
   * Log failed action
   */
  async logFailure(
    userId: string | Types.ObjectId,
    action: AuditLogAction,
    errorMessage: string,
    options?: Partial<CreateAuditLogDto>,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      result: AuditLogResult.FAILURE,
      errorMessage,
      severity: AuditLogSeverity.HIGH,
      ...options,
    });
  }

  /**
   * Query audit logs with filters
   */
  async query(query: AuditLogQuery): Promise<AuditLogDocument[]> {
    const filter: any = {};

    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.result) {
      filter.result = query.result;
    }
    if (query.severity) {
      filter.severity = query.severity;
    }
    if (query.ipAddress) {
      filter.ipAddress = query.ipAddress;
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    return this.auditLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit || 100)
      .skip(query.skip || 0)
      .exec();
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(
    userId: string | Types.ObjectId,
    limit: number = 50,
    skip: number = 0,
  ): Promise<AuditLogDocument[]> {
    return this.query({ userId, limit, skip });
  }

  /**
   * Get failed login attempts from a specific IP
   */
  async getFailedLoginsByIp(ipAddress: string, since: Date): Promise<AuditLogDocument[]> {
    return this.query({
      ipAddress,
      action: AuditLogAction.LOGIN_FAILURE,
      startDate: since,
    });
  }

  /**
   * Get suspicious activity (multiple failures)
   * Uses dynamic configuration for threshold and time window
   */
  async getSuspiciousActivity(
    timeWindowMinutes?: number,
    failureThreshold?: number,
  ): Promise<{ ipAddress: string; count: number }[]> {
    // Load from dynamic config if not provided
    const windowMinutes =
      timeWindowMinutes ?? (await this.configCache.getNumber('AUDIT_LOG_SUSPICIOUS_ACTIVITY_WINDOW_MINUTES', 15));
    const threshold =
      failureThreshold ?? (await this.configCache.getNumber('AUDIT_LOG_SUSPICIOUS_ACTIVITY_THRESHOLD', 5));

    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const results = await this.auditLogModel.aggregate([
      {
        $match: {
          result: AuditLogResult.FAILURE,
          createdAt: { $gte: since },
          ipAddress: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$ipAddress',
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gte: threshold },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return results.map((r) => ({
      ipAddress: r._id,
      count: r.count,
    }));
  }

  /**
   * Count logs matching criteria
   */
  async count(query: AuditLogQuery): Promise<number> {
    const filter: any = {};

    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.result) {
      filter.result = query.result;
    }
    if (query.ipAddress) {
      filter.ipAddress = query.ipAddress;
    }
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    return this.auditLogModel.countDocuments(filter).exec();
  }
}
