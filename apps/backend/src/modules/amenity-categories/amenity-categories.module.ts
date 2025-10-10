import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AmenityCategoriesAdminController } from './controllers/amenity-categories-admin.controller';
import { AmenityCategoriesPublicController } from './controllers/amenity-categories-public.controller';
import { AmenityCategoriesService } from './amenity-categories.service';
import {
  AmenityCategory,
  AmenityCategorySchema,
} from '../../database/schemas/amenity-category.schema';
import { Amenity, AmenitySchema } from '../../database/schemas/amenity.schema';
import {
  CatalogVersion,
  CatalogVersionSchema,
} from '../../database/schemas/catalog-version.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AmenityCategory.name, schema: AmenityCategorySchema },
      { name: Amenity.name, schema: AmenitySchema },
      { name: CatalogVersion.name, schema: CatalogVersionSchema },
    ]),
  ],
  controllers: [AmenityCategoriesAdminController, AmenityCategoriesPublicController],
  providers: [AmenityCategoriesService],
  exports: [AmenityCategoriesService],
})
export class AmenityCategoriesModule {}
