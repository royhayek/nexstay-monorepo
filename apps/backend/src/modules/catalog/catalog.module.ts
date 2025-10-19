import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogItem, CatalogItemSchema } from '../../database/schemas/catalog-item.schema';
import {
  CatalogVersion,
  CatalogVersionSchema,
} from '../../database/schemas/catalog-version.schema';
import { CatalogService } from './catalog.service';
import { CatalogPublicController } from './controllers/catalog-public.controller';
import { CatalogAdminController } from './controllers/catalog-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CatalogItem.name, schema: CatalogItemSchema },
      { name: CatalogVersion.name, schema: CatalogVersionSchema },
    ]),
  ],
  controllers: [CatalogPublicController, CatalogAdminController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
