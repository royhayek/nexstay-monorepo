import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthMethod } from '../../modules/auth/dto/login.dto';
import { MailService } from './mail.service';
import { SmsService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { OtpNotificationMethod } from '../../database/schemas/user.schema';

@Injectable()
export class NotificationService {
  constructor(
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async sendOtp(method: AuthMethod, to: string, code: string) {
    if (method === AuthMethod.EMAIL) {
      await this.mailService.send(to, 'Your OTP Code', 'otp', { code });
    } else if (method === AuthMethod.PHONE) {
      await this.smsService.send(to, `Your OTP code is: ${code}`);
    } else {
      throw new InternalServerErrorException('Unsupported delivery method');
    }
  }

  async sendOtpByPreference(
    preferredMethod: OtpNotificationMethod,
    email?: string,
    phone?: string,
    code?: string,
  ) {
    if (!code) {
      throw new InternalServerErrorException('OTP code is required');
    }

    switch (preferredMethod) {
      case OtpNotificationMethod.EMAIL:
        if (!email) {
          throw new InternalServerErrorException('Email address is required for email OTP');
        }
        await this.mailService.send(email, 'Your OTP Code', 'otp', { code });
        break;

      case OtpNotificationMethod.SMS:
        if (!phone) {
          throw new InternalServerErrorException('Phone number is required for SMS OTP');
        }
        await this.smsService.send(phone, `Your OTP code is: ${code}`);
        break;

      case OtpNotificationMethod.WHATSAPP:
        if (!phone) {
          throw new InternalServerErrorException('Phone number is required for WhatsApp OTP');
        }
        await this.whatsAppService.sendOtp(phone, code);
        break;

      default:
        throw new InternalServerErrorException(
          `Unsupported OTP delivery method: ${String(preferredMethod)}`,
        );
    }
  }
}
