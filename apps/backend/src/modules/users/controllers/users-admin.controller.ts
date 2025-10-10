import { plainToInstance } from 'class-transformer';
import { DateUtils } from '../../../common/utils/date.utils';
import { ApiTags, ApiParam, ApiBody, ApiConsumes, ApiQuery, ApiExtraModels } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  Body,
  Delete,
  Put,
  Query,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { UsersFacadeService } from '../services/users-facade.service';
import { UserDataDto, UserResponseDto } from '../dto/user-response.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import * as userSchema from '../../../database/schemas/user.schema';
import { UserRole } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { AdminUsersListResponseDto } from '../dto/admin-users-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import {
  AdminDeleteUserResponse,
  AdminUpdateUserResponse,
  AdminToggleStatusResponse,
  AdminToggleEmailVerificationResponse,
  AdminTogglePhoneVerificationResponse,
  AdminBulkDeleteUsersResponse,
  AdminUpdateUserResponseDto,
  AdminDeleteUserResponseDto,
  AdminToggleStatusResponseDto,
  AdminToggleEmailVerificationResponseDto,
  AdminTogglePhoneVerificationResponseDto,
  AdminBulkDeleteUsersResponseDto,
} from '../dto/admin-response.dto';
import { AdminBulkDeleteUsersDto } from '../dto/admin-bulk-delete.dto';
import { ToggleResponse } from '../types/user.types';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserTableFilterDto } from '../dto/user-filters.dto';
import { S3Service, FileCategory } from '../../storage/services/s3.service';
import { ProfileImageUploadInterceptor } from '../../storage/interceptors/file-upload.interceptor';
import { ProfileImageValidationPipe } from '../../storage/pipes/file-validation.pipe';
import { GuestDropdownResponseDto, HostDropdownResponseDto } from '../dto/user-search.dto';
import {
  UpdatePreferencesDto,
  UserPreferencesResponseDto,
  UpdatePreferencesResponseDto,
  UserPreferencesDataDto,
} from '../dto/user-preferences.dto';
import { FileUploadResponseDto } from '../../storage/dto/upload-file-response.dto';

/**
 * Admin Controller for Users
 * Handles administrative user management operations
 */
@Controller('admin/users')
@ApiTags('Users Management')
@ApiExtraModels(UserDataDto, PaginatedDto)
export class UsersAdminController extends BaseController {
  constructor(
    private readonly usersService: UsersFacadeService,
    private readonly s3Service: S3Service,
  ) {
    super();
  }

