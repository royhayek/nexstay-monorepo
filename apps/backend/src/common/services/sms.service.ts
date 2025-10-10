import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { Twilio } from 'twilio';
import twilioConfig from '../../config/twilio.config';
import { DynamicConfigService } from '../../modules/config/config.service';
import type { ConfigType } from '@nestjs/config';
import type { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';
import { LoggingUtil } from '../utils/logging.util';

@Injectable()
export class SmsService {
  private client?: Twilio;
  private enabledCache?: { value: boolean; until: number };

  constructor(
    @Inject(twilioConfig.KEY) private readonly twilio: ConfigType<typeof twilioConfig>,
    private readonly dynamicConfig: DynamicConfigService,
  ) {}

  private async isEnabled(): Promise<boolean> {
    const now = Date.now();
    if (this.enabledCache && now < this.enabledCache.until) return this.enabledCache.value;
    const enabled = await this.dynamicConfig.getBoolean('NOTIFY_SMS_ENABLED', false);
    this.enabledCache = { value: enabled, until: now + 30_000 };
    return enabled;
  }

  private async ensureClient(): Promise<void> {
    if (this.client || process.env.NODE_ENV === 'test') return;
    const enabled = await this.isEnabled();
    if (!enabled) return;
    if (!this.twilio.sid || !this.twilio.authToken) {
      LoggingUtil.error('Twilio credentials are missing', undefined, 'SmsService');
      throw new InternalServerErrorException('SMS configuration error');
    }
    this.client = new Twilio(this.twilio.sid, this.twilio.authToken, { lazyLoading: true });
  }

  async send(to: string, message: string): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      LoggingUtil.warn(`SMS disabled; skipping send() to ${to}`, 'SmsService');
      return; // no-op when disabled
    }

    if (process.env.NODE_ENV === 'test') {
      LoggingUtil.log(`(test) SMS to ${to}: "${message}"`, 'SmsService');
      return;
    }

    await this.ensureClient();
    if (!this.client) {
      LoggingUtil.error('SMS client unavailable', undefined, 'SmsService');
      throw new InternalServerErrorException('Failed to send SMS');
    }

    try {
      const payload = this.twilio.messagingServiceSid
        ? { body: message, to, messagingServiceSid: this.twilio.messagingServiceSid }
        : { body: message, to, from: this.twilio.from };

      const result: MessageInstance = await this.client.messages.create(payload);

      LoggingUtil.log(`SMS sent to ${to}: ${result.sid}`, 'SmsService');
    } catch (err: unknown) {
      if (err instanceof Error)
        LoggingUtil.error(`Failed to send SMS to ${to}`, err.stack, 'SmsService');
      else
        LoggingUtil.error(`Failed to send SMS to ${to}: ${String(err)}`, undefined, 'SmsService');
      throw new InternalServerErrorException('Failed to send SMS');
    }
  }
}
