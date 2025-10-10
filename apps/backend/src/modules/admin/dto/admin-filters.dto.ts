import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import {
  IsSearchField,
  IsDateField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';
import { FilterValueEnum } from '../../../common/enums/filter.enums';

export enum AdminActivityTypeEnum {
  ALL = 'all',
  USER_MANAGEMENT = 'user_management',
  PROPERTY_MANAGEMENT = 'property_management',
  BOOKING_MANAGEMENT = 'booking_management',
  PAYMENT_PROCESSING = 'payment_processing',
  SYSTEM_ACTIONS = 'system_actions',
  SECURITY_EVENTS = 'security_events',
}

export enum AdminSortFieldEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TYPE = 'type',
  USER_ID = 'userId',
  SEVERITY = 'severity',
}

export enum ActivitySeverityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class AdminActivityFiltersDto {
  @IsSearchField({
    description: 'Search activities by description or user',
    example: 'user login attempt',
  })
  search?: string;

  @IsEnumField(AdminActivityTypeEnum, {
    description: 'Filter by activity type',
    example: AdminActivityTypeEnum.USER_MANAGEMENT,
    required: false,
  })
  type?: AdminActivityTypeEnum;

  @IsEnumField(ActivitySeverityEnum, {
    description: 'Filter by activity severity',
    example: ActivitySeverityEnum.HIGH,
    required: false,
  })
  severity?: ActivitySeverityEnum;

  @IsDateField({
    description: 'Filter activities from this date',
    example: '2024-01-01',
  })
  startDate?: string;

  @IsDateField({
    description: 'Filter activities until this date',
    example: '2024-12-31',
  })
  endDate?: string;

  // Pagination with raw validators for specific business logic
  @ApiPropertyOptional({
    description: 'Page number',
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

  // Sorting with enum validation
  @IsEnumField(AdminSortFieldEnum, {
    description: 'Sort field',
    example: AdminSortFieldEnum.CREATED_AT,
    required: false,
  })
  sortField?: AdminSortFieldEnum = AdminSortFieldEnum.CREATED_AT;

  @IsEnumField(SortDirectionEnum, {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
    required: false,
  })
  sortDirection?: SortDirectionEnum = SortDirectionEnum.DESC;
}

export class AdminDashboardFiltersDto {
  @IsDateField({
    description: 'Dashboard data from this date',
    example: '2024-01-01',
  })
  startDate?: string;

  @IsDateField({
    description: 'Dashboard data until this date',
    example: '2024-12-31',
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of days to include in dashboard data',
    minimum: 1,
    maximum: 365,
    default: 30,
    example: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @IsEnumField(FilterValueEnum, {
    description: 'Include system performance metrics',
    example: FilterValueEnum.TRUE,
    required: false,
  })
  includePerformance?: FilterValueEnum;

  @IsEnumField(FilterValueEnum, {
    description: 'Include detailed user metrics',
    example: FilterValueEnum.TRUE,
    required: false,
  })
  includeUserMetrics?: FilterValueEnum;
}

export class AdminSystemHealthFiltersDto {
  @IsEnumField(FilterValueEnum, {
    description: 'Include memory usage details',
    example: FilterValueEnum.TRUE,
    required: false,
  })
  includeMemoryDetails?: FilterValueEnum;

  @IsEnumField(FilterValueEnum, {
    description: 'Include database connection status',
    example: FilterValueEnum.TRUE,
    required: false,
  })
  includeDatabaseStatus?: FilterValueEnum;

  @IsEnumField(FilterValueEnum, {
    description: 'Include external service status',
    example: FilterValueEnum.TRUE,
    required: false,
  })
  includeExternalServices?: FilterValueEnum;
}

export class BulkActionDto {
  @IsSearchField({
    description: 'Bulk action type',
    example: 'deactivate_users',
    required: true,
  })
  action: string;

  @ApiProperty({
    description: 'Array of target IDs for bulk action',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsOptional()
  targetIds?: string[];

  @IsSearchField({
    description: 'Optional reason for bulk action',
    example: 'Inactive accounts cleanup',
  })
  reason?: string;
}
