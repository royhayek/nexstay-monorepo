import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { AnalyticsAdminController } from './controllers/analytics-admin.controller';
import { AnalyticsAppController } from './controllers/analytics-app.controller';
import { AnalyticsPublicController } from './controllers/analytics-public.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsCoreService } from './services/analytics-core.service';
import { AnalyticsAdminService } from './services/analytics-admin.service';
import { AnalyticsFacadeService } from './services/analytics-facade.service';
import { Invoice, InvoiceSchema } from '../../database/schemas/invoice.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../../database/schemas/payment-transaction.schema';
import { DeviceToken, DeviceTokenSchema } from '../../database/schemas/device-token.schema';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [
    SharedSchemasModule,
    I18nModule,
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [AnalyticsAdminController, AnalyticsAppController, AnalyticsPublicController],
  providers: [
    AnalyticsService, // Legacy service - maintained for backward compatibility
    AnalyticsCoreService,
    AnalyticsAdminService,
    AnalyticsFacadeService,
  ],
  exports: [
    AnalyticsService, // Legacy export
    AnalyticsFacadeService, // New primary export
    AnalyticsCoreService,
    AnalyticsAdminService,
  ],
})
export class AnalyticsModule {}
