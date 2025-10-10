import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { migrateDynamicConfig } from './migrate-dynamic-config';
import { LoggingUtil } from '../../common/utils/logging.util';

async function runMigrations() {
  LoggingUtil.migrationLog('Starting database migrations...');

  try {
    // Create Nest application (full app, not just context)
    const app = await NestFactory.create(AppModule);

    // Run migrations
    await migrateDynamicConfig(app);

    LoggingUtil.migrationSuccess('All migrations completed successfully!');
    await app.close();
    process.exit(0);
  } catch (error) {
    LoggingUtil.migrationError(
      'Migration failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    process.exit(1);
  }
}

void runMigrations();
