import { Injectable } from '@nestjs/common';
import { PaginationConfigService } from '../services/pagination-config.service';

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Interface for normalized pagination result
 */
export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Utility class for pagination operations with dynamic configuration
 *
 * This utility provides methods to normalize and validate pagination parameters
 * using dynamic configuration from the database, allowing runtime changes
 * without code deployment.
 */
@Injectable()
export class PaginationUtils {
  constructor(private readonly paginationConfigService: PaginationConfigService) {}

  /**
   * Normalize pagination parameters using dynamic configuration
   *
   * @param params - Raw pagination parameters from request
   * @returns Normalized pagination with page, limit, and skip values
   */
  async normalizePagination(params?: PaginationParams): Promise<NormalizedPagination> {
    const config = await this.paginationConfigService.getConfig();

    // Normalize limit
    const limit = await this.paginationConfigService.normalizeLimit(params?.limit);

    // Normalize page (default to 1, minimum 1)
    const page = Math.max(1, params?.page || 1);

    // Calculate skip for database queries
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
    };
  }

  /**
   * Create pagination metadata for API responses
   *
   * @param total - Total number of items
   * @param page - Current page number
   * @param limit - Items per page
   * @returns Pagination metadata object
   */
  createMetadata(
    total: number,
    page: number,
    limit: number,
  ): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }
}
