import { plainToInstance } from 'class-transformer';
import { AccountActionTypeEnum } from '../../../common/enums/account-action.enums';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { BaseController } from '../../../common/controllers/base.controller';
import { UsersFacadeService } from '../services/users-facade.service';
import { UserDataDto, UserResponseDto } from '../dto/user-response.dto';
import * as userSchema from '../../../database/schemas/user.schema';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { DeleteAccountDataDto, DeleteAccountResponseDto } from '../dto/delete-account.response';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { DeactivateAccountDto } from '../dto/deactivate-account.dto';
import {
  DeactivateAccountDataDto,
  DeactivateAccountResponseDto,
} from '../dto/deactivate-account-response.dto';
import {
  AccountActionReasonDataDto,
  AccountActionReasonsListResponseDto,
} from '../dto/account-action-reason-response.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateProfileDataDto, UpdateProfileResponseDto } from '../dto/update-profile-response.dto';
import { S3Service, FileCategory } from '../../storage/services/s3.service';
import { ProfileImageUploadInterceptor } from '../../storage/interceptors/file-upload.interceptor';
import { ProfileImageValidationPipe } from '../../storage/pipes/file-validation.pipe';
import {
  UpdatePreferencesDto,
  UserPreferencesResponseDto,
  UpdatePreferencesResponseDto,
  UserPreferencesDataDto,
} from '../dto/user-preferences.dto';

/**
 * App Controller for Users
 * Handles user-related operations for mobile app and website (Guest & Host functionality)
 */
