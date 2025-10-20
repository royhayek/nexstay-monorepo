import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { AccountsCoreService } from './accounts-core.service';
import { AccountsAdminService } from './accounts-admin.service';
import { AccountsEscrowService } from './accounts-escrow.service';
import { AccountsPayoutService } from './accounts-payout.service';
import { AccountsTransactionService } from './accounts-transaction.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AccountFiltersDto } from '../dto/account-filters.dto';
import { AccountBalanceUpdateDto } from '../dto/account-balance-update.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccountDocument, AccountOwnerType } from '../../../database/schemas/account.schema';
import {
  TransactionDocument,
  TransactionType,
  TransactionStatus,
} from '../../../database/schemas/transaction.schema';
import { UserRole } from '../../../database/schemas/user.schema';
import { PayoutProcessingResult } from '../interfaces/service-responses.interface';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { JsonUtils } from '../../../common/utils/json.utils';

/**
 * Accounts Facade Service - Coordination layer for all account operations
 * Follows architectural patterns from ARCHITECTURAL_GUIDELINES.md
 */
@Injectable()
export class AccountsFacadeService {
  constructor(
    private readonly accountsCoreService: AccountsCoreService,
    private readonly accountsAdminService: AccountsAdminService,
    private readonly accountsEscrowService: AccountsEscrowService,
    private readonly accountsPayoutService: AccountsPayoutService,
    private readonly accountsTransactionService: AccountsTransactionService,
  ) {}

  // ================================
  // Core Account Operations (Public)
  // ================================

  /**
   * Create a new account
   */
  async createAccount(createAccountDto: CreateAccountDto): Promise<AccountDocument> {
    return this.accountsCoreService.createAccount(createAccountDto);
  }

  /**
   * Get account by ID with access validation
   */
  async getAccountById(
    accountId: string,
    userId?: string,
    userRole?: string,
  ): Promise<AccountDocument> {
    const account = await this.accountsCoreService.findById(accountId, true);

    // Validate access if userId provided
    if (userId && userRole !== 'admin') {
      this.validateAccountAccess(account, userId);
    }

    return account;
  }

  /**
   * Get user's accounts summary
   */
  async getUserAccountsSummary(userId: string): Promise<{
    totalBalance: number;
    availableBalance: number;
    pendingBalance: number;
    escrowedBalance: number;
    accounts: AccountDocument[];
  }> {
    return this.accountsCoreService.getAccountSummary(userId);
  }

  /**
   * Get user's primary accounts (Guest Wallet and Host Earnings)
   */
  async getUserAccounts(userId: string): Promise<{
    guestWallet?: AccountDocument;
    hostEarnings?: AccountDocument;
  }> {
    return this.accountsCoreService.getUserAccounts(userId);
  }

  /**
   * Create user accounts when user registers
   */
  async createUserAccounts(
    userId: string,
    userEmail: string,
  ): Promise<{
    guestWallet: AccountDocument;
    hostEarnings: AccountDocument;
  }> {
    return this.accountsCoreService.createUserAccounts(userId, userEmail);
  }

