import {
  IsNameField,
  IsPasswordField,
  IsDateField,
  IsEmailField,
  IsPhoneField,
} from '../../../common/validators/standardized-validators';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupCompleteProfileDto {
  @IsNameField({
    field: 'firstName',
    description: 'User first name',
    required: true,
    maxLength: 50,
  })
  firstName!: string;

  @IsNameField({
    field: 'lastName',
    description: 'User last name',
    required: true,
    maxLength: 50,
  })
  lastName!: string;

  @IsDateField({
    description: 'Date of birth (must be 18 or older)',
    example: '1990-01-15',
    required: true,
  })
  birthDate!: string;

  @IsPasswordField({
    description: 'Password for the account',
    required: true,
    example: 'MySecurePassword123!',
  })
  password!: string;

  @IsEmailField({
    description: 'Optional email address (if signed up with phone)',
    required: false,
    example: 'user@example.com',
  })
  @IsOptional()
  email?: string;

  @IsPhoneField({
    description: 'Optional phone number (if signed up with email)',
    required: false,
    example: '+1234567890',
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Session token from contact verification step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  sessionToken!: string;
}
