import { INestApplication } from '@nestjs/common';
import { DynamicConfigService } from '../../modules/config/config.service';
import { ConfigCategory } from '../schemas/app-config.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

export async function seedDynamicConfig(appContext: INestApplication) {
  await runSeeder('dynamic config', async () => {
    const configService = appContext.get(DynamicConfigService);

    const seedItems = [
      // ---- Security configurations ----
      {
        key: 'SESSION_EXPIRES_IN',
        value: '15m',
        title: 'Session Expiry Duration',
        description: 'JWT access token expiry',
        category: ConfigCategory.SECURITY,
        sortOrder: 1,
      },
      {
        key: 'REFRESH_EXPIRES_IN',
        value: '7d',
        title: 'Refresh Token Expiry',
        description: 'Refresh token expiry',
        category: ConfigCategory.SECURITY,
        sortOrder: 2,
      },
      {
        key: 'OTP_LENGTH',
        value: '6',
        title: 'OTP Code Length',
        description: 'Digits in verification OTP',
        category: ConfigCategory.SECURITY,
        sortOrder: 3,
      },
      {
        key: 'OTP_TTL_SECONDS',
        value: '300',
        title: 'OTP Validity Period',
        description: 'OTP validity in seconds (5m)',
        category: ConfigCategory.SECURITY,
        sortOrder: 4,
      },
      {
        key: 'OTP_RESEND_COOLDOWN_SECONDS',
        value: process.env.NODE_ENV === 'test' ? '1' : '60',
        title: 'OTP Resend Cooldown',
        description: 'Min seconds between OTP resends',
        category: ConfigCategory.SECURITY,
        sortOrder: 5,
      },
      {
        key: 'OTP_MAX_ATTEMPTS',
        value: '5',
        title: 'OTP Max Attempts',
        description: 'Max verify attempts before lockout',
        category: ConfigCategory.SECURITY,
        sortOrder: 6,
      },
      {
        key: 'RESET_TTL_SECONDS',
        value: '600',
        title: 'Password Reset Validity',
        description: 'Password reset code validity (10m)',
        category: ConfigCategory.SECURITY,
        sortOrder: 7,
      },
      {
        key: 'RESET_MAX_ATTEMPTS',
        value: '5',
        title: 'Password Reset Max Attempts',
        description: 'Max attempts for password reset code',
        category: ConfigCategory.SECURITY,
        sortOrder: 8,
      },
      {
        key: 'OTP_REQUESTS_PER_WINDOW',
        value: '5',
        title: 'OTP Requests Per Window',
        description: 'Max OTP requests in window',
        category: ConfigCategory.SECURITY,
        sortOrder: 9,
      },
      {
        key: 'OTP_REQUEST_WINDOW_SECONDS',
        value: '900',
        title: 'OTP Request Window Duration',
        description: 'Rate-limit window (15m)',
        category: ConfigCategory.SECURITY,
        sortOrder: 6,
      },

      // ---- Booking & Property Management ----
      {
        key: 'DEFAULT_MINIMUM_NIGHTS',
        value: '1',
        title: 'Default Minimum Nights',
        description: 'Default minimum nights for property bookings',
        category: ConfigCategory.BOOKING,
        sortOrder: 1,
      },
      {
        key: 'DEFAULT_MAXIMUM_NIGHTS',
        value: '365',
        title: 'Default Maximum Nights',
        description: 'Default maximum nights for property bookings',
        category: ConfigCategory.BOOKING,
        sortOrder: 2,
      },
      {
        key: 'BOOKING_CANCELLATION_WINDOW_HOURS',
        value: '24',
        title: 'Booking Cancellation Window',
        description: 'Hours before check-in when guests can cancel',
        category: ConfigCategory.BOOKING,
        sortOrder: 3,
      },
      {
        key: 'AUTO_BOOKING_CONFIRMATION',
        value: 'false',
        title: 'Auto Booking Confirmation',
        description: 'Automatically confirm bookings without host approval',
        category: ConfigCategory.BOOKING,
        sortOrder: 4,
      },
      {
        key: 'INSTANT_BOOKING_ENABLED',
        value: 'true',
        title: 'Enable Instant Booking',
        description: 'Allow instant booking for eligible properties',
        category: ConfigCategory.BOOKING,
        sortOrder: 5,
      },
      {
        key: 'BOOKING_REQUEST_EXPIRY_HOURS',
        value: '24',
        title: 'Booking Request Expiry',
        description: 'Hours after which pending booking requests expire',
        category: ConfigCategory.BOOKING,
        sortOrder: 6,
      },

      // ---- Payment & Pricing ----
      {
        key: 'GUEST_SERVICE_FEE_RATE',
        value: '0.03',
        title: 'Guest Service Fee Rate',
        description: 'Service fee rate charged to guests at booking',
        category: ConfigCategory.PAYMENT,
        sortOrder: 1,
      },
      {
        key: 'HOST_COMMISSION_RATE',
        value: '0.07',
        title: 'Host Commission Rate',
        description: 'Platform commission rate deducted from host earnings',
        category: ConfigCategory.PAYMENT,
        sortOrder: 2,
      },
      {
        key: 'PROCESSING_FEE_CARD',
        value: '0',
        title: 'Card Processing Fee Rate',
        description: 'Processing fee rate for card payments',
        category: ConfigCategory.PAYMENT,
        sortOrder: 3,
      },
      {
        key: 'PROCESSING_FEE_BANK',
        value: '0',
        title: 'Bank Transfer Processing Fee Rate',
        description: 'Processing fee rate for bank transfers',
        category: ConfigCategory.PAYMENT,
        sortOrder: 4,
      },
      {
        key: 'PROCESSING_FEE_WALLET',
        value: '0',
        title: 'Digital Wallet Processing Fee Rate',
        description: 'Processing fee rate for digital wallets',
        category: ConfigCategory.PAYMENT,
        sortOrder: 5,
      },
      {
        key: 'PROCESSING_FEE_FIXED',
        value: '0',
        title: 'Fixed Processing Fee',
        description: 'Fixed processing fee per transaction',
        category: ConfigCategory.PAYMENT,
        sortOrder: 6,
      },
      {
        key: 'OCCUPANCY_TAX_RATE',
        value: '0',
        title: 'Occupancy Tax Rate',
        description: 'Occupancy tax rate for bookings',
        category: ConfigCategory.PAYMENT,
        sortOrder: 7,
      },
      {
        key: 'VAT_RATE',
        value: '0.20',
        title: 'VAT Rate',
        description: 'VAT rate where applicable',
        category: ConfigCategory.PAYMENT,
        sortOrder: 8,
      },
      {
        key: 'MIN_SERVICE_FEE',
        value: '1.00',
        title: 'Minimum Service Fee',
        description: 'Minimum service fee amount',
        category: ConfigCategory.PAYMENT,
        sortOrder: 9,
      },
      {
        key: 'MAX_SERVICE_FEE',
        value: '100.00',
        title: 'Maximum Service Fee',
        description: 'Maximum service fee amount',
        category: ConfigCategory.PAYMENT,
        sortOrder: 10,
      },
      {
        key: 'MIN_PROCESSING_FEE',
        value: '0',
        title: 'Minimum Processing Fee',
        description: 'Minimum processing fee amount',
        category: ConfigCategory.PAYMENT,
        sortOrder: 11,
      },
      {
        key: 'MAX_PROCESSING_FEE',
        value: '0',
        title: 'Maximum Processing Fee',
        description: 'Maximum processing fee amount',
        category: ConfigCategory.PAYMENT,
        sortOrder: 12,
      },
      {
        key: 'DEFAULT_CLEANING_FEE',
        value: '0',
        title: 'Default Cleaning Fee',
        description: 'Default cleaning fee amount',
        category: ConfigCategory.PAYMENT,
        sortOrder: 13,
      },
      {
        key: 'CURRENCY_DEFAULT',
        value: 'USD',
        title: 'Default Currency',
        description: 'Default currency for pricing',
        category: ConfigCategory.PAYMENT,
        sortOrder: 14,
      },
      {
        key: 'REFUND_PROCESSING_DAYS',
        value: '5',
        title: 'Refund Processing Time',
        description: 'Business days to process refunds',
        category: ConfigCategory.PAYMENT,
        sortOrder: 15,
      },
      {
        key: 'REFUND_ADMIN_THRESHOLD',
        value: '500',
        title: 'Refund Admin Approval Threshold',
        description: 'Amount above which admin approval is required for refunds',
        category: ConfigCategory.PAYMENT,
        sortOrder: 16,
      },
      {
        key: 'REFUND_REQUIRE_ADMIN_APPROVAL',
        value: 'true',
        title: 'Refund Admin Approval Required',
        description: 'Require admin approval for refunds above threshold',
        category: ConfigCategory.PAYMENT,
        sortOrder: 17,
      },
      {
        key: 'CANCELLATION_POLICY_DEFAULT',
        value: 'moderate',
        title: 'Default Cancellation Policy',
        description: 'Default cancellation policy for new properties',
        category: ConfigCategory.PAYMENT,
        sortOrder: 18,
      },

      // ---- File Upload & Media ----
      {
        key: 'MAX_PROPERTY_IMAGES',
        value: '20',
        title: 'Max Property Images',
        description: 'Maximum images allowed per property',
        category: ConfigCategory.FEATURES,
        sortOrder: 1,
      },
      {
        key: 'MAX_FILE_SIZE_MB',
        value: '10',
        title: 'Max File Size (MB)',
        description: 'Maximum file size in megabytes',
        category: ConfigCategory.FEATURES,
        sortOrder: 2,
      },
      {
        key: 'MAX_PROFILE_IMAGE_SIZE_MB',
        value: '5',
        title: 'Max Profile Image Size (MB)',
        description: 'Maximum profile image size in megabytes',
        category: ConfigCategory.FEATURES,
        sortOrder: 3,
      },
      {
        key: 'ALLOWED_IMAGE_FORMATS',
        value: 'jpg,jpeg,png,webp',
        title: 'Allowed Image Formats',
        description: 'Allowed image file formats',
        category: ConfigCategory.FEATURES,
        sortOrder: 4,
      },
      {
        key: 'IMAGE_COMPRESSION_ENABLED',
        value: 'true',
        title: 'Enable Image Compression',
        description: 'Enable automatic image compression',
        category: ConfigCategory.FEATURES,
        sortOrder: 5,
      },
      {
        key: 'IMAGE_COMPRESSION_QUALITY',
        value: '80',
        title: 'Image Compression Quality',
        description: 'Image compression quality percentage',
        category: ConfigCategory.FEATURES,
        sortOrder: 6,
      },

      // ---- Email Configuration ----
      {
        key: 'NOTIFY_EMAIL_ENABLED',
        value: 'true',
        title: 'Enable Email Notifications',
        description: 'Enable email notifications',
        category: ConfigCategory.EMAIL,
        sortOrder: 1,
      },
      {
        key: 'EMAIL_BOOKING_CONFIRMATION',
        value: 'true',
        title: 'Email Booking Confirmations',
        description: 'Send email for booking confirmations',
        category: ConfigCategory.EMAIL,
        sortOrder: 2,
      },
      {
        key: 'EMAIL_BOOKING_REMINDER_HOURS',
        value: '24',
        title: 'Booking Reminder Timing',
        description: 'Hours before check-in to send reminder email',
        category: ConfigCategory.EMAIL,
        sortOrder: 3,
      },
      {
        key: 'EMAIL_REVIEW_REMINDER_DAYS',
        value: '3',
        title: 'Review Reminder Timing',
        description: 'Days after checkout to send review reminder',
        category: ConfigCategory.EMAIL,
        sortOrder: 4,
      },
      {
        key: 'EMAIL_MARKETING_ENABLED',
        value: 'true',
        title: 'Enable Marketing Emails',
        description: 'Enable marketing email campaigns',
        category: ConfigCategory.EMAIL,
        sortOrder: 5,
      },
      {
        key: 'EMAIL_TEMPLATE_LANGUAGE_DEFAULT',
        value: 'en',
        title: 'Default Email Language',
        description: 'Default language for email templates',
        category: ConfigCategory.EMAIL,
        sortOrder: 6,
      },

      // ---- SMS Configuration ----
      {
        key: 'NOTIFY_SMS_ENABLED',
        value: 'false',
        title: 'Enable SMS Notifications',
        description: 'Enable SMS notifications',
        category: ConfigCategory.SMS,
        sortOrder: 1,
      },
      {
        key: 'SMS_BOOKING_CONFIRMATION',
        value: 'false',
        title: 'SMS Booking Confirmations',
        description: 'Send SMS for booking confirmations',
        category: ConfigCategory.SMS,
        sortOrder: 2,
      },
      {
        key: 'SMS_OTP_VERIFICATION',
        value: 'true',
        title: 'SMS OTP Verification',
        description: 'Send SMS for OTP verification',
        category: ConfigCategory.SMS,
        sortOrder: 3,
      },
      {
        key: 'SMS_EMERGENCY_NOTIFICATIONS',
        value: 'true',
        title: 'SMS Emergency Alerts',
        description: 'Send SMS for emergency notifications',
        category: ConfigCategory.SMS,
        sortOrder: 4,
      },

      // ---- WhatsApp Configuration ----
      {
        key: 'NOTIFY_WHATSAPP_ENABLED',
        value: 'false',
        title: 'Enable WhatsApp Notifications',
        description: 'Enable WhatsApp notifications via Twilio',
        category: ConfigCategory.SMS,
        sortOrder: 5,
      },
      {
        key: 'WHATSAPP_OTP_VERIFICATION',
        value: 'true',
        title: 'WhatsApp OTP Verification',
        description: 'Send WhatsApp messages for OTP verification',
        category: ConfigCategory.SMS,
        sortOrder: 6,
      },
      {
        key: 'WHATSAPP_BOOKING_CONFIRMATION',
        value: 'false',
        title: 'WhatsApp Booking Confirmations',
        description: 'Send WhatsApp messages for booking confirmations',
        category: ConfigCategory.SMS,
        sortOrder: 7,
      },

      // ---- Push Notifications ----
      {
        key: 'PUSH_BOOKING_UPDATES',
        value: 'true',
        title: 'Push Booking Updates',
        description: 'Send push notifications for booking updates',
        category: ConfigCategory.NOTIFICATIONS,
        sortOrder: 1,
      },
      {
        key: 'PUSH_MESSAGE_NOTIFICATIONS',
        value: 'true',
        title: 'Push Message Notifications',
        description: 'Send push notifications for messages',
        category: ConfigCategory.NOTIFICATIONS,
        sortOrder: 2,
      },
      {
        key: 'PUSH_MARKETING_ENABLED',
        value: 'false',
        title: 'Enable Marketing Push',
        description: 'Enable marketing push notifications',
        category: ConfigCategory.NOTIFICATIONS,
        sortOrder: 3,
      },
      {
        key: 'NOTIFICATION_BATCH_SIZE',
        value: '100',
        title: 'Notification Batch Size',
        description: 'Batch size for processing notifications',
        category: ConfigCategory.NOTIFICATIONS,
        sortOrder: 4,
      },

      // ---- UI & User Experience ----
      {
        key: 'DEFAULT_LANGUAGE',
        value: 'en',
        title: 'Default Language',
        description: 'Default application language',
        category: ConfigCategory.UI,
        sortOrder: 1,
      },
      {
        key: 'SUPPORTED_LANGUAGES',
        value: 'en,fr,ar,es,de',
        title: 'Supported Languages',
        description: 'Comma-separated list of supported languages',
        category: ConfigCategory.UI,
        sortOrder: 2,
      },
      {
        key: 'DEFAULT_CURRENCY_DISPLAY',
        value: 'USD',
        title: 'Default Currency Display',
        description: 'Default currency for display purposes',
        category: ConfigCategory.UI,
        sortOrder: 3,
      },
      {
        key: 'DATE_FORMAT_DEFAULT',
        value: 'MM/dd/yyyy',
        title: 'Default Date Format',
        description: 'Default date format for display',
        category: ConfigCategory.UI,
        sortOrder: 4,
      },
      {
        key: 'TIMEZONE_DEFAULT',
        value: 'UTC',
        title: 'Default Timezone',
        description: 'Default timezone for the application',
        category: ConfigCategory.UI,
        sortOrder: 5,
      },

      // ---- Search & Pagination ----
      {
        key: 'SEARCH_RESULTS_PER_PAGE',
        value: '20',
        title: 'Search Results Per Page',
        description: 'Number of search results per page',
        category: ConfigCategory.GENERAL,
        sortOrder: 1,
      },
      {
        key: 'MAX_SEARCH_RADIUS_KM',
        value: '100',
        title: 'Max Search Radius (KM)',
        description: 'Maximum search radius in kilometers',
        category: ConfigCategory.GENERAL,
        sortOrder: 2,
      },
      {
        key: 'AUTOCOMPLETE_MIN_CHARS',
        value: '3',
        title: 'Autocomplete Min Characters',
        description: 'Minimum characters for autocomplete to trigger',
        category: ConfigCategory.GENERAL,
        sortOrder: 3,
      },
      {
        key: 'PROPERTY_CACHE_TTL_MINUTES',
        value: '15',
        title: 'Property Cache TTL',
        description: 'Property cache time-to-live in minutes',
        category: ConfigCategory.GENERAL,
        sortOrder: 4,
      },

      // ---- Payment Provider Configuration ----
      {
        key: 'PAYMENT_PROVIDER_APS_ENABLED',
        value: 'true',
        title: 'Enable APS Payment Provider',
        description: 'Enable Amazon Payment Services (APS) payment provider',
        category: ConfigCategory.PAYMENT,
        sortOrder: 1,
      },

      // ---- Payment Security & Configuration ----
      {
        key: 'PAYMENT_TIMEOUT_MINUTES',
        value: '30',
        title: 'Payment Intent Timeout',
        description: 'Minutes before payment intent expires',
        category: ConfigCategory.PAYMENT,
        sortOrder: 3,
      },
      {
        key: 'PAYMENT_MAX_ATTEMPTS',
        value: '3',
        title: 'Payment Max Attempts',
        description: 'Maximum payment attempts before blocking',
        category: ConfigCategory.PAYMENT,
        sortOrder: 4,
      },
      {
        key: 'PAYMENT_RETRY_DELAY_MINUTES',
        value: '5',
        title: 'Payment Retry Delay',
        description: 'Minutes to wait between failed payment attempts',
        category: ConfigCategory.PAYMENT,
        sortOrder: 5,
      },
      {
        key: 'REFUND_REQUIRE_ADMIN_APPROVAL',
        value: 'true',
        title: 'Refund Admin Approval Required',
        description: 'Require admin approval for refunds above threshold',
        category: ConfigCategory.PAYMENT,
        sortOrder: 6,
      },
      {
        key: 'REFUND_ADMIN_THRESHOLD_AMOUNT',
        value: '500',
        title: 'Refund Admin Approval Threshold',
        description: 'Amount above which admin approval is required for refunds',
        category: ConfigCategory.PAYMENT,
        sortOrder: 7,
      },
      {
        key: 'PAYMENT_WEBHOOK_TIMEOUT_SECONDS',
        value: '30',
        title: 'Payment Webhook Timeout',
        description: 'Seconds to wait for payment webhook responses',
        category: ConfigCategory.PAYMENT,
        sortOrder: 8,
      },
      {
        key: 'PAYMENT_VERIFICATION_REQUIRED',
        value: 'true',
        title: 'Payment Verification Required',
        description: 'Require additional verification for large payments',
        category: ConfigCategory.PAYMENT,
        sortOrder: 9,
      },
      {
        key: 'PAYMENT_VERIFICATION_THRESHOLD',
        value: '1000',
        title: 'Payment Verification Threshold',
        description: 'Amount above which payment verification is required',
        category: ConfigCategory.PAYMENT,
        sortOrder: 10,
      },

      // ---- Invoice Configuration ----
      {
        key: 'INVOICE_AUTO_GENERATION',
        value: 'true',
        title: 'Auto Generate Invoices',
        description: 'Automatically generate invoices for confirmed bookings',
        category: ConfigCategory.PAYMENT,
        sortOrder: 11,
      },
      {
        key: 'INVOICE_DUE_DAYS',
        value: '14',
        title: 'Invoice Due Days',
        description: 'Default days until invoice is due',
        category: ConfigCategory.PAYMENT,
        sortOrder: 12,
      },
      {
        key: 'INVOICE_OVERDUE_REMINDER_DAYS',
        value: '3',
        title: 'Invoice Overdue Reminder',
        description: 'Days after due date to send overdue reminder',
        category: ConfigCategory.PAYMENT,
        sortOrder: 13,
      },
      {
        key: 'INVOICE_LATE_FEE_PERCENTAGE',
        value: '5',
        title: 'Invoice Late Fee Percentage',
        description: 'Late fee percentage for overdue invoices',
        category: ConfigCategory.PAYMENT,
        sortOrder: 14,
      },
      {
        key: 'INVOICE_MAX_LINE_ITEMS',
        value: '50',
        title: 'Max Invoice Line Items',
        description: 'Maximum line items allowed per invoice',
        category: ConfigCategory.PAYMENT,
        sortOrder: 15,
      },
      {
        key: 'INVOICE_RETENTION_YEARS',
        value: '7',
        title: 'Invoice Retention Period',
        description: 'Years to retain invoice records for compliance',
        category: ConfigCategory.PAYMENT,
        sortOrder: 16,
      },
      {
        key: 'INVOICE_EMAIL_ENABLED',
        value: 'true',
        title: 'Enable Invoice Emails',
        description: 'Enable sending invoices via email',
        category: ConfigCategory.PAYMENT,
        sortOrder: 17,
      },
      {
        key: 'INVOICE_PDF_GENERATION',
        value: 'true',
        title: 'Enable Invoice PDF Generation',
        description: 'Enable PDF generation for invoices',
        category: ConfigCategory.PAYMENT,
        sortOrder: 18,
      },

      // ---- Payout Configuration ----
      {
        key: 'PAYOUT_MINIMUM_AMOUNT',
        value: '50',
        title: 'Minimum Payout Amount',
        description: 'Minimum amount required to request a payout',
        category: ConfigCategory.PAYOUT,
        sortOrder: 1,
      },
      {
        key: 'PAYOUT_MAXIMUM_AMOUNT',
        value: '100000',
        title: 'Maximum Payout Amount',
        description: 'Maximum amount allowed for a single payout',
        category: ConfigCategory.PAYOUT,
        sortOrder: 2,
      },
      {
        key: 'PAYOUT_HOLD_PERIOD_DAYS',
        value: '1',
        title: 'Payout Hold Period',
        description: 'Days to wait after checkout before payout eligibility',
        category: ConfigCategory.PAYOUT,
        sortOrder: 3,
      },
      {
        key: 'PAYOUT_PROCESSING_DAYS',
        value: '3',
        title: 'Payout Processing Days',
        description: 'Days to process standard payouts',
        category: ConfigCategory.PAYOUT,
        sortOrder: 4,
      },
      {
        key: 'DEFAULT_PAYMENT_PROVIDER',
        value: 'aps',
        title: 'Default Payment Provider',
        description: 'Default payment provider for payouts',
        category: ConfigCategory.PAYOUT,
        sortOrder: 5,
      },

      // ---- Split Payment Configurations ----
      {
        key: 'SPLIT_PAYMENT_ENABLED',
        value: 'true',
        title: 'Enable Split Payments',
        description: 'Enable automatic split payment processing',
        category: ConfigCategory.PAYMENT,
        sortOrder: 19,
      },
      {
        key: 'SPLIT_PAYMENT_AUTO_PROCESS',
        value: 'true',
        title: 'Auto Process Split Payments',
        description: 'Automatically process split payments on booking completion',
        category: ConfigCategory.PAYMENT,
        sortOrder: 20,
      },
      {
        key: 'SPLIT_PAYMENT_RETRY_ATTEMPTS',
        value: '3',
        title: 'Split Payment Retry Attempts',
        description: 'Maximum retry attempts for failed split payments',
        category: ConfigCategory.PAYMENT,
        sortOrder: 21,
      },
      {
        key: 'SPLIT_PAYMENT_RETRY_DELAY_HOURS',
        value: '4',
        title: 'Split Payment Retry Delay',
        description: 'Hours to wait between split payment retry attempts',
        category: ConfigCategory.PAYMENT,
        sortOrder: 22,
      },
      {
        key: 'SPLIT_PAYMENT_ADMIN_THRESHOLD',
        value: '10000',
        title: 'Split Payment Admin Approval Threshold',
        description: 'Amount above which admin approval is required for split payments',
        category: ConfigCategory.PAYMENT,
        sortOrder: 23,
      },
      {
        key: 'SPLIT_PAYMENT_BATCH_SIZE',
        value: '50',
        title: 'Split Payment Batch Size',
        description: 'Batch size for processing split payments',
        category: ConfigCategory.PAYMENT,
        sortOrder: 24,
      },
      {
        key: 'SPLIT_PAYMENT_CONCURRENT_LIMIT',
        value: '5',
        title: 'Split Payment Concurrent Processing Limit',
        description: 'Maximum concurrent split payments to process',
        category: ConfigCategory.PAYMENT,
        sortOrder: 25,
      },
      {
        key: 'SPLIT_PAYMENT_SIMULATION_DELAY',
        value: '100',
        title: 'Split Payment Simulation Delay',
        description: 'Milliseconds delay for simulating split payment processing',
        category: ConfigCategory.PAYMENT,
        sortOrder: 26,
      },

      // ---- Security Configurations ----
      {
        key: 'PASSWORD_MIN_LENGTH',
        value: '8',
        title: 'Minimum Password Length',
        description: 'Minimum password length requirement',
        category: ConfigCategory.SECURITY,
        sortOrder: 7,
      },
      {
        key: 'PASSWORD_REQUIRE_SPECIAL_CHARS',
        value: 'true',
        title: 'Require Special Characters',
        description: 'Require special characters in passwords',
        category: ConfigCategory.SECURITY,
        sortOrder: 8,
      },
      {
        key: 'API_RATE_LIMIT_PER_MINUTE',
        value: '100',
        title: 'API Rate Limit',
        description: 'API requests per minute per user',
        category: ConfigCategory.SECURITY,
        sortOrder: 9,
      },
    ];

    const existingConfigs = await configService.getAll();
    const existingCount = existingConfigs.length;

    if (existingCount === 0) {
      for (const { key, value, title, description, category, sortOrder } of seedItems) {
        await configService.set(key, value, title, description, category, sortOrder);
      }
      SeederLogger.success('dynamic config');
    } else {
      const newConfigs: typeof seedItems = [];
      const updatedConfigs: typeof seedItems = [];

      for (const seedItem of seedItems) {
        const existing = existingConfigs.find((config) => config.key === seedItem.key);
        if (!existing) {
          newConfigs.push(seedItem);
        } else if (
          existing.value !== seedItem.value ||
          existing.title !== seedItem.title ||
          existing.description !== seedItem.description ||
          existing.category !== seedItem.category ||
          existing.sortOrder !== seedItem.sortOrder
        ) {
          updatedConfigs.push(seedItem);
        }
      }

      if (newConfigs.length > 0 || updatedConfigs.length > 0) {
        for (const config of [...newConfigs, ...updatedConfigs]) {
          await configService.set(
            config.key,
            config.value,
            config.title,
            config.description,
            config.category,
            config.sortOrder,
          );
        }

        if (newConfigs.length > 0 && updatedConfigs.length > 0) {
          SeederLogger.modified('dynamic config', newConfigs.length + updatedConfigs.length);
        } else if (newConfigs.length > 0) {
          SeederLogger.success('dynamic config');
        } else {
          SeederLogger.modified('dynamic config', updatedConfigs.length);
        }
      } else {
        SeederLogger.skipped('dynamic config');
      }
    }
  });
}
