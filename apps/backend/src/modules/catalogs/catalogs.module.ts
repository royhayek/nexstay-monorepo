import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogsController } from './controllers/catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { CatalogVersion, CatalogVersionSchema } from '../../database/schemas/catalog-version.schema';
import { BedType, BedTypeSchema } from '../../database/schemas/bed-type.schema';
import { PropertyType, PropertyTypeSchema } from '../../database/schemas/property-type.schema';
import { RoomType, RoomTypeSchema } from '../../database/schemas/room-type.schema';
import {
  CancellationPolicy,
  CancellationPolicySchema,
} from '../../database/schemas/cancellation-policy.schema';
import { Currency, CurrencySchema } from '../../database/schemas/currency.schema';
import { NotificationType, NotificationTypeSchema } from '../../database/schemas/notification-type.schema';
import { PaymentProvider, PaymentProviderSchema } from '../../database/schemas/payment-provider.schema';
import { EnumDisplaysModule } from '../enum-displays/enum-displays.module';
import { AmenityCategoriesModule } from '../amenity-categories/amenity-categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogVersion.name, schema: CatalogVersionSchema },
      { name: BedType.name, schema: BedTypeSchema },
      { name: PropertyType.name, schema: PropertyTypeSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: CancellationPolicy.name, schema: CancellationPolicySchema },
      { name: Currency.name, schema: CurrencySchema },
      { name: NotificationType.name, schema: NotificationTypeSchema },
      { name: PaymentProvider.name, schema: PaymentProviderSchema },
    ]),
    EnumDisplaysModule,
    AmenityCategoriesModule,
  ],
  controllers: [CatalogsController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
