import {
  Controller,
  Get,
  Post,
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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';

import { AccountsFacadeService } from '../services/accounts-facade.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import type {
  TransactionType,
  TransactionStatus,
} from '../../../database/schemas/transaction.schema';
import { PayoutRequestResult } from '../interfaces/service-responses.interface';
import {
  AccountDataDto,
  AccountsPaginatedDto,
  AccountResponseDto,
  AccountSummaryResponseDto,
  UserAccountsResponseDto,
  AccountCreationResponseDto,
  type AccountResponse,
  type AccountSummaryResponse,
  type UserAccountsResponse,
  type AccountCreationResponse,
} from '../dto/account-response.dto';
import {
  TransactionDataDto,
  TransactionsPaginatedDto,
  TransactionResponseDto,
  TransactionStatsResponseDto,
  TransactionsListResponseDto,
  PayoutRequestResponseDto,
  type TransactionResponse,
  type TransactionStatsResponse,
  type TransactionsListResponse,
} from '../dto/transaction-response.dto';

@Controller('app/accounts')
@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(
  AccountDataDto,
  AccountsPaginatedDto,
  TransactionDataDto,
  TransactionsPaginatedDto,
  PaginationDto,
)
export class AccountsAppController extends BaseController {
  constructor(private readonly accountsService: AccountsFacadeService) {
    super();
  }

  // ================================
  // Account Operations
  // ================================

  @Get('my-accounts')
  @ProtectedEndpoint(
    'Get user accounts summary',
    'Get comprehensive summary of user accounts including balances and status',
    AccountSummaryResponseDto,
  )
  async getMyAccounts(@CurrentUser() user: UserDocument): Promise<AccountSummaryResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const summary = await this.accountsService.getUserAccountsSummary(String(user._id));

