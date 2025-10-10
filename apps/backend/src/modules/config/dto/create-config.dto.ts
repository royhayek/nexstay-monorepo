import { ConfigCategory } from '../../../database/schemas/app-config.schema';
import {
  IsNameField,
  IsTextAreaField,
  IsEnumField,
  IsNumberField,
} from '../../../common/validators/standardized-validators';

export class CreateConfigDto {
  @IsNameField({ required: true, example: 'SESSION_EXPIRES_IN' })
  key: string;

  @IsNameField({ required: true, example: '15m' })
  value: string;

  @IsNameField({ required: true, example: 'Session Expiry Duration' })
  title: string;

  @IsTextAreaField({
    required: false,
    example: 'JWT session expiry duration in minutes or hours format',
  })
  description?: string;

  @IsEnumField(ConfigCategory, { required: true, example: ConfigCategory.GENERAL })
  category: ConfigCategory;

  @IsNumberField({ required: false, example: 0 })
  sortOrder?: number;
}
