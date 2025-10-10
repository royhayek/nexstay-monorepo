import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  BaseResponseDto,
  createResponseDto,
  createPaginatedResponseDto,
  PaginationMetaDto,
} from '../../../common/dto/base-response.dto';
import {
  DashboardOverviewDto,
  PlatformDistributionDto,
  RegionalDataDto,
} from './dashboard-overview.dto';
import { BookingOverviewDto, BookingDetailDto } from './booking-overview.dto';
import {
  TopHostAnalyticsDto,
  CustomerReviewAnalyticsDto,
  ToursAvailabilityDto,
  YearlyBookingStatisticsDto,
} from './analytics-admin.dto';
import type {
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
  PropertyAnalytics,
} from '../interfaces/analytics.interfaces';

// ========================================
// DASHBOARD RESPONSE DTOs
// ========================================

/**
 * Dashboard overview response with comprehensive analytics
 */
export class DashboardOverviewResponseDto extends BaseResponseDto<DashboardOverviewDto> {
  @ApiProperty({
    description: 'Dashboard overview analytics data',
    type: DashboardOverviewDto,
  })
  declare data: DashboardOverviewDto;
}

/**
 * Booking overview response with statistics and trends
 */
export class BookingOverviewResponseDto extends BaseResponseDto<BookingOverviewDto> {
  @ApiProperty({
    description: 'Booking overview analytics data',
    type: BookingOverviewDto,
  })
  declare data: BookingOverviewDto;
}

// ========================================
// METRICS RESPONSE DTOs
// ========================================

/**
 * User analytics metrics response
 */
export class UserAnalyticsResponseDto extends BaseResponseDto<UserAnalytics> {
  @ApiProperty({
    description: 'User analytics metrics data',
    type: () => UserAnalyticsDataDto,
  })
  declare data: UserAnalytics;
}

/**
 * User analytics data structure for Swagger documentation
 */
export class UserAnalyticsDataDto implements UserAnalytics {
  @ApiProperty({
    description: 'Total number of users',
    example: 1500,
    minimum: 0,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of active users in the period',
    example: 450,
    minimum: 0,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of new users in the period',
    example: 50,
    minimum: 0,
  })
  newUsers: number;

