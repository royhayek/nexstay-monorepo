import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SecurityDeposit,
  SecurityDepositSchema,
} from '../../database/schemas/security-deposit.schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';
import { SecurityDepositService } from './services/security-deposit.service';
import { SecurityDepositProcessingService } from './services/security-deposit-processing.service';
import { SecurityDepositClaimsService } from './services/security-deposit-claims.service';
import { SecurityDepositController } from './controllers/security-deposit.controller';
import { SecurityDepositAdminController } from './controllers/security-deposit-admin.controller';
import { MultiCurrencyModule } from '../multi-currency/multi-currency.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SecurityDeposit.name, schema: SecurityDepositSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    MultiCurrencyModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [SecurityDepositController, SecurityDepositAdminController],
  providers: [
    SecurityDepositService,
    SecurityDepositProcessingService,
    SecurityDepositClaimsService,
  ],
  exports: [SecurityDepositService, SecurityDepositProcessingService, SecurityDepositClaimsService],
})
export class SecurityDepositsModule {}
