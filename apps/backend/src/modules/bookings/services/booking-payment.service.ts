import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { AccountsFacadeService } from '../../accounts/services/accounts-facade.service';
import { DynamicConfigService } from '../../config/config.service';
import { FeeCalculationService } from '../../fees/services/fee-calculation.service';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { BookingPaymentFlowException } from '../exceptions/booking.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

export interface BookingPaymentResult {
  transactionId: string;
  escrowTransactionId?: string;
  paymentSuccess: boolean;
  errorMessage?: string;
}

export interface BookingRefundResult {
  refundTransactionId: string;
  escrowReleaseTransactionId?: string;
  refundAmount: number;
  refundSuccess: boolean;
}

export interface BookingPayoutResult {
  payoutTransactionId: string;
  hostEarnings: number;
  platformFees: number;
  payoutSuccess: boolean;
}

/**
 * Service handling booking payment integration with accounts module
 */
@Injectable()
export class BookingPaymentService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly accountsFacade: AccountsFacadeService,
    private readonly configService: DynamicConfigService,
    private readonly feeCalculationService: FeeCalculationService,
  ) {}

  /**
   * Process payment for a booking
   */
  async processBookingPayment(
    bookingId: string,
    _paymentMethodId?: string,
  ): Promise<BookingPaymentResult> {
    ValidationUtils.validateObjectId(bookingId, 'bookingId', {
      context: 'BookingPaymentService',
    });

    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('guest')
        .populate('property')
        .exec();

      ValidationUtils.validateEntityExists(booking, bookingId, {
        entityName: 'Booking',
        context: 'BookingPaymentService',
      });

      if (booking!.status !== BookingStatus.PENDING) {
        throw new BookingPaymentFlowException('Booking is not in pending status');
      }

      // 1. Create booking escrow transaction
      // Get guest wallet ID first
      const userAccounts = await this.accountsFacade.getUserAccounts(booking!.guestId.toString());
      if (!userAccounts.guestWallet) {
        throw new BookingPaymentFlowException('Guest wallet not found');
      }

      // Calculate fees using FeeCalculationService
      const feeBreakdown = await this.feeCalculationService.calculateFeeBreakdown(
        booking!.pricing.totalAmount,
      );

      const escrowTransaction = await this.accountsFacade.createBookingEscrow(
        String(userAccounts.guestWallet._id),
        booking!.hostId.toString(),
        booking!.pricing.totalAmount,
        bookingId,
        booking!.checkIn,
        feeBreakdown.hostCommission / booking!.pricing.totalAmount, // Calculate platform fee rate
      );

      // 2. Update booking status
      await this.bookingModel.findByIdAndUpdate(bookingId, {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        confirmedAt: DateUtils.now(),
        paymentIntentId: String(escrowTransaction._id),
      });

      LoggingUtil.log(
        `Booking payment processed successfully: ${bookingId}`,
        'BookingPaymentService',
      );

      return {
        transactionId: String(escrowTransaction._id),
        escrowTransactionId: String(escrowTransaction._id),
        paymentSuccess: true,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error processing booking payment: ${(error as Error).message}`,
        error,
        'BookingPaymentService',
      );
      throw error;
    }
  }

  /**
   * Process refund for a cancelled booking
   */
  async processBookingRefund(
    bookingId: string,
    refundReason: string,
  ): Promise<BookingRefundResult> {
    try {
      const booking = await this.bookingModel
        .findById(bookingId)
        .populate('guest')
        .populate('property')
        .exec();

      if (!booking) {
        throw new BookingPaymentFlowException('Booking not found');
      }

      if (booking.paymentStatus !== PaymentStatus.PAID) {
        throw new BookingPaymentFlowException('Booking payment not found or already refunded');
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefundAmount(booking);

      // 1. Cancel/release the escrow transaction if it exists
      let escrowReleaseTransactionId: string | undefined;
      if (booking.paymentIntentId) {
        const releaseResult = await this.accountsFacade.cancelEscrowTransaction(
          booking.paymentIntentId,
          `Booking cancelled: ${refundReason}`,
        );
        escrowReleaseTransactionId = String(releaseResult._id);
      }

      // 2. Update booking status
      await this.bookingModel.findByIdAndUpdate(bookingId, {
        paymentStatus: PaymentStatus.REFUNDED,
        status: BookingStatus.CANCELLED,
        cancelledAt: DateUtils.now(),
        cancellationReason: refundReason,
        refundAmount,
        refundDate: DateUtils.now(),
      });

      LoggingUtil.errorWithException(
        `Booking refund processed successfully: ${bookingId}`,
        'BookingPaymentService',
      );

      return {
        refundTransactionId: escrowReleaseTransactionId || '',
        escrowReleaseTransactionId,
        refundAmount,
        refundSuccess: true,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error processing booking refund: ${(error as Error).message}`,
        error,
        'BookingPaymentService',
      );
      throw error;
    }
  }

  /**
   * Process host payout after checkout
   */
  async processHostPayout(bookingId: string): Promise<BookingPayoutResult> {
    try {
      const booking = await this.bookingModel.findById(bookingId).populate('property').exec();

      if (!booking) {
        throw new BookingPaymentFlowException('Booking not found');
      }

      if (booking.status !== BookingStatus.CHECKED_OUT) {
        throw new BookingPaymentFlowException('Booking must be checked out before payout');
      }

      if (!booking.paymentIntentId) {
        throw new BookingPaymentFlowException('No payment transaction found for this booking');
      }

      // Calculate final payout amounts using FeeCalculationService
      const feeBreakdown = await this.feeCalculationService.calculateFeeBreakdown(
        booking.pricing.totalAmount,
      );
      const hostEarnings = feeBreakdown.totalHostPayout;
      const platformFees = feeBreakdown.totalPlatformRevenue;

      // 1. Release escrow funds to host
      const releaseResult = await this.accountsFacade.releaseEscrowFunds(booking.paymentIntentId);

      // 2. Update booking with payout information
      await this.bookingModel.findByIdAndUpdate(bookingId, {
        payoutStatus: booking.payoutStatus, // Keep existing status or update as needed
      });

      LoggingUtil.log(
        `Host payout processed successfully for booking: ${bookingId}`,
        'BookingPaymentService',
      );

      return {
        payoutTransactionId: String(releaseResult.hostPayout._id),
        hostEarnings,
        platformFees,
        payoutSuccess: true,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error processing host payout: ${(error as Error).message}`,
        error,
        'BookingPaymentService',
      );
      throw error;
    }
  }

  /**
   * Calculate refund amount based on cancellation policy and timing
   */
  private calculateRefundAmount(booking: BookingDocument): number {
    const now = DateUtils.now();
    const checkInDate = DateUtils.create(booking.checkIn);
    const daysDifference = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Simple cancellation policy - can be enhanced based on property settings
    let refundPercentage = 0;

    if (daysDifference >= 7) {
      refundPercentage = 1.0; // Full refund if cancelled 7+ days before
    } else if (daysDifference >= 1) {
      refundPercentage = 0.5; // 50% refund if cancelled 1-6 days before
    } else {
      refundPercentage = 0.0; // No refund if cancelled same day
    }

    // Always deduct service fees from refunds
    const baseRefund = booking.pricing.totalAmount * refundPercentage;
    const serviceFeeDeduction = (booking.pricing.serviceFee || 0) * 0.5; // 50% service fee retained

    return Math.max(0, baseRefund - serviceFeeDeduction);
  }

  /**
   * Update booking status to PAID after external payment confirmation
   * This is called from payment confirmation flow when external payment succeeds
   */
  async updateBookingStatusToPaid(bookingId: string, escrowTransactionId: string): Promise<void> {
    ValidationUtils.validateObjectId(bookingId, 'bookingId', {
      context: 'BookingPaymentService',
    });

    try {
      const booking = await this.bookingModel.findById(bookingId).exec();

      ValidationUtils.validateEntityExists(booking, bookingId, {
        entityName: 'Booking',
        context: 'BookingPaymentService',
      });

      // Update booking status to paid and confirmed
      await this.bookingModel.findByIdAndUpdate(bookingId, {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
        confirmedAt: DateUtils.now(),
        paymentIntentId: escrowTransactionId,
      });

      LoggingUtil.log(
        `Booking ${bookingId} status updated to PAID with escrow transaction ${escrowTransactionId}`,
        'BookingPaymentService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating booking status to paid: ${(error as Error).message}`,
        error,
        'BookingPaymentService',
      );
      throw error;
    }
  }

  /**
   * Get booking payment status and transaction details
   */
  async getBookingPaymentStatus(bookingId: string): Promise<{
    paymentStatus: PaymentStatus;
    paymentIntentId?: string;
    refundAmount?: number;
    refundDate?: Date;
  }> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new BookingPaymentFlowException('Booking not found');
    }

    return {
      paymentStatus: booking.paymentStatus,
      paymentIntentId: booking.paymentIntentId,
      refundAmount: booking.refundAmount,
      refundDate: booking.refundDate,
    };
  }
}
