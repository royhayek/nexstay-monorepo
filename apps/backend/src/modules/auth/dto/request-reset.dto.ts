import { AuthMethod } from './login.dto';
import { IsIdentifierField, IsEnumField } from '../../../common/validators/standardized-validators';

export class RequestResetDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number',
    example: 'user@example.com',
  })
  identifier!: string;

  @IsEnumField([AuthMethod.EMAIL, AuthMethod.PHONE], {
    required: true,
    description: 'Reset method: email or phone',
    example: AuthMethod.EMAIL,
  })
  method!: AuthMethod.EMAIL | AuthMethod.PHONE;
}
