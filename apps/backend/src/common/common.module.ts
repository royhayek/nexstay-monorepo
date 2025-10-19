import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IpThrottleConfigService } from './services/ip-throttle-config.service';
import { DeviceTrustConfigService } from './services/device-trust-config.service';
import { BookingConfigService } from './services/booking-config.service';
import { PaginationConfigService } from './services/pagination-config.service';
import { IpThrottlerGuard } from './guards/ip-throttler.guard';
import { PaginationUtils } from './utils/pagination.utils';
import { IsCatalogValueConstraint } from './validators/catalog.validators';
import { CatalogItem, CatalogItemSchema } from '../database/schemas/catalog-item.schema';

/**
 * Common module for shared services, guards, utilities, and custom validators
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogItem.name, schema: CatalogItemSchema },
    ]),
  ],
  providers: [
    IpThrottleConfigService,
    DeviceTrustConfigService,
    BookingConfigService,
    PaginationConfigService,
    PaginationUtils,
    IpThrottlerGuard,
    IsCatalogValueConstraint,
  ],
  exports: [
    IpThrottleConfigService,
    DeviceTrustConfigService,
    BookingConfigService,
    PaginationConfigService,
    PaginationUtils,
    IpThrottlerGuard,
    IsCatalogValueConstraint,
  ],
})
export class CommonModule {}
