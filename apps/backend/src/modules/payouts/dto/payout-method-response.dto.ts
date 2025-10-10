import { ApiProperty } from '@nestjs/swagger';
import { PayoutMethodType, PayoutMethodStatus } from '../../../common/enums/payout.enums';
import { CurrencyCode } from '../../../common/enums/payment.enums';
import { createResponseDto } from '../../../common/dto/base-response.dto';

class BankAccountResponseDto {
  @ApiProperty({ description: 'Masked account number', example: '****7890' })
  accountNumber: string;

  @ApiProperty({ description: 'Routing number', example: '021000021' })
  routingNumber: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  accountHolderName: string;

  @ApiProperty({ description: 'Bank name', example: 'Chase Bank', required: false })
  bankName?: string;
}

class WalletResponseDto {
  @ApiProperty({ description: 'Masked wallet address', example: '1A1z...DivfNa' })
  walletAddress: string;

  @ApiProperty({ description: 'Wallet type', example: 'bitcoin' })
  walletType: string;
}

export class PayoutMethodResponseDto {
  @ApiProperty({ description: 'Payout method ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Payout method type', enum: PayoutMethodType })
  type: PayoutMethodType;

  @ApiProperty({ description: 'Payout method status', enum: PayoutMethodStatus })
  status: PayoutMethodStatus;

  @ApiProperty({
    description: 'Bank account details',
    type: BankAccountResponseDto,
    required: false,
  })
  bankAccount?: BankAccountResponseDto;

  @ApiProperty({ description: 'Wallet details', type: WalletResponseDto, required: false })
  wallet?: WalletResponseDto;

  @ApiProperty({ description: 'Currency code', enum: CurrencyCode })
  currency: CurrencyCode;

  @ApiProperty({
    description: 'Friendly nickname',
    example: 'My Main Bank Account',
    required: false,
  })
  nickname?: string;

  @ApiProperty({ description: 'Whether this is the default method', example: true })
  isDefault: boolean;

  @ApiProperty({
    description: 'Date when verified',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'Date when last used',
    example: '2024-01-20T14:30:00Z',
    required: false,
  })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Creation date', example: '2024-01-10T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

// Create response DTO using factory pattern
export const PayoutMethodResponse = createResponseDto(PayoutMethodResponseDto);

// Type alias for better code readability
export type PayoutMethodResponseType = InstanceType<typeof PayoutMethodResponse>;
