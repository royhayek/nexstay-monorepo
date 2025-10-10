import {
  IsEmailField,
  IsPhoneField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { AuthMethod } from './login.dto';

export class AddSecondaryContactDto {
  @IsEnumField([AuthMethod.EMAIL, AuthMethod.PHONE], {
    required: true,
    description: 'Type of contact to add',
    example: AuthMethod.EMAIL,
  })
  contactType!: AuthMethod.EMAIL | AuthMethod.PHONE;

  @IsEmailField({
    description: 'Email address (required when contactType is email)',
    required: false,
    example: 'user@example.com',
  })
  email?: string;

  @IsPhoneField({
    description: 'Phone number (required when contactType is phone)',
    required: false,
    example: '+1234567890',
  })
  phone?: string;
}