  // ================================
  // Transaction Operations (Public)
  // ================================

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
  ) {
    return this.accountsTransactionService.getUserTransactionHistory(userId, pagination, filters);
  }

  /**
   * Get transaction details with access validation
   */
  async getTransactionById(transactionId: string, userId?: string): Promise<TransactionDocument> {
    return this.accountsTransactionService.getTransactionById(transactionId, userId);
  }

  /**
   * Get user transaction statistics
   */
  async getUserTransactionStats(
    userId: string,
    period: 'last_30_days' | 'last_90_days' | 'last_year' | 'all_time' = 'last_30_days',
  ) {
    return this.accountsTransactionService.getUserTransactionStats(userId, period);
  }

  // ================================
  // Escrow Operations (Business Logic)
  // ================================

  /**
   * Create escrow deposit from external payment (credit card)
   * This is the correct flow for new payments - External Payment → Escrow Account
   */
  async createBookingEscrowFromExternalPayment(
    guestId: string,
    hostId: string,
    amount: number,
    bookingId: string,
    checkInDate: Date,
    platformFeeRate?: number,
  ): Promise<TransactionDocument> {
    return this.accountsEscrowService.createEscrowDepositFromExternalPayment(
      guestId,
      hostId,
      amount,
      bookingId,
      checkInDate,
      platformFeeRate,
    );
  }

  /**
   * Create escrow hold for booking payment from guest wallet
   * This is for when guest pays from their existing wallet balance
   */
  async createBookingEscrow(
    guestWalletId: string,
    hostId: string,
    amount: number,
    bookingId: string,
    checkInDate: Date,
    platformFeeRate?: number,
  ): Promise<TransactionDocument> {
    return this.accountsEscrowService.createEscrowHold(
      guestWalletId,
      hostId,
      amount,
      bookingId,
      checkInDate,
      platformFeeRate,
    );
  }

  /**
   * Release escrow funds after check-in (24h delay)
   */
  async releaseEscrowFunds(transactionId: string): Promise<{
    hostPayout: TransactionDocument;
    platformFee: TransactionDocument;
  }> {
    return this.accountsEscrowService.releaseEscrowFunds(transactionId);
  }

  /**
   * Cancel escrow transaction (for booking cancellations)
   */
  async cancelEscrowTransaction(
    transactionId: string,
    refundReason: string,
  ): Promise<TransactionDocument> {
    return this.accountsEscrowService.cancelEscrowTransaction(transactionId, refundReason);
  }

  /**
   * Get pending escrow transactions
   */
  async getPendingEscrowTransactions(): Promise<TransactionDocument[]> {
    return this.accountsEscrowService.getPendingEscrowTransactions();
  }

  // ================================
  // Payout Operations (Host Features)
  // ================================

  /**
   * Process host payout with validation
   */
  async processHostPayout(
    hostId: string,
    amount: number,
    payoutMethodId?: string,
    fastPay = false,
  ): Promise<PayoutProcessingResult> {
    // Validate payout eligibility
    const payoutInfo = await this.accountsPayoutService.getAvailablePayoutAmount(hostId);

    if (amount > payoutInfo.availableAmount) {
      throw new Error('VALIDATION_FAILED');
    }

    if (amount < payoutInfo.minimumPayout) {
      throw new Error('VALIDATION_FAILED');
    }

    if (payoutInfo.holdUntil && payoutInfo.holdUntil > DateUtils.now()) {
      throw new Error('VALIDATION_FAILED');
    }

    return this.accountsPayoutService.processHostPayout(hostId, amount, payoutMethodId, fastPay);
  }

  /**
   * Get available payout amount for host
   */
  async getHostPayoutInfo(hostId: string): Promise<{
    availableAmount: number;
    minimumPayout: number;
    isNewHost: boolean;
    holdUntil?: Date;
  }> {
    return this.accountsPayoutService.getAvailablePayoutAmount(hostId);
  }

  /**
   * Complete payout (external webhook)
   */
  async completePayout(transactionId: string): Promise<TransactionDocument> {
    return this.accountsPayoutService.completePayout(transactionId);
  }

  /**
   * Fail payout (external webhook)
   */
  async failPayout(transactionId: string, reason: string): Promise<TransactionDocument> {
    return this.accountsPayoutService.failPayout(transactionId, reason);
  }

  // ================================
  // Admin Operations (Role-Based)
  // ================================

  /**
   * Admin: Get all accounts with filtering
   */
  async getAccountsWithFilters(
    filters: AccountFiltersDto,
    pagination: PaginationDto,
    userRole: UserRole,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SYSTEM_ADMIN) {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.findAllWithFilters(filters, pagination);
  }

  /**
   * Admin: Force freeze account
   */
  async freezeAccount(
    accountId: string,
    adminId: string,
    reason: string,
    userRole: string,
  ): Promise<AccountDocument> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.forceFreeze(accountId, adminId, reason);
  }

  /**
   * Admin: Force unfreeze account
   */
  async unfreezeAccount(
    accountId: string,
    adminId: string,
    userRole: string,
  ): Promise<AccountDocument> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.forceUnfreeze(accountId, adminId);
  }

  /**
   * Admin: Get account transaction history
   */
  async getAccountTransactionHistory(
    accountId: string,
    pagination: PaginationDto,
    userRole: string,
  ) {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.getAccountTransactionHistory(accountId, pagination);
  }

  /**
   * Admin: Get account ledger entries
   */
  async getAccountLedger(accountId: string, pagination: PaginationDto, userRole: string) {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.getAccountLedger(accountId, pagination);
  }

  /**
   * Admin: Get system accounts
   */
  async getSystemAccounts(userRole: string): Promise<AccountDocument[]> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.getSystemAccounts();
  }

  /**
   * Admin: Get reconciliation report
   */
  async getReconciliationReport(userRole: string) {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.generateReconciliationReport();
  }

  /**
   * Admin: Get suspicious accounts
   */
  async getSuspiciousAccounts(userRole: string): Promise<AccountDocument[]> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.getSuspiciousAccounts();
  }

  /**
   * Admin: Create manual transaction
   */
  async createManualTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    type: TransactionType,
    description: string,
    adminId: string,
    userRole: string,
    metadata?: Record<string, unknown>,
  ): Promise<TransactionDocument> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsTransactionService.createManualTransaction(
      fromAccountId,
      toAccountId,
      amount,
      type,
      description,
      adminId,
      metadata,
    );
  }

  /**
   * Admin: Bulk freeze accounts
   */
  async bulkFreezeAccounts(
    accountIds: string[],
    adminId: string,
    reason: string,
    userRole: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    if (userRole !== 'admin') {
      throw new Error('FORBIDDEN');
    }

    return this.accountsAdminService.bulkFreeze(accountIds, adminId, reason);
  }

  // ================================
  // System Operations (Internal)
  // ================================

  /**
   * Update account balance (internal use)
   */
  async updateAccountBalance(
    accountId: string,
    updateDto: AccountBalanceUpdateDto,
    expectedVersion?: number,
  ): Promise<AccountDocument> {
    return this.accountsCoreService.updateBalance(accountId, updateDto, expectedVersion);
  }

  /**
   * Get pending transactions for processing
   */
  async getPendingTransactions(limit = 100): Promise<TransactionDocument[]> {
    return this.accountsTransactionService.getPendingTransactions(limit);
  }

  /**
   * Get failed transactions for retry
   */
  async getFailedTransactions(limit = 50): Promise<TransactionDocument[]> {
    return this.accountsTransactionService.getFailedTransactions(limit);
  }

  /**
   * Retry failed transaction
   */
  async retryFailedTransaction(transactionId: string): Promise<TransactionDocument> {
    return this.accountsTransactionService.retryFailedTransaction(transactionId);
  }

  // ================================
  // Private Helper Methods
  // ================================

  /**
   * Validate user access to account
   */
  private validateAccountAccess(account: AccountDocument, userId: string): void {
    // System accounts are admin only
    if (account.ownerType === AccountOwnerType.SYSTEM) {
      throw new Error('FORBIDDEN');
    }

    // User can only access their own accounts
    if (!account.ownerId || account.ownerId.toString() !== userId) {
      throw new Error('FORBIDDEN');
    }
  }

  /**
   * Log important account operations for audit
   */
  private logAccountOperation(
    operation: string,
    accountId: string,
    userId?: string,
    metadata?: Record<string, unknown>,
  ): void {
    LoggingUtil.log(
      `Account operation: ${operation}, accountId=${accountId}, userId=${userId}, metadata=${JsonUtils.safeStringify(metadata)}, timestamp=${DateUtils.toISO(DateUtils.now())}`,
      'AccountsFacadeService',
    );
  }
}
