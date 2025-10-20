import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

/**
 * DTO for OAuth-based signin
 * Mobile app handles OAuth flow and sends token to backend
 */
export class OAuthSignInDto {
  @ApiProperty({
    description: 'OAuth provider',
    enum: OAuthProvider,
    example: OAuthProvider.GOOGLE,
  })
  @IsEnum(OAuthProvider, { message: 'validation.INVALID_OAUTH_PROVIDER' })
  @IsNotEmpty({ message: 'validation.REQUIRED_FIELD' })
  provider!: OAuthProvider;

  @ApiProperty({
    description: 'OAuth access token from provider',
    example: 'ya29.a0AfH6SMBx...',
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.REQUIRED_FIELD' })
  accessToken!: string;

  @ApiProperty({
    description: 'User ID from OAuth provider',
    example: '1234567890',
    required: false,
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsOptional()
  providerId?: string;

  @ApiProperty({
    description: 'User email from OAuth provider',
    example: 'user@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'validation.INVALID_EMAIL' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'User first name from OAuth provider',
    example: 'John',
    required: false,
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'User last name from OAuth provider',
    example: 'Doe',
    required: false,
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Profile photo URL from OAuth provider',
    example: 'https://lh3.googleusercontent.com/...',
    required: false,
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsOptional()
  photoUrl?: string;
}
