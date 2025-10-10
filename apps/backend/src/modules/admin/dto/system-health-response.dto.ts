import { ApiProperty } from '@nestjs/swagger';
import { SystemStatusEnum, ServiceStatusEnum } from '../services/admin-system.service';

/**
 * Memory Info DTO
 */
export class MemoryInfoDto {
  @ApiProperty({
    description: 'Used heap memory in bytes',
    example: 45678912,
  })
  used!: number;

  @ApiProperty({
    description: 'Total heap memory in bytes',
    example: 67108864,
  })
  total!: number;

  @ApiProperty({
    description: 'External memory in bytes',
    example: 1234567,
  })
  external!: number;

  @ApiProperty({
    description: 'Resident Set Size in bytes',
    example: 89012345,
  })
  rss!: number;

  @ApiProperty({
    description: 'Memory usage percentage',
    example: 68,
  })
  usagePercentage!: number;
}

/**
 * Uptime Info DTO
 */
export class UptimeInfoDto {
  @ApiProperty({
    description: 'Uptime in seconds',
    example: 86400,
  })
  seconds!: number;

  @ApiProperty({
    description: 'Formatted uptime string',
    example: '1d 0h 0m 0s',
  })
  formatted!: string;
}

/**
 * Service Status DTO
 */
export class ServiceStatusDto {
  @ApiProperty({
    enum: ServiceStatusEnum,
    description: 'Database connection status',
    example: ServiceStatusEnum.CONNECTED,
  })
  database!: ServiceStatusEnum;

  @ApiProperty({
    enum: ServiceStatusEnum,
    description: 'Redis connection status',
    example: ServiceStatusEnum.CONNECTED,
  })
  redis!: ServiceStatusEnum;

  @ApiProperty({
    enum: ServiceStatusEnum,
    description: 'File storage service status',
    example: ServiceStatusEnum.CONNECTED,
  })
  fileStorage!: ServiceStatusEnum;

  @ApiProperty({
    enum: ServiceStatusEnum,
    description: 'Notifications service status',
    example: ServiceStatusEnum.ACTIVE,
  })
  notifications!: ServiceStatusEnum;

  @ApiProperty({
    enum: ServiceStatusEnum,
    description: 'Payments service status',
    example: ServiceStatusEnum.ACTIVE,
  })
  payments!: ServiceStatusEnum;
}

/**
 * System Health Response DTO
 */
export class SystemHealthResponseDto {
  @ApiProperty({
    enum: SystemStatusEnum,
    description: 'Overall system status',
    example: SystemStatusEnum.HEALTHY,
  })
  status!: SystemStatusEnum;

  @ApiProperty({
    description: 'Timestamp when health check was performed',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp!: Date;

  @ApiProperty({
    type: ServiceStatusDto,
    description: 'Individual service statuses',
  })
  services!: ServiceStatusDto;

  @ApiProperty({
    type: UptimeInfoDto,
    description: 'System uptime information',
  })
  uptime!: UptimeInfoDto;

  @ApiProperty({
    type: MemoryInfoDto,
    description: 'Memory usage information',
  })
  memory!: MemoryInfoDto;

  @ApiProperty({
    description: 'Error message if system check failed',
    required: false,
    example: 'Failed to retrieve system health',
  })
  error?: string;
}
