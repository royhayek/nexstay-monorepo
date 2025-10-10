import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Account, AccountDocument, AccountType } from '../../../database/schemas/account.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from '../../../database/schemas/transaction.schema';
import { Payout, PayoutDocument } from '../../../database/schemas/payout.schema';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class AccountsPayoutService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Payout.name) private readonly payoutModel: Model<PayoutDocument>,
  ) {}

  /**
   * Process host payout (Standard or Fast Pay)
   */
  async processHostPayout(
    hostId: string,
    amount: number,
    payoutMethodId?: string,
    fastPay = false,
  ): Promise<{
    transaction: TransactionDocument;
    payout?: PayoutDocument;
    fastPayFee?: number;
  }> {
    const session = await this.transactionModel.db.startSession();

    try {
      session.startTransaction();

      // Get host earnings account
      const hostAccount = await this.getHostEarningsAccount(hostId);

      // Check if host has sufficient funds
      if (!hostAccount.canDebit(amount)) {
        throw new Error('VALIDATION_FAILED');
      }

      // Check new host hold period
      if (hostAccount.payoutSettings?.isNewHost) {
        await this.validateNewHostHold(hostAccount);
      }

      // Calculate Fast Pay fee if applicable
      let fastPayFee = 0;
      let netAmount = amount;

      if (fastPay) {
        fastPayFee = this.calculateFastPayFee(amount);
        netAmount = amount - fastPayFee;

        if (netAmount <= 0) {
          throw new Error('VALIDATION_FAILED');
        }
      }

      // Create payout transaction
      const payoutTransaction = new this.transactionModel({
        fromAccountId: String(hostAccount._id),
        toAccountId: await this.getOrCreatePlatformCashAccount().then((acc) => acc._id),
        amount: { value: amount, currency: hostAccount.currency },
        type: TransactionType.HOST_PAYOUT,
        status: TransactionStatus.PENDING,
        description: fastPay ? 'Fast Pay host payout' : 'Standard host payout',
        narrative: `Host payout - ${fastPay ? 'Fast Pay (30 min)' : 'Standard (1-7 days)'}`,
        metadata: {
          hostId: new Types.ObjectId(hostId),
          payoutMethod: fastPay ? 'FAST_PAY' : 'STANDARD',
          fastPayFee: fastPayFee > 0 ? fastPayFee : undefined,
          netAmount,
        },
      });

      const savedTransaction = await payoutTransaction.save({ session });

      // Process Fast Pay fee if applicable
      if (fastPayFee > 0) {
        await this.processFastPayFee(String(hostAccount._id), fastPayFee, session);
      }

      // Create payout record
      let payout: PayoutDocument | undefined;
      if (payoutMethodId) {
        payout = await this.createPayoutRecord(
          hostId,
          String(savedTransaction._id),
          netAmount,
          payoutMethodId,
          fastPay,
          session,
        );
      }

      // Move money from host account to pending
      hostAccount.balance.available -= amount;
      hostAccount.balance.pending += amount;
      hostAccount.balance.total =
        hostAccount.balance.available + hostAccount.balance.pending + hostAccount.balance.escrowed;

      await hostAccount.save({ session });

      // Mark transaction as processing
      savedTransaction.status = TransactionStatus.PROCESSING;
      savedTransaction.processedAt = DateUtils.now();
      await savedTransaction.save({ session });

      await session.commitTransaction();

      LoggingUtil.log(
        `Host payout initiated: ${amount} cents (${fastPay ? 'Fast Pay' : 'Standard'}) for host ${hostId}`,
        'AccountsPayoutService',
      );

      return {
        transaction: savedTransaction,
        payout,
        fastPayFee: fastPayFee > 0 ? fastPayFee : undefined,
      };
    } catch (error) {
      await session.abortTransaction();
      LoggingUtil.errorWithException(
        `Error processing host payout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsPayoutService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Complete a payout (called when external payment is successful)
   */
  async completePayout(transactionId: string): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();

    try {
      session.startTransaction();

      const transaction = await this.transactionModel.findById(transactionId).session(session);

      if (!transaction) {
        throw new Error('NOT_FOUND');
      }

      if (transaction.status !== TransactionStatus.PROCESSING) {
        throw new Error('VALIDATION_FAILED');
      }

      // Update host account - move from pending to completed (reduce pending balance)
      const hostAccount = await this.accountModel
        .findById(transaction.fromAccountId)
        .session(session);

      if (!hostAccount) {
        throw new Error('Account not found');
      }

      hostAccount.balance.pending -= transaction.amount.value;
      hostAccount.balance.total =
        hostAccount.balance.available + hostAccount.balance.pending + hostAccount.balance.escrowed;

      await hostAccount.save({ session });

      // Update transaction status
      transaction.status = TransactionStatus.COMPLETED;
      transaction.processedAt = DateUtils.now();
      await transaction.save({ session });

      // Update payout record if exists
      const payout = await this.payoutModel
        .findOne({ transactionId: transaction._id })
        .session(session);

      if (payout) {
        payout.status = PayoutStatus.COMPLETED;
        payout.completedAt = DateUtils.now();
        await payout.save({ session });
      }

      await session.commitTransaction();

      LoggingUtil.log(`Payout completed: ${transaction.transactionId}`, 'AccountsPayoutService');

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      LoggingUtil.errorWithException(
        `Error completing payout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsPayoutService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Fail a payout (called when external payment fails)
   */
  async failPayout(transactionId: string, reason: string): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();

    try {
      session.startTransaction();

      const transaction = await this.transactionModel.findById(transactionId).session(session);

      if (!transaction) {
        throw new Error('NOT_FOUND');
      }

      if (transaction.status !== TransactionStatus.PROCESSING) {
        throw new Error('VALIDATION_FAILED');
      }

      // Restore host account balance - move from pending back to available
      const hostAccount = await this.accountModel
        .findById(transaction.fromAccountId)
        .session(session);

      if (!hostAccount) {
        throw new Error('Account not found');
      }

      hostAccount.balance.pending -= transaction.amount.value;
      hostAccount.balance.available += transaction.amount.value;
      hostAccount.balance.total =
        hostAccount.balance.available + hostAccount.balance.pending + hostAccount.balance.escrowed;

      await hostAccount.save({ session });

      // Update transaction status
      transaction.status = TransactionStatus.FAILED;
      transaction.failedAt = DateUtils.now();
      transaction.failureReason = reason;
      await transaction.save({ session });

      // Update payout record if exists
      const payout = await this.payoutModel
        .findOne({ transactionId: transaction._id })
        .session(session);

      if (payout) {
        payout.status = PayoutStatus.FAILED;
        payout.failureReason = reason;
        payout.failedAt = DateUtils.now();
        await payout.save({ session });
      }

      await session.commitTransaction();

      LoggingUtil.log(
        `Payout failed: ${transaction.transactionId} - ${reason}`,
        'AccountsPayoutService',
      );

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      LoggingUtil.errorWithException(
        `Error failing payout: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsPayoutService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Get available payout amount for host
   */
  async getAvailablePayoutAmount(hostId: string): Promise<{
    availableAmount: number;
    minimumPayout: number;
    isNewHost: boolean;
    holdUntil?: Date;
  }> {
    const hostAccount = await this.getHostEarningsAccount(hostId);

    const minimumPayout = hostAccount.payoutSettings?.minimumPayoutAmount || 50; // $0.50 default
    const isNewHost = hostAccount.payoutSettings?.isNewHost || false;

    // Check new host hold
    let holdUntil: Date | undefined;
    if (isNewHost) {
      const thirtyDaysAgo = DateUtils.now();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldestEarning = await this.transactionModel
        .findOne({
          toAccountId: String(hostAccount._id),
          type: TransactionType.ESCROW_RELEASE,
          status: TransactionStatus.COMPLETED,
        })
        .sort({ processedAt: 1 })
        .exec();

      if (oldestEarning && oldestEarning.processedAt && oldestEarning.processedAt > thirtyDaysAgo) {
        holdUntil = DateUtils.create(oldestEarning.processedAt);
        holdUntil.setDate(holdUntil.getDate() + 30);
      }
    }

    return {
      availableAmount: holdUntil && holdUntil > DateUtils.now() ? 0 : hostAccount.balance.available,
      minimumPayout,
      isNewHost,
      holdUntil,
    };
  }

  /**
   * Process payouts for hosts with sufficient balance
   * Automated cron job
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async processAutomaticPayouts(): Promise<void> {
    LoggingUtil.log('Processing automatic payouts...', 'AccountsPayoutService');

    try {
      // Find host accounts with sufficient balance and auto-payout enabled
      const hostAccounts = await this.accountModel
        .find({
          accountType: AccountType.HOST_EARNINGS,
          'balance.available': { $gte: 100 }, // Minimum $1.00
          'payoutSettings.automaticPayouts': true,
        })
        .limit(50) // Process in batches
        .exec();

      if (hostAccounts.length === 0) {
        LoggingUtil.log('No automatic payouts to process', 'AccountsPayoutService');
        return;
      }

      LoggingUtil.log(
        `Processing ${hostAccounts.length} automatic payouts`,
        'AccountsPayoutService',
      );

      const results = await Promise.allSettled(
        hostAccounts.map((account) =>
          this.processHostPayout(
            account.ownerId?.toString() || '',
            account.balance.available,
            account.payoutSettings?.defaultPayoutMethodId?.toString(),
            false, // Standard payouts for automatic processing
          ),
        ),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      LoggingUtil.log(
        `Automatic payouts processed: ${successful} successful, ${failed} failed`,
        'AccountsPayoutService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error in automatic payouts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsPayoutService',
      );
    }
  }

  /**
   * Calculate Fast Pay fee (1.5% with $15 maximum)
   */
  private calculateFastPayFee(amount: number): number {
    const feeRate = 0.015; // 1.5%
    const maxFee = 1500; // $15.00 in cents

    return Math.min(Math.round(amount * feeRate), maxFee);
  }

  /**
   * Process Fast Pay fee transaction
   */
  private async processFastPayFee(
    hostAccountId: string,
    feeAmount: number,
    session: ClientSession | null,
  ): Promise<TransactionDocument> {
    const platformRevenueAccount = await this.getOrCreatePlatformRevenueAccount();

    const feeTransaction = new this.transactionModel({
      fromAccountId: new Types.ObjectId(hostAccountId),
      toAccountId: platformRevenueAccount._id,
      amount: { value: feeAmount, currency: 'USD' },
      type: TransactionType.FAST_PAY_FEE,
      status: TransactionStatus.PENDING,
      description: 'Fast Pay processing fee',
      narrative: 'Fee for Fast Pay payout processing (1.5%)',
    });

    const sessionOptions = session ? { session } : undefined;
    const savedFeeTransaction = await feeTransaction.save(sessionOptions);

    // Process the fee transaction immediately
    const hostAccount = await this.accountModel.findById(hostAccountId).session(session);
    if (!hostAccount) {
      throw new Error('Host account not found');
    }

    hostAccount.balance.available -= feeAmount;
    platformRevenueAccount.balance.available += feeAmount;

    await Promise.all([
      hostAccount.save(sessionOptions),
      platformRevenueAccount.save(sessionOptions),
    ]);

    savedFeeTransaction.status = TransactionStatus.COMPLETED;
    savedFeeTransaction.processedAt = DateUtils.now();
    await savedFeeTransaction.save(sessionOptions);

    return savedFeeTransaction;
  }

  /**
   * Create payout record for external processing
   */
  private async createPayoutRecord(
    hostId: string,
    transactionId: string,
    amount: number,
    payoutMethodId: string,
    fastPay: boolean,
    session: ClientSession | null,
  ): Promise<PayoutDocument> {
    const payout = new this.payoutModel({
      hostId: new Types.ObjectId(hostId),
      transactionId: new Types.ObjectId(transactionId),
      payoutMethodId: new Types.ObjectId(payoutMethodId),
      amount: { value: amount, currency: 'USD' },
      type: fastPay ? 'FAST_PAY' : 'STANDARD',
      status: 'PENDING',
      estimatedArrival: this.calculateEstimatedArrival(fastPay),
      metadata: {
        fastPay,
        processingTime: fastPay ? '30 minutes' : '1-7 business days',
      },
    });

    const sessionOptions = session ? { session } : undefined;
    return payout.save(sessionOptions);
  }

  /**
   * Calculate estimated arrival date for payout
   */
  private calculateEstimatedArrival(fastPay: boolean): Date {
    const now = DateUtils.now();

    if (fastPay) {
      // Fast Pay: 30 minutes
      now.setMinutes(now.getMinutes() + 30);
    } else {
      // Standard: 3 business days (conservative estimate)
      now.setDate(now.getDate() + 3);
    }

    return now;
  }

  /**
   * Validate new host hold period
   */
  private async validateNewHostHold(hostAccount: AccountDocument): Promise<void> {
    if (!hostAccount.payoutSettings?.isNewHost) {
      return;
    }

    const thirtyDaysAgo = DateUtils.now();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const firstEarning = await this.transactionModel
      .findOne({
        toAccountId: String(hostAccount._id),
        type: TransactionType.ESCROW_RELEASE,
        status: TransactionStatus.COMPLETED,
      })
      .sort({ processedAt: 1 })
      .exec();

    if (firstEarning && firstEarning.processedAt && firstEarning.processedAt > thirtyDaysAgo) {
      throw new Error('VALIDATION_FAILED');
    }

    // Remove new host flag if 30 days have passed
    if (firstEarning && firstEarning.processedAt && firstEarning.processedAt <= thirtyDaysAgo) {
      if (hostAccount.payoutSettings) {
        hostAccount.payoutSettings.isNewHost = false;
        await hostAccount.save();
        LoggingUtil.log(
          `Removed new host flag for account ${hostAccount.accountNumber}`,
          'AccountsPayoutService',
        );
      }
    }
  }

  /**
   * Get host earnings account
   */
  private async getHostEarningsAccount(hostId: string): Promise<AccountDocument> {
    const account = await this.accountModel
      .findOne({
        ownerId: new Types.ObjectId(hostId),
        accountType: AccountType.HOST_EARNINGS,
      })
      .exec();

    if (!account) {
      throw new Error('Host earnings account not found');
    }

    return account;
  }

  /**
   * Get or create platform cash account
   */
  private async getOrCreatePlatformCashAccount(): Promise<AccountDocument> {
    let cashAccount = await this.accountModel
      .findOne({ accountType: AccountType.PLATFORM_CASH })
      .exec();

    if (!cashAccount) {
      cashAccount = new this.accountModel({
        accountType: AccountType.PLATFORM_CASH,
        accountNumber: 'PC-000001',
        accountName: 'Platform Cash Account',
        ownerType: 'SYSTEM',
        currency: 'USD',
        balance: {
          available: 0,
          pending: 0,
          escrowed: 0,
          total: 0,
        },
      });

      cashAccount = await cashAccount.save();
    }

    return cashAccount;
  }

  /**
   * Get or create platform revenue account
   */
  private async getOrCreatePlatformRevenueAccount(): Promise<AccountDocument> {
    let revenueAccount = await this.accountModel
      .findOne({ accountType: AccountType.PLATFORM_REVENUE })
      .exec();

    if (!revenueAccount) {
      revenueAccount = new this.accountModel({
        accountType: AccountType.PLATFORM_REVENUE,
        accountNumber: 'PR-000001',
        accountName: 'Platform Revenue Account',
        ownerType: 'SYSTEM',
        currency: 'USD',
        balance: {
          available: 0,
          pending: 0,
          escrowed: 0,
          total: 0,
        },
      });

      revenueAccount = await revenueAccount.save();
    }

    return revenueAccount;
  }
}
