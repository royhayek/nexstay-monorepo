import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery, ClientSession } from 'mongoose';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from '../../../database/schemas/transaction.schema';
import { Account, AccountDocument } from '../../../database/schemas/account.schema';
import {
  AccountLedger,
  AccountLedgerDocument,
  LedgerEntryType,
  LedgerStatus,
} from '../../../database/schemas/account-ledger.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  TransactionHistoryResponse,
  TransactionStatsResponse,
} from '../interfaces/service-responses.interface';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class AccountsTransactionService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(AccountLedger.name) private readonly ledgerModel: Model<AccountLedgerDocument>,
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Get user transaction history
   */
  async getUserTransactionHistory(
    userId: string,
    pagination: PaginationDto,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<TransactionHistoryResponse> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'AccountsTransactionService',
    });
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      maxLimit: 100,
    });

    // Get user's accounts first
    const userAccounts = await this.accountModel
      .find({ ownerId: new Types.ObjectId(userId) })
      .select('_id')
      .exec();

    const userAccountIds = userAccounts.map((acc) => acc._id);

    if (userAccountIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    // Build filter query
    const filterQuery: FilterQuery<TransactionDocument> = {
      $or: [{ fromAccountId: { $in: userAccountIds } }, { toAccountId: { $in: userAccountIds } }],
    };

    if (filters?.type) {
      filterQuery.type = filters.type;
    }

    if (filters?.status) {
      filterQuery.status = filters.status;
    }

    if (filters?.fromDate) {
      filterQuery.createdAt = { $gte: DateUtils.create(filters.fromDate) };
    }

    if (filters?.toDate) {
      const existingCreatedQuery = filterQuery.createdAt as Record<string, unknown>;
      filterQuery.createdAt = {
        ...existingCreatedQuery,
        $lte: DateUtils.create(filters.toDate),
      };
    }

    // Execute queries
    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filterQuery)
        .populate('fromAccount', 'accountNumber accountName accountType')
        .populate('toAccount', 'accountNumber accountName accountType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filterQuery),
    ]);

    const paginationResult = buildPaginatedResult(items, total, page, limit);

    return {
      items: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      limit: paginationResult.limit,
      totalPages: paginationResult.totalPages,
      hasNextPage: paginationResult.hasNextPage,
      hasPrevPage: paginationResult.hasPrevPage,
    };
  }

  /**
   * Get specific transaction details
   */
  async getTransactionById(transactionId: string, userId?: string): Promise<TransactionDocument> {
    const transaction = await this.transactionModel
      .findById(transactionId)
      .populate('fromAccount', 'accountNumber accountName accountType ownerId')
      .populate('toAccount', 'accountNumber accountName accountType ownerId')
      .exec();

    if (!transaction) {
      throw new Error('NOT_FOUND');
    }

    // If userId is provided, verify user has access to this transaction
    if (userId && transaction.populated('fromAccount') && transaction.populated('toAccount')) {
      const userObjectId = new Types.ObjectId(userId);
      const fromAccount = transaction.populated('fromAccount') as AccountDocument;
      const toAccount = transaction.populated('toAccount') as AccountDocument;

      const hasAccess =
        fromAccount?.ownerId?.equals(userObjectId) || toAccount?.ownerId?.equals(userObjectId);

      if (!hasAccess) {
        throw new Error('FORBIDDEN');
      }
    }

    return transaction;
  }

  /**
   * Get transaction statistics for user
   */
  async getUserTransactionStats(
    userId: string,
    period: 'last_30_days' | 'last_90_days' | 'last_year' | 'all_time' = 'last_30_days',
  ): Promise<TransactionStatsResponse> {
    // Get user's accounts
    const userAccounts = await this.accountModel
      .find({ ownerId: new Types.ObjectId(userId) })
      .select('_id')
      .exec();

    const userAccountIds2 = userAccounts.map((acc) => acc._id);

    if (userAccountIds2.length === 0) {
      return {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        byType: {},
        byStatus: {},
      };
    }

    // Calculate date range
    let dateFilter: { createdAt?: { $gte: Date } } = {};
    if (period !== 'all_time') {
      const days = {
        last_30_days: 30,
        last_90_days: 90,
        last_year: 365,
      };

      const startDate = DateUtils.now();
      startDate.setDate(startDate.getDate() - days[period]);
      dateFilter = { createdAt: { $gte: startDate } };
    }

    const filterQuery: FilterQuery<TransactionDocument> = {
      $or: [{ fromAccountId: { $in: userAccountIds2 } }, { toAccountId: { $in: userAccountIds2 } }],
      ...dateFilter,
    };

    const transactions = await this.transactionModel
      .find(filterQuery)
      .populate('fromAccount', 'ownerId')
      .populate('toAccount', 'ownerId')
      .exec();

    let totalIncome = 0;
    let totalExpenses = 0;
    const byType: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};

    const userObjectId = new Types.ObjectId(userId);

    // Get all unique account IDs to fetch account details
    const transactionAccountIds = Array.from(
      new Set([
        ...transactions.map((t) => t.fromAccountId.toString()),
        ...transactions.map((t) => t.toAccountId.toString()),
      ]),
    );

    const accounts = await this.accountModel.find({ _id: { $in: transactionAccountIds } }).exec();
    const accountMap = new Map(accounts.map((acc) => [String(acc._id), acc]));

    transactions.forEach((transaction) => {
      const fromAccount = accountMap.get(transaction.fromAccountId.toString());
      const toAccount = accountMap.get(transaction.toAccountId.toString());
      const amount = transaction.amount.value;

      // Determine if this is income or expense for the user
      const isIncome = toAccount?.ownerId?.equals(userObjectId);
      const isExpense = fromAccount?.ownerId?.equals(userObjectId);

      if (isIncome) {
        totalIncome += amount;
      }
      if (isExpense) {
        totalExpenses += amount;
      }

      // Group by type
      const type = transaction.type;
      if (!byType[type]) {
        byType[type] = { count: 0, amount: 0 };
      }
      byType[type].count++;
      byType[type].amount += amount;

      // Group by status
      const status = transaction.status;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      byType,
      byStatus,
    };
  }

  /**
   * Create a manual transaction (admin only)
   */
  async createManualTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    type: TransactionType,
    description: string,
    adminId: string,
    metadata?: Record<string, any>,
  ): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();

    try {
      session.startTransaction();

      // Validate accounts exist
      const [fromAccount, toAccount] = await Promise.all([
        this.accountModel.findById(fromAccountId).session(session),
        this.accountModel.findById(toAccountId).session(session),
      ]);

      if (!fromAccount || !toAccount) {
        throw new Error('NOT_FOUND');
      }

      // Check if from account can be debited
      if (!fromAccount.canDebit(amount)) {
        throw new Error('VALIDATION_FAILED');
      }

      // Create transaction
      const transaction = new this.transactionModel({
        fromAccountId: new Types.ObjectId(fromAccountId),
        toAccountId: new Types.ObjectId(toAccountId),
        amount: { value: amount, currency: fromAccount.currency },
        type,
        status: TransactionStatus.PENDING,
        description,
        narrative: `Manual transaction created by admin ${adminId}`,
        metadata: {
          ...metadata,
          adminId: new Types.ObjectId(adminId),
          manualTransaction: true,
        },
      });

      const sessionOptions = session ? { session } : undefined;
      const savedTransaction = await transaction.save(sessionOptions);

      // Process transaction immediately
      await this.processTransaction(String(savedTransaction._id), session);

      // Create ledger entries for audit trail
      await this.createLedgerEntry(savedTransaction, session);

      await session.commitTransaction();

      LoggingUtil.log(
        `Manual transaction created: ${savedTransaction.transactionId} by admin ${adminId}`,
        'AccountsTransactionService',
      );

      return savedTransaction;
    } catch (error) {
      await session.abortTransaction();
      LoggingUtil.errorWithException(
        `Error creating manual transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsTransactionService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Get pending transactions for processing
   */
  async getPendingTransactions(limit = 100): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({
        status: TransactionStatus.PENDING,
        scheduledReleaseAt: { $exists: false }, // Exclude escrow transactions
      })
      .populate('fromAccount', 'accountNumber accountName accountType')
      .populate('toAccount', 'accountNumber accountName accountType')
      .sort({ createdAt: 1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get failed transactions for retry
   */
  async getFailedTransactions(limit = 50): Promise<TransactionDocument[]> {
    return this.transactionModel
      .find({ status: TransactionStatus.FAILED })
      .populate('fromAccount', 'accountNumber accountName accountType')
      .populate('toAccount', 'accountNumber accountName accountType')
      .sort({ failedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Retry a failed transaction
   */
  async retryFailedTransaction(transactionId: string): Promise<TransactionDocument> {
    const session = await this.transactionModel.db.startSession();

    try {
      session.startTransaction();

      const transaction = await this.transactionModel.findById(transactionId).session(session);

      if (!transaction || transaction.status !== TransactionStatus.FAILED) {
        throw new Error('VALIDATION_FAILED');
      }

      // Reset transaction status
      transaction.status = TransactionStatus.PENDING;
      transaction.failedAt = undefined;
      transaction.failureReason = undefined;
      const sessionOptions = session ? { session } : undefined;
      await transaction.save(sessionOptions);

      // Process transaction
      await this.processTransaction(String(transaction._id), session);

      await session.commitTransaction();

      LoggingUtil.log(
        `Transaction retried: ${transaction.transactionId}`,
        'AccountsTransactionService',
      );

      return transaction;
    } catch (error) {
      await session.abortTransaction();
      LoggingUtil.errorWithException(
        `Error retrying transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'AccountsTransactionService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Process a single transaction (move money between accounts)
   */
  private async processTransaction(
    transactionId: string,
    session?: ClientSession | null,
  ): Promise<TransactionDocument> {
    const sessionValue = session ?? null;
    const transaction = await this.transactionModel.findById(transactionId).session(sessionValue);

    if (!transaction || !transaction.isProcessable()) {
      throw new Error('Transaction not processable');
    }

    // Get both accounts
    const [fromAccount, toAccount] = await Promise.all([
      this.accountModel.findById(transaction.fromAccountId).session(sessionValue),
      this.accountModel.findById(transaction.toAccountId).session(sessionValue),
    ]);

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    // Verify sufficient funds
    if (!fromAccount.canDebit(transaction.amount.value)) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failedAt = DateUtils.now();
      transaction.failureReason = 'Insufficient funds';
      const sessionOptions = session ? { session } : undefined;
      await transaction.save(sessionOptions);
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
   * Create ledger entry for double-entry bookkeeping
   */
  private async createLedgerEntry(
    transaction: TransactionDocument,
    session?: ClientSession | null,
  ): Promise<AccountLedgerDocument> {
    const sessionValue = session ?? null;
    const fromAccount = await this.accountModel
      .findById(transaction.fromAccountId)
      .session(sessionValue);
    const toAccount = await this.accountModel
      .findById(transaction.toAccountId)
      .session(sessionValue);

    if (!fromAccount || !toAccount) {
      throw new Error('Account not found');
    }

    const ledgerEntry = new this.ledgerModel({
      transactionId: transaction.transactionId,
      debitAccountId: transaction.toAccountId, // Account receiving money
      creditAccountId: transaction.fromAccountId, // Account sending money
      entryType: this.mapTransactionTypeToLedgerType(transaction.type),
      status:
        transaction.status === TransactionStatus.COMPLETED
          ? LedgerStatus.COMPLETED
          : LedgerStatus.PENDING,
      amount: {
        amount: transaction.amount.value,
        currency: transaction.amount.currency,
      },
      debitSnapshot: {
        accountId: toAccount._id,
        accountNumber: toAccount.accountNumber,
        balanceBefore: transaction.toAccountBalanceBefore || 0,
        balanceAfter: transaction.toAccountBalanceAfter || 0,
        availableBalanceAfter: toAccount.balance.available,
        pendingBalanceAfter: toAccount.balance.pending,
        version: toAccount.version,
      },
      creditSnapshot: {
        accountId: fromAccount._id,
        accountNumber: fromAccount.accountNumber,
        balanceBefore: transaction.fromAccountBalanceBefore || 0,
        balanceAfter: transaction.fromAccountBalanceAfter || 0,
        availableBalanceAfter: fromAccount.balance.available,
        pendingBalanceAfter: fromAccount.balance.pending,
        version: fromAccount.version,
      },
      description: transaction.description,
      narrative: transaction.narrative,
      processedAt: transaction.processedAt,
      metadata: transaction.metadata,
    });

    const sessionOptions = session ? { session } : undefined;
    return ledgerEntry.save(sessionOptions);
  }

  /**
   * Map transaction type to ledger entry type
   */
  private mapTransactionTypeToLedgerType(transactionType: TransactionType): LedgerEntryType {
    const mapping: Record<TransactionType, LedgerEntryType> = {
      [TransactionType.BOOKING_PAYMENT]: LedgerEntryType.PAYMENT_RECEIVED,
      [TransactionType.ESCROW_RELEASE]: LedgerEntryType.RELEASE,
      [TransactionType.PLATFORM_FEE]: LedgerEntryType.PLATFORM_FEE,
      [TransactionType.HOST_PAYOUT]: LedgerEntryType.PAYOUT,
      [TransactionType.REFUND]: LedgerEntryType.REFUND,
      [TransactionType.SECURITY_DEPOSIT]: LedgerEntryType.HOLD,
      [TransactionType.FAST_PAY_FEE]: LedgerEntryType.PROCESSING_FEE,
      [TransactionType.TRANSFER]: LedgerEntryType.TRANSFER,
    };

    return mapping[transactionType] || LedgerEntryType.TRANSFER;
  }
}
