import { IsPriceField, IsNumberField } from '../../../common/validators/standardized-validators';

export class AccountBalanceUpdateDto {
  @IsPriceField({ required: false, example: 10.0 })
  debitAmount?: number;

  @IsPriceField({ required: false, example: 15.0 })
  creditAmount?: number;

  @IsNumberField({ required: false, example: -5.0 })
  pendingChange?: number;

  @IsNumberField({ required: false, example: -10.0 })
  escrowChange?: number;
}