@Controller('app/users')
@ApiTags('Users')
export class UsersAppController extends BaseController {
  constructor(
    private readonly usersService: UsersFacadeService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  @Get('profile')
  @ProtectedEndpoint(
    'Get current user profile',
    "Retrieve the authenticated user's profile information",
    UserResponseDto,
  )
  async getProfile(@CurrentUser() user: userSchema.UserDocument): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        return plainToInstance(UserDataDto, user.toObject());
      },
      'Get user profile',
      'User Profile',
      'User profile retrieved successfully',
      'Failed to retrieve user profile',
    );
  }

  @Put('profile')
  @ProtectedEndpoint(
    'Update user profile',
    "Update the authenticated user's profile information",
    UpdateProfileResponseDto,
  )
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @CurrentUser() user: userSchema.UserDocument,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.updateProfile(String(user._id), updateProfileDto);
        return plainToInstance(UpdateProfileDataDto, result.user.toObject());
      },
      'Update profile',
      'Profile Updated',
      'Profile updated successfully',
      'Failed to update profile',
    );
  }

  @Post('profile/avatar')
  @UseInterceptors(ProfileImageUploadInterceptor)
  @ProtectedEndpoint(
    'Upload user profile image',
    'Upload a new profile image for the authenticated user',
    UserResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPEG, PNG, WebP, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  async uploadAvatar(
    @CurrentUser() user: userSchema.UserDocument,
    @UploadedFile(ProfileImageValidationPipe) file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROFILE_IMAGES,
          String(user._id),
        );

        const updatedUser = await this.usersService.updateAvatar(String(user._id), result.url);
        return plainToInstance(UserDataDto, updatedUser.toObject());
      },
      'Upload profile image',
      'Avatar Uploaded',
      'Profile image uploaded successfully',
      'Failed to upload profile image',
    );
  }

  @Delete('profile/avatar')
  @ProtectedEndpoint(
    'Remove user profile image',
    'Remove the current profile image for the authenticated user',
    UserResponseDto,
  )
  async removeAvatar(@CurrentUser() user: userSchema.UserDocument): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (user.avatarUrl) {
          await this.s3Service.deleteFile(user.avatarUrl);
        }
        const updatedUser = await this.usersService.updateAvatar(String(user._id), null);
        return plainToInstance(UserDataDto, updatedUser.toObject());
      },
      'Remove profile image',
      'Avatar Removed',
      'Profile image removed successfully',
      'Failed to remove profile image',
    );
  }

  @Get('preferences')
  @ProtectedEndpoint(
    'Get user preferences',
    "Retrieve the authenticated user's preferences and settings",
    UserPreferencesResponseDto,
  )
  async getPreferences(
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<UserPreferencesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const preferences = await this.usersService.getUserPreferences(String(user._id));
        return plainToInstance(UserPreferencesDataDto, preferences);
      },
      'Get user preferences',
      'User Preferences',
      'User preferences retrieved successfully',
      'Failed to retrieve user preferences',
    );
  }

  @Put('preferences')
  @ProtectedEndpoint(
    'Update user preferences',
    "Update the authenticated user's preferences and settings",
    UpdatePreferencesResponseDto,
  )
  @ApiBody({ type: UpdatePreferencesDto })
  async updatePreferences(
    @CurrentUser() user: userSchema.UserDocument,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UpdatePreferencesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updatedPreferences = await this.usersService.updateUserPreferences(
          String(user._id),
          updatePreferencesDto,
        );
        const data: UserPreferencesDataDto = plainToInstance(
          UserPreferencesDataDto,
          updatedPreferences,
        );
        return data;
      },
      'Update user preferences',
      'Preferences Updated',
      'User preferences updated successfully',
      'Failed to update user preferences',
    );
  }

  @Get('account/deletion-reasons')
  @ProtectedEndpoint(
    'Get account deletion reasons',
    'Retrieve available reasons for account deletion',
    AccountActionReasonsListResponseDto,
  )
  async getDeletionReasons(): Promise<AccountActionReasonsListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const reasons = (await this.usersService.getAccountActionReasons(
          AccountActionTypeEnum.DELETE,
        )) as Array<{
          _id: string;
          type: string;
          title: string;
          description: string;
          displayOrder: number;
          isActive: boolean;
        }>;
        const data: AccountActionReasonDataDto[] = reasons.map((reason) =>
          plainToInstance(AccountActionReasonDataDto, reason),
        );
        return data;
      },
      'Get deletion reasons',
      'Deletion Reasons',
      'Deletion reasons retrieved successfully',
      'Failed to retrieve deletion reasons',
    );
  }

  @Get('account/deactivation-reasons')
  @ProtectedEndpoint(
    'Get account deactivation reasons',
    'Retrieve available reasons for account deactivation',
    AccountActionReasonsListResponseDto,
  )
  async getDeactivationReasons(): Promise<AccountActionReasonsListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const reasons = (await this.usersService.getAccountActionReasons(
          AccountActionTypeEnum.DEACTIVATE,
        )) as Array<{
          _id: string;
          type: string;
          title: string;
          description: string;
          displayOrder: number;
          isActive: boolean;
        }>;
        const data: AccountActionReasonDataDto[] = reasons.map((reason) =>
          plainToInstance(AccountActionReasonDataDto, reason),
        );
        return data;
      },
      'Get deactivation reasons',
      'Deactivation Reasons',
      'Deactivation reasons retrieved successfully',
      'Failed to retrieve deactivation reasons',
    );
  }

  @Put('account/deactivate')
  @ProtectedEndpoint(
    'Deactivate user account',
    "Temporarily deactivate the authenticated user's account",
    DeactivateAccountResponseDto,
  )
  @ApiBody({ type: DeactivateAccountDto })
  async deactivateAccount(
    @CurrentUser() user: userSchema.UserDocument,
    @Body() deactivateAccountDto: DeactivateAccountDto,
  ): Promise<DeactivateAccountResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.deactivateAccount(
          String(user._id),
          deactivateAccountDto,
        );
        const data: DeactivateAccountDataDto = plainToInstance(DeactivateAccountDataDto, result);
        return data;
      },
      'Deactivate account',
      'Account Deactivated',
      'Account deactivated successfully',
      'Failed to deactivate account',
    );
  }

  @Delete('account')
  @ProtectedEndpoint(
    'Delete user account permanently',
    "Permanently delete the authenticated user's account and all associated data",
    DeleteAccountResponseDto,
  )
  @ApiBody({ type: DeleteAccountDto })
  async deleteAccount(
    @CurrentUser() user: userSchema.UserDocument,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<DeleteAccountResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.deleteAccount(String(user._id), deleteAccountDto);
        const data: DeleteAccountDataDto = plainToInstance(DeleteAccountDataDto, result);
        return data;
      },
      'Delete account',
      'Account Deleted',
      'Account deleted successfully',
      'Failed to delete account',
    );
  }
}
