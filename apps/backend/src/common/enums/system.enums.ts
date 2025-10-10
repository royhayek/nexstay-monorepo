/**
 * System-level enums that are fixed in code and cannot be changed at runtime.
 * These enums represent core business logic states and workflows.
 */

// Import enums from other files
import { PropertyType, RoomType, BedType, CancellationPolicy } from './property.enums';
import { UserStatus } from './user-status.enums';
import { UserRole, OtpNotificationMethod } from '../../database/schemas/user.schema';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  DevicePlatform,
  NotificationChannel,
} from './notification.enums';
import {
  PaymentProvider,
  PaymentMethodType,
  PaymentTransactionStatus,
  InvoiceStatus,
  PaymentIntentStatus,
  CurrencyCode,
} from './payment.enums';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum ReviewType {
  GUEST_TO_HOST = 'guest_to_host',
  HOST_TO_GUEST = 'host_to_guest',
}

/**
 * All system enums that can have display configurations
 */
export const SYSTEM_ENUMS = {
  // User related
  UserRole,
  UserStatus,
  OtpNotificationMethod,

  // Property related
  PropertyType,
  RoomType,
  BedType,
  CancellationPolicy,

  // Booking related
  BookingStatus,

  // Payment related
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentProvider,
  PaymentMethodType,
  PaymentIntentStatus,
  InvoiceStatus,
  CurrencyCode,

  // Review related
  ReviewType,

  // Notification related
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  DevicePlatform,
  NotificationChannel,
} as const;

export type SystemEnumName = keyof typeof SYSTEM_ENUMS;
export type SystemEnumValue =
  (typeof SYSTEM_ENUMS)[SystemEnumName][keyof (typeof SYSTEM_ENUMS)[SystemEnumName]];
