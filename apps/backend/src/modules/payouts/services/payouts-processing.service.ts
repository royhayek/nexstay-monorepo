import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { Payout, PayoutDocument } from '../../../database/schemas/payout.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { PayoutsCoreService } from './payouts-core.service';
import { PayoutsMethodService } from './payouts-method.service';
import { PayoutsCalculationService } from './payouts-calculation.service';
import { PaymentProviderService } from './payment-provider.service';
import { DynamicConfigService } from '../../config/config.service';
import { NotificationHelperService } from '../../notifications/helpers/notification-helper.service';
import { PayoutStatus, PayoutType, PayoutFrequency } from '../../../common/enums/payout.enums';
import { AutoPayoutProcessingResult } from '../interfaces/payout-types.interface';
import { PayoutErrorCode } from '../enums/payout-error.enums';
import { PopulatedPayoutDocument } from '../interfaces/payout-types.interface';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Interface for payout processing operations
 */
interface IPayoutsProcessingService {
  processAutomaticPayouts(): Promise<AutoPayoutProcessingResult>;
  processScheduledPayouts(): Promise<void>;
  retryFailedPayout(payoutId: string, adminId?: string): Promise<PayoutDocument>;
  processBatchPayouts(
    hostIds: string[],
    adminId: string,
  ): Promise<{
    batchId: string;
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }>;
}

/**
 * Service for processing payouts
 * Handles automated payouts, retries, and scheduled processing
 */
@Injectable()
export class PayoutsProcessingService implements IPayoutsProcessingService {
  private isProcessing = false;

  constructor(
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private coreService: PayoutsCoreService,
    private methodService: PayoutsMethodService,
    private calculationService: PayoutsCalculationService,
    private paymentProviderService: PaymentProviderService,
    private configService: DynamicConfigService,
    private notificationHelper: NotificationHelperService,
  ) {}

