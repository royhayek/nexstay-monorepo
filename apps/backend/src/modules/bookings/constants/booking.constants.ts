/**
 * Booking module constants
 */
import { BookingStatus } from '../../../common/enums/booking.enums';

/**
 * Pagination constants for booking listings
 *
 * NOTE: Pagination defaults (DEFAULT_LIMIT, MAX_LIMIT) are now loaded dynamically
 * from database configuration via PaginationConfigService. These values serve as
 * fallback defaults for booking-specific pagination.
 */
export const BOOKING_PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
} as const;

/**
 * Booking validation constants
 *
 * NOTE: Guest limit constants (MAX_ADULTS, MAX_CHILDREN, MAX_INFANTS, MAX_TOTAL_GUESTS)
 * are now loaded dynamically from database configuration via BookingConfigService.
 * These values serve as fallback defaults for DTO validation decorators.
 * Runtime validation in BookingCoreService uses dynamic configuration.
 */
export const BOOKING_VALIDATION_CONSTANTS = {
  MIN_ADULTS: 1,
  MAX_ADULTS: 16,
  MIN_CHILDREN: 0,
  MAX_CHILDREN: 10,
  MIN_INFANTS: 0,
  MAX_INFANTS: 5,
  MIN_TOTAL_GUESTS: 1,
  MAX_TOTAL_GUESTS: 20,
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 365,
  MIN_BASE_AMOUNT: 0,
  MAX_BASE_AMOUNT: 100000,
} as const;

/**
 * Booking business rules constants
 *
 * NOTE: Advance booking rules (MAX_ADVANCE_BOOKING_DAYS, MIN_ADVANCE_BOOKING_HOURS)
 * and AUTO_CANCEL_UNPAID_HOURS are now loaded dynamically from database configuration
 * via BookingConfigService. These values serve as fallback defaults.
 * Runtime validation in BookingCoreService uses dynamic configuration.
 */
export const BOOKING_BUSINESS_CONSTANTS = {
  DEFAULT_CURRENCY: 'USD',
  CONFIRMATION_CODE_LENGTH: 8,
  MAX_ADVANCE_BOOKING_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  CANCELLATION_GRACE_PERIOD_HOURS: 24,
  AUTO_CANCEL_UNPAID_HOURS: 24,
} as const;

/**
 * Booking time constants
 *
 * NOTE: Check-in/check-out times (DEFAULT_CHECKIN_TIME, DEFAULT_CHECKOUT_TIME)
 * are now loaded dynamically from database configuration via BookingConfigService.
 * These values serve as fallback defaults.
 */
export const BOOKING_TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  DEFAULT_CHECKIN_TIME: '15:00',
  DEFAULT_CHECKOUT_TIME: '11:00',
} as const;

/**
 * Booking message constants
 */
export const BOOKING_MESSAGES = {
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_UPDATED: 'Booking updated successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  PROPERTY_NOT_AVAILABLE: 'Property is not available for the selected dates',
  INVALID_DATES: 'Invalid check-in or check-out dates',
  PAST_DATES: 'Check-in date cannot be in the past',
  INVALID_DATE_RANGE: 'Check-out date must be after check-in date',
  GUEST_CAPACITY_EXCEEDED: 'Number of guests exceeds property capacity',
  INSUFFICIENT_PAYMENT: 'Payment amount is insufficient',
  BOOKING_NOT_CANCELLABLE: 'This booking cannot be cancelled',
} as const;

/**
 * Booking status flow constants
 */
export const BOOKING_STATUS_FLOW = {
  ALLOWED_TRANSITIONS: {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
    [BookingStatus.CHECKED_IN]: [BookingStatus.CHECKED_OUT],
    [BookingStatus.CHECKED_OUT]: [],
    [BookingStatus.CANCELLED]: [],
  } as Record<BookingStatus, BookingStatus[]>,
} as const;
