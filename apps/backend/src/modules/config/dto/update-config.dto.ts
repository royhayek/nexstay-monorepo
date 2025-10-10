import { ConfigCategory } from '../../../database/schemas/app-config.schema';
import {
  IsNameField,
  IsTextAreaField,
  IsEnumField,
  IsNumberField,
} from '../../../common/validators/standardized-validators';

export class UpdateConfigDto {
  @IsNameField({ required: false, example: '30m' })
  value?: string;

  @IsNameField({ required: false, example: 'Extended Session Duration' })
  title?: string;

  @IsTextAreaField({
    required: false,
    example: 'Updated JWT session expiry duration - now 30 minutes instead of 15',
  })
  description?: string;

  @IsEnumField(ConfigCategory, { required: false, example: ConfigCategory.SECURITY })
  category?: ConfigCategory;

  @IsNumberField({ required: false, example: 1 })
  sortOrder?: number;
}
