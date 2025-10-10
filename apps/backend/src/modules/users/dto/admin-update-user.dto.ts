import { UserRole } from '../../../database/schemas/user.schema';
import {
  IsNameField,
  IsEmailField,
  IsPhoneField,
  IsTextAreaField,
  IsUrlField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

export class AdminUpdateUserDto {
  @IsNameField({
    field: 'firstName',
    description: 'First name for admin updates',
    maxLength: 50,
  })
  firstName?: string;

  @IsNameField({
    field: 'lastName',
    description: 'Last name for admin updates',
    maxLength: 50,
  })
  lastName?: string;

  @IsEmailField({
    description: 'Email address for admin updates',
    example: 'admin@example.com',
  })
  email?: string;

  @IsPhoneField({
    description: 'Phone number for admin contact',
    example: '+1234567890',
  })
  phone?: string;

  @IsTextAreaField({
    description: 'User bio for profile',
    maxLength: 500,
  })
  bio?: string;

  @IsEnumField(UserRole, {
    isArray: true,
    description: 'User roles for admin updates',
    example: [UserRole.GUEST, UserRole.HOST],
  })
  role?: UserRole[];

  @IsUrlField({
    description: 'User avatar image URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl?: string;
}
