import { ValidateIf } from 'class-validator';
import { Types } from 'mongoose';
import { IsTextAreaField, IsUuidField } from '../../../common/validators/standardized-validators';

export class DeactivateAccountDto {
  @IsUuidField({
    required: true,
    description: 'ID of the selected reason for deactivation',
    example: '507f1f77bcf86cd799439011',
  })
  reasonId!: string | Types.ObjectId;

  @ValidateIf((o: DeactivateAccountDto) => o.customReason !== undefined && o.customReason !== '')
  @IsTextAreaField({
    description: 'Custom reason text - required when "Other reason" is selected',
    example: 'I need to focus on my studies',
    maxLength: 500,
  })
  customReason?: string;
}