  @ApiProperty({
    description: 'Users breakdown by role',
    example: { guest: 1200, host: 250, admin: 5 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  usersByRole: Record<string, number>;

  @ApiProperty({
    description: 'Users breakdown by region',
    example: { US: 800, UK: 300, FR: 200 },
    type: 'object',
    additionalProperties: { type: 'number' },
  })
  usersByRegion: Record<string, number>;

  @ApiProperty({
    description: 'User growth rate percentage',
    example: 12.5,
  })
  userGrowthRate: number;
}

/**
 * Booking analytics metrics response
 */
export class BookingAnalyticsResponseDto extends BaseResponseDto<BookingAnalytics> {
  @ApiProperty({
    description: 'Booking analytics metrics data',
    type: () => BookingAnalyticsDataDto,
  })
  declare data: BookingAnalytics;
}

/**
 * Booking analytics data structure for Swagger documentation
 */
export class BookingAnalyticsDataDto implements BookingAnalytics {
  @ApiProperty({
    description: 'Total number of bookings',
    example: 500,
    minimum: 0,
  })
  totalBookings: number;

  @ApiProperty({
    description: 'Number of confirmed bookings',
    example: 350,
    minimum: 0,
  })
  confirmedBookings: number;

  @ApiProperty({
    description: 'Number of pending bookings',
    example: 75,
    minimum: 0,
  })
  pendingBookings: number;

  @ApiProperty({
    description: 'Number of cancelled bookings',
    example: 75,
    minimum: 0,
  })
  cancelledBookings: number;

  @ApiProperty({
    description: 'Total revenue from bookings',
    example: 125000,
    minimum: 0,
  })
  revenue: number;

  @ApiProperty({
    description: 'Average booking value',
    example: 350,
    minimum: 0,
  })
  averageBookingValue: number;

  @ApiProperty({
    description: 'Booking growth rate percentage',
    example: 15.2,
  })
  bookingGrowthRate: number;
}

/**
 * Financial analytics metrics response
 */
export class FinancialAnalyticsResponseDto extends BaseResponseDto<FinancialAnalytics> {
  @ApiProperty({
    description: 'Financial analytics metrics data',
    type: () => FinancialAnalyticsDataDto,
  })
  declare data: FinancialAnalytics;
}

/**
 * Financial analytics data structure for Swagger documentation
 */
export class FinancialAnalyticsDataDto implements FinancialAnalytics {
  @ApiProperty({
    description: 'Total platform revenue',
    example: 150000,
    minimum: 0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Total host earnings',
    example: 145500,
    minimum: 0,
  })
  hostEarnings: number;

  @ApiProperty({
    description: 'Platform commission earned',
    example: 4500,
    minimum: 0,
  })
  platformCommission: number;

  @ApiProperty({
    description: 'Pending payouts amount',
    example: 12000,
    minimum: 0,
  })
  pendingPayouts: number;

  @ApiProperty({
    description: 'Revenue growth rate percentage',
    example: 8.7,
  })
  revenueGrowthRate: number;

  @ApiProperty({
    description: 'Average transaction value',
    example: 275,
    minimum: 0,
  })
  averageTransactionValue: number;
}

/**
 * Property analytics response DTO
 */
export class PropertyAnalyticsResponseDto extends BaseResponseDto<PropertyAnalytics> {
  @ApiProperty({
    description: 'Property analytics metrics data',
    type: () => PropertyAnalyticsDataDto,
  })
  declare data: PropertyAnalytics;
}

/**
 * Property analytics data structure for Swagger documentation
 */
export class PropertyAnalyticsDataDto implements PropertyAnalytics {
  @ApiProperty({
    description: 'Total number of properties',
    example: 1200,
    minimum: 0,
  })
  totalProperties: number;

  @ApiProperty({
    description: 'Number of active properties',
    example: 980,
    minimum: 0,
  })
  activeProperties: number;

  @ApiProperty({
    description: 'Average occupancy rate as percentage',
    example: 75.5,
    minimum: 0,
    maximum: 100,
  })
  averageOccupancyRate: number;

  @ApiProperty({
    description: 'Top performing properties',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        bookings: { type: 'number' },
        revenue: { type: 'number' },
        rating: { type: 'number' },
      },
    },
  })
  topPerformingProperties: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

// ========================================
// PAGINATED RESPONSE DTOs
// ========================================

/**
 * Paginated booking details response
 */
export class BookingDetailsPaginatedDataDto {
  @ApiProperty({
    description: 'Array of booking detail items',
    type: [BookingDetailDto],
  })
  @Type(() => BookingDetailDto)
  items: BookingDetailDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}

export class BookingDetailsResponseDto extends BaseResponseDto<BookingDetailsPaginatedDataDto> {
  @ApiProperty({
    description: 'Paginated booking details data',
    type: BookingDetailsPaginatedDataDto,
  })
  declare data: BookingDetailsPaginatedDataDto;
}

/**
 * Paginated top hosts analytics response
 */
export class TopHostsPaginatedDataDto {
  @ApiProperty({
    description: 'Array of top host analytics items',
    type: [TopHostAnalyticsDto],
  })
  @Type(() => TopHostAnalyticsDto)
  items: TopHostAnalyticsDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}

export class TopHostsAnalyticsResponseDto extends BaseResponseDto<TopHostsPaginatedDataDto> {
  @ApiProperty({
    description: 'Paginated top hosts analytics data',
    type: TopHostsPaginatedDataDto,
  })
  declare data: TopHostsPaginatedDataDto;
}

/**
 * Paginated customer reviews analytics response
 */
export class CustomerReviewsPaginatedDataDto {
  @ApiProperty({
    description: 'Array of customer review analytics items',
    type: [CustomerReviewAnalyticsDto],
  })
  @Type(() => CustomerReviewAnalyticsDto)
  items: CustomerReviewAnalyticsDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  pagination: PaginationMetaDto;
}

export class CustomerReviewsAnalyticsResponseDto extends BaseResponseDto<CustomerReviewsPaginatedDataDto> {
  @ApiProperty({
    description: 'Paginated customer reviews analytics data',
    type: CustomerReviewsPaginatedDataDto,
  })
  declare data: CustomerReviewsPaginatedDataDto;
}

// ========================================
// OPERATION-SPECIFIC RESPONSE DTOs
// ========================================

/**
 * Platform distribution analytics response
 */
export class PlatformDistributionDataDto {
  @ApiProperty({
    description: 'Platform distribution breakdown',
    type: [PlatformDistributionDto],
  })
  @Type(() => PlatformDistributionDto)
  platforms: PlatformDistributionDto[];

  @ApiProperty({
    description: 'Total active devices',
    example: 5000,
    minimum: 0,
  })
  totalDevices: number;

  @ApiProperty({
    description: 'Analysis timestamp',
    example: '2024-10-15T10:30:00Z',
  })
  analyzedAt: Date;
}

export class PlatformDistributionResponseDto extends BaseResponseDto<PlatformDistributionDataDto> {
  @ApiProperty({
    description: 'Platform distribution analytics data',
    type: PlatformDistributionDataDto,
  })
  declare data: PlatformDistributionDataDto;
}

/**
 * Regional distribution analytics response
 */
export class RegionalDistributionDataDto {
  @ApiProperty({
    description: 'Regional distribution breakdown',
    type: [RegionalDataDto],
  })
  @Type(() => RegionalDataDto)
  regions: RegionalDataDto[];

  @ApiProperty({
    description: 'Total bookings analyzed',
    example: 2000,
    minimum: 0,
  })
  totalBookings: number;

  @ApiProperty({
    description: 'Analysis timestamp',
    example: '2024-10-15T10:30:00Z',
  })
  analyzedAt: Date;
}

export class RegionalDistributionResponseDto extends BaseResponseDto<RegionalDistributionDataDto> {
  @ApiProperty({
    description: 'Regional distribution analytics data',
    type: RegionalDistributionDataDto,
  })
  declare data: RegionalDistributionDataDto;
}

/**
 * Tours availability analytics response
 */
export class ToursAvailabilityResponseDto extends BaseResponseDto<ToursAvailabilityDto> {
  @ApiProperty({
    description: 'Tours availability analytics data',
    type: ToursAvailabilityDto,
  })
  declare data: ToursAvailabilityDto;
}

/**
 * Yearly statistics analytics response
 */
export class YearlyStatisticsDataDto {
  @ApiProperty({
    description: 'Yearly booking statistics',
    type: [YearlyBookingStatisticsDto],
  })
  @Type(() => YearlyBookingStatisticsDto)
  yearlyStats: YearlyBookingStatisticsDto[];

  @ApiProperty({
    description: 'Analysis period',
    example: '6 years',
  })
  analysisPeriod: string;

  @ApiProperty({
    description: 'Analysis timestamp',
    example: '2024-10-15T10:30:00Z',
  })
  analyzedAt: Date;
}

export class YearlyStatisticsResponseDto extends BaseResponseDto<YearlyStatisticsDataDto> {
  @ApiProperty({
    description: 'Yearly statistics analytics data',
    type: YearlyStatisticsDataDto,
  })
  declare data: YearlyStatisticsDataDto;
}

// ========================================
// TYPE ALIASES FOR CLEAN IMPORTS
// ========================================

/**
 * Type aliases for cleaner service return types
 */
export type DashboardOverviewResponse = BaseResponseDto<DashboardOverviewDto>;
export type BookingOverviewResponse = BaseResponseDto<BookingOverviewDto>;
export type UserAnalyticsResponse = BaseResponseDto<UserAnalyticsDataDto>;
export type BookingAnalyticsResponse = BaseResponseDto<BookingAnalyticsDataDto>;
export type FinancialAnalyticsResponse = BaseResponseDto<FinancialAnalyticsDataDto>;
export type BookingDetailsResponse = BaseResponseDto<BookingDetailsPaginatedDataDto>;
export type TopHostsAnalyticsResponse = BaseResponseDto<TopHostsPaginatedDataDto>;
export type CustomerReviewsAnalyticsResponse = BaseResponseDto<CustomerReviewsPaginatedDataDto>;
export type PlatformDistributionResponse = BaseResponseDto<PlatformDistributionDataDto>;
export type RegionalDistributionResponse = BaseResponseDto<RegionalDistributionDataDto>;
export type ToursAvailabilityResponse = BaseResponseDto<ToursAvailabilityDto>;
export type YearlyStatisticsResponse = BaseResponseDto<YearlyStatisticsDataDto>;

// ========================================
// FACTORY-GENERATED RESPONSE DTOs (Alternative Approach)
// ========================================

/**
 * Factory-generated response DTOs for consistency with other modules
 * These can be used as alternatives to the explicit class definitions above
 */

// Simple response DTOs using factory pattern
export const DashboardOverviewFactoryResponseDto = createResponseDto(DashboardOverviewDto);
export const BookingOverviewFactoryResponseDto = createResponseDto(BookingOverviewDto);
export const ToursAvailabilityFactoryResponseDto = createResponseDto(ToursAvailabilityDto);

// Paginated response DTOs using factory pattern
export const BookingDetailsPaginatedResponseDto = createPaginatedResponseDto(BookingDetailDto);
export const TopHostsAnalyticsPaginatedResponseDto =
  createPaginatedResponseDto(TopHostAnalyticsDto);
export const CustomerReviewsAnalyticsPaginatedResponseDto = createPaginatedResponseDto(
  CustomerReviewAnalyticsDto,
);
