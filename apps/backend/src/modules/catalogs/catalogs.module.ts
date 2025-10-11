import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogsController } from './controllers/catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { CatalogVersionSchema } from '../../database/schemas/catalog-version.schema';
import { EnumDisplaysModule } from '../enum-displays/enum-displays.module';
import { AmenityCategoriesModule } from '../amenity-categories/amenity-categories.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'CatalogVersion', schema: CatalogVersionSchema }]),
    EnumDisplaysModule,
    AmenityCategoriesModule,
  ],
  controllers: [CatalogsController],
  providers: [CatalogsService],
  exports: [CatalogsService],
})
export class CatalogsModule {}
