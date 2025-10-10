import { UserRole } from '../../../database/schemas/user.schema';
import {
  IsEmailField,
  IsPasswordField,
  IsPhoneField,
  IsNameField,
  IsUrlField,
  IsTextAreaField,
  IsDateField,
  IsLocaleField,
  IsTimezoneField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

export class CreateUserDto {
  @IsEmailField({
    description: 'User email address (required for email authentication)',
    example: 'user@example.com',
  })
  email?: string;

  @IsPasswordField({
    description: 'User password with strong security requirements',
    example: 'MySecurePassword123!',
  })
  password?: string;

  @IsPhoneField({
    description: 'User phone number in international format (required for phone authentication)',
    example: '+1234567890',
  })
  phone?: string;

  @IsNameField({
    field: 'firstName',
    description: 'User first name',
    maxLength: 50,
  })
  firstName?: string;

  @IsNameField({
    field: 'lastName',
    description: 'User last name',
    maxLength: 50,
  })
  lastName?: string;

  @IsUrlField({
    description: 'User avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl?: string;

  @IsTextAreaField({
    description: 'User biography or personal description',
    example: 'Travel enthusiast and photographer based in New York',
    maxLength: 500,
  })
  bio?: string;

  @IsDateField({
    description: 'User birth date for age verification',
    example: '1990-01-15',
  })
  birthDate?: string;

  @IsLocaleField({
    description: 'User preferred language and region',
  })
  locale?: string;

  @IsTimezoneField({
    description: 'User timezone for scheduling and notifications',
  })
  timezone?: string;

  @IsEnumField(UserRole, {
    isArray: true,
    description: 'User roles in the system',
    example: [UserRole.GUEST],
  })
  roles?: UserRole[];
}
