import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentAccountsIntegrationService } from './services/payment-accounts-integration.service';
import { PaymentsAppController } from './controllers/payments-app.controller';
import { PaymentsAdminController } from './controllers/payments-admin.controller';
import { APSProvider } from './providers/aps.provider';
import { PaymentIntent, PaymentIntentSchema } from '../../database/schemas/payment-intent.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../../database/schemas/payment-transaction.schema';
import {
  PaymentCustomer,
  PaymentCustomerSchema,
} from '../../database/schemas/payment-customer.schema';
import { PaymentMethod, PaymentMethodSchema } from '../../database/schemas/payment-method.schema';
import { DynamicConfigModule } from '../config/config.module';
import { BookingsModule } from '../bookings/bookings.module';
import { FeesModule } from '../fees/fees.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentIntent.name, schema: PaymentIntentSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: PaymentCustomer.name, schema: PaymentCustomerSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema },
    ]),
    ConfigModule,
    DynamicConfigModule,
    forwardRef(() => BookingsModule),
    FeesModule,
    AccountsModule,
  ],
  controllers: [PaymentsAppController, PaymentsAdminController],
  providers: [PaymentsService, PaymentAccountsIntegrationService, APSProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
