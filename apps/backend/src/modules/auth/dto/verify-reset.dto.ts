import {
  IsEnumField,
  IsIdentifierField,
  IsOtpCodeField,
} from '../../../common/validators/standardized-validators';
import { AuthMethod } from './login.dto';

export class VerifyResetDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number to verify for password reset',
    example: 'user@example.com',
  })
  identifier: string;

  @IsEnumField([AuthMethod.EMAIL, AuthMethod.PHONE], {
    required: true,
    description: 'Authentication method matching the identifier type',
    example: AuthMethod.EMAIL,
  })
  method: AuthMethod.EMAIL | AuthMethod.PHONE;

  @IsOtpCodeField({
    required: true,
    description: 'OTP verification code received via email or SMS',
    example: '123456',
  })
  code: string;
}