  @Post()
  @AdminEndpoint(
    'Create new user (Admin only)',
    'Create a new user with all details including avatar URL from pre-upload',
    UserResponseDto,
  )
  @ApiBody({ type: CreateUserDto })
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() adminUser: userSchema.UserDocument,
  ): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const user = await this.usersService.createUserByAdmin(
          createUserDto,
          String(adminUser._id),
        );
        return plainToInstance(UserDataDto, user.toObject());
      },
      'Create user',
      'User Created',
      'User created successfully',
      'Failed to create user',
    );
  }

  @Get()
  @AdminEndpoint(
    'Get all users with filtering, sorting and pagination (Admin only)',
    'Retrieve all users with comprehensive filtering, sorting and pagination capabilities',
    AdminUsersListResponseDto,
  )
  async getAllUsers(@Query() filters: UserTableFilterDto): Promise<AdminUsersListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.findAllAdmin({
          ...filters,
          page: filters.page || 1,
          limit: filters.limit || 20,
        });

        const users = result.users.map((user) => plainToInstance(UserDataDto, user.toObject()));

        return {
          items: users,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
          hasNextPage: result.hasNext,
          hasPrevPage: result.hasPrev,
        };
      },
      'Get all users',
      'Users Retrieved',
      'Users retrieved successfully',
      'Failed to retrieve users',
    );
  }

  @Get('profile')
  @AdminEndpoint(
    'Get current admin profile',
    'Retrieve the profile information of the currently authenticated admin user',
    UserResponseDto,
  )
  async getProfile(@CurrentUser() adminUser: userSchema.UserDocument): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        return plainToInstance(UserDataDto, adminUser.toObject());
      },
      'Get admin profile',
      'Admin Profile Retrieved',
      'Admin profile retrieved successfully',
      'Failed to retrieve admin profile',
    );
  }

  @Post('avatar/upload')
  @AdminEndpoint(
    'Upload avatar for new user creation (Admin only)',
    'Upload an avatar image and get the URL back to use when creating a new user',
    FileUploadResponseDto,
  )
  @UseInterceptors(ProfileImageUploadInterceptor)
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
  async uploadAvatarForNewUser(
    @UploadedFile(ProfileImageValidationPipe) file: Express.Multer.File,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROFILE_IMAGES,
        );

        return {
          avatarUrl: result.url,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
      },
      'Upload avatar for new user',
      'Avatar Uploaded',
      'Avatar uploaded successfully',
      'Failed to upload avatar',
    );
  }

  @Post(':id/avatar')
  @AdminEndpoint(
    'Upload user avatar (Admin only)',
    'Upload and update the avatar image for a specific user',
    UserResponseDto,
  )
  @UseInterceptors(ProfileImageUploadInterceptor)
  @ApiParam({ name: 'id', description: 'User ID' })
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
  async uploadUserAvatar(
    @Param('id') id: string,
    @UploadedFile(ProfileImageValidationPipe) file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROFILE_IMAGES,
          id,
        );

        const updatedUser = await this.usersService.updateAvatar(id, result.url);
        return plainToInstance(UserDataDto, updatedUser.toObject());
      },
      'Upload user avatar',
      'User Avatar Uploaded',
      'User avatar uploaded successfully',
      'Failed to upload user avatar',
    );
  }

  @Delete(':id/avatar')
  @AdminEndpoint(
    'Remove user avatar (Admin only)',
    'Delete the avatar image for a specific user account',
    UserResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async removeUserAvatar(@Param('id') id: string): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const user = await this.usersService.findById(id);

        if (user.avatarUrl) {
          await this.s3Service.deleteFile(user.avatarUrl);
        }

        const updatedUser = await this.usersService.updateAvatar(id, null);
        return plainToInstance(UserDataDto, updatedUser.toObject());
      },
      'Remove user avatar',
      'User Avatar Removed',
      'User avatar removed successfully',
      'Failed to remove user avatar',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get user by ID (Admin only)',
    'Retrieve detailed information for a specific user by their ID',
    UserResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const user = await this.usersService.findById(id);
        return plainToInstance(UserDataDto, user.toObject());
      },
      'Get user by ID',
      'User Retrieved',
      'User retrieved successfully',
      'Failed to retrieve user',
    );
  }

  @Get(':id/preferences')
  @AdminEndpoint(
    'Get user preferences by ID (Admin only)',
    'Retrieve the preference settings for a specific user account',
    UserPreferencesResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUserPreferences(@Param('id') id: string): Promise<UserPreferencesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const preferences = await this.usersService.getUserPreferences(id);
        return plainToInstance(UserPreferencesDataDto, preferences);
      },
      'Get user preferences',
      'User Preferences Retrieved',
      'User preferences retrieved successfully',
      'Failed to retrieve user preferences',
    );
  }

  @Put(':id/preferences')
  @AdminEndpoint(
    'Update user preferences by admin (Admin only)',
    'Modify the preference settings for a specific user account as an administrator',
    UpdatePreferencesResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdatePreferencesDto })
  async updateUserPreferences(
    @Param('id') id: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UpdatePreferencesResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updatedPreferences = await this.usersService.updateUserPreferences(
          id,
          updatePreferencesDto,
        );
        return plainToInstance(UserPreferencesDataDto, updatedPreferences);
      },
      'Update user preferences',
      'User Preferences Updated',
      'User preferences updated successfully',
      'Failed to update user preferences',
    );
  }

  @Put(':id')
  @AdminEndpoint(
    'Update user by admin (Admin only)',
    'Update user account information and settings as an administrator',
    AdminUpdateUserResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: AdminUpdateUserDto })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: AdminUpdateUserDto,
  ): Promise<AdminUpdateUserResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updatedUser = await this.usersService.updateByAdmin(id, updateUserDto);
        return {
          user: plainToInstance(UserDataDto, updatedUser.toObject()),
        };
      },
      'Update user',
      'User Updated',
      'User updated successfully',
      'Failed to update user',
    );
  }

  @Delete(':id')
  @AdminEndpoint(
    'Delete user by admin',
    'Permanently delete a user account and all associated data',
    AdminDeleteUserResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async deleteUser(@Param('id') id: string): Promise<AdminDeleteUserResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.usersService.deleteByAdmin(id);
        return {
          deleted: true,
          deletedAt: DateUtils.now(),
        };
      },
      'Delete user',
      'User Deleted',
      'User deleted successfully',
      'Failed to delete user',
    );
  }

  @Post('bulk-delete')
  @AdminEndpoint(
    'Bulk delete users (System Admin only)',
    'Delete multiple user accounts simultaneously with validation and error reporting',
    AdminBulkDeleteUsersResponseDto,
  )
  @ApiBody({ type: AdminBulkDeleteUsersDto })
  async bulkDeleteUsers(
    @Body() bulkDeleteDto: AdminBulkDeleteUsersDto,
  ): Promise<AdminBulkDeleteUsersResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = (await this.usersService.bulkDelete(bulkDeleteDto.userIds)) as {
          deletedCount: number;
          deletedUserIds: string[];
          failedUserIds: string[];
          deletedAt: Date;
        };
        return result;
      },
      'Bulk delete users',
      'Users Deleted',
      'Users deleted successfully',
      'Failed to delete users',
    );
  }

  @Put(':id/toggle-status')
  @AdminEndpoint(
    'Toggle user active status',
    'Toggle a user account between active and inactive states',
    AdminToggleStatusResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async toggleUserStatus(@Param('id') id: string): Promise<AdminToggleStatusResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = (await this.usersService.toggleUserStatus(id)) as {
          newValue: boolean;
          message: string;
        };
        return {
          status: result.newValue ? UserStatus.ACTIVE : UserStatus.INACTIVE,
        };
      },
      'Toggle user status',
      'User Status Toggled',
      'User status toggled successfully',
      'Failed to toggle user status',
    );
  }

  @Put(':id/toggle-email-verification')
  @AdminEndpoint(
    'Toggle user email verification (Admin only)',
    'Toggle the email verification status for a specific user account',
    AdminToggleEmailVerificationResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async toggleEmailVerification(
    @Param('id') id: string,
  ): Promise<AdminToggleEmailVerificationResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = (await this.usersService.toggleEmailVerification(id)) as ToggleResponse;
        return { isEmailVerified: result.isEmailVerified || false };
      },
      'Toggle email verification',
      'Email Verification Toggled',
      'Email verification toggled successfully',
      'Failed to toggle email verification',
    );
  }

  @Put(':id/toggle-phone-verification')
  @AdminEndpoint(
    'Toggle user phone verification (Admin only)',
    'Toggle the phone verification status for a specific user account',
    AdminTogglePhoneVerificationResponseDto,
  )
  @ApiParam({ name: 'id', description: 'User ID' })
  async togglePhoneVerification(
    @Param('id') id: string,
  ): Promise<AdminTogglePhoneVerificationResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = (await this.usersService.togglePhoneVerification(id)) as ToggleResponse;
        return { isPhoneVerified: result.isPhoneVerified || false };
      },
      'Toggle phone verification',
      'Phone Verification Toggled',
      'Phone verification toggled successfully',
      'Failed to toggle phone verification',
    );
  }

  @Get('search/guests')
  @AdminEndpoint(
    'Search guest users',
    'Search and retrieve guest users by name for dropdown/selection purposes',
    GuestDropdownResponseDto,
  )
  @ApiQuery({
    name: 'search',
    required: true,
    type: String,
    description: 'Search term to match first name or last name',
  })
  async searchGuests(@Query('search') search: string): Promise<GuestDropdownResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (!search?.trim()) {
          throw new BadRequestException('Search query is required');
        }
        const guests = await this.usersService.findUsersForDropdown(
          [UserRole.GUEST],
          search.trim(),
        );
        return {
          users: guests.map((guest) => ({
            _id: String(guest._id),
            firstName: guest.firstName || '',
            lastName: guest.lastName || '',
          })),
          total: guests.length,
        };
      },
      'Search guests',
      'Guests Search',
      'Guest users retrieved successfully',
      'Failed to retrieve guest users',
    );
  }

  @Get('search/hosts')
  @AdminEndpoint(
    'Search host users',
    'Search and retrieve host users by name for dropdown/selection purposes',
    HostDropdownResponseDto,
  )
  @ApiQuery({
    name: 'search',
    required: true,
    type: String,
    description: 'Search term to match first name or last name',
  })
  async searchHosts(@Query('search') search: string): Promise<HostDropdownResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        if (!search?.trim()) {
          throw new BadRequestException('Search query is required');
        }
        const hosts = await this.usersService.findUsersForDropdown([UserRole.HOST], search.trim());
        return {
          users: hosts.map((host) => ({
            _id: String(host._id),
            firstName: host.firstName || '',
            lastName: host.lastName || '',
          })),
          total: hosts.length,
        };
      },
      'Search hosts',
      'Hosts Search',
      'Host users retrieved successfully',
      'Failed to retrieve host users',
    );
  }
}
