import { SortOrder } from 'mongoose';
import { SortDirectionEnum } from '../enums/sort.enums';

/**
 * Paginated result interface
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  limit: number;
  maxLimit?: number;
  minLimit?: number;
}

/**
 * Query options for paginated operations
 */
export interface QueryOptions {
  page: number;
  limit: number;
  sort?: Record<string, SortOrder>;
  populate?: string | string[];
  select?: string;
  lean?: boolean;
}

/**
 * Aggregation pipeline options
 */
export interface AggregationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

/**
 * Aggregation result structure
 */
export interface AggregationResult<T> {
  data: T[];
  totalCount: Array<{ count: number }>;
}

/**
 * Generic query filter interface
 */
export interface QueryFilter {
  [key: string]: unknown;
}

/**
 * Date range filter interface
 */
export interface DateRangeFilter {
  $gte?: Date;
  $lte?: Date;
}

/**
 * Range filter interface for numbers
 */
export interface NumberRangeFilter {
  $gte?: number;
  $lte?: number;
}

/**
 * Search filter options
 */
export interface SearchFilterOptions {
  fields: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  direction: SortDirectionEnum;
  allowedFields?: string[];
  defaultField?: string;
}
