import { IsIdentifierField } from '../../../common/validators/standardized-validators';

// Reuse existing checkIdentifier DTO - no need for separate signup initiate
export class SignupVerifyContactDto {
  @IsIdentifierField({
    required: true,
    description: 'Email address or phone number to verify for signup',
    example: 'user@example.com',
  })
  identifier!: string;

  // We'll determine method automatically based on identifier format
}
