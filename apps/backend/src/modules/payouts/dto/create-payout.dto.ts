import { PayoutType } from '../../../common/enums/payout.enums';
import {
  IsUuidField,
  IsTextAreaField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { IsPayoutAmountField } from '../validators/payout.validators';

export class CreatePayoutDto {
  @IsUuidField({
    required: true,
    description: 'ID of the payout method to use',
    example: '507f1f77bcf86cd799439011',
  })
  payoutMethodId!: string;

  @IsEnumField(PayoutType, {
    required: true,
    description: 'Type of payout',
    example: PayoutType.STANDARD,
  })
  type!: PayoutType;

  @IsPayoutAmountField({
    description: 'Amount to payout (optional, defaults to all eligible earnings)',
    example: 500,
  })
  amount?: number;

  @IsTextAreaField({
    description: 'Optional description for the payout',
    example: 'Monthly earnings payout',
    maxLength: 500,
  })
  description?: string;
}
