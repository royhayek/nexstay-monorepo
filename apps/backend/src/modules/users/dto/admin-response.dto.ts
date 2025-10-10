import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';
import { UserDataDto } from './user-response.dto';
import { UserStatus } from '../../../common/enums/user-status.enums';

/**
 * Admin delete user data DTO
 */
export class AdminDeleteUserDataDto {
  @ApiProperty({ description: 'Deletion timestamp' })
  deletedAt: Date;
}

/**
 * Admin update user data DTO
 */
export class AdminUpdateUserDataDto {
  @ApiProperty({ description: 'Updated user data', type: UserDataDto })
  user: UserDataDto;
}

/**
 * Admin toggle status data DTO
 */
export class AdminToggleStatusDataDto {
  @ApiProperty({ description: 'Current user status', enum: UserStatus })
  status: UserStatus;
}

/**
 * Admin toggle email verification data DTO
 */
export class AdminToggleEmailVerificationDataDto {
  @ApiProperty({ description: 'Current email verification status' })
  isEmailVerified: boolean;
}

/**
 * Admin toggle phone verification data DTO
 */
export class AdminTogglePhoneVerificationDataDto {
  @ApiProperty({ description: 'Current phone verification status' })
  isPhoneVerified: boolean;
}

/**
 * Admin bulk delete users data DTO
 */
export class AdminBulkDeleteUsersDataDto {
  @ApiProperty({ description: 'Number of users successfully deleted' })
  deletedCount: number;

  @ApiProperty({ description: 'Array of user IDs that were successfully deleted' })
  deletedUserIds: string[];

  @ApiProperty({ description: 'Array of user IDs that failed to delete (if available)' })
  failedUserIds: string[];

  @ApiProperty({ description: 'Deletion timestamp' })
  deletedAt: Date;
}

// Create typed response DTOs using the factory
export const AdminDeleteUserResponseDto = createResponseDto(AdminDeleteUserDataDto);
export const AdminUpdateUserResponseDto = createResponseDto(AdminUpdateUserDataDto);
export const AdminToggleStatusResponseDto = createResponseDto(AdminToggleStatusDataDto);
export const AdminToggleEmailVerificationResponseDto = createResponseDto(
  AdminToggleEmailVerificationDataDto,
);
export const AdminTogglePhoneVerificationResponseDto = createResponseDto(
  AdminTogglePhoneVerificationDataDto,
);
export const AdminBulkDeleteUsersResponseDto = createResponseDto(AdminBulkDeleteUsersDataDto);

// Type aliases for return types
export type AdminDeleteUserResponse = BaseResponseDto<AdminDeleteUserDataDto>;
export type AdminUpdateUserResponse = BaseResponseDto<AdminUpdateUserDataDto>;
export type AdminToggleStatusResponse = BaseResponseDto<AdminToggleStatusDataDto>;
export type AdminToggleEmailVerificationResponse =
  BaseResponseDto<AdminToggleEmailVerificationDataDto>;
export type AdminTogglePhoneVerificationResponse =
  BaseResponseDto<AdminTogglePhoneVerificationDataDto>;
export type AdminBulkDeleteUsersResponse = BaseResponseDto<AdminBulkDeleteUsersDataDto>;
