import { Global, Module } from '@nestjs/common';
import { MailService } from './services/mail.service';
import { SmsService } from './services/sms.service';
import { WhatsAppService } from './services/whatsapp.service';
import { NotificationService } from './services/notificaton.service';

@Global() // optional if used across all modules
@Module({
  providers: [MailService, SmsService, WhatsAppService, NotificationService],
  exports: [MailService, SmsService, WhatsAppService, NotificationService],
})
export class CommonModule {}
