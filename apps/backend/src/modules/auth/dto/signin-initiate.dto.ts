import { IsIdentifierField } from '../../../common/validators/standardized-validators';

export class SigninInitiateDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number to sign in with',
    example: 'user@example.com',
  })
  identifier!: string;
}
