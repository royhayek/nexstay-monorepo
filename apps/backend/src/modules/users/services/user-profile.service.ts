import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { Model } from 'mongoose';

import { canUserPerformAction } from '../../../common/enums/user-status.enums';
import { User, UserDocument, OtpNotificationMethod } from '../../../database/schemas/user.schema';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateProfileServiceDataDto } from '../dto/update-profile-response.dto';
import {
  UpdatePreferencesDto,
  OtpMethodAvailabilityDto,
  UserPreferencesDataDto,
} from '../dto/user-preferences.dto';
import { UpdateData } from '../types/user.types';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * User profile management service
 * Handles profile updates, preferences, and profile-related operations
 */
@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Update user profile */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UpdateProfileServiceDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'UserProfileService',
    });

    try {
      const user = await this.userModel.findById(userId).exec();
      ValidationUtils.validateEntityExists(user, userId, {
        entityName: 'User',
        context: 'UserProfileService',
      });

      if (!canUserPerformAction(user!.status, 'canLogin')) {
        throw new BadRequestException(`Cannot update profile of ${user!.status} account`);
      }

      // Build update object with only provided fields
      const updateData: UpdateData = {
        updatedAt: DateUtils.now(),
      };

      if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
      if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
      if (dto.bio !== undefined) updateData.bio = dto.bio;
      if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
      if (dto.birthDate !== undefined) updateData.birthDate = DateUtils.create(dto.birthDate);
      if (dto.locale !== undefined) updateData.locale = dto.locale;
      if (dto.timezone !== undefined) updateData.timezone = dto.timezone;

      // Update user
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updateData, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      LoggingUtil.log(`Profile updated for user ${userId}`, 'UserProfileService');

      return {
        message: 'Profile updated successfully',
        user: updatedUser.toObject(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `updateProfile: error updating user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /** Update user avatar */
  async updateAvatar(userId: string, avatarUrl: string | null): Promise<UserDocument> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!canUserPerformAction(user.status, 'canLogin')) {
        throw new BadRequestException(`Cannot update avatar of ${user.status} account`);
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            avatarUrl,
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      LoggingUtil.log(`Avatar updated for user ${userId}`, 'UserProfileService');
      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `updateAvatar: error updating avatar for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to update avatar');
    }
  }

  /** Get user preferences */
  async getUserPreferences(userId: string): Promise<{
    otpNotificationMethod: OtpNotificationMethod;
    availableMethods: OtpMethodAvailabilityDto[];
    language: string;
    timezone: string;
  }> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Return preferences with defaults if not set
      const preferences = user.preferences || {
        otpNotificationMethod: OtpNotificationMethod.EMAIL,
        language: 'en',
        timezone: 'UTC',
      };

      // Build available methods list
      const availableMethods: OtpMethodAvailabilityDto[] = this.buildAvailableMethods(
        user,
        preferences.otpNotificationMethod,
      );

      return {
        otpNotificationMethod: preferences.otpNotificationMethod,
        availableMethods,
        language: preferences.language,
        timezone: preferences.timezone,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `getUserPreferences: error retrieving preferences for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to retrieve user preferences');
    }
  }

  /** Update user preferences */
  async updateUserPreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesDataDto> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!canUserPerformAction(user.status, 'canLogin')) {
        throw new BadRequestException(`Cannot update preferences of ${user.status} account`);
      }

      // Build update object for preferences
      const currentPreferences = user.preferences || {
        otpNotificationMethod: OtpNotificationMethod.EMAIL,
        language: 'en',
        timezone: 'UTC',
      };

      const updatedPreferences = {
        otpNotificationMethod:
          dto.otpNotificationMethod || currentPreferences.otpNotificationMethod,
        language: dto.language || currentPreferences.language,
        timezone: dto.timezone || currentPreferences.timezone,
      };

      // Update user preferences
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            preferences: updatedPreferences,
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      LoggingUtil.log(`Preferences updated for user ${userId}`, 'UserProfileService');

      // Build available methods list for response
      const availableMethods: OtpMethodAvailabilityDto[] = this.buildAvailableMethods(
        updatedUser,
        updatedUser.preferences.otpNotificationMethod,
      );

      return {
        otpNotificationMethod: updatedUser.preferences.otpNotificationMethod,
        availableMethods,
        language: updatedUser.preferences.language,
        timezone: updatedUser.preferences.timezone,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `updateUserPreferences: error updating preferences for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to update user preferences');
    }
  }

  /**
   * Helper method to build available OTP methods
   */
  private buildAvailableMethods(
    user: UserDocument,
    selectedMethod: OtpNotificationMethod,
  ): OtpMethodAvailabilityDto[] {
    const availableMethods: OtpMethodAvailabilityDto[] = [];

    // EMAIL method
    const emailEnabled = Boolean(user.email && user.isEmailVerified);
    availableMethods.push({
      method: OtpNotificationMethod.EMAIL,
      enabled: emailEnabled,
      selected: selectedMethod === OtpNotificationMethod.EMAIL,
      disabledReason: !emailEnabled
        ? !user.email
          ? 'Email address not provided'
          : 'Email not verified'
        : undefined,
    });

    // SMS method
    const smsEnabled = Boolean(user.phone && user.isPhoneVerified);
    availableMethods.push({
      method: OtpNotificationMethod.SMS,
      enabled: smsEnabled,
      selected: selectedMethod === OtpNotificationMethod.SMS,
      disabledReason: !smsEnabled
        ? !user.phone
          ? 'Phone number not provided'
          : 'Phone not verified'
        : undefined,
    });

    // WHATSAPP method (requires phone verification)
    const whatsappEnabled = Boolean(user.phone && user.isPhoneVerified);
    availableMethods.push({
      method: OtpNotificationMethod.WHATSAPP,
      enabled: whatsappEnabled,
      selected: selectedMethod === OtpNotificationMethod.WHATSAPP,
      disabledReason: !whatsappEnabled
        ? !user.phone
          ? 'Phone number not provided'
          : 'Phone not verified'
        : undefined,
    });

    return availableMethods;
  }
}
