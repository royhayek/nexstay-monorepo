import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DynamicConfigService } from './config.service';
import { ConfigCacheHelper } from './config-cache.helper';
import { ConfigPublicController } from './controllers/config-public.controller';
import { ConfigAdminController } from './controllers/config-admin.controller';
import { AppConfig, AppConfigSchema } from '../../database/schemas/app-config.schema';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: AppConfig.name, schema: AppConfigSchema }])],
  controllers: [ConfigPublicController, ConfigAdminController],
  providers: [DynamicConfigService, ConfigCacheHelper],
  exports: [DynamicConfigService, ConfigCacheHelper],
})
export class DynamicConfigModule {}
