import { Expose, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { Types } from 'mongoose';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Base user fields for consistent user representation
 */
export abstract class BaseUserDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  @Transform(({ obj }: { obj: { _id: Types.ObjectId } }) => obj._id.toString())
  id!: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @Expose()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @Expose()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'URL to user avatar image',
    example: 'https://example.com/avatars/user123.jpg',
    format: 'uri',
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    description: 'User roles in the system',
    enum: UserRole,
    isArray: true,
    example: [UserRole.GUEST, UserRole.HOST],
  })
  @Expose()
  roles!: UserRole[];

  @ApiProperty({
    description: 'Account status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Expose()
  status!: UserStatus;
}

/**
 * Minimal user data for listings and references
 */
export class UserSummaryDto extends BaseUserDto {
  @ApiProperty({
    description: 'Total number of reviews received',
    example: 42,
    minimum: 0,
  })
  @Expose()
  reviewCount!: number;

  @ApiProperty({
    description: 'Average rating from all reviews',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @Expose()
  averageRating!: number;

  @ApiPropertyOptional({
    description: 'User bio/about section',
    example: 'Passionate host who loves sharing local experiences with guests',
  })
  @Expose()
  bio?: string;

  @ApiProperty({
    description: 'Whether email is verified',
    example: true,
  })
  @Expose()
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Whether phone is verified',
    example: true,
  })
  @Expose()
  isPhoneVerified!: boolean;

  @ApiProperty({
    description: 'Whether identity is verified',
    example: true,
  })
  @Expose()
  isIdentityVerified!: boolean;

  @ApiProperty({
    description: 'When the user joined',
    example: '2023-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'User preferred locale',
    example: 'en',
  })
  @Expose()
  locale?: string;

  @ApiPropertyOptional({
    description: 'How long the user has been hosting (computed field)',
    example: 'Hosting since January 2023',
  })
  @Expose()
  @Transform(({ obj }: { obj: UserDataDto }) => {
    if (!obj.createdAt) return undefined;
    const createdDate = DateUtils.create(obj.createdAt);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    return `Hosting since ${createdDate.toLocaleDateString('en-US', options)}`;
  })
  hostingSince?: string;
}

/**
 * Complete user profile data
 */
export class UserDataDto extends BaseUserDto {
  @ApiPropertyOptional({
    description: 'User phone number in international format',
    example: '+1234567890',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User biography or description',
    example: 'Travel enthusiast and photographer based in New York',
  })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({
    description: 'User birth date',
    example: '1990-01-15T00:00:00.000Z',
    format: 'date-time',
  })
  @Expose()
  birthDate?: Date;

  @ApiPropertyOptional({
    description: 'User preferred locale',
    example: 'en-US',
  })
  @Expose()
  locale?: string;

  @ApiPropertyOptional({
    description: 'User timezone',
    example: 'America/New_York',
  })
  @Expose()
  timezone?: string;

  @ApiProperty({
    description: 'Indicates if this is the user first login',
    example: false,
  })
  @Expose()
  firstLogin!: boolean;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  @Expose()
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Phone verification status',
    example: false,
  })
  @Expose()
  isPhoneVerified!: boolean;

  @ApiProperty({
    description: 'Total number of reviews received',
    example: 42,
    minimum: 0,
  })
  @Expose()
  reviewCount!: number;

  @ApiProperty({
    description: 'Average rating from all reviews',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @Expose()
  averageRating!: number;

  @ApiProperty({
    description: 'List of property IDs in user wishlist',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @Expose()
  @Transform(
    ({ obj }: { obj: { wishlist: Types.ObjectId[] } }) =>
      obj.wishlist?.map((id) => id.toString()) || [],
  )
  wishlist!: string[];

  @ApiPropertyOptional({
    description: 'Account creation timestamp',
    format: 'date-time',
  })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'Last account update timestamp',
    format: 'date-time',
  })
  @Expose()
  updatedAt?: Date;
}

/**
 * Admin view with sensitive fields
 */
export class UserAdminDto extends UserDataDto {
  @ApiPropertyOptional({
    description: 'Last login timestamp',
    format: 'date-time',
  })
  @Expose()
  lastLoginAt?: Date;

  @ApiPropertyOptional({
    description: 'Last active timestamp',
    format: 'date-time',
  })
  @Expose()
  lastActiveAt?: Date;

  @ApiProperty({
    description: 'Failed login attempts count',
    example: 0,
    minimum: 0,
  })
  @Expose()
  failedLoginAttempts!: number;

  @ApiPropertyOptional({
    description: 'Account locked until timestamp',
    format: 'date-time',
  })
  @Expose()
  lockedUntil?: Date;
}

// Response DTOs using factory functions for proper Swagger generation
export class UserResponseDto extends BaseResponseDto<UserDataDto> {
  @ApiProperty({ type: UserDataDto })
  declare data: UserDataDto;
}

export class UserSummaryResponseDto extends BaseResponseDto<UserSummaryDto> {
  @ApiProperty({ type: UserSummaryDto })
  declare data: UserSummaryDto;
}

export class UserAdminResponseDto extends BaseResponseDto<UserAdminDto> {
  @ApiProperty({ type: UserAdminDto })
  declare data: UserAdminDto;
}

// Factory-based response DTOs (for advanced usage)
export const UserResponseDtoFactory = createResponseDto(UserDataDto);
export const UserSummaryResponseDtoFactory = createResponseDto(UserSummaryDto);
export const UserAdminResponseDtoFactory = createResponseDto(UserAdminDto);
