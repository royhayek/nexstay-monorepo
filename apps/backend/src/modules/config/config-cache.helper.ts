import { Injectable, Logger } from '@nestjs/common';
import { DynamicConfigService } from './config.service';

/**
 * Cached configuration item
 */
interface CachedConfig<T> {
  value: T;
  fetchedAt: number;
  ttlMs: number;
}

/**
 * Configuration cache helper with automatic expiration and refresh
 *
 * This helper provides a caching layer over DynamicConfigService to reduce
 * database queries for frequently accessed configuration values.
 *
 * Features:
 * - Configurable TTL per config type (security: 2min, general: 5min)
 * - Automatic cache invalidation
 * - Type-safe getters for common config types
 * - Fallback values for all configs
 *
 * Usage:
 * ```typescript
 * constructor(private readonly configCache: ConfigCacheHelper) {}
 *
 * async example() {
 *   // Get with caching
 *   const limit = await this.configCache.getNumber('IP_THROTTLE_AUTH_LOGIN_LIMIT', 5);
 *
 *   // Force refresh (bypass cache)
 *   const fresh = await this.configCache.getNumber('IP_THROTTLE_AUTH_LOGIN_LIMIT', 5, true);
 * }
 * ```
 */
@Injectable()
export class ConfigCacheHelper {
  private readonly logger = new Logger(ConfigCacheHelper.name);
  private readonly cache = new Map<string, CachedConfig<unknown>>();

  // TTL durations in milliseconds
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SECURITY_TTL_MS = 2 * 60 * 1000; // 2 minutes for security-critical configs
  private readonly GENERAL_TTL_MS = 10 * 60 * 1000; // 10 minutes for non-critical configs

  constructor(private readonly configService: DynamicConfigService) {}

  /**
   * Get a string configuration value with caching
   */
  async getString(key: string, fallback: string, forceRefresh = false): Promise<string> {
    return this.get(key, fallback, this.getTTL(key), forceRefresh, (value) => String(value));
  }

  /**
   * Get a number configuration value with caching
   */
  async getNumber(key: string, fallback: number, forceRefresh = false): Promise<number> {
    return this.get(key, fallback, this.getTTL(key), forceRefresh, (value) => {
      const parsed = Number(value);
      if (isNaN(parsed)) {
        this.logger.warn(`Config ${key} has invalid number value: ${value}, using fallback: ${fallback}`);
        return fallback;
      }
      return parsed;
    });
  }

  /**
   * Get a boolean configuration value with caching
   */
  async getBoolean(key: string, fallback: boolean, forceRefresh = false): Promise<boolean> {
    return this.get(key, fallback, this.getTTL(key), forceRefresh, (value) => {
      const str = String(value).toLowerCase();
      return str === 'true' || str === '1' || str === 'yes';
    });
  }

  /**
   * Get a comma-separated list as array with caching
   */
  async getArray(key: string, fallback: string[], forceRefresh = false): Promise<string[]> {
    return this.get(key, fallback, this.getTTL(key), forceRefresh, (value) => {
      const str = String(value);
      return str
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    });
  }

  /**
   * Generic get method with caching and type conversion
   */
  private async get<T>(
    key: string,
    fallback: T,
    ttlMs: number,
    forceRefresh: boolean,
    transform: (value: string) => T,
  ): Promise<T> {
    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cached = this.cache.get(key) as CachedConfig<T> | undefined;
      if (cached && this.isValid(cached)) {
        return cached.value;
      }
    }

    // Fetch from database
    try {
      const value = await this.configService.get(key);

      if (value === null || value === undefined) {
        // Config not found, use fallback and cache it
        this.logger.warn(`Config ${key} not found in database, using fallback: ${fallback}`);
        this.setCached(key, fallback, ttlMs);
        return fallback;
      }

      // Transform and cache the value
      const transformed = transform(value);
      this.setCached(key, transformed, ttlMs);
      return transformed;
    } catch (error) {
      this.logger.error(
        `Failed to fetch config ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // On error, use fallback
      return fallback;
    }
  }

  /**
   * Invalidate a specific config from cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Invalidated cache for config: ${key}`);
  }

  /**
   * Invalidate all configs matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keys = Array.from(this.cache.keys());
    const matchedKeys = keys.filter((key) => pattern.test(key));

    matchedKeys.forEach((key) => this.cache.delete(key));
    this.logger.debug(`Invalidated ${matchedKeys.length} configs matching pattern: ${pattern}`);
  }

  /**
   * Clear all cached configs
   */
  clearAll(): void {
    this.cache.clear();
    this.logger.debug('Cleared all config cache');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    expired: number;
  } {
    const keys = Array.from(this.cache.keys());
    const expired = keys.filter((key) => {
      const cached = this.cache.get(key);
      return cached && !this.isValid(cached);
    }).length;

    return {
      size: this.cache.size,
      keys,
      expired,
    };
  }

  /**
   * Determine TTL based on config key
   */
  private getTTL(key: string): number {
    // Security-critical configs have shorter TTL
    if (
      key.includes('IP_THROTTLE') ||
      key.includes('AUDIT_LOG') ||
      key.includes('PASSWORD') ||
      key.includes('OTP') ||
      key.includes('SECURITY') ||
      key.includes('VERIFICATION')
    ) {
      return this.SECURITY_TTL_MS;
    }

    // UI and general configs can have longer TTL
    if (
      key.includes('UI_') ||
      key.includes('DEFAULT_') ||
      key.includes('LANGUAGE') ||
      key.includes('CURRENCY_DISPLAY')
    ) {
      return this.GENERAL_TTL_MS;
    }

    // Default TTL for everything else
    return this.DEFAULT_TTL_MS;
  }

  /**
   * Check if cached value is still valid
   */
  private isValid(cached: CachedConfig<unknown>): boolean {
    const now = Date.now();
    return now - cached.fetchedAt < cached.ttlMs;
  }

  /**
   * Set a value in cache
   */
  private setCached<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      fetchedAt: Date.now(),
      ttlMs,
    });
  }
}
