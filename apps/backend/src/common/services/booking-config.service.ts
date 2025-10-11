import { Injectable } from '@nestjs/common';
import { ConfigCacheHelper } from '../../modules/config/config-cache.helper';

/**
 * Booking limit configuration options
 */
export interface BookingConfig {
  maxAdults: number;
  maxChildren: number;
  maxInfants: number;
  maxTotalGuests: number;
  maxAdvanceDays: number;
  minAdvanceHours: number;
  autoCancelUnpaidHours: number;
  defaultCheckinTime: string;
  defaultCheckoutTime: string;
}

/**
 * Service for managing booking limit configurations dynamically
 *
 * This service loads booking settings from the database
 * with caching, allowing runtime changes without code deployment.
 */
@Injectable()
export class BookingConfigService {
  constructor(private readonly configCache: ConfigCacheHelper) {}

  /**
   * Get all booking configuration settings
   */
  async getConfig(): Promise<BookingConfig> {
    const [
      maxAdults,
      maxChildren,
      maxInfants,
      maxTotalGuests,
      maxAdvanceDays,
      minAdvanceHours,
      autoCancelUnpaidHours,
      defaultCheckinTime,
      defaultCheckoutTime,
    ] = await Promise.all([
      this.configCache.getNumber('BOOKING_MAX_ADULTS', 16),
      this.configCache.getNumber('BOOKING_MAX_CHILDREN', 5),
      this.configCache.getNumber('BOOKING_MAX_INFANTS', 5),
      this.configCache.getNumber('BOOKING_MAX_TOTAL_GUESTS', 16),
      this.configCache.getNumber('BOOKING_MAX_ADVANCE_DAYS', 365),
      this.configCache.getNumber('BOOKING_MIN_ADVANCE_HOURS', 2),
      this.configCache.getNumber('BOOKING_AUTO_CANCEL_UNPAID_HOURS', 24),
      this.configCache.getString('BOOKING_DEFAULT_CHECKIN_TIME', '15:00'),
      this.configCache.getString('BOOKING_DEFAULT_CHECKOUT_TIME', '11:00'),
    ]);

    return {
      maxAdults,
      maxChildren,
      maxInfants,
      maxTotalGuests,
      maxAdvanceDays,
      minAdvanceHours,
      autoCancelUnpaidHours,
      defaultCheckinTime,
      defaultCheckoutTime,
    };
  }

  /**
   * Get maximum adults allowed per booking
   */
  async getMaxAdults(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MAX_ADULTS', 16);
  }

  /**
   * Get maximum children allowed per booking
   */
  async getMaxChildren(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MAX_CHILDREN', 5);
  }

  /**
   * Get maximum infants allowed per booking
   */
  async getMaxInfants(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MAX_INFANTS', 5);
  }

  /**
   * Get maximum total guests allowed per booking
   */
  async getMaxTotalGuests(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MAX_TOTAL_GUESTS', 16);
  }

  /**
   * Get maximum days in advance a booking can be made
   */
  async getMaxAdvanceDays(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MAX_ADVANCE_DAYS', 365);
  }

  /**
   * Get minimum hours in advance a booking must be made
   */
  async getMinAdvanceHours(): Promise<number> {
    return this.configCache.getNumber('BOOKING_MIN_ADVANCE_HOURS', 2);
  }

  /**
   * Get hours before unpaid bookings are automatically cancelled
   */
  async getAutoCancelUnpaidHours(): Promise<number> {
    return this.configCache.getNumber('BOOKING_AUTO_CANCEL_UNPAID_HOURS', 24);
  }

  /**
   * Get default check-in time
   */
  async getDefaultCheckinTime(): Promise<string> {
    return this.configCache.getString('BOOKING_DEFAULT_CHECKIN_TIME', '15:00');
  }

  /**
   * Get default check-out time
   */
  async getDefaultCheckoutTime(): Promise<string> {
    return this.configCache.getString('BOOKING_DEFAULT_CHECKOUT_TIME', '11:00');
  }
}
