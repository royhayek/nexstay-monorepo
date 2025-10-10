import { ValidateIf } from 'class-validator';
import {
  IsIdentifierField,
  IsEnumField,
  IsPasswordField,
} from '../../../common/validators/standardized-validators';

export enum AuthMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

export enum CodeDeliveryMethod {
  EMAIL = 'email',
  SMS = 'sms',
}

export class LoginUserDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address, phone number, or social ID',
    example: 'user@example.com',
  })
  identifier!: string;

  @IsEnumField(AuthMethod, {
    required: true,
    description: 'Authentication method',
    example: AuthMethod.EMAIL,
  })
  method!: AuthMethod;

  @ValidateIf((obj: LoginUserDto) => [AuthMethod.EMAIL, AuthMethod.PHONE].includes(obj.method))
  @IsPasswordField({
    description: 'Password (required for email/phone methods)',
    example: 'MySecurePassword123!',
  })
  password?: string;
}
