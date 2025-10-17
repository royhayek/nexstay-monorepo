import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountsFacadeService } from '../../accounts/services/accounts-facade.service';
import { FeeCalculationService } from '../../fees/services/fee-calculation.service';
import { BookingPaymentService } from '../../bookings/services/booking-payment.service';
import { NotificationHelperService } from '../../notifications/helpers/notification-helper.service';
import { PaymentTransactionDocument } from '../../../database/schemas/payment-transaction.schema';
import { PaymentIntentDocument } from '../../../database/schemas/payment-intent.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { PaymentProvider, PaymentTransactionStatus } from '../../../common/enums/payment.enums';
import { TransactionDocument } from '../../../database/schemas/transaction.schema';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';

export interface PaymentAccountsIntegrationResult {
  accountTransactionId?: string;
  escrowTransactionId?: string;
  success: boolean;
  errors: string[];
}

export interface PayoutIntegrationResult {
  payoutTransactionId: string;
  hostEarnings: number;
  platformFees: number;
  success: boolean;
}

/**
 * Enhanced service handling integration between payment providers and accounts module
 * PRIMARY BRIDGE for all financial operations - Manages external payment processing
 * while using accounts module as single source of truth for internal state
 *
 * Architecture:
 * External Payments → PaymentAccountsIntegrationService → Accounts Module
 */
