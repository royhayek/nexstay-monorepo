import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnumDisplaysAdminController } from './controllers/enum-displays-admin.controller';
import { EnumDisplaysPublicController } from './controllers/enum-displays-public.controller';
import { EnumDisplaysService } from './enum-displays.service';
import { EnumDisplay, EnumDisplaySchema } from '../../database/schemas/enum-display.schema';
import {
  CatalogVersion,
  CatalogVersionSchema,
} from '../../database/schemas/catalog-version.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EnumDisplay.name, schema: EnumDisplaySchema },
      { name: CatalogVersion.name, schema: CatalogVersionSchema },
    ]),
  ],
  controllers: [EnumDisplaysAdminController, EnumDisplaysPublicController],
  providers: [EnumDisplaysService],
  exports: [EnumDisplaysService],
})
export class EnumDisplaysModule {}
