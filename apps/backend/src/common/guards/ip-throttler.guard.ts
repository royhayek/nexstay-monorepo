import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerOptions } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IpThrottleConfigService } from '../services/ip-throttle-config.service';
import { IP_THROTTLE_KEY, IpThrottleOptions } from '../decorators/ip-throttle.decorator';

/**
 * IP-based throttler guard for authentication endpoints
 *
 * This guard extends the standard ThrottlerGuard to implement IP-based rate limiting
 * for sensitive authentication operations like login, password reset, and OTP requests.
 *
 * Features:
 * - Tracks requests per IP address instead of per user
 * - Supports custom rate limits per endpoint via @IpThrottle() decorator
 * - Loads rate limits dynamically from database configuration
 * - Properly extracts client IP from proxy headers (X-Forwarded-For, X-Real-IP)
 * - Prevents brute force attacks on authentication endpoints
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    protected readonly reflector: Reflector,
    private readonly ipThrottleConfigService: IpThrottleConfigService,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Override to inject dynamic configuration based on decorator metadata
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the IP throttle metadata from the decorator
    const ipThrottleOptions = this.reflector.getAllAndOverride<IpThrottleOptions>(IP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If IP throttle is configured, load dynamic config and override throttle settings
    if (ipThrottleOptions) {
      const dynamicConfig = await this.loadDynamicConfig(ipThrottleOptions);

      // Override the throttler options with dynamic config
      if (dynamicConfig) {
        // Store original options
        const originalOptions = (this as any).options;

        // Temporarily override with dynamic config
        (this as any).options = [{
          limit: dynamicConfig.limit,
          ttl: dynamicConfig.ttlSeconds * 1000, // Convert to milliseconds
        }];

        try {
          // Call parent with overridden options
          return await super.canActivate(context);
        } finally {
          // Restore original options
          (this as any).options = originalOptions;
        }
      }
    }

    // Fall back to standard throttling behavior
    return super.canActivate(context);
  }

  /**
   * Load dynamic configuration based on the IP throttle options
   * Maps static preset descriptions to dynamic config methods
   */
  private async loadDynamicConfig(options: IpThrottleOptions): Promise<IpThrottleOptions | null> {
    try {
      // Map based on description to determine which config to load
      const description = options.description || '';

      if (description.includes('login') || description.includes('attempts per 15 minutes')) {
        return await this.ipThrottleConfigService.getAuthLoginConfig();
      } else if (description.includes('OTP') || description.includes('requests per 5 minutes')) {
        return await this.ipThrottleConfigService.getOtpRequestConfig();
      } else if (description.includes('password reset')) {
        return await this.ipThrottleConfigService.getPasswordResetConfig();
      } else if (description.includes('signup') || description.includes('hour')) {
        return await this.ipThrottleConfigService.getSignupConfig();
      } else if (description.includes('refresh') || description.includes('per minute')) {
        return await this.ipThrottleConfigService.getTokenRefreshConfig();
      }

      // Return the static config as fallback
      return options;
    } catch (error) {
      // If dynamic config fails, return static config as fallback
      console.error('Failed to load dynamic IP throttle config, using static values:', error);
      return options;
    }
  }

  /**
   * Extract client IP address from request
   * Properly handles proxied requests by checking common proxy headers
   */
  protected async getTracker(req: Request): Promise<string> {
    // Check common proxy headers (in order of preference)
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
      // Use the first IP which is the original client
      return forwarded.split(',')[0].trim();
    }

    const realIp = req.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback to connection remote address
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Override to provide better error messages
   */
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException('Too many requests from this IP address. Please try again later.');
  }
}