@Injectable()
export class PaymentAccountsIntegrationService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly accountsFacade: AccountsFacadeService,
    private readonly feeCalculationService: FeeCalculationService,
    private readonly bookingPaymentService: BookingPaymentService,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  /**
   * Complete payment flow integration - PRIMARY METHOD
   * Handles both external payment processing and internal account state
   */
  async processCompletePaymentFlow(
    paymentTransaction: PaymentTransactionDocument,
    paymentIntent: PaymentIntentDocument,
  ): Promise<PaymentAccountsIntegrationResult & { bookingUpdated?: boolean }> {
    const errors: string[] = [];
    let bookingUpdated = false;

    try {
      LoggingUtil.log(
        `Processing complete payment flow for transaction: ${String(paymentTransaction._id)}`,
        'PaymentAccountsIntegrationService',
      );

      // Step 1: Process successful payment through accounts module
      const accountsResult = await this.processSuccessfulPayment(paymentTransaction, paymentIntent);

      if (!accountsResult.success) {
        return { ...accountsResult, bookingUpdated };
      }

      // Step 2: Update booking payment status if booking exists
      if (paymentTransaction.bookingId && accountsResult.escrowTransactionId) {
        try {
          LoggingUtil.log(
            `Updating booking ${String(paymentTransaction.bookingId)} status to PAID`,
            'PaymentAccountsIntegrationService',
          );

          await this.bookingPaymentService.updateBookingStatusToPaid(
            String(paymentTransaction.bookingId),
            accountsResult.escrowTransactionId,
          );

          bookingUpdated = true;
          LoggingUtil.log(
            `Booking ${String(paymentTransaction.bookingId)} successfully updated to PAID status`,
            'PaymentAccountsIntegrationService',
          );

          // Step 3: Send payment receipt email notification
          try {
            const booking = await this.bookingModel
              .findById(paymentTransaction.bookingId)
              .populate('propertyId')
              .exec();

            if (booking && booking.propertyId) {
              await this.notificationHelper.sendPaymentSuccessfulNotification(
                booking,
                booking.propertyId as any, // TypeScript workaround for populated field
              );

              LoggingUtil.log(
                `Payment receipt email sent for booking ${String(booking._id)}`,
                'PaymentAccountsIntegrationService',
              );
            }
          } catch (emailError) {
            // Don't fail the entire payment flow if email fails
            LoggingUtil.errorWithException(
              `Failed to send payment receipt email: ${String(emailError)}`,
              emailError,
              'PaymentAccountsIntegrationService',
            );
          }
        } catch (bookingError) {
          const errorMessage = `Failed to update booking status: ${String(bookingError)}`;
          errors.push(errorMessage);
          LoggingUtil.errorWithException(
            errorMessage,
            bookingError,
            'PaymentAccountsIntegrationService',
          );
        }
      }

      return {
        ...accountsResult,
        bookingUpdated,
        success: errors.length === 0,
        errors: [...accountsResult.errors, ...errors],
      };
    } catch (error) {
      const errorMessage = `Error in complete payment flow: ${String(error)}`;
      LoggingUtil.errorWithException(errorMessage, error, 'PaymentAccountsIntegrationService');
      return {
        success: false,
        errors: [errorMessage],
        bookingUpdated,
      };
    }
  }

  /**
   * Check guest account balance before payment
   */
  async checkGuestAccountBalance(guestId: string): Promise<{
    hasAccount: boolean;
    availableBalance: number;
    currency: string;
  }> {
    try {
      const accounts = await this.accountsFacade.getUserAccounts(guestId);

      if (!accounts.guestWallet) {
        return {
          hasAccount: false,
          availableBalance: 0,
          currency: 'USD',
        };
      }

      return {
        hasAccount: true,
        availableBalance: accounts.guestWallet.balance.available,
        currency: accounts.guestWallet.currency,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error checking guest account balance: ${String(error)}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      return {
        hasAccount: false,
        availableBalance: 0,
        currency: 'USD',
      };
    }
  }

  /**
   * Get payment integration summary for admin/reporting
   */
  getPaymentIntegrationSummary(_timeRange: { startDate: Date; endDate: Date }): {
    totalPayments: number;
    totalEscrowHeld: number;
    totalReleased: number;
    pendingEscrows: number;
    integrationHealth: 'healthy' | 'degraded' | 'critical';
  } {
    try {
      // This would query accounts module for summary data
      // For now, return placeholder data
      return {
        totalPayments: 0,
        totalEscrowHeld: 0,
        totalReleased: 0,
        pendingEscrows: 0,
        integrationHealth: 'healthy',
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting integration summary: ${String(error)}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      return {
        totalPayments: 0,
        totalEscrowHeld: 0,
        totalReleased: 0,
        pendingEscrows: 0,
        integrationHealth: 'critical',
      };
    }
  }

  /**
   * Process successful payment transaction through accounts module
   * Creates escrow hold when payment is confirmed by external provider
   */
  async processSuccessfulPayment(
    paymentTransaction: PaymentTransactionDocument,
    paymentIntent: PaymentIntentDocument,
  ): Promise<PaymentAccountsIntegrationResult> {
    const errors: string[] = [];

    try {
      LoggingUtil.log(
        `Processing successful payment ${String(paymentTransaction._id)} through accounts module`,
        'PaymentAccountsIntegrationService',
      );

      // Get user accounts for the customer
      if (!paymentTransaction.customerId) {
        const errorMessage = 'Payment transaction has no customer ID';
        errors.push(errorMessage);
        LoggingUtil.error(errorMessage, undefined, 'PaymentAccountsIntegrationService');
        return { success: false, errors };
      }

      const customerId = paymentTransaction.customerId.toString();
      LoggingUtil.log(
        `Looking up accounts for customerId: ${customerId} (original: ${String(paymentTransaction.customerId)}, type: ${typeof paymentTransaction.customerId})`,
        'PaymentAccountsIntegrationService',
      );

      // Add debugging to see if customerId is valid ObjectId format
      const { Types } = await import('mongoose');
      const isValidObjectId = Types.ObjectId.isValid(customerId);
      LoggingUtil.log(
        `CustomerId validation: isValidObjectId=${isValidObjectId}, length=${customerId.length}`,
        'PaymentAccountsIntegrationService',
      );

      const userAccounts = await this.accountsFacade.getUserAccounts(customerId);

      if (!userAccounts.guestWallet) {
        const errorMessage = `Guest wallet not found for customer ${customerId}. Account lookup may have failed - check ownerId matching logic in database`;
        errors.push(errorMessage);
        LoggingUtil.error(errorMessage, undefined, 'PaymentAccountsIntegrationService');
        return { success: false, errors };
      }

      LoggingUtil.log(
        `Successfully found guest wallet for customer ${customerId}: ${String(userAccounts.guestWallet._id)}`,
        'PaymentAccountsIntegrationService',
      );

      // Create escrow transaction for booking payment
      // This assumes the payment has been successful with external provider
      // and we need to hold the funds in escrow until booking completion
      let escrowTransactionId: string | undefined;

      if (paymentTransaction.bookingId) {
        try {
          // Use booking check-in date if available, otherwise default to 24 hours from now
          const checkInDate = paymentIntent.metadata?.checkInDate
            ? DateUtils.create(paymentIntent.metadata.checkInDate as string)
            : DateUtils.create(DateUtils.nowTimestamp() + 24 * 60 * 60 * 1000);

          // Calculate platform fee rate from fee service (using dynamic config)
          const feeBreakdown = await this.feeCalculationService.calculateFeeBreakdown(
            paymentTransaction.amount.amount,
          );
          const platformFeeRate = feeBreakdown.hostCommission / paymentTransaction.amount.amount;

          LoggingUtil.log(
            `Using dynamic platform fee rate: ${platformFeeRate} (${(platformFeeRate * 100).toFixed(2)}%) for booking payment`,
            'PaymentAccountsIntegrationService',
          );

          const escrowTransaction =
            await this.accountsFacade.createBookingEscrowFromExternalPayment(
              paymentTransaction.customerId.toString(),
              paymentTransaction.amount.amount,
              paymentTransaction.bookingId.toString(),
              checkInDate,
              platformFeeRate,
            );

          escrowTransactionId = String(escrowTransaction._id);
          LoggingUtil.log(
            `Escrow transaction created: ${escrowTransactionId} for payment ${String(paymentTransaction._id)}`,
            'PaymentAccountsIntegrationService',
          );
        } catch (escrowError) {
          const errorMessage = `Failed to create escrow transaction: ${escrowError instanceof Error ? escrowError.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.errorWithException(
            errorMessage,
            escrowError,
            'PaymentAccountsIntegrationService',
          );
        }
      }

      // Record the account integration in payment metadata
      // This links the external payment to our internal account system
      const accountTransactionId = escrowTransactionId;

      return {
        accountTransactionId,
        escrowTransactionId,
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      const errorMessage = `Critical error processing successful payment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      LoggingUtil.errorWithException(errorMessage, error, 'PaymentAccountsIntegrationService');

      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Process payment refund through accounts module
   * Cancels escrow transaction and refunds money to guest wallet
   */
  async processPaymentRefund(
    paymentTransaction: PaymentTransactionDocument,
    refundAmount: number,
    refundReason: string,
  ): Promise<PaymentAccountsIntegrationResult> {
    const errors: string[] = [];

    try {
      LoggingUtil.log(
        `Processing payment refund ${String(paymentTransaction._id)} for amount ${refundAmount}`,
        'PaymentAccountsIntegrationService',
      );

      // Find the original escrow transaction to cancel
      const escrowTransactionId = paymentTransaction.metadata?.escrowTransactionId as string;

      if (!escrowTransactionId) {
        const errorMessage = 'No escrow transaction found to refund';
        errors.push(errorMessage);
        LoggingUtil.warn(errorMessage, 'PaymentAccountsIntegrationService');
      } else {
        try {
          // Cancel the escrow transaction, which refunds money to guest wallet
          const refundTransaction = await this.accountsFacade.cancelEscrowTransaction(
            escrowTransactionId,
            refundReason,
          );

          LoggingUtil.log(
            `Escrow transaction cancelled and refunded: ${String(refundTransaction._id)}`,
            'PaymentAccountsIntegrationService',
          );

          return {
            accountTransactionId: String(refundTransaction._id),
            success: true,
            errors: [],
          };
        } catch (escrowError) {
          const errorMessage = `Failed to cancel escrow transaction: ${escrowError instanceof Error ? escrowError.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.errorWithException(
            errorMessage,
            escrowError,
            'PaymentAccountsIntegrationService',
          );
        }
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      const errorMessage = `Critical error processing payment refund: ${error instanceof Error ? error.message : 'Unknown error'}`;
      LoggingUtil.errorWithException(errorMessage, error, 'PaymentAccountsIntegrationService');

      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Process host payout through accounts module
   * Transfers funds from escrow to host earnings account
   */
  async processHostPayout(
    paymentTransaction: PaymentTransactionDocument,
    payoutMethodId?: string,
    fastPay = false,
  ): Promise<PayoutIntegrationResult> {
    try {
      LoggingUtil.log(
        `Processing host payout for payment ${String(paymentTransaction._id)}`,
        'PaymentAccountsIntegrationService',
      );

      // Find the escrow transaction to release
      const escrowTransactionId = paymentTransaction.metadata?.escrowTransactionId as string;

      if (!escrowTransactionId) {
        throw new Error('No escrow transaction found for payout');
      }

      // Release escrow funds to host and platform accounts
      const releaseResult = await this.accountsFacade.releaseEscrowFunds(escrowTransactionId);

      // Calculate amounts from the release result
      const hostEarnings = releaseResult.hostPayout.amount.value;
      const platformFees = releaseResult.platformFee.amount.value;

      // If fast pay is requested, process immediate payout to external account
      if (fastPay && payoutMethodId) {
        try {
          this.processExternalPayout(releaseResult.hostPayout, payoutMethodId, true);
        } catch (payoutError) {
          LoggingUtil.warn(
            `Failed to process external payout, funds remain in host earnings: ${payoutError instanceof Error ? payoutError.message : 'Unknown error'}`,
            'PaymentAccountsIntegrationService',
          );
          // Don't fail the entire operation - funds are safely in host earnings
        }
      }

      LoggingUtil.log(
        `Host payout processed successfully: Host=${hostEarnings}, Platform=${platformFees}`,
        'PaymentAccountsIntegrationService',
      );

      return {
        payoutTransactionId: String(releaseResult.hostPayout._id),
        hostEarnings,
        platformFees,
        success: true,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error processing host payout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      throw error;
    }
  }

  /**
   * Process external payout to host's bank account or payment method
   * This integrates with external payment providers for actual money transfer
   */
  processExternalPayout(
    hostTransaction: TransactionDocument,
    payoutMethodId: string,
    fastPay = false,
  ): {
    externalTransactionId: string;
    status: 'pending' | 'completed' | 'failed';
    fees?: number;
  } {
    try {
      LoggingUtil.log(
        `Processing external payout: ${String(hostTransaction._id)} to method ${payoutMethodId}`,
        'PaymentAccountsIntegrationService',
      );

      // This is where we would integrate with external payment providers
      // For now, simulate the external payout process

      const payoutAmount = hostTransaction.amount.value;
      const fastPayFee = fastPay ? Math.round(payoutAmount * 0.01) : 0; // 1% fast pay fee
      const netAmount = payoutAmount - fastPayFee;

      // In a real implementation, this would:
      // 1. Call external payment provider API (Stripe Connect, PayPal, etc.)
      // 2. Initiate bank transfer or payment method transfer
      // 3. Handle webhooks for status updates
      // 4. Update transaction status based on provider response

      // Simulate external provider call
      const externalTransactionId = `ext_${DateUtils.nowTimestamp()}_${Math.random().toString(36).substring(2, 11)}`;

      LoggingUtil.log(
        `External payout initiated: ${externalTransactionId}, Amount: ${netAmount}, Fees: ${fastPayFee}`,
        'PaymentAccountsIntegrationService',
      );

      // In production, this would be updated via webhooks
      return {
        externalTransactionId,
        status: fastPay ? 'completed' : 'pending',
        fees: fastPayFee,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error processing external payout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      throw error;
    }
  }

  /**
   * Handle external payment provider webhooks
   * Updates account transactions based on external provider status changes
   */
  handlePaymentWebhook(
    provider: PaymentProvider,
    webhookData: Record<string, unknown>,
  ): {
    processed: boolean;
    transactionUpdated?: string;
  } {
    try {
      LoggingUtil.log(
        `Processing ${provider} webhook: ${(webhookData.type as string) || 'unknown'}`,
        'PaymentAccountsIntegrationService',
      );

      // Handle different webhook types based on provider
      switch (provider) {
        case PaymentProvider.APS:
          return this.handleAPSWebhook(webhookData);
        default:
          LoggingUtil.warn(
            `Unsupported webhook provider: ${String(provider)}`,
            'PaymentAccountsIntegrationService',
          );
          return { processed: false };
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error handling payment webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      return { processed: false };
    }
  }

  /**
   * Handle APS (Amazon Payment Services) webhooks
   */
  private handleAPSWebhook(webhookData: Record<string, unknown>): {
    processed: boolean;
    transactionUpdated?: string;
  } {
    // Implementation for APS-specific webhook handling
    // This would update account transactions based on APS events

    const eventType = webhookData.type as string;
    const transactionId = webhookData.transaction_id as string;

    switch (eventType) {
      case 'payment.succeeded':
        LoggingUtil.log(
          `APS payment succeeded: ${transactionId}`,
          'PaymentAccountsIntegrationService',
        );
        // Update account transaction status if needed
        break;

      case 'payment.failed':
        LoggingUtil.log(
          `APS payment failed: ${transactionId}`,
          'PaymentAccountsIntegrationService',
        );
        // Handle failed payment - might need to reverse escrow
        break;

      case 'payout.completed':
        LoggingUtil.log(
          `APS payout completed: ${transactionId}`,
          'PaymentAccountsIntegrationService',
        );
        // Update payout transaction status
        break;

      default:
        LoggingUtil.log(
          `Unhandled APS webhook event: ${eventType}`,
          'PaymentAccountsIntegrationService',
        );
    }

    return {
      processed: true,
      transactionUpdated: transactionId,
    };
  }

  /**
   * Get payment integration status for a transaction
   * Shows the connection between external payments and internal accounts
   */
  getPaymentIntegrationStatus(_paymentTransactionId: string): {
    paymentStatus: PaymentTransactionStatus;
    accountTransactionId?: string;
    escrowTransactionId?: string;
    escrowStatus?: string;
    hostPayoutId?: string;
    payoutStatus?: string;
  } {
    try {
      // This would query both payment and account systems to show integrated status
      // For now, return a basic structure
      return {
        paymentStatus: PaymentTransactionStatus.SUCCESS,
        // Would be populated from actual database queries
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting payment integration status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'PaymentAccountsIntegrationService',
      );
      throw error;
    }
  }
}
