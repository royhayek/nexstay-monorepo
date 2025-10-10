import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingPaymentService } from './booking-payment.service';
import { BookingCoreService } from './booking-core.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

export interface SagaStep {
  stepId: string;
  stepName: string;
  executed: boolean;
  compensated: boolean;
  metadata?: Record<string, any>;
  executedAt?: Date;
  compensatedAt?: Date;
  error?: string;
}

export interface BookingSagaState {
  sagaId: string;
  bookingId: string;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'COMPENSATING' | 'FAILED';
  steps: SagaStep[];
  startedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  lastError?: string;
}

/**
 * Booking Saga Service
 * Implements the Saga pattern for distributed booking transactions
 * Handles compensation logic for failed booking operations
 */
@Injectable()
export class BookingSagaService {
  private sagaStates = new Map<string, BookingSagaState>();

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly paymentService: BookingPaymentService,
    private readonly coreService: BookingCoreService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Execute booking creation saga
   */
  async executeBookingCreationSaga(
    bookingId: string,
    paymentMethodId?: string,
  ): Promise<BookingSagaState> {
    const sagaId = this.generateSagaId();

    const sagaState: BookingSagaState = {
      sagaId,
      bookingId,
      status: 'PENDING',
      steps: [
        { stepId: '1', stepName: 'validate-booking', executed: false, compensated: false },
        { stepId: '2', stepName: 'process-payment', executed: false, compensated: false },
        { stepId: '3', stepName: 'confirm-booking', executed: false, compensated: false },
        { stepId: '4', stepName: 'send-notifications', executed: false, compensated: false },
        { stepId: '5', stepName: 'update-availability', executed: false, compensated: false },
      ],
      startedAt: new Date(),
    };

    this.sagaStates.set(sagaId, sagaState);

    try {
      LoggingUtil.log(
        `Starting booking creation saga ${sagaId} for booking ${bookingId}`,
        'BookingSagaService',
      );
      sagaState.status = 'EXECUTING';

      // Step 1: Validate booking
      await this.executeStep(sagaState, '1', async () => {
        const booking = await this.coreService.findById(bookingId);
        ValidationUtils.validateEntityExists(booking, bookingId, {
          entityName: 'Booking',
          context: 'BookingSagaService',
        });
        return { bookingData: booking };
      });

      // Step 2: Process payment
      await this.executeStep(sagaState, '2', async () => {
        const paymentResult = await this.paymentService.processBookingPayment(
          bookingId,
          paymentMethodId,
        );
        if (!paymentResult.paymentSuccess) {
          throw new Error(paymentResult.errorMessage || 'Payment processing failed');
        }
        return { transactionId: paymentResult.transactionId };
      });

      // Step 3: Confirm booking
      await this.executeStep(sagaState, '3', async () => {
        await this.coreService.updateStatus(bookingId, BookingStatus.CONFIRMED, 'system');
        await this.coreService.updatePaymentStatus(bookingId, PaymentStatus.PAID);
        return { status: 'confirmed' };
      });

      // Step 4: Send notifications
      await this.executeStep(sagaState, '4', () => {
        // Placeholder for notification sending
        // In a real implementation, this would call the appropriate notification methods
        LoggingUtil.log(
          `Sending booking confirmation notifications for booking ${bookingId}`,
          'BookingSagaService',
        );
        return Promise.resolve({ notificationsSent: true });
      });

      // Step 5: Update property availability
      await this.executeStep(sagaState, '5', () => {
        // This would integrate with property service to block dates
        // For now, we'll log it as a placeholder
        LoggingUtil.log(
          `Property availability updated for booking ${bookingId}`,
          'BookingSagaService',
        );
        return Promise.resolve({ availabilityUpdated: true });
      });

      sagaState.status = 'COMPLETED';
      sagaState.completedAt = new Date();

      LoggingUtil.log(
        `Booking creation saga ${sagaId} completed successfully`,
        'BookingSagaService',
      );
      return sagaState;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Booking creation saga ${sagaId} failed:`,
        error,
        'BookingSagaService',
      );
      sagaState.status = 'COMPENSATING';
      sagaState.lastError = error instanceof Error ? error.message : 'Unknown error';

      await this.compensateSaga(sagaState);
      return sagaState;
    }
  }

  /**
   * Execute booking cancellation saga
   */
  async executeBookingCancellationSaga(
    bookingId: string,
    cancelledBy: string,
    reason?: string,
  ): Promise<BookingSagaState> {
    const sagaId = this.generateSagaId();

    const sagaState: BookingSagaState = {
      sagaId,
      bookingId,
      status: 'PENDING',
      steps: [
        { stepId: '1', stepName: 'validate-cancellation', executed: false, compensated: false },
        { stepId: '2', stepName: 'process-refund', executed: false, compensated: false },
        { stepId: '3', stepName: 'update-booking-status', executed: false, compensated: false },
        { stepId: '4', stepName: 'release-availability', executed: false, compensated: false },
        {
          stepId: '5',
          stepName: 'send-cancellation-notifications',
          executed: false,
          compensated: false,
        },
      ],
      startedAt: new Date(),
    };

    this.sagaStates.set(sagaId, sagaState);

    try {
      LoggingUtil.log(
        `Starting booking cancellation saga ${sagaId} for booking ${bookingId}`,
        'BookingSagaService',
      );
      sagaState.status = 'EXECUTING';

      // Step 1: Validate cancellation
      await this.executeStep(sagaState, '1', async () => {
        const booking = await this.coreService.findById(bookingId);
        if (booking.status === BookingStatus.CANCELLED) {
          throw new Error('Booking is already cancelled');
        }
        if (booking.status === BookingStatus.CHECKED_OUT) {
          throw new Error('Cannot cancel completed booking');
        }
        return { bookingData: booking };
      });

      // Step 2: Process refund
      await this.executeStep(sagaState, '2', async () => {
        const refundResult = await this.paymentService.processBookingRefund(
          bookingId,
          reason || 'Booking cancelled',
        );
        return { refundTransactionId: refundResult.refundTransactionId };
      });

      // Step 3: Update booking status
      await this.executeStep(sagaState, '3', async () => {
        await this.coreService.updateStatus(bookingId, BookingStatus.CANCELLED, cancelledBy);
        return { status: 'cancelled' };
      });

      // Step 4: Release availability
      await this.executeStep(sagaState, '4', () => {
        // This would integrate with property service to release dates
        LoggingUtil.log(
          `Property availability released for booking ${bookingId}`,
          'BookingSagaService',
        );
        return Promise.resolve({ availabilityReleased: true });
      });

      // Step 5: Send notifications
      await this.executeStep(sagaState, '5', () => {
        // Placeholder for cancellation notification sending
        LoggingUtil.log(
          `Sending booking cancellation notifications for booking ${bookingId}`,
          'BookingSagaService',
        );
        return Promise.resolve({ notificationsSent: true });
      });

      sagaState.status = 'COMPLETED';
      sagaState.completedAt = new Date();

      LoggingUtil.log(
        `Booking cancellation saga ${sagaId} completed successfully`,
        'BookingSagaService',
      );
      return sagaState;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Booking cancellation saga ${sagaId} failed:`,
        error,
        'BookingSagaService',
      );
      sagaState.status = 'COMPENSATING';
      sagaState.lastError = error instanceof Error ? error.message : 'Unknown error';

      await this.compensateSaga(sagaState);
      return sagaState;
    }
  }

  /**
   * Execute a single saga step with error handling
   */
  private async executeStep(
    sagaState: BookingSagaState,
    stepId: string,
    action: () => Promise<any>,
  ): Promise<void> {
    const step = sagaState.steps.find((s) => s.stepId === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in saga`);
    }

    try {
      LoggingUtil.log(`Executing saga step ${stepId}: ${step.stepName}`, 'BookingSagaService');

      const result: unknown = await action();

      step.executed = true;
      step.executedAt = new Date();
      step.metadata = result as Record<string, unknown>;

      LoggingUtil.log(`Saga step ${stepId} completed successfully`, 'BookingSagaService');
    } catch (error) {
      step.error = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.errorWithException(`Saga step ${stepId} failed:`, error, 'BookingSagaService');
      throw error;
    }
  }

  /**
   * Compensate saga by reversing executed steps
   */
  private async compensateSaga(sagaState: BookingSagaState): Promise<void> {
    LoggingUtil.log(`Starting compensation for saga ${sagaState.sagaId}`, 'BookingSagaService');

    // Compensate steps in reverse order
    const executedSteps = sagaState.steps
      .filter((step) => step.executed && !step.compensated)
      .reverse();

    for (const step of executedSteps) {
      try {
        await this.compensateStep(sagaState, step);
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to compensate step ${step.stepId}:`,
          error,
          'BookingSagaService',
        );
        // Continue with other compensations even if one fails
      }
    }

    sagaState.status = 'FAILED';
    sagaState.failedAt = new Date();

    LoggingUtil.log(`Saga compensation completed for ${sagaState.sagaId}`, 'BookingSagaService');
  }

  /**
   * Compensate individual step
   */
  private async compensateStep(sagaState: BookingSagaState, step: SagaStep): Promise<void> {
    LoggingUtil.log(`Compensating step ${step.stepId}: ${step.stepName}`, 'BookingSagaService');

    switch (step.stepName) {
      case 'process-payment':
        // Reverse payment by issuing refund
        if (step.metadata?.transactionId) {
          await this.paymentService.processBookingRefund(sagaState.bookingId, 'Saga compensation');
        }
        break;

      case 'confirm-booking':
        // Revert booking status back to pending
        await this.coreService.updateStatus(sagaState.bookingId, BookingStatus.PENDING, 'system');
        break;

      case 'send-notifications': {
        // Send compensation notifications
        LoggingUtil.log(
          `Sending error notification for booking ${sagaState.bookingId}`,
          'BookingSagaService',
        );
        break;
      }

      case 'update-availability':
        // Release the blocked dates
        LoggingUtil.log(
          `Releasing availability for booking ${sagaState.bookingId}`,
          'BookingSagaService',
        );
        break;

      case 'process-refund':
        // Log refund compensation (refunds generally shouldn't be reversed)
        LoggingUtil.log(
          `Refund compensation for booking ${sagaState.bookingId}`,
          'BookingSagaService',
        );
        break;

      default:
        LoggingUtil.log(`No compensation defined for step ${step.stepName}`, 'BookingSagaService');
    }

    step.compensated = true;
    step.compensatedAt = new Date();
  }

  /**
   * Get saga state by ID
   */
  getSagaState(sagaId: string): BookingSagaState | undefined {
    return this.sagaStates.get(sagaId);
  }

  /**
   * Get all sagas for a booking
   */
  getBookingSagas(bookingId: string): BookingSagaState[] {
    return Array.from(this.sagaStates.values()).filter((saga) => saga.bookingId === bookingId);
  }

  /**
   * Generate unique saga ID
   */
  private generateSagaId(): string {
    return `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
