import { registerAs } from '@nestjs/config';

export interface TwilioEnv {
  sid: string;
  authToken: string;
  from: string;
  messagingServiceSid: string;
}

export default registerAs(
  'twilio',
  (): TwilioEnv => ({
    sid: process.env.TWILIO_SID ?? '',
    authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    from: process.env.TWILIO_PHONE_NUMBER ?? '',
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID ?? '',
  }),
);
