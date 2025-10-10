import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BookingInstallment,
  BookingInstallmentSchema,
} from '../../database/schemas/booking-installment.schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';
import { BookingInstallmentService } from './services/booking-installment.service';
import { BookingInstallmentSchedulingService } from './services/booking-installment-scheduling.service';
import { BookingInstallmentProcessingService } from './services/booking-installment-processing.service';
import { BookingInstallmentController } from './controllers/booking-installment.controller';
import { BookingInstallmentAdminController } from './controllers/booking-installment-admin.controller';
import { MultiCurrencyModule } from '../multi-currency/multi-currency.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingInstallment.name, schema: BookingInstallmentSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    MultiCurrencyModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [BookingInstallmentController, BookingInstallmentAdminController],
  providers: [
    BookingInstallmentService,
    BookingInstallmentSchedulingService,
    BookingInstallmentProcessingService,
  ],
  exports: [
    BookingInstallmentService,
    BookingInstallmentSchedulingService,
    BookingInstallmentProcessingService,
  ],
})
export class BookingInstallmentsModule {}
