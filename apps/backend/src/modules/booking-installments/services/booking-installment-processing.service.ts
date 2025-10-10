import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import {
  BookingInstallment,
  BookingInstallmentDocument,
} from '../../../database/schemas/booking-installment.schema';
import {
  InstallmentStatus,
  InstallmentRetryStrategy,
} from '../../../common/enums/installment.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class BookingInstallmentProcessingService {
  processPayment(
    installment: BookingInstallmentDocument,
    paymentMethodId: string,
  ): BookingInstallmentDocument {
    LoggingUtil.log(
      `Processing payment for installment ${String(installment._id)}`,
      'BookingInstallmentProcessingService',
    );

    // Mock payment processing - integrate with actual payment provider
    installment.status = InstallmentStatus.PROCESSING;
    installment.paymentMethodId = paymentMethodId;
    installment.attemptCount += 1;

    try {
      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate for testing

      if (success) {
        installment.status = InstallmentStatus.PAID;
        installment.paidAt = DateUtils.now();
        installment.paidAmount = installment.scheduledAmount;
        installment.paymentIntentId = `pi_mock_${DateUtils.now().getTime()}`;
      } else {
        installment.status = InstallmentStatus.FAILED;
        installment.failedAt = DateUtils.now();
        installment.failureReason = 'Payment declined';
        this.scheduleRetry(installment);
      }

      // Mock save method - should be handled by service layer
      return installment;
    } catch (error: unknown) {
      installment.status = InstallmentStatus.FAILED;
      installment.failedAt = DateUtils.now();
      installment.failureReason = error instanceof Error ? error.message : 'Unknown payment error';
      this.scheduleRetry(installment);
      // Mock save method - should be handled by service layer
      return installment;
    }
  }

  retryPayment(installment: BookingInstallmentDocument): BookingInstallmentDocument {
    LoggingUtil.log(
      `Retrying payment for installment ${String(installment._id)}`,
      'BookingInstallmentProcessingService',
    );

    if (installment.attemptCount >= installment.maxRetryAttempts) {
      LoggingUtil.warn(
        `Maximum retry attempts reached for installment ${String(installment._id)}`,
        'BookingInstallmentProcessingService',
      );
      return installment;
    }

    // Use existing payment method for retry
    return this.processPayment(installment, installment.paymentMethodId || '');
  }

  private scheduleRetry(installment: BookingInstallment): void {
    if (installment.attemptCount >= installment.maxRetryAttempts) {
      return;
    }

    const retryDelay = this.calculateRetryDelay(
      (installment.retryStrategy as InstallmentRetryStrategy) ||
        InstallmentRetryStrategy.EXPONENTIAL,
      installment.attemptCount,
    );

    installment.retryAfter = DateUtils.create(DateUtils.now().getTime() + retryDelay);
  }

  private calculateRetryDelay(strategy: InstallmentRetryStrategy, attemptCount: number): number {
    switch (strategy) {
      case InstallmentRetryStrategy.EXPONENTIAL:
        return Math.pow(2, attemptCount) * 24 * 60 * 60 * 1000; // Days in milliseconds
      case InstallmentRetryStrategy.DAILY:
        return 24 * 60 * 60 * 1000; // 1 day
      case InstallmentRetryStrategy.WEEKLY:
        return 7 * 24 * 60 * 60 * 1000; // 1 week
      default:
        return 24 * 60 * 60 * 1000; // Default to 1 day
    }
  }
}
