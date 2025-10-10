import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { SystemHealthResponseDto } from './system-health-response.dto';

// Dashboard Response
export class AdminDashboardDataDto {
  @ApiProperty({ description: 'Admin statistics and dashboard data' })
  adminStats: any;

  @ApiProperty({ description: 'Last updated timestamp', example: '2024-01-15T10:30:00Z' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Date range information' })
  dateRange: { start: Date; end: Date; days: number };

  @ApiProperty({ description: 'Applied filters' })
  filters: any;

  @ApiProperty({ description: 'Performance metrics', required: false })
  performanceMetrics?: any;

  @ApiProperty({ description: 'User metrics', required: false })
  userMetrics?: any;
}

// Booking Overview Response
export class BookingOverviewDataDto {
  @ApiProperty({ description: 'Total bookings', example: 1250 })
  totalBookings: number;

  @ApiProperty({ description: 'Active bookings', example: 350 })
  activeBookings: number;

  @ApiProperty({ description: 'Completed bookings', example: 800 })
  completedBookings: number;

  @ApiProperty({ description: 'Cancelled bookings', example: 100 })
  cancelledBookings: number;

  @ApiProperty({ description: 'Total revenue', example: 125000.5 })
  totalRevenue: number;

  @ApiProperty({ description: 'Recent bookings' })
  recentBookings: any[];
}

// Response DTOs extending BaseResponseDto
export class AdminDashboardResponseDto extends BaseResponseDto<AdminDashboardDataDto> {
  @ApiProperty({ type: AdminDashboardDataDto })
  declare data: AdminDashboardDataDto;
}

export class BookingOverviewResponseDto extends BaseResponseDto<BookingOverviewDataDto> {
  @ApiProperty({ type: BookingOverviewDataDto })
  declare data: BookingOverviewDataDto;
}

export class SystemHealthDataResponseDto extends BaseResponseDto<SystemHealthResponseDto> {
  @ApiProperty({ type: SystemHealthResponseDto })
  declare data: SystemHealthResponseDto;
}
