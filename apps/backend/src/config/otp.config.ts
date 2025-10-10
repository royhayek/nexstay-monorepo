export const OTP_CONFIG_KEYS = [
  'OTP_LENGTH',
  'OTP_TTL_SECONDS',
  'OTP_RESEND_COOLDOWN_SECONDS',
  'OTP_MAX_ATTEMPTS',
  'RESET_TTL_SECONDS',
  'RESET_MAX_ATTEMPTS',
  'NOTIFY_EMAIL_ENABLED',
  'NOTIFY_SMS_ENABLED',
  'OTP_REQUESTS_PER_WINDOW',
  'OTP_REQUEST_WINDOW_SECONDS',
] as const;

export type OtpConfigKeys = (typeof OTP_CONFIG_KEYS)[number];

export interface OtpConfig {
  length: number; // OTP_LENGTH
  ttlMs: number; // OTP_TTL_SECONDS * 1000
  resendCooldownMs: number; // OTP_RESEND_COOLDOWN_SECONDS * 1000
  maxAttempts: number; // OTP_MAX_ATTEMPTS

  resetTtlMs: number; // RESET_TTL_SECONDS * 1000
  resetMaxAttempts: number; // RESET_MAX_ATTEMPTS

  notifyEmailEnabled: boolean; // NOTIFY_EMAIL_ENABLED
  notifySmsEnabled: boolean; // NOTIFY_SMS_ENABLED

  windowRequests: number; // OTP_REQUESTS_PER_WINDOW
  windowMs: number; // OTP_REQUEST_WINDOW_SECONDS * 1000
}
