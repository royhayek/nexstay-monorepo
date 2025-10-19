import { Module } from '@nestjs/common';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { DynamicConfigModule } from '../config/config.module';
import { PropertyCoreService } from './services/property-core.service';
import { PropertySearchService } from './services/property-search.service';
import { PropertyManagementService } from './services/property-management.service';
import { PropertyAdminService } from './services/property-admin.service';
import { PropertiesFacadeService } from './services/properties-facade.service';
import { PropertyFeeService } from './services/property-fee.service';
import { HostOnboardingService } from './services/host-onboarding.service';
import { SearchPreferencesService } from './services/search-preferences.service';
import { PropertiesAppController } from './controllers/properties-app.controller';
import { PropertiesAdminController } from './controllers/properties-admin.controller';
import { PropertiesPublicController } from './controllers/properties-public.controller';
import { HostOnboardingController } from './controllers/host-onboarding.controller';
import { SearchPreferencesController } from './controllers/search-preferences.controller';
import { StorageModule } from '../storage/storage.module';
import { AccountsModule } from '../accounts/accounts.module';
import { FeesModule } from '../fees/fees.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    SharedSchemasModule,
    DynamicConfigModule,
    StorageModule,
    AccountsModule,
    FeesModule,
    NotificationsModule,
    CatalogModule,
  ],
  providers: [
    PropertyCoreService,
    PropertySearchService,
    PropertyManagementService,
    PropertyAdminService,
    PropertyFeeService,
    PropertiesFacadeService,
    HostOnboardingService,
    SearchPreferencesService,
  ],
  controllers: [
    PropertiesAppController,
    PropertiesAdminController,
    PropertiesPublicController,
    HostOnboardingController,
    SearchPreferencesController,
  ],
  exports: [PropertiesFacadeService],
})
export class PropertiesModule {}
