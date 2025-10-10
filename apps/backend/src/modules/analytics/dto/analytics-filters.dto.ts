import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsSearchField,
  IsDateField,
  IsUuidField,
} from '../../../common/validators/standardized-validators';

/**
 * DTO for analytics filtering with standardized validators
 */
export class AnalyticsFiltersDto {
  @IsSearchField({
    example: 'booking search term',
    description: 'Search term for filtering analytics data',
  })
  search?: string;

  @IsDateField({
    example: '2024-01-01',
    description: 'Start date for analytics period',
  })
  startDate?: string;

  @IsDateField({
    example: '2024-12-31',
    description: 'End date for analytics period',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Analytics time period',
    enum: ['7d', '30d', '90d', '1y'],
    default: '7d',
  })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y'])
  period?: '7d' | '30d' | '90d' | '1y' = '7d';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * DTO for admin-specific analytics filtering
 */
export class AdminAnalyticsFiltersDto extends AnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    example: 'confirmed',
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by specific property ID',
  })
  propertyId?: string;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by specific guest ID',
  })
  guestId?: string;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by specific host ID',
  })
  hostId?: string;

  @ApiPropertyOptional({
    description: 'Minimum booking amount',
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking amount',
    minimum: 0,
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'Sort field for results',
    enum: ['createdAt', 'totalAmount', 'checkIn', 'status'],
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'totalAmount', 'checkIn', 'status'])
  sortBy?: 'createdAt' | 'totalAmount' | 'checkIn' | 'status' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'desc';
}

/**
 * DTO for analytics dashboard filters
 */
export class DashboardFiltersDto {
  @ApiPropertyOptional({
    description: 'Analytics time period for dashboard metrics',
    enum: ['7d', '30d', '90d', '1y'],
    default: '7d',
    example: '7d',
  })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y'])
  period?: '7d' | '30d' | '90d' | '1y' = '7d';

  @ApiPropertyOptional({
    description: 'Include platform distribution data',
    default: true,
    example: true,
  })
  @IsOptional()
  includePlatformData?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include regional analytics data',
    default: true,
    example: true,
  })
  @IsOptional()
  includeRegionalData?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include monthly trends data',
    default: true,
    example: true,
  })
  @IsOptional()
  includeMonthlyTrends?: boolean = true;

  @ApiPropertyOptional({
    description: 'Number of top hosts to include',
    minimum: 1,
    maximum: 20,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  topHostsLimit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of recent invoices to include',
    minimum: 1,
    maximum: 20,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  recentInvoicesLimit?: number = 10;
}

/**
 * DTO for metrics period validation
 */
export class MetricsPeriodDto {
  @ApiPropertyOptional({
    description: 'Time period for metrics calculation',
    enum: ['7d', '30d', '90d', '1y'],
    default: '7d',
    example: '7d',
  })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y'])
  period?: '7d' | '30d' | '90d' | '1y' = '7d';
}
