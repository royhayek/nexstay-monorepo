import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';

// Controllers
import { PayoutsHostController } from './controllers/payouts-host.controller';
import { PayoutsAdminController } from './controllers/payouts-admin.controller';

// Services
import { PayoutsFacadeService } from './services/payouts-facade.service';
import { PayoutsCoreService } from './services/payouts-core.service';
import { PayoutsMethodService } from './services/payouts-method.service';
import { PayoutsCalculationService } from './services/payouts-calculation.service';
import { PayoutsProcessingService } from './services/payouts-processing.service';
import { PaymentProviderService } from './services/payment-provider.service';
import { ApsPaymentProvider } from './services/payment-providers/aps-payment-provider';
import { PayoutsAccountsIntegrationService } from './services/payouts-accounts-integration.service';

import { Payout, PayoutSchema } from '../../database/schemas/payout.schema';
import { PayoutMethod, PayoutMethodSchema } from '../../database/schemas/payout-method.schema';

import { DynamicConfigModule } from '../config/config.module';
import { AuthModule } from '../auth/auth.module';
import { FeesModule } from '../fees/fees.module';
import { AccountsModule } from '../accounts/accounts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([
      { name: Payout.name, schema: PayoutSchema },
      { name: PayoutMethod.name, schema: PayoutMethodSchema },
    ]),
    ScheduleModule.forRoot(),
    DynamicConfigModule,
    AuthModule,
    FeesModule,
    AccountsModule,
    NotificationsModule,
  ],
  controllers: [PayoutsHostController, PayoutsAdminController],
  providers: [
    // Facade and specialized services
    PayoutsFacadeService,
    PayoutsCoreService,
    PayoutsMethodService,
    PayoutsCalculationService,
    PayoutsProcessingService,
    PayoutsAccountsIntegrationService,
    // Payment provider services
    PaymentProviderService,
    ApsPaymentProvider,
  ],
  exports: [PayoutsFacadeService],
})
export class PayoutsModule {}
