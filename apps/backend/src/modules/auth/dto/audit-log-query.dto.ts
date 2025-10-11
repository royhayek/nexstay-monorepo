import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import {
  AuditLogAction,
  AuditLogResult,
  AuditLogSeverity,
} from '../../../database/schemas/audit-log.schema';

/**
 * Query parameters for filtering audit logs
 */
export class AuditLogQueryDto {
  @ApiProperty({
    description: 'Filter by action type',
    enum: AuditLogAction,
    required: false,
  })
  @IsOptional()
  @IsEnum(AuditLogAction)
  action?: AuditLogAction;

  @ApiProperty({
    description: 'Filter by result',
    enum: AuditLogResult,
    required: false,
  })
  @IsOptional()
  @IsEnum(AuditLogResult)
  result?: AuditLogResult;

  @ApiProperty({
    description: 'Filter by severity',
    enum: AuditLogSeverity,
    required: false,
  })
  @IsOptional()
  @IsEnum(AuditLogSeverity)
  severity?: AuditLogSeverity;

  @ApiProperty({
    description: 'Filter by IP address',
    example: '192.168.1.100',
    required: false,
  })
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({
    description: 'Start date for filtering (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO 8601)',
    example: '2025-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of entries per page',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

/**
 * Query parameters for suspicious activity report
 */
export class SuspiciousActivityQueryDto {
  @ApiProperty({
    description: 'Time window in minutes to analyze',
    example: 15,
    default: 15,
    minimum: 1,
    maximum: 1440,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours
  timeWindowMinutes?: number = 15;
}