        return {
          totalBalance: summary.totalBalance,
          availableBalance: summary.availableBalance,
          pendingBalance: summary.pendingBalance,
          escrowedBalance: summary.escrowedBalance,
          accounts: summary.accounts.map((account) =>
            plainToInstance(AccountDataDto, account.toObject()),
          ),
        };
      },
      'Get my accounts',
      'Accounts Retrieved',
      'Accounts summary retrieved successfully',
    );
  }

  @Get('primary')
  @ProtectedEndpoint(
    'Get user primary accounts (Guest Wallet & Host Earnings)',
    'Retrieve primary user accounts including guest wallet and host earnings accounts',
    UserAccountsResponseDto,
  )
  async getPrimaryAccounts(@CurrentUser() user: UserDocument): Promise<UserAccountsResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const accounts = await this.accountsService.getUserAccounts(String(user._id));

        return {
          guestWallet: accounts.guestWallet
            ? plainToInstance(AccountDataDto, accounts.guestWallet.toObject())
            : undefined,
          hostEarnings: accounts.hostEarnings
            ? plainToInstance(AccountDataDto, accounts.hostEarnings.toObject())
            : undefined,
        };
      },
      'Get primary accounts',
      'Primary Accounts Retrieved',
      'Primary accounts retrieved successfully',
    );
  }

  @Get(':id')
  @ProtectedEndpoint(
    'Get account by ID',
    'Retrieve detailed account information by account ID',
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
          String(user._id),
          user.roles?.[0],
        );

        return plainToInstance(AccountDataDto, account.toObject());
      },
      'Get account by ID',
      'Account Retrieved',
      'Account retrieved successfully',
    );
  }

  @Post()
  @ProtectedEndpoint(
    'Create new account',
    'Create a new account for the authenticated user',
    AccountCreationResponseDto,
  )
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: UserDocument,
  ): Promise<AccountCreationResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Ensure user can only create accounts for themselves
        createAccountDto.ownerId = String(user._id);

        const account = await this.accountsService.createAccount(createAccountDto);

        return {
          account: plainToInstance(AccountDataDto, account.toObject()),
          createdAt: account.createdAt,
        };
      },
      'Create account',
      'Account Created',
      'Account created successfully',
    );
  }

  // ================================
  // Transaction Operations
  // ================================

  @Get('transactions/my-history')
  @ProtectedEndpoint(
    'Get user transaction history',
    'Retrieve paginated transaction history for user accounts',
    TransactionsListResponseDto,
  )
  async getMyTransactionHistory(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<TransactionsListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.getUserTransactionHistory(
          String(user._id),
          { page, limit: Math.min(limit, 100) },
          {
            type: type as TransactionType | undefined,
            status: status as TransactionStatus | undefined,
            fromDate,
            toDate,
          },
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
      'Get transaction history',
      'Transaction History Retrieved',
      'Transaction history retrieved successfully',
    );
  }

  @Get('transactions/:id')
  @ProtectedEndpoint(
    'Get transaction details',
    'Retrieve detailed information for a specific transaction',
    TransactionResponseDto,
  )
  async getTransactionById(
    @Param('id') transactionId: string,
    @CurrentUser() user: UserDocument,
  ): Promise<TransactionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.accountsService.getTransactionById(
          transactionId,
          String(user._id),
        );

        return plainToInstance(TransactionDataDto, transaction.toObject());
      },
      'Get transaction details',
      'Transaction Retrieved',
      'Transaction details retrieved successfully',
    );
  }

  @Get('transactions/stats/:period')
  @ProtectedEndpoint(
    'Get transaction statistics',
    'Get comprehensive transaction statistics for user accounts',
    TransactionStatsResponseDto,
  )
  async getTransactionStats(
    @Param('period') period: 'last_30_days' | 'last_90_days' | 'last_year' | 'all_time',
    @CurrentUser() user: UserDocument,
  ): Promise<TransactionStatsResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const stats = await this.accountsService.getUserTransactionStats(String(user._id), period);

        return stats;
      },
      'Get transaction statistics',
      'Transaction Stats Retrieved',
      'Transaction statistics retrieved successfully',
    );
  }

  // ================================
  // Payout Operations
  // ================================

  @Get('payouts/info')
  @ProtectedEndpoint(
    'Get host payout information',
    'Retrieve host payout settings and eligibility information',
    PayoutRequestResponseDto,
  )
  async getPayoutInfo(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payoutInfo = await this.accountsService.getHostPayoutInfo(String(user._id));

        return payoutInfo;
      },
      'Get payout info',
      'Payout Info Retrieved',
      'Payout information retrieved successfully',
    );
  }

  @Post('payouts/request')
  @ProtectedEndpoint(
    'Request host payout',
    'Submit a payout request for host earnings',
    PayoutRequestResponseDto,
  )
  async requestPayout(
    @Body()
    requestDto: {
      amount: number;
      payoutMethodId?: string;
      fastPay?: boolean;
    },
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.accountsService.processHostPayout(
          String(user._id),
          requestDto.amount,
          requestDto.payoutMethodId,
          requestDto.fastPay || false,
        );

        const payoutResult: PayoutRequestResult = {
          transactionId: String(result.transaction._id),
          payoutId: result.payout ? String(result.payout._id) : undefined,
          amount: requestDto.amount,
          fastPayFee: result.fastPayFee,
          estimatedArrival: result.payout?.expectedArrival,
        };

        return payoutResult;
      },
      'Request payout',
      'Payout Requested',
      'Payout request processed successfully',
    );
  }

  // ================================
  // Escrow Operations (Limited Access)
  // ================================

  @Get('escrow/pending')
  @ProtectedEndpoint(
    'Get user pending escrow transactions',
    'Retrieve user transactions currently held in escrow',
    TransactionsListResponseDto,
  )
  async getPendingEscrowTransactions(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // This would typically be filtered to user's transactions only
        // For now, we'll return a limited view
        const transactions = await this.accountsService.getPendingEscrowTransactions();

        // Filter to only transactions involving this user's accounts
        const userAccounts = await this.accountsService.getUserAccounts(String(user._id));
        const userAccountIds = [
          userAccounts.guestWallet?._id?.toString(),
          userAccounts.hostEarnings?._id?.toString(),
        ].filter(Boolean);

        const userTransactions = transactions.filter(
          (transaction) =>
            userAccountIds.includes(transaction.fromAccountId.toString()) ||
            userAccountIds.includes(transaction.toAccountId.toString()),
        );

        return userTransactions.map((transaction) =>
          plainToInstance(TransactionDataDto, transaction.toObject() as Record<string, unknown>),
        );
      },
      'Get pending escrow',
      'Pending Escrow Retrieved',
      'Pending escrow transactions retrieved successfully',
    );
  }
}
