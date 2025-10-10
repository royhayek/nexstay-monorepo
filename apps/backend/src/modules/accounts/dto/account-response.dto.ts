import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  AccountType,
  AccountStatus,
  AccountOwnerType,
} from '../../../database/schemas/account.schema';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';

export class AccountBalanceDto {
  @ApiProperty({ description: 'Available balance in cents', example: 5000 })
  @Expose()
  available: number;

  @ApiProperty({ description: 'Pending balance in cents', example: 1000 })
  @Expose()
  pending: number;

  @ApiProperty({ description: 'Escrowed balance in cents', example: 2000 })
  @Expose()
  escrowed: number;

  @ApiProperty({ description: 'Total balance in cents', example: 8000 })
  @Expose()
  total: number;
}

export class PayoutSettingsDto {
  @ApiProperty({
    description: 'Payout method preference',
    enum: ['STANDARD', 'FAST_PAY'],
    example: 'STANDARD',
  })
  @Expose()
  payoutMethod: 'STANDARD' | 'FAST_PAY';

  @ApiProperty({ description: 'Whether Fast Pay is enabled', example: false })
  @Expose()
  fastPayEnabled: boolean;

  @ApiProperty({ description: 'Minimum payout amount in cents', example: 50 })
  @Expose()
  minimumPayoutAmount: number;

  @ApiProperty({ description: 'Whether this is a new host', example: false })
  @Expose()
  isNewHost: boolean;
}

export class UserSummaryDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  _id: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @Expose()
  firstName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @Expose()
  lastName?: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @Expose()
  email?: string;
}

export class AccountDataDto {
  @ApiProperty({ description: 'Account ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  _id: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.GUEST_WALLET,
  })
  @Expose()
  accountType: AccountType;

  @ApiProperty({ description: 'Unique account number', example: 'GW-123456' })
  @Expose()
  accountNumber: string;

  @ApiProperty({
    description: 'Human-readable account name',
    example: 'Guest Wallet - john.doe@example.com',
  })
  @Expose()
  accountName: string;

  @ApiProperty({ description: 'Owner ID', example: '507f1f77bcf86cd799439011' })
  @Expose()
  ownerId?: string;

  @ApiProperty({
    description: 'Owner type',
    enum: AccountOwnerType,
    example: AccountOwnerType.USER,
  })
  @Expose()
  ownerType: AccountOwnerType;

  @ApiProperty({ description: 'Account currency', example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({ description: 'Account balance information', type: AccountBalanceDto })
  @Expose()
  @Type(() => AccountBalanceDto)
  balance: AccountBalanceDto;

  @ApiProperty({
    description: 'Account status',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @Expose()
  status: AccountStatus;

  @ApiProperty({
    description: 'Payout settings (only for HOST_EARNINGS accounts)',
    type: PayoutSettingsDto,
    required: false,
  })
  @Expose()
  @Type(() => PayoutSettingsDto)
  payoutSettings?: PayoutSettingsDto;

  @ApiProperty({ description: 'Account owner information', type: UserSummaryDto, required: false })
  @Expose()
  @Type(() => UserSummaryDto)
  owner?: UserSummaryDto;

  @ApiProperty({ description: 'Last activity timestamp', example: '2024-01-15T10:30:00Z' })
  @Expose()
  lastActivityAt?: Date;

  @ApiProperty({ description: 'Transaction count', example: 25 })
  @Expose()
  transactionCount: number;

  @ApiProperty({ description: 'Account created timestamp', example: '2024-01-01T09:00:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Account updated timestamp', example: '2024-01-15T10:30:00Z' })
  @Expose()
  updatedAt: Date;
}

// Paginated DTOs following architectural guidelines
export class AccountsPaginatedDto {
  @ApiProperty({ type: [AccountDataDto], description: 'Array of account items' })
  @Type(() => AccountDataDto)
  items: AccountDataDto[];

  @ApiProperty({ description: 'Total number of accounts', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20, minimum: 1 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5, minimum: 0 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrevPage: boolean;
}

// Response DTOs using factory pattern
export const AccountResponseDto = createResponseDto(AccountDataDto);
export const AccountsListResponseDto = createResponseDto(AccountsPaginatedDto);

// Type aliases for return types
export type AccountResponse = BaseResponseDto<AccountDataDto>;
export type AccountsListResponse = BaseResponseDto<AccountsPaginatedDto>;

// Operation-specific response DTOs
export class AccountCreationDataDto {
  @ApiProperty({ description: 'Created account information', type: AccountDataDto })
  @Expose()
  @Type(() => AccountDataDto)
  account: AccountDataDto;

  @ApiProperty({ description: 'Account creation timestamp', example: '2024-01-15T10:30:00Z' })
  @Expose()
  createdAt: Date;
}

export class AccountSummaryDataDto {
  @ApiProperty({ description: 'Total balance across all accounts in cents', example: 15000 })
  @Expose()
  totalBalance: number;

  @ApiProperty({ description: 'Available balance across all accounts in cents', example: 10000 })
  @Expose()
  availableBalance: number;

  @ApiProperty({ description: 'Pending balance across all accounts in cents', example: 3000 })
  @Expose()
  pendingBalance: number;

  @ApiProperty({ description: 'Escrowed balance across all accounts in cents', example: 2000 })
  @Expose()
  escrowedBalance: number;

  @ApiProperty({ description: 'User accounts list', type: [AccountDataDto] })
  @Expose()
  @Type(() => AccountDataDto)
  accounts: AccountDataDto[];
}

export class UserAccountsDataDto {
  @ApiProperty({ description: 'Guest wallet account', type: AccountDataDto, required: false })
  @Expose()
  @Type(() => AccountDataDto)
  guestWallet?: AccountDataDto;

  @ApiProperty({ description: 'Host earnings account', type: AccountDataDto, required: false })
  @Expose()
  @Type(() => AccountDataDto)
  hostEarnings?: AccountDataDto;
}

// Operation response DTOs
export const AccountCreationResponseDto = createResponseDto(AccountCreationDataDto);
export const AccountSummaryResponseDto = createResponseDto(AccountSummaryDataDto);
export const UserAccountsResponseDto = createResponseDto(UserAccountsDataDto);

// Operation response type aliases
export type AccountCreationResponse = BaseResponseDto<AccountCreationDataDto>;
export type AccountSummaryResponse = BaseResponseDto<AccountSummaryDataDto>;
export type UserAccountsResponse = BaseResponseDto<UserAccountsDataDto>;
