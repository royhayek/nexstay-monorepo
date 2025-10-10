import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Account,
  AccountDocument,
  AccountType,
  AccountStatus,
  AccountOwnerType,
} from '../../../database/schemas/account.schema';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountBalanceUpdateDto } from '../dto/account-balance-update.dto';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { JsonUtils } from '../../../common/utils/json.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';

@Injectable()
export class AccountsCoreService {
  constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>) {}

  /**
   * Create a new account
   */
  async createAccount(createAccountDto: CreateAccountDto): Promise<AccountDocument> {
    try {
      LoggingUtil.log(
        `Creating account: ${createAccountDto.accountType} for owner ${createAccountDto.ownerId}`,
        'AccountsCoreService',
      );

      const accountNumber = await this.generateAccountNumber(createAccountDto.accountType);

      const account = new this.accountModel({
        accountType: createAccountDto.accountType,
        accountNumber,
        accountName: createAccountDto.accountName,
        ownerId: createAccountDto.ownerId,
        ownerType: createAccountDto.ownerType,
        currency: createAccountDto.currency || 'USD',
        balance: {
          available: 0,
          pending: 0,
          escrowed: 0,
          total: 0,
        },
        status: AccountStatus.ACTIVE,
        payoutSettings: createAccountDto.payoutSettings,
        metadata: createAccountDto.metadata,
      });

      const savedAccount = await account.save();
      LoggingUtil.log(
        `Account created successfully: ${savedAccount.accountNumber}`,
        'AccountsCoreService',
      );

      return savedAccount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.errorWithException(
        `Error creating account: ${errorMessage}`,
        error,
        'AccountsCoreService',
      );
      throw new Error(`Failed to create account: ${errorMessage}`);
    }
  }

  /**
   * Find account by ID
   */
  async findById(accountId: string, populate = false): Promise<AccountDocument> {
    ValidationUtils.validateObjectId(accountId, 'accountId', {
      context: 'AccountsCoreService',
      throwOnError: true,
    });

    let query = this.accountModel.findById(accountId);

    if (populate) {
      query = query.populate('owner', 'firstName lastName email');
    }

    const account = await query.exec();
    ValidationUtils.validateEntityExists(account, accountId, {
      entityName: 'Account',
      context: 'AccountsCoreService',
    });

    return account!;
  }

  /**
   * Find account by account number
   */
  async findByAccountNumber(accountNumber: string): Promise<AccountDocument> {
    if (!accountNumber || typeof accountNumber !== 'string') {
      throw new BadRequestException('Account number is required and must be a string');
    }

    const account = await this.accountModel.findOne({ accountNumber }).exec();
    ValidationUtils.validateEntityExists(account, accountNumber, {
      entityName: 'Account',
      context: 'AccountsCoreService',
    });

    return account!;
  }

  /**
   * Find accounts by owner
   */
  async findByOwnerId(ownerId: string, accountType?: AccountType): Promise<AccountDocument[]> {
    ValidationUtils.validateObjectId(ownerId, 'ownerId', {
      context: 'AccountsCoreService',
      throwOnError: true,
    });

    // Build query with proper ObjectId conversion - ownerId should be ObjectId in DB
    const filter: { ownerId: Types.ObjectId; accountType?: AccountType } = {
      ownerId: new Types.ObjectId(ownerId), // Convert string to ObjectId as per schema
    };

    if (accountType) {
      filter.accountType = accountType;
    }

    LoggingUtil.log(
      `Executing MongoDB query with filter: originalOwnerId=${ownerId}, accountType=${accountType}, filter=${JsonUtils.safeStringify(filter)}, ownerIdType=${typeof filter.ownerId}, isObjectId=${filter.ownerId instanceof Types.ObjectId}`,
      'AccountsCoreService',
    );

    // First try with ObjectId (correct approach)
    let accounts = await this.accountModel.find(filter).exec();

    // If no results with ObjectId, try string format (for data migration compatibility)
    if (accounts.length === 0) {
      LoggingUtil.log(
        `No accounts found with ObjectId format, trying string format for ownerId: ${ownerId}`,
        'AccountsCoreService',
      );

      const stringFilter: { ownerId: string; accountType?: AccountType } = {
        ownerId: ownerId,
      };

      if (accountType) {
        stringFilter.accountType = accountType;
      }

      accounts = await this.accountModel.find(stringFilter).exec();

      if (accounts.length > 0) {
        LoggingUtil.log(
          `MIGRATION NEEDED: Found ${accounts.length} accounts with string ownerId format. These should be migrated to ObjectId.`,
          'AccountsCoreService',
        );
      }
    }

    LoggingUtil.log(
      `MongoDB query result: originalOwnerId=${ownerId}, resultCount=${accounts.length}, foundAccountIds=[${accounts.map((acc) => String(acc._id)).join(', ')}], foundOwnerIds=[${accounts.map((acc) => String(acc.ownerId)).join(', ')}]`,
      'AccountsCoreService',
    );

    return accounts;
  }

  /**
   * Get user's primary accounts (GUEST_WALLET and HOST_EARNINGS)
   */
  async getUserAccounts(userId: string): Promise<{
    guestWallet?: AccountDocument;
    hostEarnings?: AccountDocument;
  }> {
    LoggingUtil.log(`Looking up accounts for userId: ${userId}`, 'AccountsCoreService');

    const accounts = await this.findByOwnerId(userId);

    LoggingUtil.log(
      `Found ${accounts.length} accounts for userId ${userId}: accountTypes=[${accounts.map((acc) => acc.accountType).join(', ')}], accountIds=[${accounts.map((acc) => String(acc._id)).join(', ')}]`,
      'AccountsCoreService',
    );

    const guestWallet = accounts.find((acc) => acc.accountType === AccountType.GUEST_WALLET);
    const hostEarnings = accounts.find((acc) => acc.accountType === AccountType.HOST_EARNINGS);

    LoggingUtil.log(
      `Account filtering results for userId ${userId}: totalAccounts=${accounts.length}, foundGuestWallet=${!!guestWallet}, foundHostEarnings=${!!hostEarnings}, guestWalletType=${guestWallet?.accountType}, hostEarningsType=${hostEarnings?.accountType}`,
      'AccountsCoreService',
    );

    return {
      guestWallet,
      hostEarnings,
    };
  }

  /**
   * Update account balance (with optimistic locking)
   */
  async updateBalance(
    accountId: string,
    updateDto: AccountBalanceUpdateDto,
    expectedVersion?: number,
  ): Promise<AccountDocument> {
    const session = await this.accountModel.db.startSession();

    try {
      session.startTransaction();

      const account = await this.accountModel.findById(accountId).session(session);
      ValidationUtils.validateEntityExists(account, accountId, {
        entityName: 'Account',
        context: 'AccountsCoreService',
      });

      // Optimistic locking check
      if (expectedVersion !== undefined && account!.version !== expectedVersion) {
        throw new ConflictException('Account version mismatch - please refresh and try again');
      }

      // Validate amounts using ValidationUtils
      if (updateDto.debitAmount) {
        ValidationUtils.validatePrice(updateDto.debitAmount, 'debitAmount', {
          context: 'AccountsCoreService',
          allowZero: false,
        });
        if (!account!.canDebit(updateDto.debitAmount)) {
          throw new BadRequestException('Insufficient funds for debit operation');
        }
      }

      if (updateDto.creditAmount) {
        ValidationUtils.validatePrice(updateDto.creditAmount, 'creditAmount', {
          context: 'AccountsCoreService',
          allowZero: false,
        });
        if (!account!.canCredit(updateDto.creditAmount)) {
          throw new BadRequestException('Credit operation would exceed account limits');
        }
      }

      // Update balance using schema method
      account!.updateBalance(updateDto.debitAmount || 0, updateDto.creditAmount || 0);

      // Update other fields if provided
      if (updateDto.pendingChange) {
        account!.balance.pending += updateDto.pendingChange;
      }

      if (updateDto.escrowChange) {
        account!.balance.escrowed += updateDto.escrowChange;
      }

      // Recalculate total
      account!.balance.total =
        account!.balance.available + account!.balance.pending + account!.balance.escrowed;

      const updatedAccount = await account!.save({ session });

      await session.commitTransaction();
      return updatedAccount;
    } catch (error) {
      await session.abortTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.errorWithException(
        `Error updating account balance: ${errorMessage}`,
        error,
        'AccountsCoreService',
      );
      throw error;
    } finally {
      void session.endSession();
    }
  }

  /**
   * Freeze account
   */
  async freezeAccount(accountId: string, reason: string): Promise<AccountDocument> {
    const account = await this.findById(accountId);

    account.status = AccountStatus.FROZEN;
    account.frozenAt = DateUtils.now();
    account.frozenReason = reason;

    return account.save();
  }

  /**
   * Unfreeze account
   */
  async unfreezeAccount(accountId: string): Promise<AccountDocument> {
    const account = await this.findById(accountId);

    account.status = AccountStatus.ACTIVE;
    account.frozenAt = undefined;
    account.frozenReason = undefined;

    return account.save();
  }

  /**
   * Generate unique account number
   */
  private async generateAccountNumber(accountType: AccountType): Promise<string> {
    const prefix = this.getAccountPrefix(accountType);
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const randomNumber = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0');
      const accountNumber = `${prefix}-${randomNumber}`;

      const existing = await this.accountModel.findOne({ accountNumber }).exec();
      if (!existing) {
        return accountNumber;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique account number');
  }

  /**
   * Get account prefix based on type
   */
  private getAccountPrefix(accountType: AccountType): string {
    const prefixMap: Record<AccountType, string> = {
      [AccountType.GUEST_WALLET]: 'GW',
      [AccountType.HOST_EARNINGS]: 'HE',
      [AccountType.PLATFORM_CASH]: 'PC',
      [AccountType.PLATFORM_REVENUE]: 'PR',
      [AccountType.ESCROW]: 'ESC',
      [AccountType.GUEST_DEPOSIT]: 'GD',
    };

    return prefixMap[accountType] || 'ACC';
  }

  /**
   * Create user accounts (Guest Wallet and Host Earnings)
   */
  async createUserAccounts(
    userId: string,
    userEmail: string,
  ): Promise<{
    guestWallet: AccountDocument;
    hostEarnings: AccountDocument;
  }> {
    try {
      // Create Guest Wallet
      const guestWallet = await this.createAccount({
        accountType: AccountType.GUEST_WALLET,
        accountName: `Guest Wallet - ${userEmail}`,
        ownerId: userId,
        ownerType: AccountOwnerType.USER,
        currency: 'USD',
      });

      // Create Host Earnings Account
      const hostEarnings = await this.createAccount({
        accountType: AccountType.HOST_EARNINGS,
        accountName: `Host Earnings - ${userEmail}`,
        ownerId: userId,
        ownerType: AccountOwnerType.USER,
        currency: 'USD',
        payoutSettings: {
          payoutMethod: 'STANDARD',
          fastPayEnabled: false,
          minimumPayoutAmount: 50, // $0.50 minimum
          isNewHost: true, // New host gets 30-day hold
        },
      });

      LoggingUtil.log(
        `User accounts created for user ${userId}: ${guestWallet.accountNumber}, ${hostEarnings.accountNumber}`,
        'AccountsCoreService',
      );

      return {
        guestWallet,
        hostEarnings,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.errorWithException(
        `Error creating user accounts for ${userId}: ${errorMessage}`,
        error,
        'AccountsCoreService',
      );
      throw error;
    }
  }

  /**
   * Get account summary for user
   */
  async getAccountSummary(userId: string): Promise<{
    totalBalance: number;
    availableBalance: number;
    pendingBalance: number;
    escrowedBalance: number;
    accounts: AccountDocument[];
  }> {
    const accounts = await this.findByOwnerId(userId);

    const summary = accounts.reduce(
      (acc, account) => ({
        totalBalance: acc.totalBalance + account.balance.total,
        availableBalance: acc.availableBalance + account.balance.available,
        pendingBalance: acc.pendingBalance + account.balance.pending,
        escrowedBalance: acc.escrowedBalance + account.balance.escrowed,
      }),
      {
        totalBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        escrowedBalance: 0,
      },
    );

    return {
      ...summary,
      accounts,
    };
  }
}