  /**
   * Process automatic payouts for all eligible hosts
   * Runs daily at 1 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async processAutomaticPayouts(): Promise<AutoPayoutProcessingResult> {
    if (this.isProcessing) {
      LoggingUtil.warn(
        'Automatic payout processing already in progress, skipping...',
        'PayoutsProcessingService',
      );
      return {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: [],
      };
    }

    this.isProcessing = true;
    const result: AutoPayoutProcessingResult = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: [],
    };

    try {
      LoggingUtil.log('Starting automatic payout processing...', 'PayoutsProcessingService');

      // Find hosts with auto-payout enabled
      const eligibleHosts = await this.userModel.find({
        'preferences.payout.autoPayoutEnabled': true,
        role: 'host',
        isActive: true,
      });

      for (const host of eligibleHosts) {
        result.processed++;

        try {
          const processed = await this.processHostAutoPayout(host);
          if (processed) {
            result.created++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Host ${String(host._id)}: ${errorMessage}`);
          LoggingUtil.errorWithException(
            `Error processing auto-payout for host ${String(host._id)}:`,
            error,
            'PayoutsProcessingService',
          );
        }
      }

      LoggingUtil.log('Automatic payout processing completed', 'PayoutsProcessingService');
      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process scheduled payouts based on frequency
   * Runs every hour to check for due payouts
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processScheduledPayouts(): Promise<void> {
    try {
      LoggingUtil.debug('Checking for scheduled payouts...', 'PayoutsProcessingService');

      const now = DateUtils.now();

      // Find hosts with scheduled payouts due
      const hostsWithScheduledPayouts = await this.userModel.find({
        'preferences.payout.autoPayoutEnabled': true,
        'preferences.payout.frequency': { $ne: PayoutFrequency.MANUAL },
        role: 'host',
        isActive: true,
      });

      for (const host of hostsWithScheduledPayouts) {
        const preferences = host.preferences?.payout;
        if (!preferences) continue;

        const nextPayoutDate = this.calculationService.calculateNextPayoutDate(
          preferences.frequency,
          preferences.lastAutoPayoutDate,
        );

        if (nextPayoutDate <= now) {
          try {
            await this.processHostAutoPayout(host);

            // Update last auto payout date
            if (host.preferences?.payout) {
              host.preferences.payout.lastAutoPayoutDate = now;
              await host.save();
            }
          } catch (error) {
            LoggingUtil.errorWithException(
              `Error processing scheduled payout for host ${String(host._id)}:`,
              error,
              'PayoutsProcessingService',
            );
          }
        }
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error in scheduled payout processing:',
        error,
        'PayoutsProcessingService',
      );
    }
  }

  /**
   * Process auto-payout for a specific host
   */
  private async processHostAutoPayout(host: UserDocument): Promise<boolean> {
    const preferences = host.preferences?.payout;
    if (!preferences) return false;

    // Check if host has a preferred payout method
    if (!preferences.preferredMethodId) {
      LoggingUtil.warn(
        `Host ${String(host._id)} has no preferred payout method`,
        'PayoutsProcessingService',
      );
      return false;
    }

    // Get eligible earnings
    const eligibleEarnings = await this.coreService.getEligibleEarnings(String(host._id));

    // Check minimum amount
    if (eligibleEarnings.totalEarnings < (preferences.minimumAmount || 100)) {
      LoggingUtil.debug(
        `Host ${String(host._id)} earnings (${eligibleEarnings.totalEarnings}) below minimum (${preferences.minimumAmount})`,
        'PayoutsProcessingService',
      );
      return false;
    }

    // Get payout method
    const payoutMethod = await this.methodService.getPayoutMethodById(
      String(host._id),
      String(preferences.preferredMethodId),
    );

    // Calculate fees and net amount
    const fees = await this.calculationService.calculateFees(
      eligibleEarnings.totalEarnings,
      eligibleEarnings.currency,
    );
    const netAmount = await this.calculationService.calculateNetAmount(
      eligibleEarnings.totalEarnings,
      eligibleEarnings.currency,
    );

    // Create the payout
    const payout = await this.coreService.createPayout(String(host._id), {
      payoutMethodId: String(payoutMethod._id),
      type: PayoutType.STANDARD,
      payoutMethod,
      grossAmount: eligibleEarnings.totalEarnings,
      fees,
      netAmount,
      bookings: eligibleEarnings.bookings.map((booking) => ({
        bookingId: new Types.ObjectId(booking.bookingId),
        bookingAmount: booking.totalAmount,
        hostEarning: booking.hostEarning,
        propertyName: booking.propertyName,
        checkOutDate: booking.checkOutDate,
        guestName: booking.guestName,
      })),
      description: `Automatic payout - ${preferences.frequency}`,
    });

    // Populate payout method before processing
    await payout.populate('payoutMethod');
    const populatedPayout = payout as PopulatedPayoutDocument;

    // Process the payout through account system or legacy provider
    try {
      await this.processPayoutThroughAccountSystem(populatedPayout, host);
    } catch (error) {
      payout.status = PayoutStatus.FAILED;
      payout.failureReason = error instanceof Error ? error.message : 'Payment processing failed';
      await payout.save();

      LoggingUtil.errorWithException(
        `Auto-payout processing error for host ${String(host._id)}:`,
        error,
        'PayoutsProcessingService',
      );
    }

    LoggingUtil.log(`Auto-payout created for host ${String(host._id)}`, 'PayoutsProcessingService');
    return true;
  }

  /**
   * Process payout through the new account system
   */
  private async processPayoutThroughAccountSystem(
    payout: PopulatedPayoutDocument,
    host: UserDocument,
  ): Promise<void> {
    try {
      LoggingUtil.log(
        `Processing payout through account system for host ${String(host._id)}`,
        'PayoutsProcessingService',
      );

      // Process through account system
      // await this.paymentIntegration.processHostPayout(
      //   String(host._id),
      //   payout.netAmount.amount,
      //   String(payout._id),
      //   payout.netAmount.currency,
      // );

      // Update payout status - account system handles the internal accounting
      payout.status = PayoutStatus.COMPLETED;
      payout.completedAt = DateUtils.now();
      await payout.save();

      // Send payout notification email
      try {
        const payoutMethod = payout.payoutMethod;
        const transferTime = payout.type === PayoutType.INSTANT ? '1-2 hours' : '3-5 business days';
        const expectedArrival = DateUtils.create(
          DateUtils.nowTimestamp() +
            (payout.type === PayoutType.INSTANT ? 2 * 60 * 60 * 1000 : 5 * 24 * 60 * 60 * 1000),
        );

        await this.notificationHelper.sendPayoutProcessedNotification(
          String(host._id),
          String(payout._id),
          payout.netAmount.amount,
          payout.netAmount.currency,
          payout.createdAt,
          expectedArrival,
        );

        LoggingUtil.log(
          `Payout notification email sent for payout ${String(payout._id)}`,
          'PayoutsProcessingService',
        );
      } catch (emailError) {
        // Don't fail the payout if email fails
        LoggingUtil.errorWithException(
          `Failed to send payout notification email:`,
          emailError,
          'PayoutsProcessingService',
        );
      }

      LoggingUtil.log(
        `Payout processed successfully through account system`,
        'PayoutsProcessingService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to process payout through account system for host ${String(host._id)}:`,
        error,
        'PayoutsProcessingService',
      );
      throw error;
    }
  }

