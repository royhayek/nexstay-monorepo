import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicesService } from './invoices.service';
import { InvoicesAppController } from './controllers/invoices-app.controller';
import { InvoicesAdminController } from './controllers/invoices-admin.controller';
import { Invoice, InvoiceSchema } from '../../database/schemas/invoice.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    NotificationsModule,
  ],
  controllers: [InvoicesAppController, InvoicesAdminController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
