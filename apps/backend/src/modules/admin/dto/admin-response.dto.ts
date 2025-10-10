import { createResponseDto } from '../../../common/dto/base-response.dto';
import { SystemHealthResponseDto } from './system-health-response.dto';
import { AdminStatsResponseDto } from './admin-stats-response.dto';
import { EnhancedDashboardResponseDto } from './enhanced-dashboard-response.dto';
import { BookingOverviewDto } from '../../analytics/dto/booking-overview.dto';

/**
 * Admin Response DTOs using factory pattern
 * Following our architectural guidelines for consistent response structure
 */

// System Health Response
export const AdminSystemHealthResponseDto = createResponseDto(SystemHealthResponseDto);
export type AdminSystemHealthResponseDto = InstanceType<typeof AdminSystemHealthResponseDto>;

// Dashboard Response
export const AdminDashboardResponseDto = createResponseDto(EnhancedDashboardResponseDto);
export type AdminDashboardResponseDto = InstanceType<typeof AdminDashboardResponseDto>;

// Booking Overview Response
export const AdminBookingOverviewResponseDto = createResponseDto(BookingOverviewDto);
export type AdminBookingOverviewResponseDto = InstanceType<typeof AdminBookingOverviewResponseDto>;

// Admin Stats Response
export const AdminStatsOnlyResponseDto = createResponseDto(AdminStatsResponseDto);
export type AdminStatsOnlyResponseDto = InstanceType<typeof AdminStatsOnlyResponseDto>;
