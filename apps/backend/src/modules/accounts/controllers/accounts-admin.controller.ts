import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { UserRole } from '../../../database/schemas/user.schema';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';

import { AccountsFacadeService } from '../services/accounts-facade.service';
import { AccountFiltersDto } from '../dto/account-filters.dto';
import {
  AccountDataDto,
  AccountsPaginatedDto,
  AccountResponseDto,
  AccountsListResponseDto,
  type AccountResponse,
  type AccountsListResponse,
} from '../dto/account-response.dto';
import {
  TransactionDataDto,
  TransactionsPaginatedDto,
  TransactionResponseDto,
  TransactionsListResponseDto,
  EscrowTransactionResponseDto,
  PayoutRequestResponseDto,
  type TransactionsListResponse,
} from '../dto/transaction-response.dto';
import type {
  FreezeAccountRequest,
  CancelEscrowRequest,
  FailPayoutRequest,
  BulkFreezeAccountsRequest,
  CreateManualTransactionRequest,
} from '../interfaces/accounts-controller.interfaces';

@Controller('admin/accounts')
@ApiTags('Accounts Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
@ApiExtraModels(AccountDataDto, AccountsPaginatedDto, TransactionDataDto, TransactionsPaginatedDto)
export class AccountsAdminController extends BaseController {
  constructor(private readonly accountsService: AccountsFacadeService) {
    super();
  }

  // ================================
  // Account Management
  // ================================

  @Get()
  @AdminEndpoint(
    'Get all accounts with advanced filtering',
    'Retrieve all user and system accounts with comprehensive filtering, sorting, and pagination',
    AccountsListResponseDto,
  )
  async getAllAccounts(
    @Query() filters: AccountFiltersDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @CurrentUser() user: UserDocument,
  ): Promise<AccountsListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.getAccountsWithFilters(
          filters,
          { page, limit: Math.min(limit, 100) },
          user.roles?.[0] || 'admin',
        );

        const items = result.items.map((account) =>
          plainToInstance(AccountDataDto, account.toObject()),
        );

        return {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get all accounts',
      'Accounts Retrieved',
      'All accounts retrieved successfully',
    );
  }

  @Get('system')
  @AdminEndpoint(
    'Get system accounts (platform accounts)',
    'Retrieve platform-owned system accounts for administrative oversight',
    AccountsListResponseDto,
  )
  async getSystemAccounts(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const accounts = await this.accountsService.getSystemAccounts(user.roles?.[0] || 'admin');

        return accounts.map((account) => plainToInstance(AccountDataDto, account.toObject()));
      },
      'Get system accounts',
      'System Accounts Retrieved',
      'System accounts retrieved successfully',
    );
  }

  @Get('suspicious')
  @AdminEndpoint(
    'Get accounts with suspicious activity',
    'Retrieve accounts flagged for suspicious activity or transactions',
    AccountsListResponseDto,
  )
  async getSuspiciousAccounts(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const accounts = await this.accountsService.getSuspiciousAccounts(
          user.roles?.[0] || 'admin',
        );

        return accounts.map((account) => plainToInstance(AccountDataDto, account.toObject()));
      },
      'Get suspicious accounts',
      'Suspicious Accounts Retrieved',
      'Suspicious accounts retrieved successfully',
    );
  }

  @Get('reconciliation')
  @AdminEndpoint(
    'Generate account reconciliation report',
    'Generate comprehensive reconciliation report for all platform accounts',
    AccountsListResponseDto,
  )
  async getReconciliationReport(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const report = await this.accountsService.getReconciliationReport(
          user.roles?.[0] || 'admin',
        );

        return report;
      },
      'Generate reconciliation report',
      'Reconciliation Report Generated',
      'Account reconciliation report generated successfully',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get account by ID (admin access)',
    'Retrieve detailed account information by ID with administrative privileges',
    AccountResponseDto,
  )
  async getAccountById(
    @Param('id') accountId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<AccountResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const account = await this.accountsService.getAccountById(
          accountId,
          undefined, // No user restriction for admin
          user.roles?.[0] || 'admin',
        );

        return plainToInstance(AccountDataDto, account.toObject());
      },
      'Get account by ID',
      'Account Retrieved',
      'Account retrieved successfully',
    );
  }

  // ================ Account Operations ================
  // Account Operations
  // ================================

  @Put(':id/freeze')
  @AdminEndpoint(
    'Freeze account',
    'Freeze account to prevent transactions and payouts',
    AccountResponseDto,
  )
  async freezeAccount(
    @Param('id') accountId: string,
    @Body() freezeDto: FreezeAccountRequest,
    @CurrentUser() user: UserDocument,
  ): Promise<AccountResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const account = await this.accountsService.freezeAccount(
          accountId,
          String(user._id),
          freezeDto.reason,
          user.roles?.[0] || 'admin',
        );

        return plainToInstance(AccountDataDto, account.toObject());
      },
      'Freeze account',
      'Account Frozen',
      'Account frozen successfully',
    );
  }

  @Put(':id/unfreeze')
  @AdminEndpoint(
    'Unfreeze account',
    'Unfreeze account to restore normal transaction capabilities',
    AccountResponseDto,
  )
  async unfreezeAccount(
    @Param('id') accountId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<AccountResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const account = await this.accountsService.unfreezeAccount(
          accountId,
          String(user._id),
          user.roles?.[0] || 'admin',
        );

        return plainToInstance(AccountDataDto, account.toObject());
      },
      'Unfreeze account',
      'Account Unfrozen',
      'Account unfrozen successfully',
    );
  }

  @Post('bulk/freeze')
  @AdminEndpoint(
    'Bulk freeze accounts',
    'Freeze multiple accounts simultaneously for security or compliance',
    AccountsListResponseDto,
  )
  async bulkFreezeAccounts(
    @Body() bulkDto: BulkFreezeAccountsRequest,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.bulkFreezeAccounts(
          bulkDto.accountIds,
          String(user._id),
          bulkDto.reason,
          user.roles?.[0] || 'admin',
        );

        return result;
      },
      'Bulk freeze accounts',
      'Bulk Freeze Completed',
      'Bulk account freeze operation completed',
    );
  }

  // ================================
  // Transaction Management
  // ================================

  @Get(':id/transactions')
  @AdminEndpoint(
    'Get account transaction history',
    'Retrieve comprehensive transaction history for a specific account',
    TransactionsListResponseDto,
  )
  async getAccountTransactionHistory(
    @Param('id') accountId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser() user: UserDocument,
  ): Promise<TransactionsListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.getAccountTransactionHistory(
          accountId,
          { page, limit: Math.min(limit, 100) },
          user.roles?.[0] || 'admin',
        );

        const items = result.items.map((transaction) =>
          plainToInstance(TransactionDataDto, transaction.toObject()),
        );

        return {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get account transactions',
      'Account Transactions Retrieved',
      'Account transaction history retrieved successfully',
    );
  }

  @Get(':id/ledger')
  @AdminEndpoint(
    'Get account ledger entries for auditing',
    'Retrieve detailed ledger entries for account auditing and compliance',
    TransactionsListResponseDto,
  )
  async getAccountLedger(
    @Param('id') accountId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.getAccountLedger(
          accountId,
          { page, limit: Math.min(limit, 100) },
          user.roles?.[0] || 'admin',
        );

        return result;
      },
      'Get account ledger',
      'Account Ledger Retrieved',
      'Account ledger entries retrieved successfully',
    );
  }

  @Post('transactions/manual')
  @AdminEndpoint(
    'Create manual transaction',
    'Create manual transaction for account adjustments and corrections',
    TransactionResponseDto,
  )
  async createManualTransaction(
    @Body() transactionDto: CreateManualTransactionRequest,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.accountsService.createManualTransaction(
          transactionDto.fromAccountId,
          transactionDto.toAccountId,
          transactionDto.amount,
          transactionDto.type,
          transactionDto.description,
          String(user._id),
          user.roles?.[0] || 'admin',
          transactionDto.metadata,
        );

        return plainToInstance(TransactionDataDto, transaction.toObject());
      },
      'Create manual transaction',
      'Manual Transaction Created',
      'Manual transaction created successfully',
    );
  }

  // ================================
  // System Operations
  // ================================

  @Get('transactions/pending')
  @AdminEndpoint(
    'Get pending transactions for processing',
    'Retrieve all pending transactions requiring administrative review',
    TransactionsListResponseDto,
  )
  async getPendingTransactions(@CurrentUser() _user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transactions = await this.accountsService.getPendingTransactions();

        return transactions.map((transaction) =>
          plainToInstance(TransactionDataDto, transaction.toObject()),
        );
      },
      'Get pending transactions',
      'Pending Transactions Retrieved',
      'Pending transactions retrieved successfully',
    );
  }

  @Get('transactions/failed')
  @AdminEndpoint(
    'Get failed transactions for retry',
    'Retrieve failed transactions that can be retried or require intervention',
    TransactionsListResponseDto,
  )
  async getFailedTransactions(@CurrentUser() _user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transactions = await this.accountsService.getFailedTransactions();

        return transactions.map((transaction) =>
          plainToInstance(TransactionDataDto, transaction.toObject()),
        );
      },
      'Get failed transactions',
      'Failed Transactions Retrieved',
      'Failed transactions retrieved successfully',
    );
  }

  @Put('transactions/:id/retry')
  @AdminEndpoint(
    'Retry failed transaction',
    'Retry a previously failed transaction with administrative override',
    TransactionResponseDto,
  )
  async retryFailedTransaction(
    @Param('id') transactionId: string,
    @CurrentUser() _user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.accountsService.retryFailedTransaction(transactionId);

        return plainToInstance(TransactionDataDto, transaction.toObject());
      },
      'Retry failed transaction',
      'Transaction Retried',
      'Failed transaction retry initiated successfully',
    );
  }

  // ================================
  // Escrow Management
  // ================================

  @Get('escrow/pending')
  @AdminEndpoint(
    'Get all pending escrow transactions',
    'Retrieve all transactions currently held in escrow awaiting release',
    TransactionsListResponseDto,
  )
  async getAllPendingEscrowTransactions(@CurrentUser() _user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transactions = await this.accountsService.getPendingEscrowTransactions();

        return transactions.map((transaction) =>
          plainToInstance(TransactionDataDto, transaction.toObject()),
        );
      },
      'Get pending escrow transactions',
      'Pending Escrow Retrieved',
      'All pending escrow transactions retrieved successfully',
    );
  }

  @Put('escrow/:id/release')
  @AdminEndpoint(
    'Manually release escrow transaction',
    'Manually release funds from escrow with administrative authorization',
    EscrowTransactionResponseDto,
  )
  async releaseEscrowTransaction(
    @Param('id') transactionId: string,
    @CurrentUser() _user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.releaseEscrowFunds(transactionId);

        return {
          hostPayout: plainToInstance(TransactionDataDto, result.hostPayout.toObject()),
          platformFee: plainToInstance(TransactionDataDto, result.platformFee.toObject()),
        };
      },
      'Release escrow funds',
      'Escrow Released',
      'Escrow funds released successfully',
    );
  }

  @Put('escrow/:id/cancel')
  @AdminEndpoint(
    'Cancel escrow transaction',
    'Cancel escrow transaction and return funds to original account',
    EscrowTransactionResponseDto,
  )
  async cancelEscrowTransaction(
    @Param('id') transactionId: string,
    @Body() cancelDto: CancelEscrowRequest,
    @CurrentUser() _user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const refundTransaction = await this.accountsService.cancelEscrowTransaction(
          transactionId,
          cancelDto.reason,
        );

        return plainToInstance(TransactionDataDto, refundTransaction.toObject());
      },
      'Cancel escrow transaction',
      'Escrow Cancelled',
      'Escrow transaction cancelled and refunded successfully',
    );
  }

  // ================================
  // Payout Management
  // ================================

  @Put('payouts/:id/complete')
  @AdminEndpoint(
    'Mark payout as completed',
    'Manually mark payout as completed for accounting and reporting',
    PayoutRequestResponseDto,
  )
  async completePayout(@Param('id') transactionId: string, @CurrentUser() _user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.accountsService.completePayout(transactionId);

        return plainToInstance(TransactionDataDto, transaction.toObject());
      },
      'Complete payout',
      'Payout Completed',
      'Payout marked as completed successfully',
    );
  }

  @Put('payouts/:id/fail')
  @AdminEndpoint(
    'Mark payout as failed',
    'Mark payout as failed with reason for retry or investigation',
    PayoutRequestResponseDto,
  )
  async failPayout(
    @Param('id') transactionId: string,
    @Body() failDto: FailPayoutRequest,
    @CurrentUser() _user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.accountsService.failPayout(transactionId, failDto.reason);

        return plainToInstance(TransactionDataDto, transaction.toObject());
      },
      'Fail payout',
      'Payout Failed',
      'Payout marked as failed successfully',
    );
  }
}
