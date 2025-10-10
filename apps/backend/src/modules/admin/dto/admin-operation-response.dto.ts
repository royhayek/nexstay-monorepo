import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';
import { AdminActivityTypeEnum, ActivitySeverityEnum } from './admin-filters.dto';

// Admin Activity DTO
export class AdminActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Activity type',
    enum: AdminActivityTypeEnum,
    example: AdminActivityTypeEnum.USER_MANAGEMENT,
  })
  type: AdminActivityTypeEnum;

  @ApiProperty({
    description: 'Activity description',
    example: 'User account deactivated',
  })
  description: string;

  @ApiProperty({
    description: 'Admin user who performed the action',
    example: 'admin@example.com',
  })
  performedBy: string;

  @ApiProperty({
    description: 'Target resource ID if applicable',
    example: '507f1f77bcf86cd799439012',
  })
  targetId?: string;

  @ApiProperty({
    description: 'Target resource type if applicable',
    example: 'user',
  })
  targetType?: string;

  @ApiProperty({
    description: 'Activity severity level',
    enum: ActivitySeverityEnum,
    example: ActivitySeverityEnum.MEDIUM,
  })
  severity: ActivitySeverityEnum;

  @ApiProperty({
    description: 'Additional metadata',
    example: { reason: 'Policy violation', previousStatus: 'active' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

// Bulk operation result DTO
export class BulkOperationResultDto {
  @ApiProperty({
    description: 'Total number of items processed',
    example: 25,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of successful operations',
    example: 23,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of failed operations',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of successful item IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  successfulIds: string[];

  @ApiProperty({
    description: 'Array of failed items with errors',
    example: [
      {
        id: '507f1f77bcf86cd799439013',
        error: 'User not found',
      },
    ],
  })
  failedItems: Array<{
    id: string;
    error: string;
  }>;

  @ApiProperty({
    description: 'Operation execution time in milliseconds',
    example: 2500,
  })
  executionTime: number;

  @ApiProperty({
    description: 'Operation completed timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  completedAt: Date;
}

// System health metrics DTO
export class SystemHealthMetricsDto {
  @ApiProperty({
    description: 'Database connection status',
    example: 'healthy',
  })
  databaseStatus: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({
    description: 'Memory usage percentage',
    example: 67.5,
  })
  memoryUsage: number;

  @ApiProperty({
    description: 'CPU usage percentage',
    example: 45.2,
  })
  cpuUsage: number;

  @ApiProperty({
    description: 'System uptime in seconds',
    example: 86400,
  })
  uptime: number;

  @ApiProperty({
    description: 'Active connections count',
    example: 125,
  })
  activeConnections: number;

  @ApiProperty({
    description: 'External services status',
    example: {
      emailService: 'healthy',
      smsService: 'healthy',
      paymentGateway: 'degraded',
      s3Storage: 'healthy',
    },
  })
  externalServices: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;

  @ApiProperty({
    description: 'Last health check timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  lastChecked: Date;
}

// Admin notification DTO
export class AdminNotificationDto {
  @ApiProperty({
    description: 'Notification ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'System Alert',
  })
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: 'High memory usage detected',
  })
  message: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'warning',
  })
  type: 'info' | 'warning' | 'error' | 'success';

  @ApiProperty({
    description: 'Is notification read',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Notification priority',
    example: 'high',
  })
  priority: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'Notification created timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

// Audit log entry DTO
export class AuditLogEntryDto {
  @ApiProperty({
    description: 'Audit log entry ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Action performed',
    example: 'UPDATE_USER_PROFILE',
  })
  action: string;

  @ApiProperty({
    description: 'Resource type affected',
    example: 'user',
  })
  resourceType: string;

  @ApiProperty({
    description: 'Resource ID affected',
    example: '507f1f77bcf86cd799439012',
  })
  resourceId: string;

  @ApiProperty({
    description: 'User who performed the action',
    example: '507f1f77bcf86cd799439013',
  })
  performedBy: string;

  @ApiProperty({
    description: 'IP address of the requester',
    example: '192.168.1.100',
  })
  ipAddress: string;

  @ApiProperty({
    description: 'User agent string',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent: string;

  @ApiProperty({
    description: 'Changes made (before/after values)',
    example: {
      email: { before: 'old@example.com', after: 'new@example.com' },
      status: { before: 'inactive', after: 'active' },
    },
  })
  changes?: Record<string, { before: any; after: any }>;

  @ApiProperty({
    description: 'Additional metadata',
    example: { reason: 'User request', approvedBy: 'supervisor' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Audit log entry timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

// Concrete paginated DTOs following architectural guidelines
export class AdminActivitiesPaginatedDto extends PaginatedDto<AdminActivityDto> {
  @ApiProperty({ type: [AdminActivityDto], description: 'Array of admin activity items' })
  @Type(() => AdminActivityDto)
  declare items: AdminActivityDto[];
}

export class AdminNotificationsPaginatedDto extends PaginatedDto<AdminNotificationDto> {
  @ApiProperty({ type: [AdminNotificationDto], description: 'Array of admin notification items' })
  @Type(() => AdminNotificationDto)
  declare items: AdminNotificationDto[];
}

export class AuditLogsPaginatedDto extends PaginatedDto<AuditLogEntryDto> {
  @ApiProperty({ type: [AuditLogEntryDto], description: 'Array of audit log entry items' })
  @Type(() => AuditLogEntryDto)
  declare items: AuditLogEntryDto[];
}

// Operation-specific response DTOs using BaseResponseDto
export class AdminActivitiesResponseDto extends BaseResponseDto<AdminActivitiesPaginatedDto> {
  @ApiProperty({
    description: 'Paginated admin activities data',
    type: AdminActivitiesPaginatedDto,
  })
  declare data: AdminActivitiesPaginatedDto;
}

export class BulkOperationResultResponseDto extends BaseResponseDto<BulkOperationResultDto> {
  @ApiProperty({
    description: 'Bulk operation result details',
    type: BulkOperationResultDto,
  })
  declare data: BulkOperationResultDto;
}

export class SystemHealthMetricsResponseDto extends BaseResponseDto<SystemHealthMetricsDto> {
  @ApiProperty({
    description: 'System health metrics data',
    type: SystemHealthMetricsDto,
  })
  declare data: SystemHealthMetricsDto;
}

export class AdminNotificationsResponseDto extends BaseResponseDto<AdminNotificationsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated admin notifications data',
    type: AdminNotificationsPaginatedDto,
  })
  declare data: AdminNotificationsPaginatedDto;
}

export class AuditLogsResponseDto extends BaseResponseDto<AuditLogsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated audit logs data',
    type: AuditLogsPaginatedDto,
  })
  declare data: AuditLogsPaginatedDto;
}

// Single item response DTOs
export class AdminActivityResponseDto extends BaseResponseDto<AdminActivityDto> {
  @ApiProperty({
    description: 'Admin activity data',
    type: AdminActivityDto,
  })
  declare data: AdminActivityDto;
}

export class AdminNotificationResponseDto extends BaseResponseDto<AdminNotificationDto> {
  @ApiProperty({
    description: 'Admin notification data',
    type: AdminNotificationDto,
  })
  declare data: AdminNotificationDto;
}

export class AuditLogEntryResponseDto extends BaseResponseDto<AuditLogEntryDto> {
  @ApiProperty({
    description: 'Audit log entry data',
    type: AuditLogEntryDto,
  })
  declare data: AuditLogEntryDto;
}

// Type aliases for service return types (eliminates manual inline types)
export type AdminActivitiesResponse = BaseResponseDto<AdminActivitiesPaginatedDto>;
export type BulkOperationResultResponse = BaseResponseDto<BulkOperationResultDto>;
export type SystemHealthMetricsResponse = BaseResponseDto<SystemHealthMetricsDto>;
export type AdminNotificationsResponse = BaseResponseDto<AdminNotificationsPaginatedDto>;
export type AuditLogsResponse = BaseResponseDto<AuditLogsPaginatedDto>;
export type AdminActivityResponse = BaseResponseDto<AdminActivityDto>;
export type AdminNotificationResponse = BaseResponseDto<AdminNotificationDto>;
export type AuditLogEntryResponse = BaseResponseDto<AuditLogEntryDto>;
