import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import { Account, AccountDocument, AccountStatus } from '../../../database/schemas/account.schema';
import {
  AccountLedger,
  AccountLedgerDocument,
} from '../../../database/schemas/account-ledger.schema';
import { Transaction, TransactionDocument } from '../../../database/schemas/transaction.schema';
import { AccountFiltersDto } from '../dto/account-filters.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import type { FilterQuery } from 'mongoose';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class AccountsAdminService {
  constructor(
    @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
    @InjectModel(AccountLedger.name) private readonly ledgerModel: Model<AccountLedgerDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  /**
   * Get all accounts with advanced filtering and pagination
   */
  async findAllWithFilters(
    filters: AccountFiltersDto,
    pagination: PaginationDto,
  ): Promise<{
    items: AccountDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      maxLimit: 100,
    });

    // Build filter query
    const filterQuery: FilterQuery<AccountDocument> = {};

    if (filters.accountType) {
      filterQuery.accountType = filters.accountType;
    }

    if (filters.status) {
      filterQuery.status = filters.status;
    }

    if (filters.ownerType) {
      filterQuery.ownerType = filters.ownerType;
    }

    if (filters.currency) {
      filterQuery.currency = filters.currency;
    }

    if (filters.ownerId) {
      ValidationUtils.validateObjectId(filters.ownerId, 'ownerId', {
        context: 'AccountsAdminService',
      });
      filterQuery.ownerId = new Types.ObjectId(filters.ownerId);
    }

    if (filters.minBalance !== undefined) {
      filterQuery['balance.available'] = { $gte: filters.minBalance };
    }

    if (filters.maxBalance !== undefined) {
      const existingBalanceQuery = filterQuery['balance.available'] as Record<string, unknown>;
      filterQuery['balance.available'] = {
        ...existingBalanceQuery,
        $lte: filters.maxBalance,
      };
    }

    if (filters.createdFrom) {
      filterQuery.createdAt = { $gte: DateUtils.create(filters.createdFrom) };
    }

    if (filters.createdTo) {
      const existingCreatedQuery = filterQuery.createdAt as Record<string, unknown>;
      filterQuery.createdAt = {
        ...existingCreatedQuery,
        $lte: DateUtils.create(filters.createdTo),
      };
    }

    if (filters.search) {
      filterQuery.$or = [
        { accountNumber: { $regex: filters.search, $options: 'i' } },
        { accountName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Execute queries
    const [items, total] = await Promise.all([
      this.accountModel
        .find(filterQuery)
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.accountModel.countDocuments(filterQuery),
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
   * Force freeze account (admin only)
   */
  async forceFreeze(accountId: string, adminId: string, reason: string): Promise<AccountDocument> {
    ValidationUtils.validateObjectId(accountId, 'accountId', {
      context: 'AccountsAdminService',
    });
    ValidationUtils.validateObjectId(adminId, 'adminId', {
      context: 'AccountsAdminService',
    });

    const account = await this.accountModel.findById(accountId);
    ValidationUtils.validateEntityExists(account, accountId, {
      entityName: 'Account',
      context: 'AccountsAdminService',
    });

    account!.status = AccountStatus.FROZEN;
    account!.frozenAt = DateUtils.now();
    account!.frozenReason = `Admin freeze by ${adminId}: ${reason}`;

    const frozenAccount = await account!.save();
    LoggingUtil.log(
      `Account ${account!.accountNumber} frozen by admin ${adminId}`,
      'AccountsAdminService',
    );

    return frozenAccount;
  }

  /**
   * Force unfreeze account (admin only)
   */
  async forceUnfreeze(accountId: string, adminId: string): Promise<AccountDocument> {
    ValidationUtils.validateObjectId(accountId, 'accountId', {
      context: 'AccountsAdminService',
    });
    ValidationUtils.validateObjectId(adminId, 'adminId', {
      context: 'AccountsAdminService',
    });

    const account = await this.accountModel.findById(accountId);
    ValidationUtils.validateEntityExists(account, accountId, {
      entityName: 'Account',
      context: 'AccountsAdminService',
    });

    account!.status = AccountStatus.ACTIVE;
    account!.frozenAt = undefined;
    account!.frozenReason = undefined;

    const unfrozenAccount = await account!.save();
    LoggingUtil.log(
      `Account ${account!.accountNumber} unfrozen by admin ${adminId}`,
      'AccountsAdminService',
    );

    return unfrozenAccount;
  }

  /**
   * Get account transaction history with details
   */
  async getAccountTransactionHistory(
    accountId: string,
    pagination: PaginationDto,
  ): Promise<{
    items: TransactionDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    ValidationUtils.validateObjectId(accountId, 'accountId', {
      context: 'AccountsAdminService',
    });
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      maxLimit: 100,
    });

    const filter = {
      $or: [
        { fromAccountId: new Types.ObjectId(accountId) },
        { toAccountId: new Types.ObjectId(accountId) },
      ],
    };

    const [items, total] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('fromAccount', 'accountNumber accountName accountType')
        .populate('toAccount', 'accountNumber accountName accountType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter),
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
   * Get system accounts (platform accounts)
   */
  async getSystemAccounts(): Promise<AccountDocument[]> {
    return this.accountModel.find({ ownerType: 'SYSTEM' }).sort({ accountType: 1 }).exec();
  }

  /**
   * Get account ledger entries for auditing
   */
  async getAccountLedger(
    accountId: string,
    pagination: PaginationDto,
  ): Promise<{
    items: AccountLedgerDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    ValidationUtils.validateObjectId(accountId, 'accountId', {
      context: 'AccountsAdminService',
    });
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      maxLimit: 100,
    });

    const filter = {
      $or: [
        { debitAccountId: new Types.ObjectId(accountId) },
        { creditAccountId: new Types.ObjectId(accountId) },
      ],
    };

    const [items, total] = await Promise.all([
      this.ledgerModel
        .find(filter)
        .populate('debitAccount', 'accountNumber accountName accountType')
        .populate('creditAccount', 'accountNumber accountName accountType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ledgerModel.countDocuments(filter),
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
   * Get accounts with suspicious activity
   */
  async getSuspiciousAccounts(): Promise<AccountDocument[]> {
    // Accounts with unusually high transaction volumes, frozen accounts, etc.
    return this.accountModel
      .find({
        $or: [
          { status: AccountStatus.FROZEN },
          { 'balance.available': { $lt: -1000 } }, // Negative balance over $10
          { transactionCount: { $gt: 1000 } }, // High transaction volume
        ],
      })
      .populate('owner', 'firstName lastName email')
      .sort({ lastActivityAt: -1 })
      .limit(100)
      .exec();
  }

  /**
   * Generate account reconciliation report
   */
  async generateReconciliationReport(): Promise<{
    summary: {
      totalAccounts: number;
      totalBalance: number;
      availableBalance: number;
      pendingBalance: number;
      escrowedBalance: number;
    };
    byAccountType: Record<
      string,
      {
        count: number;
        totalBalance: number;
        availableBalance: number;
      }
    >;
    byCurrency: Record<
      string,
      {
        count: number;
        totalBalance: number;
        availableBalance: number;
      }
    >;
  }> {
    const accounts = await this.accountModel.find().exec();

    const summary = accounts.reduce(
      (acc, account) => ({
        totalAccounts: acc.totalAccounts + 1,
        totalBalance: acc.totalBalance + account.balance.total,
        availableBalance: acc.availableBalance + account.balance.available,
        pendingBalance: acc.pendingBalance + account.balance.pending,
        escrowedBalance: acc.escrowedBalance + account.balance.escrowed,
      }),
      {
        totalAccounts: 0,
        totalBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        escrowedBalance: 0,
      },
    );

    const byAccountType = accounts.reduce(
      (acc, account) => {
        if (!acc[account.accountType]) {
          acc[account.accountType] = {
            count: 0,
            totalBalance: 0,
            availableBalance: 0,
          };
        }
        acc[account.accountType].count++;
        acc[account.accountType].totalBalance += account.balance.total;
        acc[account.accountType].availableBalance += account.balance.available;
        return acc;
      },
      {} as Record<
        string,
        {
          count: number;
          totalBalance: number;
          availableBalance: number;
        }
      >,
    );

    const byCurrency = accounts.reduce(
      (acc, account) => {
        if (!acc[account.currency]) {
          acc[account.currency] = {
            count: 0,
            totalBalance: 0,
            availableBalance: 0,
          };
        }
        acc[account.currency].count++;
        acc[account.currency].totalBalance += account.balance.total;
        acc[account.currency].availableBalance += account.balance.available;
        return acc;
      },
      {} as Record<
        string,
        {
          count: number;
          totalBalance: number;
          availableBalance: number;
        }
      >,
    );

    return {
      summary,
      byAccountType,
      byCurrency,
    };
  }

  /**
   * Bulk operations for accounts
   */
  async bulkFreeze(
    accountIds: string[],
    adminId: string,
    reason: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    ValidationUtils.validateObjectIdArray(accountIds, 'accountIds', {
      context: 'AccountsAdminService',
      minItems: 1,
      maxItems: 50,
      uniqueItems: true,
    });
    ValidationUtils.validateObjectId(adminId, 'adminId', {
      context: 'AccountsAdminService',
    });

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const accountId of accountIds) {
      try {
        await this.forceFreeze(accountId, adminId, reason);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }
}
