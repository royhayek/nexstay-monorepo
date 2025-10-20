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
import {
  AccountLedger,
  AccountLedgerDocument,
} from '../../../database/schemas/account-ledger.schema';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class AccountsEscrowService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(AccountLedger.name) private readonly ledgerModel: Model<AccountLedgerDocument>,
  ) {}

  /**
   * Create escrow deposit for external payment (credit card, etc.)
   * Money goes: External Payment → Escrow Account (direct deposit)
   * This is the correct flow for new payments, not from guest wallet
   */
  async createEscrowDepositFromExternalPayment(
    guestId: string,
    hostId: string,
    amount: number,
    bookingId: string,
    checkInDate: Date,
    platformFeeRate = 0.15, // 15% platform fee
  ): Promise<TransactionDocument> {
    // Use sessions only in production (requires replica set)
    const useSession = process.env.NODE_ENV === 'production';
    const session = useSession ? await this.transactionModel.db.startSession() : null;

    try {
      if (session) {
        session.startTransaction();
      }

      // Get or create escrow account
      const escrowAccount = await this.getOrCreateEscrowAccount();

      // Calculate release date (24 hours after check-in)
      const releaseDate = DateUtils.create(checkInDate);
      releaseDate.setHours(releaseDate.getHours() + 24);

      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Get or create external payments account (virtual account for external deposits)
      const externalPaymentsAccount = await this.getOrCreateExternalPaymentsAccount();

      // Create escrow transaction - this is a DEPOSIT from external payment
      const escrowTransaction = new this.transactionModel({
        transactionId,
        fromAccountId: externalPaymentsAccount._id, // Virtual external payments account
        toAccountId: escrowAccount._id,
        amount: { value: amount, currency: 'USD' },
        type: TransactionType.BOOKING_PAYMENT,
        status: TransactionStatus.COMPLETED, // External payment already successful
        description: 'Booking payment deposit to escrow from external payment',
        narrative: `Payment for booking ${bookingId} held in escrow until 24 hours after check-in`,
        scheduledReleaseAt: releaseDate,
        reference: {
          type: 'Booking',
          id: new Types.ObjectId(bookingId),
        },
        metadata: {
          bookingId: new Types.ObjectId(bookingId),
          guestId: new Types.ObjectId(guestId),
          hostId: new Types.ObjectId(hostId),
          platformFeeRate,
          escrowReleaseDate: releaseDate,
          externalPayment: true, // Flag to indicate external payment source
        },
      });

      const saveOptions = session ? { session } : {};
      const savedTransaction = await escrowTransaction.save(saveOptions);

      // Credit escrow account directly (no debit from internal account)
      await this.creditEscrowFromExternalPayment(String(savedTransaction._id), session);

      if (session) {
        await session.commitTransaction();
      }

      LoggingUtil.log(
        `External payment escrow deposit created: ${savedTransaction.transactionId} for booking ${bookingId}, amount ${amount}, release scheduled for ${DateUtils.toISO(releaseDate)}`,
        'AccountsEscrowService',
      );

      return savedTransaction;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      LoggingUtil.errorWithException(
        `Error creating external payment escrow deposit: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsEscrowService',
      );
      throw error;
    } finally {
      if (session) {
        void session.endSession();
      }
    }
  }

  /**
   * Create escrow transaction for booking payment FROM GUEST WALLET
   * Money goes: Guest Wallet → Escrow Account
   * This is for when guest pays from their existing wallet balance
   */
  async createEscrowHold(
    guestWalletId: string,
    hostId: string,
    amount: number,
    bookingId: string,
    checkInDate: Date,
    platformFeeRate = 0.15, // 15% platform fee
  ): Promise<TransactionDocument> {
    // Use sessions only in production (requires replica set)
    const useSession = process.env.NODE_ENV === 'production';
    const session = useSession ? await this.transactionModel.db.startSession() : null;

    try {
      if (session) {
        session.startTransaction();
      }

      // Get or create escrow account
      const escrowAccount = await this.getOrCreateEscrowAccount();

      // Calculate release date (24 hours after check-in)
      const releaseDate = DateUtils.create(checkInDate);
      releaseDate.setHours(releaseDate.getHours() + 24);

      // Generate unique transaction ID
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create escrow transaction
      const escrowTransaction = new this.transactionModel({
        transactionId,
        fromAccountId: new Types.ObjectId(guestWalletId),
        toAccountId: escrowAccount._id,
        amount: { value: amount, currency: 'USD' },
        type: TransactionType.BOOKING_PAYMENT,
        status: TransactionStatus.PENDING,
        description: 'Booking payment held in escrow',
        narrative: `Payment for booking ${bookingId} held in escrow until 24 hours after check-in`,
        scheduledReleaseAt: releaseDate,
        reference: {
          type: 'Booking',
          id: new Types.ObjectId(bookingId),
        },
        metadata: {
          bookingId: new Types.ObjectId(bookingId),
          hostId: new Types.ObjectId(hostId),
          platformFeeRate,
          escrowReleaseDate: releaseDate,
        },
      });

      const saveOptions = session ? { session } : {};
      const savedTransaction = await escrowTransaction.save(saveOptions);

      // Process the transaction immediately to move money to escrow
      await this.processEscrowTransaction(String(savedTransaction._id), session);

      if (session) {
        await session.commitTransaction();
      }

      LoggingUtil.log(
        `Escrow hold created: ${savedTransaction.transactionId} for booking ${bookingId}, release scheduled for ${DateUtils.toISO(releaseDate)}`,
        'AccountsEscrowService',
      );

      return savedTransaction;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      LoggingUtil.errorWithException(
        `Error creating escrow hold: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsEscrowService',
      );
      throw error;
    } finally {
      if (session) {
        void session.endSession();
      }
    }
  }

  /**
   * Release escrow funds to host and platform
   * Money goes: Escrow → Host Earnings + Platform Revenue
   */
  async releaseEscrowFunds(transactionId: string): Promise<{
    hostPayout: TransactionDocument;
    platformFee: TransactionDocument;
  }> {
    // Use sessions only in production (requires replica set)
    const useSession = process.env.NODE_ENV === 'production';
    let session: ClientSession | null = null;

    if (useSession) {
      try {
        session = await this.transactionModel.db.startSession();
        session.startTransaction();
      } catch {
        LoggingUtil.log(
          'Failed to start transaction - continuing without session',
          'AccountsEscrowService',
        );
        session = null;
      }
    }

    try {
      // Find the original escrow transaction
      const escrowTransactionQuery = this.transactionModel.findById(transactionId);
      const escrowTransaction = session
        ? await escrowTransactionQuery.session(session)
        : await escrowTransactionQuery;

      if (!escrowTransaction) {
        throw new Error('NOT_FOUND');
      }

      if (!escrowTransaction.canBeReleased()) {
        throw new Error('VALIDATION_FAILED');
      }

      // Get host earnings account
      const hostEarningsAccount = await this.getHostEarningsAccount(
        escrowTransaction.metadata?.hostId?.toString() || '',
      );

      // Get platform revenue account
      const platformRevenueAccount = await this.getOrCreatePlatformRevenueAccount();

      // Calculate amounts
      const totalAmount = escrowTransaction.amount.value;
      const platformFeeRate = escrowTransaction.metadata?.platformFeeRate || 0.15;
      const platformFeeAmount = Math.round(totalAmount * platformFeeRate);
      const hostAmount = totalAmount - platformFeeAmount;

      // Generate unique transaction IDs for both transactions
      const hostPayoutTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const platformFeeTransactionId = `TXN_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;

      // Create host payout transaction
      const hostPayout = new this.transactionModel({
        transactionId: hostPayoutTransactionId,
        fromAccountId: escrowTransaction.toAccountId, // From escrow
        toAccountId: hostEarningsAccount._id,
        amount: { value: hostAmount, currency: escrowTransaction.amount.currency },
        type: TransactionType.ESCROW_RELEASE,
        status: TransactionStatus.PENDING,
        description: 'Escrow release to host earnings',
        narrative: `Host earnings from booking ${escrowTransaction.metadata?.bookingId?.toString() || 'unknown'}`,
        reference: escrowTransaction.reference,
        metadata: {
          ...escrowTransaction.metadata,
          originalTransactionId: escrowTransaction._id,
        },
      });

      // Create platform fee transaction
      const platformFee = new this.transactionModel({
        transactionId: platformFeeTransactionId,
        fromAccountId: escrowTransaction.toAccountId, // From escrow
        toAccountId: platformRevenueAccount._id,
        amount: { value: platformFeeAmount, currency: escrowTransaction.amount.currency },
        type: TransactionType.PLATFORM_FEE,
        status: TransactionStatus.PENDING,
        description: 'Platform fee from booking',
        narrative: `Platform fee from booking ${escrowTransaction.metadata?.bookingId?.toString() || 'unknown'}`,
        reference: escrowTransaction.reference,
        metadata: {
          ...escrowTransaction.metadata,
          originalTransactionId: escrowTransaction._id,
          platformFeeRate,
        },
      });

      // Save both transactions
      const [savedHostPayout, savedPlatformFee] = await Promise.all([
        session ? hostPayout.save({ session }) : hostPayout.save(),
        session ? platformFee.save({ session }) : platformFee.save(),
      ]);

      // Process both transactions
      await Promise.all([
        this.processEscrowTransaction(String(savedHostPayout._id), session),
        this.processEscrowTransaction(String(savedPlatformFee._id), session),
      ]);

      // Mark original escrow transaction as completed
      escrowTransaction.status = TransactionStatus.COMPLETED;
      escrowTransaction.processedAt = DateUtils.now();
      if (session) {
        await escrowTransaction.save({ session });
      } else {
        await escrowTransaction.save();
      }

      if (session) {
        await session.commitTransaction();
      }

      LoggingUtil.log(
        `Escrow funds released: Host ${hostAmount} cents, Platform ${platformFeeAmount} cents`,
        'AccountsEscrowService',
      );

      return {
        hostPayout: savedHostPayout,
        platformFee: savedPlatformFee,
      };
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      LoggingUtil.errorWithException(
        `Error releasing escrow funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsEscrowService',
      );
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * Automated cron job to process escrow releases
   * Runs every 10 minutes to check for eligible escrow releases
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async processScheduledEscrowReleases(): Promise<void> {
    LoggingUtil.log('Processing scheduled escrow releases...', 'AccountsEscrowService');

    try {
      // Find all transactions ready for escrow release
      const eligibleTransactions = await this.transactionModel
        .find({
          type: TransactionType.BOOKING_PAYMENT,
          status: TransactionStatus.COMPLETED,
          scheduledReleaseAt: { $lte: DateUtils.now() },
        })
        .limit(100) // Process in batches
        .exec();

      if (eligibleTransactions.length === 0) {
        LoggingUtil.log('No escrow releases to process', 'AccountsEscrowService');
        return;
      }

      LoggingUtil.log(
        `Processing ${eligibleTransactions.length} escrow releases`,
        'AccountsEscrowService',
      );

      // Process each release
      const results = await Promise.allSettled(
        eligibleTransactions.map((transaction) => this.releaseEscrowFunds(String(transaction._id))),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      LoggingUtil.log(
        `Escrow releases processed: ${successful} successful, ${failed} failed`,
        'AccountsEscrowService',
      );

      // Log failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          LoggingUtil.error(
            `Failed to process escrow release for transaction ${String(eligibleTransactions[index]._id)}`,
            undefined,
            'AccountsEscrowService',
          );
        }
      });
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error in scheduled escrow processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsEscrowService',
      );
    }
  }

  /**
   * Get pending escrow transactions
   */
  async getPendingEscrowTransactions(): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({
        type: TransactionType.BOOKING_PAYMENT,
        status: TransactionStatus.COMPLETED,
        scheduledReleaseAt: { $exists: true },
      })
      .populate('fromAccount', 'accountNumber accountName')
      .populate('toAccount', 'accountNumber accountName')
      .sort({ scheduledReleaseAt: 1 })
      .exec();
  }

  /**
   * Cancel escrow transaction (for booking cancellations)
   */
  async cancelEscrowTransaction(
    transactionId: string,
    refundReason: string,
  ): Promise<TransactionDocument> {
    // Use sessions only in production (requires replica set)
    const useSession = process.env.NODE_ENV === 'production';
    let session: ClientSession | null = null;

    if (useSession) {
      try {
        session = await this.transactionModel.db.startSession();
        session.startTransaction();
      } catch {
        LoggingUtil.log(
          'Failed to start transaction - continuing without session',
          'AccountsEscrowService',
        );
        session = null;
      }
    }

    try {
      // Find the original escrow transaction
      const escrowTransactionQuery = this.transactionModel.findById(transactionId);
      const escrowTransaction = session
        ? await escrowTransactionQuery.session(session)
        : await escrowTransactionQuery;

      if (!escrowTransaction) {
        throw new Error('NOT_FOUND');
      }

      if (escrowTransaction.status !== TransactionStatus.COMPLETED) {
        throw new Error('VALIDATION_FAILED');
      }

      // Generate unique transaction ID
      const refundTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create refund transaction (Escrow → Guest Wallet)
      const refundTransaction = new this.transactionModel({
        transactionId: refundTransactionId,
        fromAccountId: escrowTransaction.toAccountId, // From escrow
        toAccountId: escrowTransaction.fromAccountId, // Back to guest wallet
        amount: escrowTransaction.amount,
        type: TransactionType.REFUND,
        status: TransactionStatus.PENDING,
        description: 'Escrow refund due to cancellation',
        narrative: `Refund for cancelled booking: ${refundReason}`,
        reference: escrowTransaction.reference,
        metadata: {
          ...escrowTransaction.metadata,
          refundReason,
          originalTransactionId: escrowTransaction._id,
        },
      });

      const savedRefund = session
        ? await refundTransaction.save({ session })
        : await refundTransaction.save();

      // Process the refund
      await this.processEscrowTransaction(String(savedRefund._id), session);

      // Mark original escrow as cancelled
      escrowTransaction.status = TransactionStatus.CANCELLED;
      if (session) {
        await escrowTransaction.save({ session });
      } else {
        await escrowTransaction.save();
      }

      if (session) {
        await session.commitTransaction();
      }

      LoggingUtil.log(
        `Escrow transaction cancelled and refunded: ${escrowTransaction.transactionId}`,
        'AccountsEscrowService',
      );

      return savedRefund;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      LoggingUtil.errorWithException(
        `Error cancelling escrow transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsEscrowService',
      );
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  /**
   * Process a single escrow transaction (move money between accounts)
   */
  private async processEscrowTransaction(
    transactionId: string,
    session?: ClientSession | null,
  ): Promise<TransactionDocument> {
    // Handle session conditionally
    const transactionQuery = session
      ? this.transactionModel.findById(transactionId).session(session)
      : this.transactionModel.findById(transactionId);

    const transaction = await transactionQuery;

    if (!transaction || !transaction.isProcessable()) {
      throw new Error('Transaction not processable');
    }

    // Get both accounts with conditional session usage
    const fromAccountQuery = session
      ? this.accountModel.findById(transaction.fromAccountId).session(session)
      : this.accountModel.findById(transaction.fromAccountId);

    const toAccountQuery = session
      ? this.accountModel.findById(transaction.toAccountId).session(session)
      : this.accountModel.findById(transaction.toAccountId);

    const [fromAccount, toAccount] = await Promise.all([fromAccountQuery, toAccountQuery]);

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    // Verify sufficient funds
    if (!fromAccount.canDebit(transaction.amount.value)) {
      throw new Error('Insufficient funds');
    }

    // Update account balances
    fromAccount.updateBalance(0, transaction.amount.value); // Credit (reduce) from account
    toAccount.updateBalance(transaction.amount.value, 0); // Debit (increase) to account

    // Save balance snapshots
    transaction.fromAccountBalanceBefore = fromAccount.balance.available + transaction.amount.value;
    transaction.fromAccountBalanceAfter = fromAccount.balance.available;
    transaction.toAccountBalanceBefore = toAccount.balance.available - transaction.amount.value;
    transaction.toAccountBalanceAfter = toAccount.balance.available;

    // Update transaction status
    transaction.status = TransactionStatus.COMPLETED;
    transaction.processedAt = DateUtils.now();

    // Save all changes
    const sessionOptions = session ? { session } : undefined;
    await Promise.all([
      fromAccount.save(sessionOptions),
      toAccount.save(sessionOptions),
      transaction.save(sessionOptions),
    ]);

    return transaction;
  }

  /**
   * Get or create escrow account
   */
  private async getOrCreateEscrowAccount(): Promise<AccountDocument> {
    let escrowAccount = await this.accountModel.findOne({ accountType: AccountType.ESCROW }).exec();

    if (!escrowAccount) {
      escrowAccount = new this.accountModel({
        accountType: AccountType.ESCROW,
        accountNumber: 'ESC-000001',
        accountName: 'Platform Escrow Account',
        ownerType: 'SYSTEM',
        currency: 'USD',
        balance: {
          available: 0,
          pending: 0,
          escrowed: 0,
          total: 0,
        },
      });

      escrowAccount = await escrowAccount.save();
    }

    return escrowAccount;
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

  /**
   * Get or create external payments account (virtual account for tracking external deposits)
   */
  private async getOrCreateExternalPaymentsAccount(): Promise<AccountDocument> {
    let externalAccount = await this.accountModel
      .findOne({ accountType: AccountType.PLATFORM_CASH })
      .exec();

    if (!externalAccount) {
      externalAccount = new this.accountModel({
        accountType: AccountType.PLATFORM_CASH,
        accountNumber: 'PC-000001',
        accountName: 'Platform Cash Account (External Payments)',
        ownerType: 'SYSTEM',
        currency: 'USD',
        balance: {
          available: 0,
          pending: 0,
          escrowed: 0,
          total: 0,
        },
      });

      externalAccount = await externalAccount.save();
    }

    return externalAccount;
  }

  /**
   * Credit escrow account from external payment (no internal debit needed)
   */
  private async creditEscrowFromExternalPayment(
    transactionId: string,
    session?: ClientSession | null,
  ): Promise<TransactionDocument> {
    // Handle session conditionally
    const transactionQuery = session
      ? this.transactionModel.findById(transactionId).session(session)
      : this.transactionModel.findById(transactionId);

    const transaction = await transactionQuery;

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Get escrow account
    const escrowAccountQuery = session
      ? this.accountModel.findById(transaction.toAccountId).session(session)
      : this.accountModel.findById(transaction.toAccountId);

    const escrowAccount = await escrowAccountQuery;

    if (!escrowAccount) {
      throw new Error('Escrow account not found');
    }

    // Credit escrow account with external payment amount
    escrowAccount.balance.escrowed += transaction.amount.value;
    escrowAccount.balance.total =
      escrowAccount.balance.available +
      escrowAccount.balance.pending +
      escrowAccount.balance.escrowed;

    // Update last activity
    escrowAccount.lastActivityAt = DateUtils.now();
    escrowAccount.version += 1;

    // Record balance snapshots in transaction
    transaction.toAccountBalanceBefore = escrowAccount.balance.escrowed - transaction.amount.value;
    transaction.toAccountBalanceAfter = escrowAccount.balance.escrowed;
    transaction.processedAt = DateUtils.now();

    // Save changes
    const saveOptions = session ? { session } : {};
    await Promise.all([escrowAccount.save(saveOptions), transaction.save(saveOptions)]);

    LoggingUtil.log(
      `External payment credited to escrow: transactionId=${transaction.transactionId}, amount=${transaction.amount.value}, escrowBalance=${escrowAccount.balance.escrowed}`,
      'AccountsEscrowService',
    );

    return transaction;
  }
}
