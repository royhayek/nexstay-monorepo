import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { CatalogVersion, CatalogVersionDocument } from '../../schemas/catalog-version.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedCatalogVersion(appContext: INestApplication) {
  await runSeeder('catalog version', async () => {
    const catalogVersionModel: Model<CatalogVersionDocument> = appContext.get(
      getModelToken(CatalogVersion.name),
    );

    const existingVersion = await catalogVersionModel.findOne({ id: 'default' }).exec();

    if (existingVersion) {
      SeederLogger.skipped('catalog version', `v${existingVersion.version} already exists`);
      return;
    }

    await catalogVersionModel.create({
      id: 'default',
      version: 1,
      lastModifiedBy: 'seeder',
    });

    SeederLogger.success('catalog version');
  });
}
