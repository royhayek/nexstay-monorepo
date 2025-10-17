export enum NotificationType {
  // Booking related
  BOOKING_REQUEST = 'booking_request',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  CHECK_IN_REMINDER = 'check_in_reminder',
  CHECK_OUT_REMINDER = 'check_out_reminder',

  // Review related
  REVIEW_RECEIVED = 'review_received',
  REVIEW_REMINDER = 'review_reminder',

  // Property related
  PROPERTY_APPROVED = 'property_approved',
  PROPERTY_REJECTED = 'property_rejected',
  PROPERTY_FLAGGED = 'property_flagged',
  FIRST_LISTING_CONGRATULATIONS = 'first_listing_congratulations',

  // Payment related
  PAYMENT_SUCCESSFUL = 'payment_successful',
  PAYMENT_FAILED = 'payment_failed',
  PAYOUT_PROCESSED = 'payout_processed',

  // Account related
  WELCOME = 'welcome',
  ACCOUNT_VERIFIED = 'account_verified',
  SECURITY_ALERT = 'security_alert',
  PASSWORD_RESET = 'password_reset',

  // Host application related
  HOST_APPLICATION_RECEIVED = 'host_application_received',
  HOST_APPLICATION_APPROVED = 'host_application_approved',
  HOST_APPLICATION_REJECTED = 'host_application_rejected',
  ADMIN_ACTION_REQUIRED = 'admin_action_required',

  // Messages
  NEW_MESSAGE = 'new_message',

  // General
  PROMOTIONAL = 'promotional',
  SYSTEM_UPDATE = 'system_update',
  SYSTEM = 'system',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}
