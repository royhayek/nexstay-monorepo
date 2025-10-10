import { Types, SortOrder } from 'mongoose';
import {
  QueryFilter,
  DateRangeFilter,
  NumberRangeFilter,
  SearchFilterOptions,
  SortConfig,
  PaginationConfig,
} from '../interfaces/database.interfaces';
import { SortDirectionEnum } from '../enums/sort.enums';
import { DateUtils } from './date.utils';

/**
 * Query Builder Utility
 * Provides reusable functions for building MongoDB queries consistently across the application
 */

/**
 * Query Builder Class
 * Provides chainable methods for building complex MongoDB queries
 */
export class QueryBuilder {
  private query: QueryFilter = {};

  /**
   * Create a new QueryBuilder instance
   */
  static create(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Add ObjectId filter to query
   */
  addObjectIdFilter(field: string, value: string | undefined): QueryBuilder {
    if (value && Types.ObjectId.isValid(value)) {
      this.query[field] = new Types.ObjectId(value);
    }
    return this;
  }

  /**
   * Add multiple ObjectId filters
   */
  addObjectIdFilters(filters: Record<string, string | undefined>): QueryBuilder {
    Object.entries(filters).forEach(([field, value]) => {
      this.addObjectIdFilter(field, value);
    });
    return this;
  }

  /**
   * Add date range filter to query
   */
  addDateRangeFilter(field: string, fromDate?: string, toDate?: string): QueryBuilder {
    if (fromDate || toDate) {
      const dateFilter: DateRangeFilter = {};

      if (fromDate) {
        dateFilter.$gte = DateUtils.safeParse(fromDate);
      }

      if (toDate) {
        dateFilter.$lte = DateUtils.safeParse(toDate);
      }

      this.query[field] = dateFilter;
    }
    return this;
  }

  /**
   * Add number range filter to query
   */
  addNumberRangeFilter(field: string, minValue?: number, maxValue?: number): QueryBuilder {
    if (minValue !== undefined || maxValue !== undefined) {
      const rangeFilter: NumberRangeFilter = {};

      if (minValue !== undefined) {
        rangeFilter.$gte = minValue;
      }

      if (maxValue !== undefined) {
        rangeFilter.$lte = maxValue;
      }

      this.query[field] = rangeFilter;
    }
    return this;
  }

  /**
   * Add boolean filter to query
   */
  addBooleanFilter(field: string, value: boolean | undefined): QueryBuilder {
    if (value !== undefined) {
      this.query[field] = value;
    }
    return this;
  }

  /**
   * Add string equality filter to query
   */
  addStringFilter(field: string, value: string | undefined): QueryBuilder {
    if (value && value.trim()) {
      this.query[field] = value.trim();
    }
    return this;
  }

  /**
   * Add enum filter to query
   */
  addEnumFilter(field: string, value: string | undefined, allowedValues?: string[]): QueryBuilder {
    if (value && value.trim()) {
      const trimmedValue = value.trim();

      // If allowed values provided, validate
      if (allowedValues && !allowedValues.includes(trimmedValue)) {
        return this;
      }

      this.query[field] = trimmedValue;
    }
    return this;
  }

  /**
   * Add array contains filter to query
   */
  addArrayContainsFilter(field: string, value: string | undefined): QueryBuilder {
    if (value && value.trim()) {
      this.query[field] = { $in: [value.trim()] };
    }
    return this;
  }

  /**
   * Add search filter (regex on multiple fields)
   */
  addSearchFilter(searchTerm: string | undefined, options: SearchFilterOptions): QueryBuilder {
    if (searchTerm && searchTerm.trim()) {
      const regexOptions = options.caseSensitive ? '' : 'i';
      const regexPattern = options.exactMatch ? `^${searchTerm.trim()}$` : searchTerm.trim();

      this.query.$or = options.fields.map((field) => ({
        [field]: { $regex: regexPattern, $options: regexOptions },
      }));
    }
    return this;
  }

  /**
   * Add custom filter condition
   */
  addCustomFilter(
    field: string,
    condition: any /* MongoDB condition - needs flexible typing */,
  ): QueryBuilder {
    if (condition !== undefined && condition !== null) {
      this.query[field] = condition;
    }
    return this;
  }

  /**
   * Get the built query
   */
  build(): QueryFilter {
    return { ...this.query };
  }

  /**
   * Reset the query builder
   */
  reset(): QueryBuilder {
    this.query = {};
    return this;
  }
}

/**
 * Utility Functions for Common Query Operations
 */

/**
 * Build date range filter
 */
export function buildDateRangeFilter(
  fromDate?: string,
  toDate?: string,
): DateRangeFilter | undefined {
  if (!fromDate && !toDate) {
    return undefined;
  }

  const filter: DateRangeFilter = {};

  if (fromDate) {
    filter.$gte = DateUtils.safeParse(fromDate);
  }

  if (toDate) {
    filter.$lte = DateUtils.safeParse(toDate);
  }

  return filter;
}

/**
 * Build ObjectId filter with validation
 */
export function buildObjectIdFilter(value: string | undefined): Types.ObjectId | undefined {
  if (value && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  return undefined;
}

/**
 * Build text search filter
 */
export function buildTextSearchFilter(
  searchTerm: string | undefined,
  fields: string[],
  caseSensitive = false,
): any[] /* MongoDB query objects */ | undefined {
  if (!searchTerm || !searchTerm.trim()) {
    return undefined;
  }

  const regexOptions = caseSensitive ? '' : 'i';

  return fields.map((field) => ({
    [field]: { $regex: searchTerm.trim(), $options: regexOptions },
  }));
}

/**
 * Build sort object with validation
 */
export function buildSortQuery(
  sortBy: string | undefined,
  sortDirection: SortDirectionEnum | string | undefined = SortDirectionEnum.DESC,
  allowedFields: string[] = [],
  defaultField = 'createdAt',
): Record<string, SortOrder> {
  const validSortBy = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultField;

  const directionStr = String(sortDirection).toLowerCase();
  const validDirection: SortOrder = directionStr === 'asc' ? 1 : -1;

  return { [validSortBy]: validDirection };
}

/**
 * Calculate pagination skip value
 */
export function calculateSkip(page: number, limit: number): number {
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);
  return (validPage - 1) * validLimit;
}

/**
 * Validate and normalize pagination parameters
 */
export function validatePagination(config: PaginationConfig): {
  page: number;
  limit: number;
  skip: number;
} {
  const { page, limit, maxLimit = 100, minLimit = 1 } = config;

  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(minLimit, limit), maxLimit);
  const skip = calculateSkip(validPage, validLimit);

  return { page: validPage, limit: validLimit, skip };
}

/**
 * Build complete paginated query
 */
export function buildPaginatedQuery(
  baseQuery: QueryFilter,
  sortConfig: SortConfig,
  paginationConfig: PaginationConfig,
): {
  filter: QueryFilter;
  sort: Record<string, SortOrder>;
  pagination: { page: number; limit: number; skip: number };
} {
  const sort = buildSortQuery(
    sortConfig.field,
    sortConfig.direction,
    sortConfig.allowedFields,
    sortConfig.defaultField,
  );

  const pagination = validatePagination(paginationConfig);

  return {
    filter: baseQuery,
    sort,
    pagination,
  };
}
