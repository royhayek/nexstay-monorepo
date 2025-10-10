import { AuthMethod } from './login.dto';
import { IsEnumField, IsIdentifierField } from '../../../common/validators/standardized-validators';

export class RequestVerifyDto {
  @IsEnumField([AuthMethod.EMAIL, AuthMethod.PHONE], {
    required: true,
    description: 'Verification method: email or phone',
    example: AuthMethod.EMAIL,
  })
  method!: AuthMethod.EMAIL | AuthMethod.PHONE;

  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number to verify',
    example: 'alice@example.com',
  })
  identifier!: string;
}
