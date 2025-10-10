import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsUuidField, IsNameField } from '../../../common/validators/standardized-validators';
import { AccountType, AccountOwnerType } from '../../../database/schemas/account.schema';

export class CreatePayoutSettingsDto {
  @ApiProperty({
    description: 'Payout method preference',
    enum: ['STANDARD', 'FAST_PAY'],
    default: 'STANDARD',
    example: 'STANDARD',
  })
  @IsOptional()
  @IsEnum(['STANDARD', 'FAST_PAY'])
  payoutMethod?: 'STANDARD' | 'FAST_PAY' = 'STANDARD';

  @ApiProperty({
    description: 'Whether Fast Pay is enabled',
    default: false,
    example: false,
  })
  @IsOptional()
  fastPayEnabled?: boolean = false;

  @ApiProperty({
    description: 'Minimum payout amount in cents',
    minimum: 0,
    default: 50,
    example: 50,
  })
  @IsOptional()
  minimumPayoutAmount?: number = 50;

  @IsUuidField({
    description: 'Default payout method ID',
    example: '507f1f77bcf86cd799439011',
  })
  defaultPayoutMethodId?: string;

  @ApiProperty({
    description: 'Whether this is a new host (subject to 30-day hold)',
    default: true,
    example: true,
  })
  @IsOptional()
  isNewHost?: boolean = true;
}

export class CreateAccountDto {
  @ApiProperty({
    description: 'Type of account to create',
    enum: AccountType,
    example: AccountType.GUEST_WALLET,
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @IsNameField({
    required: true,
    description: 'Human-readable account name',
    example: 'Guest Wallet - john.doe@example.com',
  })
  accountName: string;

  @IsUuidField({
    description: 'ID of the account owner (user)',
    example: '507f1f77bcf86cd799439011',
  })
  ownerId?: string;

  @ApiProperty({
    description: 'Type of account owner',
    enum: AccountOwnerType,
    default: AccountOwnerType.USER,
    example: AccountOwnerType.USER,
  })
  @IsEnum(AccountOwnerType)
  ownerType: AccountOwnerType = AccountOwnerType.USER;

  @ApiProperty({
    description: 'Account currency (ISO 4217 code)',
    default: 'USD',
    example: 'USD',
  })
  @IsOptional()
  currency?: string = 'USD';

  @ApiProperty({
    description: 'Payout settings (only for HOST_EARNINGS accounts)',
    type: CreatePayoutSettingsDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePayoutSettingsDto)
  payoutSettings?: CreatePayoutSettingsDto;

  @ApiProperty({
    description: 'Additional metadata for the account',
    example: { region: 'US', timezone: 'America/New_York' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
