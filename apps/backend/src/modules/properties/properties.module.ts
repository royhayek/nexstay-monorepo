import { Module } from '@nestjs/common';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { DynamicConfigModule } from '../config/config.module';
import { PropertyCoreService } from './services/property-core.service';
import { PropertySearchService } from './services/property-search.service';
import { PropertyManagementService } from './services/property-management.service';
import { PropertyAdminService } from './services/property-admin.service';
import { PropertiesFacadeService } from './services/properties-facade.service';
import { PropertyFeeService } from './services/property-fee.service';
import { PropertiesAppController } from './controllers/properties-app.controller';
import { PropertiesAdminController } from './controllers/properties-admin.controller';
import { PropertiesPublicController } from './controllers/properties-public.controller';
import { StorageModule } from '../storage/storage.module';
import { AccountsModule } from '../accounts/accounts.module';
import { FeesModule } from '../fees/fees.module';

@Module({
  imports: [SharedSchemasModule, DynamicConfigModule, StorageModule, AccountsModule, FeesModule],
  providers: [
    PropertyCoreService,
    PropertySearchService,
    PropertyManagementService,
    PropertyAdminService,
    PropertyFeeService,
    PropertiesFacadeService,
  ],
  controllers: [PropertiesAppController, PropertiesAdminController, PropertiesPublicController],
  exports: [PropertiesFacadeService],
})
export class PropertiesModule {}
