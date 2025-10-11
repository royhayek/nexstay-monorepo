import { SetMetadata, applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export const IP_THROTTLE_KEY = 'ipThrottle';

export interface IpThrottleOptions {
  /**
   * Number of requests allowed per window
   */
  limit: number;

  /**
   * Time window in seconds
   */
  ttlSeconds: number;

  /**
   * Optional description for documentation
   */
  description?: string;
}

/**
 * IP-based rate limiting decorator for authentication endpoints
 *
 * This decorator applies stricter rate limits based on client IP address
 * to prevent brute force attacks and abuse of sensitive endpoints.
 *
 * Usage:
 * @IpThrottle({ limit: 5, ttlSeconds: 900 }) // 5 requests per 15 minutes
 * async login(@Body() dto: LoginDto) { ... }
 *
 * Common configurations:
 * - Login/Password: 5 attempts per 15 minutes
 * - OTP requests: 3 attempts per 5 minutes
 * - Password reset: 3 attempts per 15 minutes
 * - Account creation: 3 attempts per hour
 */
export const IpThrottle = (options: IpThrottleOptions) => {
  return applyDecorators(
    SetMetadata(IP_THROTTLE_KEY, options),
    Throttle({
      default: {
        limit: options.limit,
        ttl: options.ttlSeconds * 1000, // Convert to milliseconds
      },
    }),
  );
};

/**
 * Predefined IP throttle configurations for common auth operations
 */
export const IpThrottlePresets = {
  /**
   * For login and password verification endpoints
   * Allows 5 attempts per 15 minutes per IP
   */
  AUTH_LOGIN: { limit: 5, ttlSeconds: 900, description: '5 attempts per 15 minutes' },

  /**
   * For OTP/code request endpoints
   * Allows 3 requests per 5 minutes per IP
   */
  OTP_REQUEST: { limit: 3, ttlSeconds: 300, description: '3 requests per 5 minutes' },

  /**
   * For password reset initiation
   * Allows 3 attempts per 15 minutes per IP
   */
  PASSWORD_RESET: { limit: 3, ttlSeconds: 900, description: '3 attempts per 15 minutes' },

  /**
   * For account creation
   * Allows 3 attempts per hour per IP
   */
  SIGNUP: { limit: 3, ttlSeconds: 3600, description: '3 attempts per hour' },

  /**
   * For token refresh endpoint
   * Allows 10 refreshes per minute per IP
   */
  TOKEN_REFRESH: { limit: 10, ttlSeconds: 60, description: '10 refreshes per minute' },
};
