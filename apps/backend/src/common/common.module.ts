import { Module } from '@nestjs/common';
import { IpThrottleConfigService } from './services/ip-throttle-config.service';
import { DeviceTrustConfigService } from './services/device-trust-config.service';
import { BookingConfigService } from './services/booking-config.service';
import { PaginationConfigService } from './services/pagination-config.service';
import { IpThrottlerGuard } from './guards/ip-throttler.guard';
import { PaginationUtils } from './utils/pagination.utils';

/**
 * Common module for shared services, guards, and utilities
 */
@Module({
  providers: [
    IpThrottleConfigService,
    DeviceTrustConfigService,
    BookingConfigService,
    PaginationConfigService,
    PaginationUtils,
    IpThrottlerGuard,
  ],
  exports: [
    IpThrottleConfigService,
    DeviceTrustConfigService,
    BookingConfigService,
    PaginationConfigService,
    PaginationUtils,
    IpThrottlerGuard,
  ],
})
export class CommonModule {}
