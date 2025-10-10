import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom booking exceptions for better error handling
 * Provides specific error types for different booking scenarios
 */

export class BookingNotFoundException extends HttpException {
  constructor(bookingId?: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Booking not found',
        error: 'BOOKING_NOT_FOUND',
        bookingId,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PropertyNotAvailableException extends HttpException {
  constructor(checkIn: string, checkOut: string, propertyId?: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: 'Property is not available for the selected dates',
        error: 'PROPERTY_NOT_AVAILABLE',
        checkIn,
        checkOut,
        propertyId,
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidBookingStatusTransitionException extends HttpException {
  constructor(currentStatus: string, newStatus: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        error: 'INVALID_STATUS_TRANSITION',
        currentStatus,
        newStatus,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BookingValidationException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'BOOKING_VALIDATION_ERROR',
        field,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class GuestCapacityExceededException extends HttpException {
  constructor(requestedGuests: number, maxCapacity: number) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Number of guests exceeds property capacity',
        error: 'GUEST_CAPACITY_EXCEEDED',
        requestedGuests,
        maxCapacity,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BookingPaymentException extends HttpException {
  constructor(message: string, paymentIntentId?: string) {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message,
        error: 'BOOKING_PAYMENT_ERROR',
        paymentIntentId,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

export class BookingCancellationException extends HttpException {
  constructor(message: string, bookingId?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'BOOKING_CANCELLATION_ERROR',
        bookingId,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class BookingPaymentFlowException extends HttpException {
  constructor(message: string, transactionId?: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message,
        error: 'BOOKING_PAYMENT_FLOW_ERROR',
        transactionId,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
