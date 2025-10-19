import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { LoggingUtil } from '../../common/utils/logging.util';

import { seedDynamicConfig } from './dynamic-config.seeder';
import { seedAdminUser } from './admin-user.seeder';
import { seedAccountActionReasons } from './account-action-reasons.seeder';
import { seedSystemAccounts } from './system-accounts.seeder';
import { seedTaxData } from './tax-data.seeder';
import { seedExchangeRates } from './exchange-rates.seeder';

// Unified Catalog System
import { seedCatalogItems } from './catalog-items.seed';

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

    // Unified Catalog System
    await seedCatalogItems(app);

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