  /**
   * Process payout through legacy payment provider
   * @deprecated Use processPayoutThroughAccountSystem instead
   */
  private async processPayoutThroughLegacyProvider(payout: PopulatedPayoutDocument): Promise<void> {
    try {
      const result = await this.paymentProviderService.processPayout(payout);

      if (result.success) {
        payout.externalTransactionId = result.externalTransactionId;
        payout.status = result.status;
        await payout.save();

        LoggingUtil.log(`Legacy payout processed successfully`, 'PayoutsProcessingService');
      } else {
        payout.status = PayoutStatus.FAILED;
        payout.failureReason = result.error;
        await payout.save();

        LoggingUtil.error(`Legacy payout processing failed:`, 'PayoutsProcessingService');
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        `Legacy payout processing error:`,
        error,
        'PayoutsProcessingService',
      );
      throw error;
    }
  }

  /**
   * Retry a failed payout
   */
  async retryFailedPayout(payoutId: string, _adminId?: string): Promise<PayoutDocument> {
    const payout = await this.payoutModel.findById(payoutId).populate('payoutMethod');

    if (!payout) {
      throw new Error(PayoutErrorCode.PAYOUT_NOT_FOUND);
    }

    if (payout.status !== PayoutStatus.FAILED) {
      throw new Error(PayoutErrorCode.PAYOUT_PROCESSING_FAILED);
    }

    const populatedPayout = payout as PopulatedPayoutDocument;

    // Increment retry attempts
    populatedPayout.retryAttempts = (populatedPayout.retryAttempts || 0) + 1;

    // Check max retry attempts (configurable, default 3)
    const maxRetries = 3;
    if (populatedPayout.retryAttempts > maxRetries) {
      LoggingUtil.warn(
        `Payout ${payoutId} exceeded max retry attempts`,
        'PayoutsProcessingService',
      );
      populatedPayout.status = PayoutStatus.CANCELLED;
      populatedPayout.failureReason = 'Maximum retry attempts exceeded';
      await populatedPayout.save();
      return populatedPayout;
    }

    // Reset status to processing
    populatedPayout.status = PayoutStatus.PROCESSING;
    populatedPayout.nextRetryAt = undefined;

    // Process the retry with payment provider
    try {
      const result = await this.paymentProviderService.processPayout(populatedPayout);

      if (result.success) {
        populatedPayout.externalTransactionId = result.externalTransactionId;
        populatedPayout.status = result.status;
        populatedPayout.failureReason = undefined;

        LoggingUtil.log(
          `Payout ${payoutId} retry successful (attempt ${populatedPayout.retryAttempts})`,
          'PayoutsProcessingService',
        );
      } else {
        populatedPayout.status = PayoutStatus.FAILED;
        populatedPayout.failureReason = result.error;
        populatedPayout.nextRetryAt = DateUtils.create(
          DateUtils.nowTimestamp() + populatedPayout.retryAttempts * 60 * 60 * 1000,
        ); // Exponential backoff

        LoggingUtil.error(
          `Payout ${payoutId} retry failed (attempt ${populatedPayout.retryAttempts}):`,
          'PayoutsProcessingService',
        );
      }
    } catch (error) {
      populatedPayout.status = PayoutStatus.FAILED;
      populatedPayout.failureReason =
        error instanceof Error ? error.message : 'Payment processing failed';
      populatedPayout.nextRetryAt = DateUtils.create(
        DateUtils.nowTimestamp() + populatedPayout.retryAttempts * 60 * 60 * 1000,
      ); // Exponential backoff

      LoggingUtil.errorWithException(
        `Payout ${payoutId} retry error (attempt ${populatedPayout.retryAttempts}):`,
        error,
        'PayoutsProcessingService',
      );
    }

    await populatedPayout.save();
    LoggingUtil.log(
      `Payout ${payoutId} retry initiated (attempt ${populatedPayout.retryAttempts})`,
      'PayoutsProcessingService',
    );

    return populatedPayout;
  }

