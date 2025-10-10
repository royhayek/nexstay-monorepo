import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { LoggingUtil } from '../../common/utils/logging.util';

import { seedDynamicConfig } from './dynamic-config.seeder';
import { seedAdminUser } from './admin-user.seeder';
import { seedAccountActionReasons } from './account-action-reasons.seeder';
import { seedSystemAccounts } from './system-accounts.seeder';
import { seedTaxData } from './tax-data.seeder';
import { seedExchangeRates } from './exchange-rates.seeder';

// Catalog seeders
import { seedEnumDisplays } from './catalog-seeders/enum-displays.seeder';
import { seedAmenityCategories } from './catalog-seeders/amenity-categories.seeder';
import { seedAmenities } from './catalog-seeders/amenities.seeder';
import { seedBedTypes } from './catalog-seeders/bed-types.seeder';
import { seedPropertyTypes } from './catalog-seeders/property-types.seeder';
import { seedRoomTypes } from './catalog-seeders/room-types.seeder';
import { seedCancellationPolicies } from './catalog-seeders/cancellation-policies.seeder';
import { seedCurrencies } from './catalog-seeders/currencies.seeder';
import { seedNotificationTypes } from './catalog-seeders/notification-types.seeder';
import { seedPaymentProviders } from './catalog-seeders/payment-providers.seeder';
import { seedCatalogVersion } from './catalog-seeders/catalog-version.seeder';

async function runAllSeeds() {
  const app = await NestFactory.create(AppModule);

  try {
    // Core configuration seeds
    await seedDynamicConfig(app);
    await seedAdminUser(app);
    await seedAccountActionReasons(app);
    await seedSystemAccounts(app);
    await seedTaxData(app);
    await seedExchangeRates(app);

    // Catalog system seeds
    await seedEnumDisplays(app);
    await seedAmenityCategories(app);
    await seedAmenities(app);
    await seedBedTypes(app);
    await seedPropertyTypes(app);
    await seedRoomTypes(app);
    await seedCancellationPolicies(app);
    await seedCurrencies(app);
    await seedNotificationTypes(app);
    await seedPaymentProviders(app);
    await seedCatalogVersion(app);

    LoggingUtil.log('✅ All seeds complete!', 'Seeder');
  } catch (err) {
    LoggingUtil.error('❌ Seeding failed', err instanceof Error ? err.stack : undefined, 'Seeder', {
      metadata: { error: err instanceof Error ? err.message : String(err) },
    });
  } finally {
    await app.close();
  }
}

void runAllSeeds();
