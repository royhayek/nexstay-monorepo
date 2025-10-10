import { PartialType } from '@nestjs/swagger';
import { CreatePayoutMethodDto } from './create-payout-method.dto';
import { IsNameField } from '../../../common/validators/standardized-validators';

export class UpdatePayoutMethodDto extends PartialType(CreatePayoutMethodDto) {
  @IsNameField({
    description: 'Friendly nickname for this payout method',
    example: 'Updated Bank Account',
    maxLength: 100,
  })
  nickname?: string;
}
