import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutFrequency } from '../../../common/enums/payout.enums';
import {
  IsEnumField,
  IsBooleanField,
  IsUuidField,
} from '../../../common/validators/standardized-validators';
import { IsMinimumPayoutField } from '../validators/payout.validators';

export class UpdatePayoutPreferencesDto {
  @IsEnumField(PayoutFrequency, {
    description: 'Automatic payout frequency',
    example: PayoutFrequency.WEEKLY,
  })
  frequency?: PayoutFrequency;

  @IsMinimumPayoutField({
    description: 'Minimum amount for automatic payouts',
    example: 100,
  })
  minimumAmount?: number;

  @IsUuidField({
    description: 'Preferred payout method ID',
    example: '507f1f77bcf86cd799439011',
  })
  preferredMethodId?: string;

  @IsBooleanField({
    description: 'Enable automatic payouts',
    example: true,
  })
  autoPayoutEnabled?: boolean;
}

export class PayoutPreferencesResponseDto {
  @ApiProperty({
    description: 'Automatic payout frequency',
    enum: PayoutFrequency,
    example: PayoutFrequency.WEEKLY,
  })
  frequency: PayoutFrequency;

  @ApiProperty({
    description: 'Minimum amount for automatic payouts',
    example: 100,
  })
  minimumAmount: number;

  @ApiPropertyOptional({
    description: 'Preferred payout method ID',
    example: '507f1f77bcf86cd799439011',
  })
  preferredMethodId?: string;

  @ApiProperty({
    description: 'Enable automatic payouts',
    example: true,
  })
  autoPayoutEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Last automatic payout date',
    example: '2024-01-15T10:30:00Z',
  })
  lastAutoPayoutDate?: Date;

  @ApiPropertyOptional({
    description: 'Next scheduled automatic payout date',
    example: '2024-01-22T01:00:00Z',
  })
  nextScheduledPayout?: Date;
}
