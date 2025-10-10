import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

import {
  AccountType,
  AccountStatus,
  AccountOwnerType,
} from '../../../database/schemas/account.schema';
import {
  IsDateField,
  IsSearchField,
  IsUuidField,
} from '../../../common/validators/standardized-validators';

export class AccountFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by account type',
    enum: AccountType,
    example: AccountType.GUEST_WALLET,
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({
    description: 'Filter by owner type',
    enum: AccountOwnerType,
    example: AccountOwnerType.USER,
  })
  @IsOptional()
  @IsEnum(AccountOwnerType)
  ownerType?: AccountOwnerType;

  @ApiPropertyOptional({
    description: 'Filter by currency',
    example: 'USD',
  })
  @IsOptional()
  currency?: string;

  @IsUuidField({
    description: 'Filter by owner ID',
    example: '507f1f77bcf86cd799439011',
  })
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Minimum available balance (in cents)',
    minimum: 0,
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value as string, 10))
  minBalance?: number;

  @ApiPropertyOptional({
    description: 'Maximum available balance (in cents)',
    minimum: 0,
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value as string, 10))
  maxBalance?: number;

  @IsDateField({
    description: 'Filter accounts created from this date',
    example: '2024-01-01',
  })
  createdFrom?: string;

  @IsDateField({
    description: 'Filter accounts created until this date',
    example: '2024-12-31',
  })
  createdTo?: string;

  @IsSearchField({
    example: 'GW-123456',
  })
  search?: string;
}
