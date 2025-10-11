import { Injectable } from '@nestjs/common';
import { ConfigCacheHelper } from '../../modules/config/config-cache.helper';
import { IpThrottleOptions } from '../decorators/ip-throttle.decorator';

/**
 * Service for managing IP throttle configurations dynamically
 *
 * This service loads rate limit configurations from the database
 * with caching, allowing runtime changes without code deployment.
 */
@Injectable()
export class IpThrottleConfigService {
  constructor(private readonly configCache: ConfigCacheHelper) {}

  /**
   * Get throttle configuration for login endpoints
   */
  async getAuthLoginConfig(): Promise<IpThrottleOptions> {
    const [limit, ttlSeconds] = await Promise.all([
      this.configCache.getNumber('IP_THROTTLE_AUTH_LOGIN_LIMIT', 5),
      this.configCache.getNumber('IP_THROTTLE_AUTH_LOGIN_WINDOW_SECONDS', 900),
    ]);

    return {
      limit,
      ttlSeconds,
      description: `${limit} attempts per ${Math.floor(ttlSeconds / 60)} minutes`,
    };
  }

  /**
   * Get throttle configuration for OTP request endpoints
   */
  async getOtpRequestConfig(): Promise<IpThrottleOptions> {
    const [limit, ttlSeconds] = await Promise.all([
      this.configCache.getNumber('IP_THROTTLE_OTP_REQUEST_LIMIT', 3),
      this.configCache.getNumber('IP_THROTTLE_OTP_REQUEST_WINDOW_SECONDS', 300),
    ]);

    return {
      limit,
      ttlSeconds,
      description: `${limit} requests per ${Math.floor(ttlSeconds / 60)} minutes`,
    };
  }

  /**
   * Get throttle configuration for password reset endpoints
   */
  async getPasswordResetConfig(): Promise<IpThrottleOptions> {
    const [limit, ttlSeconds] = await Promise.all([
      this.configCache.getNumber('IP_THROTTLE_PASSWORD_RESET_LIMIT', 3),
      this.configCache.getNumber('IP_THROTTLE_PASSWORD_RESET_WINDOW_SECONDS', 900),
    ]);

    return {
      limit,
      ttlSeconds,
      description: `${limit} attempts per ${Math.floor(ttlSeconds / 60)} minutes`,
    };
  }

  /**
   * Get throttle configuration for signup endpoints
   */
  async getSignupConfig(): Promise<IpThrottleOptions> {
    const [limit, ttlSeconds] = await Promise.all([
      this.configCache.getNumber('IP_THROTTLE_SIGNUP_LIMIT', 3),
      this.configCache.getNumber('IP_THROTTLE_SIGNUP_WINDOW_SECONDS', 3600),
    ]);

    return {
      limit,
      ttlSeconds,
      description: `${limit} attempts per ${Math.floor(ttlSeconds / 3600)} hour(s)`,
    };
  }

  /**
   * Get throttle configuration for token refresh endpoints
   */
  async getTokenRefreshConfig(): Promise<IpThrottleOptions> {
    const [limit, ttlSeconds] = await Promise.all([
      this.configCache.getNumber('IP_THROTTLE_TOKEN_REFRESH_LIMIT', 10),
      this.configCache.getNumber('IP_THROTTLE_TOKEN_REFRESH_WINDOW_SECONDS', 60),
    ]);

    return {
      limit,
      ttlSeconds,
      description: `${limit} refreshes per ${Math.floor(ttlSeconds / 60)} minute(s)`,
    };
  }

  /**
   * Get all throttle configurations as a map
   */
  async getAllConfigs(): Promise<Record<string, IpThrottleOptions>> {
    const [authLogin, otpRequest, passwordReset, signup, tokenRefresh] = await Promise.all([
      this.getAuthLoginConfig(),
      this.getOtpRequestConfig(),
      this.getPasswordResetConfig(),
      this.getSignupConfig(),
      this.getTokenRefreshConfig(),
    ]);

    return {
      AUTH_LOGIN: authLogin,
      OTP_REQUEST: otpRequest,
      PASSWORD_RESET: passwordReset,
      SIGNUP: signup,
      TOKEN_REFRESH: tokenRefresh,
    };
  }
}
