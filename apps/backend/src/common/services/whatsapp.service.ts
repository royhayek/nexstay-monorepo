import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { Twilio } from 'twilio';
import twilioConfig from '../../config/twilio.config';
import { DynamicConfigService } from '../../modules/config/config.service';
import type { ConfigType } from '@nestjs/config';
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { LoggingUtil } from '../utils/logging.util';

@Injectable()
export class WhatsAppService {
  private client?: Twilio;
  private enabledCache?: { value: boolean; until: number };

  constructor(
    @Inject(twilioConfig.KEY) private readonly twilio: ConfigType<typeof twilioConfig>,
    private readonly dynamicConfig: DynamicConfigService,
  ) {}

  private async isEnabled(): Promise<boolean> {
    const now = Date.now();
    if (this.enabledCache && now < this.enabledCache.until) return this.enabledCache.value;
    const enabled = await this.dynamicConfig.getBoolean('NOTIFY_WHATSAPP_ENABLED', false);
    this.enabledCache = { value: enabled, until: now + 30_000 };
    return enabled;
  }

  private async ensureClient(): Promise<void> {
    if (this.client || process.env.NODE_ENV === 'test') return;
    const enabled = await this.isEnabled();
    if (!enabled) return;
    if (!this.twilio.sid || !this.twilio.authToken) {
      LoggingUtil.error(
        'Twilio credentials are missing for WhatsApp',
        undefined,
        'WhatsAppService',
      );
      throw new InternalServerErrorException('WhatsApp configuration error');
    }
    this.client = new Twilio(this.twilio.sid, this.twilio.authToken, { lazyLoading: true });
  }

  /**
   * Formats phone number for WhatsApp (must include country code and be in E.164 format)
   * WhatsApp via Twilio requires the phone number to be properly formatted
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');

    // If it doesn't start with +, add it
    if (!cleanNumber.startsWith('+')) {
      cleanNumber = `+${cleanNumber}`;
    }

    return cleanNumber;
  }

  /**
   * Sends an OTP message via WhatsApp using Twilio's WhatsApp Business API
   * @param to - Phone number in E.164 format (e.g., +1234567890)
   * @param code - OTP code to send
   */
  async sendOtp(to: string, code: string): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      LoggingUtil.warn(`WhatsApp disabled; skipping OTP send to ${to}`, 'WhatsAppService');
      return; // no-op when disabled
    }

    if (process.env.NODE_ENV === 'test') {
      LoggingUtil.log(`(test) WhatsApp OTP to ${to}: "${code}"`, 'WhatsAppService');
      return;
    }

    await this.ensureClient();
    if (!this.client) {
      LoggingUtil.error('WhatsApp client unavailable', undefined, 'WhatsAppService');
      throw new InternalServerErrorException('Failed to send WhatsApp message');
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      const whatsappNumber = `whatsapp:${formattedPhone}`;
      const fromWhatsapp = `whatsapp:${this.twilio.from}`;

      // WhatsApp message template - can be customized based on your approved templates
      const message = `🔐 Your verification code is: ${code}\n\nThis code will expire in 10 minutes. Please do not share this code with anyone.`;

      const payload = {
        body: message,
        from: fromWhatsapp,
        to: whatsappNumber,
      };

      const result: MessageInstance = await this.client.messages.create(payload);

      LoggingUtil.log(`WhatsApp OTP sent to ${formattedPhone}: ${result.sid}`, 'WhatsAppService');
    } catch (err: unknown) {
      if (err instanceof Error) {
        LoggingUtil.error(`Failed to send WhatsApp OTP to ${to}`, err.stack, 'WhatsAppService');
        // Log specific Twilio errors for debugging
        if (err.message.includes('21614')) {
          LoggingUtil.error(
            'WhatsApp number not registered or template not approved',
            undefined,
            'WhatsAppService',
          );
        }
      } else {
        LoggingUtil.error(
          `Failed to send WhatsApp OTP to ${to}: ${String(err)}`,
          undefined,
          'WhatsAppService',
        );
      }
      throw new InternalServerErrorException('Failed to send WhatsApp message');
    }
  }

  /**
   * Sends a generic WhatsApp message
   * @param to - Phone number in E.164 format
   * @param message - Message content
   */
  async send(to: string, message: string): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      LoggingUtil.warn(`WhatsApp disabled; skipping send() to ${to}`, 'WhatsAppService');
      return;
    }

    if (process.env.NODE_ENV === 'test') {
      LoggingUtil.log(`(test) WhatsApp to ${to}: "${message}"`, 'WhatsAppService');
      return;
    }

    await this.ensureClient();
    if (!this.client) {
      LoggingUtil.error('WhatsApp client unavailable', undefined, 'WhatsAppService');
      throw new InternalServerErrorException('Failed to send WhatsApp message');
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      const whatsappNumber = `whatsapp:${formattedPhone}`;
      const fromWhatsapp = `whatsapp:${this.twilio.from}`;

      const payload = {
        body: message,
        from: fromWhatsapp,
        to: whatsappNumber,
      };

      const result: MessageInstance = await this.client.messages.create(payload);

      LoggingUtil.log(
        `WhatsApp message sent to ${formattedPhone}: ${result.sid}`,
        'WhatsAppService',
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        LoggingUtil.error(`Failed to send WhatsApp message to ${to}`, err.stack, 'WhatsAppService');
      } else {
        LoggingUtil.error(
          `Failed to send WhatsApp message to ${to}: ${String(err)}`,
          undefined,
          'WhatsAppService',
        );
      }
      throw new InternalServerErrorException('Failed to send WhatsApp message');
    }
  }
}
