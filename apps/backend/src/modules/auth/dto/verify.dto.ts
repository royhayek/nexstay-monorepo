import { AuthMethod } from './login.dto';
import {
  IsEnumField,
  IsIdentifierField,
  IsOtpCodeField,
} from '../../../common/validators/standardized-validators';

export class VerifyDto {
  @IsEnumField([AuthMethod.EMAIL, AuthMethod.PHONE], {
    required: true,
    description: 'Verification method: email or phone',
    example: AuthMethod.EMAIL,
  })
  method!: AuthMethod.EMAIL | AuthMethod.PHONE;

  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number being verified',
    example: 'alice@example.com',
  })
  identifier!: string;

  @IsOtpCodeField({ required: true, example: '123456' })
  code!: string;
}
