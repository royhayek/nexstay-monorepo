import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { FixBookingHostIdTypeMigration } from '../src/database/migrations/fix-booking-hostid-type.migration';

/**
 * Standalone script to run the booking hostId migration
 * Usage: npm run migrate:booking-hostid
 */
async function bootstrap() {
  console.log('Initializing NestJS application for migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const migration = app.get(FixBookingHostIdTypeMigration);
    await migration.run();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
