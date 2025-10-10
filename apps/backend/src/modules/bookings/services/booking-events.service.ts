import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface BookingEvent {
  eventId: string;
  eventType: string;
  bookingId: string;
  timestamp: Date;
  userId: string;
  metadata?: Record<string, any>;
}

export interface BookingCreatedEvent extends BookingEvent {
  eventType: 'booking.created';
  booking: BookingDocument;
}

export interface BookingConfirmedEvent extends BookingEvent {
  eventType: 'booking.confirmed';
  booking: BookingDocument;
  paymentTransactionId?: string;
}

export interface BookingCancelledEvent extends BookingEvent {
  eventType: 'booking.cancelled';
  booking: BookingDocument;
  cancelledBy: string;
  reason?: string;
}

export interface BookingCheckedInEvent extends BookingEvent {
  eventType: 'booking.checked_in';
  booking: BookingDocument;
  checkedInBy: string;
}

export interface BookingCheckedOutEvent extends BookingEvent {
  eventType: 'booking.checked_out';
  booking: BookingDocument;
  checkedOutBy: string;
}

export interface BookingPaymentProcessedEvent extends BookingEvent {
  eventType: 'booking.payment.processed';
  booking: BookingDocument;
  transactionId: string;
  amount: number;
}

export interface BookingRefundProcessedEvent extends BookingEvent {
  eventType: 'booking.refund.processed';
  booking: BookingDocument;
  refundTransactionId: string;
  refundAmount: number;
}

export interface BookingStatusChangedEvent extends BookingEvent {
  eventType: 'booking.status.changed';
  booking: BookingDocument;
  previousStatus: BookingStatus;
  newStatus: BookingStatus;
  changedBy: string;
}

/**
 * Booking Events Service
 * Implements event-driven architecture for booking operations
 * Handles event emission and provides event history tracking
 */
@Injectable()
export class BookingEventsService {
  private eventHistory: BookingEvent[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emit booking created event
   */
  emitBookingCreated(booking: BookingDocument, userId: string): void {
    const event: BookingCreatedEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.created',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId,
      booking,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.created event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit booking confirmed event
   */
  emitBookingConfirmed(
    booking: BookingDocument,
    userId: string,
    paymentTransactionId?: string,
  ): void {
    const event: BookingConfirmedEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.confirmed',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId,
      booking,
      paymentTransactionId,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.confirmed event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit booking cancelled event
   */
  emitBookingCancelled(booking: BookingDocument, cancelledBy: string, reason?: string): void {
    const event: BookingCancelledEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.cancelled',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId: cancelledBy,
      booking,
      cancelledBy,
      reason,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.cancelled event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit booking checked in event
   */
  emitBookingCheckedIn(booking: BookingDocument, checkedInBy: string): void {
    const event: BookingCheckedInEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.checked_in',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId: checkedInBy,
      booking,
      checkedInBy,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.checked_in event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit booking checked out event
   */
  emitBookingCheckedOut(booking: BookingDocument, checkedOutBy: string): void {
    const event: BookingCheckedOutEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.checked_out',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId: checkedOutBy,
      booking,
      checkedOutBy,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.checked_out event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit payment processed event
   */
  emitBookingPaymentProcessed(
    booking: BookingDocument,
    transactionId: string,
    amount: number,
    userId: string,
  ): void {
    const event: BookingPaymentProcessedEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.payment.processed',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId,
      booking,
      transactionId,
      amount,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.payment.processed event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit refund processed event
   */
  emitBookingRefundProcessed(
    booking: BookingDocument,
    refundTransactionId: string,
    refundAmount: number,
    userId: string,
  ): void {
    const event: BookingRefundProcessedEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.refund.processed',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId,
      booking,
      refundTransactionId,
      refundAmount,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.refund.processed event for booking ${String(booking._id)}`,
      'BookingEventsService',
    );
  }

  /**
   * Emit status changed event
   */
  emitBookingStatusChanged(
    booking: BookingDocument,
    previousStatus: BookingStatus,
    newStatus: BookingStatus,
    changedBy: string,
  ): void {
    const event: BookingStatusChangedEvent = {
      eventId: this.generateEventId(),
      eventType: 'booking.status.changed',
      bookingId: String(booking._id),
      timestamp: new Date(),
      userId: changedBy,
      booking,
      previousStatus,
      newStatus,
      changedBy,
    };

    this.emitEvent(event);
    LoggingUtil.log(
      `Emitted booking.status.changed event for booking ${String(booking._id)}: ${previousStatus} -> ${newStatus}`,
      'BookingEventsService',
    );
  }

  /**
   * Get event history for a booking
   */
  getBookingEventHistory(bookingId: string): BookingEvent[] {
    return this.eventHistory.filter((event) => event.bookingId === bookingId);
  }

  /**
   * Get all events of a specific type
   */
  getEventsByType(eventType: string): BookingEvent[] {
    return this.eventHistory.filter((event) => event.eventType === eventType);
  }

  /**
   * Get recent events (last 24 hours)
   */
  getRecentEvents(hours: number = 24): BookingEvent[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.eventHistory.filter((event) => event.timestamp >= cutoff);
  }

  /**
   * Clear event history older than specified days
   */
  clearOldEvents(days: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const initialCount = this.eventHistory.length;
    this.eventHistory = this.eventHistory.filter((event) => event.timestamp >= cutoff);
    const clearedCount = initialCount - this.eventHistory.length;

    LoggingUtil.log(`Cleared ${clearedCount} old booking events`, 'BookingEventsService');
    return clearedCount;
  }

  /**
   * Generic event emission with error handling
   */
  private emitEvent(event: BookingEvent): void {
    try {
      // Store in history
      this.eventHistory.push(event);

      // Emit using NestJS EventEmitter
      this.eventEmitter.emit(event.eventType, event);

      // Optionally, emit a generic booking event
      this.eventEmitter.emit('booking.event', event);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to emit event ${event.eventType} for booking ${event.bookingId}:`,
        error,
        'BookingEventsService',
      );
      throw error;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