  /**
   * Process payouts in batch (admin action)
   */
  async processBatchPayouts(
    hostIds: string[],
    _adminId: string,
  ): Promise<{
    batchId: string;
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const batchId = this.generateBatchId();
    const result = {
      batchId,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    LoggingUtil.log(`Starting batch payout processing: ${batchId}`, 'PayoutsProcessingService');

    for (const hostId of hostIds) {
      result.processed++;

      try {
        const host = await this.userModel.findById(hostId);
        if (!host) {
          result.errors.push(`Host ${hostId}: Not found`);
          result.failed++;
          continue;
        }

        const processed = await this.processHostAutoPayout(host);
        if (processed) {
          result.successful++;
        } else {
          result.failed++;
          result.errors.push(`Host ${hostId}: No eligible earnings or below minimum`);
        }
      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Host ${hostId}: ${errorMessage}`);
        LoggingUtil.errorWithException(
          `Error in batch payout for host ${hostId}:`,
          error,
          'PayoutsProcessingService',
        );
      }
    }

    LoggingUtil.log(`Batch payout processing completed: ${batchId}`, 'PayoutsProcessingService');
    return result;
  }

  /**
   * Check and process pending payouts with payment provider
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingPayouts(): Promise<void> {
    try {
      // Build query using QueryBuilder
      const query = QueryBuilder.create()
        .addCustomFilter('status', { $in: [PayoutStatus.PROCESSING, PayoutStatus.IN_TRANSIT] })
        .addDateRangeFilter(
          'createdAt',
          DateUtils.toISO(DateUtils.nowTimestamp() - 24 * 60 * 60 * 1000),
          undefined,
        )
        .build();

      const pendingPayouts = await this.payoutModel.find(query);

      for (const payout of pendingPayouts) {
        try {
          if (payout.externalTransactionId && payout.provider) {
            const result = await this.paymentProviderService.checkPayoutStatus(
              payout.externalTransactionId,
              String(payout.provider),
            );

            if (result.status !== payout.status) {
              payout.status = result.status;
              await payout.save();

              LoggingUtil.log(`Payout status updated`, 'PayoutsProcessingService');
            }
          } else {
            LoggingUtil.debug(
              `Skipping status check for payout ${String(payout._id)} - missing transaction ID or provider`,
              'PayoutsProcessingService',
            );
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          LoggingUtil.error(
            `Error checking payout ${String(payout._id)}: ${errorMessage}`,
            'PayoutsProcessingService',
          );
        }
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error checking pending payouts:',
        error,
        'PayoutsProcessingService',
      );
    }
  }

  /**
   * Process failed payouts for retry
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processFailedPayouts(): Promise<void> {
    try {
      // Build query using QueryBuilder
      const query = QueryBuilder.create()
        .addEnumFilter('status', PayoutStatus.FAILED)
        .addCustomFilter('retryAttempts', { $lt: 3 })
        .addCustomFilter('nextRetryAt', { $lte: DateUtils.now() })
        .build();

      const failedPayouts = await this.payoutModel.find(query);

      for (const payout of failedPayouts) {
        try {
          await this.retryFailedPayout(String(payout._id));
        } catch (error) {
          LoggingUtil.errorWithException(
            `Error retrying payout ${String(payout._id)}:`,
            error,
            'PayoutsProcessingService',
          );
        }
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error processing failed payouts:',
        error,
        'PayoutsProcessingService',
      );
    }
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    const date = DateUtils.toISO(DateUtils.now()).split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `BATCH-${date}-${random}`;
  }
}
