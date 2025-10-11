import { ApiProperty } from '@nestjs/swagger';

/**
 * Device cleanup statistics response
 */
export class DeviceCleanupStatsDto {
  @ApiProperty({
    description: 'Number of devices eligible for cleanup',
    example: 42,
  })
  eligibleForCleanup: number;

  @ApiProperty({
    description: 'Expiry threshold date (devices not used since this date will be deactivated)',
    example: '2024-10-11T00:00:00.000Z',
  })
  expiryThresholdDate: Date;

  @ApiProperty({
    description: 'Whether automatic cleanup is enabled',
    example: true,
  })
  cleanupEnabled: boolean;

  @ApiProperty({
    description: 'Number of days before a device expires',
    example: 90,
  })
  expiryDays: number;
}

/**
 * Device cleanup execution result
 */
export class DeviceCleanupResultDto {
  @ApiProperty({
    description: 'Number of devices that were deactivated',
    example: 35,
  })
  deactivatedCount: number;

  @ApiProperty({
    description: 'Number of devices scanned for cleanup',
    example: 42,
  })
  scannedCount: number;

  @ApiProperty({
    description: 'Expiry threshold date used for cleanup',
    example: '2024-10-11T00:00:00.000Z',
  })
  expiryThresholdDate: Date;

  @ApiProperty({
    description: 'Success message',
    example: 'Device cleanup completed successfully',
  })
  message?: string;
}

/**
 * Booking auto-cancel statistics response
 */
export class BookingAutoCancelStatsDto {
  @ApiProperty({
    description: 'Number of bookings eligible for auto-cancellation',
    example: 15,
  })
  eligibleForCancellation: number;

  @ApiProperty({
    description: 'Cancellation threshold date (bookings created before this will be cancelled)',
    example: '2024-10-10T12:00:00.000Z',
  })
  cancellationThresholdDate: Date;

  @ApiProperty({
    description: 'Number of hours after creation before unpaid booking is auto-cancelled',
    example: 24,
  })
  autoCancelHours: number;
}

/**
 * Booking auto-cancel execution result
 */
export class BookingAutoCancelResultDto {
  @ApiProperty({
    description: 'Number of bookings that were cancelled',
    example: 12,
  })
  cancelledCount: number;

  @ApiProperty({
    description: 'Number of bookings scanned for cancellation',
    example: 15,
  })
  scannedCount: number;

  @ApiProperty({
    description: 'Cancellation threshold date used',
    example: '2024-10-10T12:00:00.000Z',
  })
  cancellationThresholdDate: Date;

  @ApiProperty({
    description: 'Success message',
    example: 'Auto-cancellation completed successfully',
  })
  message?: string;
}

/**
 * Comprehensive cleanup monitoring response
 */
export class CleanupMonitoringDto {
  @ApiProperty({
    description: 'Device cleanup statistics',
    type: DeviceCleanupStatsDto,
  })
  deviceCleanup: DeviceCleanupStatsDto;

  @ApiProperty({
    description: 'Booking auto-cancel statistics',
    type: BookingAutoCancelStatsDto,
  })
  bookingAutoCancel: BookingAutoCancelStatsDto;

  @ApiProperty({
    description: 'Timestamp when statistics were generated',
    example: '2024-10-11T15:30:00.000Z',
  })
  generatedAt: Date;
}
