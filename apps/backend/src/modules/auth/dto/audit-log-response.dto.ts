import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  AuditLogAction,
  AuditLogResult,
  AuditLogSeverity,
} from '../../../database/schemas/audit-log.schema';

/**
 * Individual audit log entry
 */
export class AuditLogEntryDto {
  @ApiProperty({ description: 'Audit log ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({
    description: 'Action performed',
    enum: AuditLogAction,
    example: AuditLogAction.LOGIN_SUCCESS,
  })
  action: AuditLogAction;

  @ApiProperty({
    description: 'Result of the action',
    enum: AuditLogResult,
    example: AuditLogResult.SUCCESS,
  })
  result: AuditLogResult;

  @ApiProperty({
    description: 'Severity level',
    enum: AuditLogSeverity,
    example: AuditLogSeverity.MEDIUM,
  })
  severity: AuditLogSeverity;

  @ApiProperty({
    description: 'Type of resource affected',
    example: 'User',
    required: false,
  })
  resourceType?: string;

  @ApiProperty({
    description: 'ID of the affected resource',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  resourceId?: string;

  @ApiProperty({ description: 'IP address', example: '192.168.1.100', required: false })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent string', required: false })
  userAgent?: string;

  @ApiProperty({ description: 'Device fingerprint hash', required: false })
  deviceFingerprint?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Error message for failed actions',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Human-readable description',
    example: 'User logged in successfully',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Timestamp when the action occurred',
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

/**
 * Paginated audit log response
 */
export class AuditLogListDataDto {
  @ApiProperty({ type: [AuditLogEntryDto], description: 'List of audit log entries' })
  entries: AuditLogEntryDto[];

  @ApiProperty({ description: 'Total number of audit logs', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Number of entries per page', example: 50 })
  limit: number;
}

export class AuditLogListResponseDto extends BaseResponseDto<AuditLogListDataDto> {
  @ApiProperty({ type: AuditLogListDataDto })
  declare data: AuditLogListDataDto;
}

/**
 * Suspicious activity report
 */
export class SuspiciousActivityItemDto {
  @ApiProperty({ description: 'IP address', example: '192.168.1.100' })
  ipAddress: string;

  @ApiProperty({ description: 'Number of failed attempts', example: 12 })
  failureCount: number;
}

export class SuspiciousActivityDataDto {
  @ApiProperty({ type: [SuspiciousActivityItemDto], description: 'List of suspicious IPs' })
  suspiciousIps: SuspiciousActivityItemDto[];

  @ApiProperty({ description: 'Time window in minutes', example: 15 })
  timeWindowMinutes: number;
}

export class SuspiciousActivityResponseDto extends BaseResponseDto<SuspiciousActivityDataDto> {
  @ApiProperty({ type: SuspiciousActivityDataDto })
  declare data: SuspiciousActivityDataDto;
}
