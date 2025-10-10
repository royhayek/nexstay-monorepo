import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PayoutMethodType } from '../../../common/enums/payout.enums';
import { CurrencyCode } from '../../../common/enums/payment.enums';
import {
  IsNameField,
  IsEnumField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import {
  IsBankAccountField,
  IsBankRoutingField,
  IsWalletAddressField,
} from '../validators/payout.validators';

class BankAccountDetailsDto {
  @IsBankAccountField({
    required: true,
    description: 'Account number',
    example: '1234567890',
  })
  accountNumber!: string;

  @IsBankRoutingField({
    required: true,
    description: 'Routing number',
    example: '021000021',
  })
  routingNumber!: string;

  @IsNameField({
    required: true,
    description: 'Account holder name',
    example: 'John Doe',
    maxLength: 100,
  })
  accountHolderName!: string;

  @IsNameField({
    description: 'Bank name',
    example: 'Chase Bank',
    maxLength: 100,
  })
  bankName?: string;

  @IsBankRoutingField({
    description: 'SWIFT code for international transfers',
    example: 'CHASUS33',
  })
  swiftCode?: string;

  @IsBankAccountField({
    description: 'International Bank Account Number',
    example: 'US64SVBKUS6S3300958879',
  })
  iban?: string;
}

class WalletDetailsDto {
  @IsWalletAddressField({
    required: true,
    description: 'Wallet address',
    example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  })
  walletAddress!: string;

  @IsNameField({
    required: true,
    description: 'Wallet type',
    example: 'bitcoin',
    maxLength: 50,
  })
  walletType!: string;
}

export class CreatePayoutMethodDto {
  @IsEnumField(PayoutMethodType, {
    required: true,
    description: 'Type of payout method',
    example: PayoutMethodType.BANK_ACCOUNT,
  })
  type!: PayoutMethodType;

  @ValidateNested()
  @Type(() => BankAccountDetailsDto)
  bankAccount?: BankAccountDetailsDto;

  @ValidateNested()
  @Type(() => WalletDetailsDto)
  wallet?: WalletDetailsDto;

  @IsEnumField(CurrencyCode, {
    required: true,
    description: 'Currency for this payout method',
    example: CurrencyCode.USD,
  })
  currency!: CurrencyCode;

  @IsNameField({
    description: 'Friendly nickname for this payout method',
    example: 'My Main Bank Account',
    maxLength: 100,
  })
  nickname?: string;

  @IsBooleanField({
    description: 'Whether this should be the default payout method',
    example: false,
  })
  isDefault?: boolean;
}
