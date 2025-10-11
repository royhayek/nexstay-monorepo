import { Injectable } from '@nestjs/common';
import { ConfigCacheHelper } from '../../modules/config/config-cache.helper';

/**
 * Pagination configuration options
 */
export interface PaginationConfig {
  defaultPageLimit: number;
  maxPageLimit: number;
}

/**
 * Service for managing pagination configurations dynamically
 *
 * This service loads pagination settings from the database
 * with caching, allowing runtime changes without code deployment.
 */
@Injectable()
export class PaginationConfigService {
  constructor(private readonly configCache: ConfigCacheHelper) {}

  /**
   * Get all pagination configuration settings
   */
  async getConfig(): Promise<PaginationConfig> {
    const [defaultPageLimit, maxPageLimit] = await Promise.all([
      this.configCache.getNumber('API_DEFAULT_PAGE_LIMIT', 20),
      this.configCache.getNumber('API_MAX_PAGE_LIMIT', 100),
    ]);

    return {
      defaultPageLimit,
      maxPageLimit,
    };
  }

  /**
   * Get default page limit for API responses
   */
  async getDefaultPageLimit(): Promise<number> {
    return this.configCache.getNumber('API_DEFAULT_PAGE_LIMIT', 20);
  }

  /**
   * Get maximum page limit allowed in API requests
   */
  async getMaxPageLimit(): Promise<number> {
    return this.configCache.getNumber('API_MAX_PAGE_LIMIT', 100);
  }

  /**
   * Validate and normalize a requested page limit
   * @param requestedLimit The limit requested by the client
   * @returns A valid limit within configured bounds
   */
  async normalizeLimit(requestedLimit?: number): Promise<number> {
    const config = await this.getConfig();

    if (!requestedLimit || requestedLimit < 1) {
      return config.defaultPageLimit;
    }

    return Math.min(requestedLimit, config.maxPageLimit);
  }
}
