import {
  IsNameField,
  IsTextAreaField,
  IsUrlField,
  IsDateField,
  IsLocaleField,
  IsTimezoneField,
} from '../../../common/validators/standardized-validators';

export class UpdateProfileDto {
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

  @IsTextAreaField({
    description: 'User biography or description',
    example: 'Travel enthusiast and photographer based in New York',
    maxLength: 500,
  })
  bio?: string;

  @IsUrlField({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user123.jpg',
  })
  avatarUrl?: string;

  @IsDateField({
    description: 'User birth date',
    example: '1990-01-15',
  })
  birthDate?: string;

  @IsLocaleField({
    description: 'User preferred locale',
  })
  locale?: string;

  @IsTimezoneField({
    description: 'User timezone',
  })
  timezone?: string;
}
