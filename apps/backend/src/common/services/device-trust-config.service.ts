import { Injectable } from '@nestjs/common';
import { ConfigCacheHelper } from '../../modules/config/config-cache.helper';

/**
 * Device trust configuration options
 */
export interface DeviceTrustConfig {
  maxDevicesPerUser: number;
  expiryDays: number;
  verificationRequired: boolean;
  cleanupEnabled: boolean;
}

/**
 * Service for managing device trust configurations dynamically
 *
 * This service loads device trust settings from the database
 * with caching, allowing runtime changes without code deployment.
 */
@Injectable()
export class DeviceTrustConfigService {
  constructor(private readonly configCache: ConfigCacheHelper) {}

  /**
   * Get all device trust configuration settings
   */
  async getConfig(): Promise<DeviceTrustConfig> {
    const [maxDevicesPerUser, expiryDays, verificationRequired, cleanupEnabled] = await Promise.all([
      this.configCache.getNumber('TRUSTED_DEVICE_MAX_PER_USER', 10),
      this.configCache.getNumber('TRUSTED_DEVICE_EXPIRY_DAYS', 90),
      this.configCache.getBoolean('TRUSTED_DEVICE_VERIFICATION_REQUIRED', true),
      this.configCache.getBoolean('TRUSTED_DEVICE_CLEANUP_ENABLED', true),
    ]);

    return {
      maxDevicesPerUser,
      expiryDays,
      verificationRequired,
      cleanupEnabled,
    };
  }

  /**
   * Get maximum devices allowed per user
   */
  async getMaxDevicesPerUser(): Promise<number> {
    return this.configCache.getNumber('TRUSTED_DEVICE_MAX_PER_USER', 10);
  }

  /**
   * Get device expiry in days
   */
  async getExpiryDays(): Promise<number> {
    return this.configCache.getNumber('TRUSTED_DEVICE_EXPIRY_DAYS', 90);
  }

  /**
   * Check if device verification is required
   */
  async isVerificationRequired(): Promise<boolean> {
    return this.configCache.getBoolean('TRUSTED_DEVICE_VERIFICATION_REQUIRED', true);
  }

  /**
   * Check if device cleanup is enabled
   */
  async isCleanupEnabled(): Promise<boolean> {
    return this.configCache.getBoolean('TRUSTED_DEVICE_CLEANUP_ENABLED', true);
  }
}
