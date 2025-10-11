import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { CommonModule } from '../../common/common.module';

// Services
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { FeesModule } from '../fees/fees.module';

// Controllers
import { BookingsAppController } from './controllers/bookings-app.controller';
import { BookingsAdminController } from './controllers/bookings-admin.controller';
import { BookingCoreService } from './services/booking-core.service';
import { BookingAdminService } from './services/booking-admin.service';
import { BookingFacadeService } from './services/booking-facade.service';
import { BookingPaymentService } from './services/booking-payment.service';
import { BookingSagaService } from './services/booking-saga.service';
import { BookingEventsService } from './services/booking-events.service';
import { BookingAutoCancelService } from './services/booking-auto-cancel.service';
import { DynamicConfigModule } from '../config/config.module';
import { PropertiesModule } from '../properties/properties.module';
import { TaxModule } from '../tax/tax.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    SharedSchemasModule,
    CommonModule,
    EventEmitterModule.forRoot(),
    NotificationsModule,
    PaymentsModule,
    InvoicesModule,
    FeesModule,
    DynamicConfigModule,
    PropertiesModule,
    TaxModule,
    forwardRef(() => AccountsModule),
  ],
  providers: [
    BookingCoreService,
    BookingAdminService,
    BookingFacadeService,
    BookingPaymentService,
    BookingSagaService,
    BookingEventsService,
    BookingAutoCancelService,
  ],
  controllers: [BookingsAppController, BookingsAdminController],
  exports: [
    BookingFacadeService,
    BookingCoreService,
    BookingPaymentService,
    BookingSagaService,
    BookingEventsService,
    BookingAutoCancelService,
  ],
})
export class BookingsModule {}
