/**
 * Booking-related enums
 * Shared between properties, bookings, and other modules that reference booking statuses
 */

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

/**
 * Booking status groupings for specific use cases
 */
export enum BookingCompletionStatus {
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed', // This should be mapped to CHECKED_OUT in actual usage
}

export enum BookingActiveStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

export enum RefundTypeEnum {
  FULL = 'full',
  PARTIAL = 'partial',
  SERVICE_FEE = 'service_fee',
  CLEANING_FEE = 'cleaning_fee',
}

export enum CancellationInitiatorEnum {
  GUEST = 'guest',
  HOST = 'host',
  ADMIN = 'admin',
  SYSTEM = 'system',
}
