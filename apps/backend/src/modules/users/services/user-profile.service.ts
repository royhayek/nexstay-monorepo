import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { Model, Types } from 'mongoose';

import { canUserPerformAction } from '../../../common/enums/user-status.enums';
import { User, UserDocument, OtpNotificationMethod } from '../../../database/schemas/user.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';

import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UpdateProfileServiceDataDto } from '../dto/update-profile-response.dto';
import {
  UpdatePreferencesDto,
  OtpMethodAvailabilityDto,
  UserPreferencesDataDto,
  UpdateEmailPreferencesDto,
  EmailNotificationsDto,
} from '../dto/user-preferences.dto';
import { UpdateData } from '../types/user.types';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import {
  WishlistDataDto,
  WishlistItemDto,
  AddToWishlistDataDto,
  RemoveFromWishlistDataDto,
  WishlistCheckDataDto,
} from '../dto/wishlist-response.dto';

/**
 * User profile management service
 * Handles profile updates, preferences, and profile-related operations
 */
@Injectable()
export class UserProfileService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
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
    emailNotifications?: EmailNotificationsDto;
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

      // Get email preferences with defaults if not set
      const emailNotifications = preferences.emailNotifications || {
        bookingConfirmation: true,
        paymentReceipt: true,
        payoutNotification: true,
        newMessage: true,
        reviewReminder: true,
        passwordReset: true,
        marketingEmails: false,
      };

      return {
        otpNotificationMethod: preferences.otpNotificationMethod,
        availableMethods,
        language: preferences.language,
        timezone: preferences.timezone,
        emailNotifications,
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
        // Preserve existing email preferences and payout preferences
        ...(currentPreferences.emailNotifications && {
          emailNotifications: currentPreferences.emailNotifications,
        }),
        ...(currentPreferences.payout && { payout: currentPreferences.payout }),
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
        emailNotifications: updatedUser.preferences.emailNotifications,
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

  /** Get user email notification preferences */
  async getEmailPreferences(userId: string): Promise<EmailNotificationsDto> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Return email preferences with defaults if not set
      const emailNotifications = user.preferences?.emailNotifications || {
        bookingConfirmation: true,
        paymentReceipt: true,
        payoutNotification: true,
        newMessage: true,
        reviewReminder: true,
        passwordReset: true,
        marketingEmails: false,
      };

      return emailNotifications;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `getEmailPreferences: error retrieving email preferences for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to retrieve email preferences');
    }
  }

  /** Update user email notification preferences */
  async updateEmailPreferences(
    userId: string,
    dto: UpdateEmailPreferencesDto,
  ): Promise<EmailNotificationsDto> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    if (!dto.emailNotifications) {
      throw new BadRequestException('Email notification preferences must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (!canUserPerformAction(user.status, 'canLogin')) {
        throw new BadRequestException(`Cannot update preferences of ${user.status} account`);
      }

      // Get current email preferences or defaults
      const currentEmailPreferences = user.preferences?.emailNotifications || {
        bookingConfirmation: true,
        paymentReceipt: true,
        payoutNotification: true,
        newMessage: true,
        reviewReminder: true,
        passwordReset: true,
        marketingEmails: false,
      };

      // Merge with new preferences (only update provided fields)
      const updatedEmailPreferences: EmailNotificationsDto = {
        bookingConfirmation:
          dto.emailNotifications.bookingConfirmation !== undefined
            ? dto.emailNotifications.bookingConfirmation
            : currentEmailPreferences.bookingConfirmation,
        paymentReceipt:
          dto.emailNotifications.paymentReceipt !== undefined
            ? dto.emailNotifications.paymentReceipt
            : currentEmailPreferences.paymentReceipt,
        payoutNotification:
          dto.emailNotifications.payoutNotification !== undefined
            ? dto.emailNotifications.payoutNotification
            : currentEmailPreferences.payoutNotification,
        newMessage:
          dto.emailNotifications.newMessage !== undefined
            ? dto.emailNotifications.newMessage
            : currentEmailPreferences.newMessage,
        reviewReminder:
          dto.emailNotifications.reviewReminder !== undefined
            ? dto.emailNotifications.reviewReminder
            : currentEmailPreferences.reviewReminder,
        passwordReset:
          dto.emailNotifications.passwordReset !== undefined
            ? dto.emailNotifications.passwordReset
            : currentEmailPreferences.passwordReset,
        marketingEmails:
          dto.emailNotifications.marketingEmails !== undefined
            ? dto.emailNotifications.marketingEmails
            : currentEmailPreferences.marketingEmails,
      };

      // Update user preferences
      const currentPreferences = user.preferences || {
        otpNotificationMethod: OtpNotificationMethod.EMAIL,
        language: 'en',
        timezone: 'UTC',
      };

      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            preferences: {
              ...currentPreferences,
              emailNotifications: updatedEmailPreferences,
            },
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      LoggingUtil.log(`Email preferences updated for user ${userId}`, 'UserProfileService');

      return updatedEmailPreferences;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `updateEmailPreferences: error updating email preferences for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to update email preferences');
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

  // ===== WISHLIST OPERATIONS =====

  /** Get user's wishlist with property details */
  async getWishlist(userId: string): Promise<WishlistDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'UserProfileService',
    });

    try {
      const user = await this.userModel
        .findById(userId)
        .populate({
          path: 'wishlist',
          select: 'name pricePerNight address rating numberOfReviews images thumbnailUrl',
        })
        .exec();

      ValidationUtils.validateEntityExists(user, userId, {
        entityName: 'User',
        context: 'UserProfileService',
      });

      const properties: WishlistItemDto[] = (user!.wishlist as unknown as PropertyDocument[])
        .filter((property): property is PropertyDocument => property && Boolean(property._id))
        .map((property: PropertyDocument) => ({
          id: String(property._id),
          name: property.name,
          pricePerNight: property.pricePerNight,
          city: property.address?.city || '',
          country: property.address?.country || '',
          thumbnailUrl:
            property.thumbnailUrl ||
            property.images?.[0]?.thumbnailUrl ||
            property.images?.[0]?.url,
          rating: property.rating || 0,
          reviewCount: property.numberOfReviews || 0,
        }));

      LoggingUtil.log(`Wishlist retrieved for user ${userId}`, 'UserProfileService');

      return {
        properties,
        total: properties.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `getWishlist: error retrieving wishlist for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to retrieve wishlist');
    }
  }

  /** Add property to user's wishlist */
  async addToWishlist(userId: string, propertyId: string): Promise<AddToWishlistDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'UserProfileService',
    });
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'UserProfileService',
    });

    try {
      // Check if property exists
      const property = await this.propertyModel.findById(propertyId).exec();
      ValidationUtils.validateEntityExists(property, propertyId, {
        entityName: 'Property',
        context: 'UserProfileService',
      });

      // Check if user exists
      const user = await this.userModel.findById(userId).exec();
      ValidationUtils.validateEntityExists(user, userId, {
        entityName: 'User',
        context: 'UserProfileService',
      });

      if (!canUserPerformAction(user!.status, 'canLogin')) {
        throw new BadRequestException(`Cannot modify wishlist of ${user!.status} account`);
      }

      const propertyObjectId = new Types.ObjectId(propertyId);

      // Check if already in wishlist
      const alreadyInWishlist = user!.wishlist.some((id) => id.equals(propertyObjectId));

      if (alreadyInWishlist) {
        throw new ConflictException('Property already in wishlist');
      }

      // Add to wishlist
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            $addToSet: { wishlist: propertyObjectId },
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      // Increment savedCount on property
      await this.propertyModel
        .findByIdAndUpdate(propertyId, {
          $inc: { savedCount: 1 },
        })
        .exec();

      LoggingUtil.log(`Property ${propertyId} added to wishlist for user ${userId}`, 'UserProfileService');

      return {
        propertyId,
        added: true,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `addToWishlist: error adding property ${propertyId} to wishlist for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to add property to wishlist');
    }
  }

  /** Remove property from user's wishlist */
  async removeFromWishlist(userId: string, propertyId: string): Promise<RemoveFromWishlistDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'UserProfileService',
    });
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'UserProfileService',
    });

    try {
      // Check if user exists
      const user = await this.userModel.findById(userId).exec();
      ValidationUtils.validateEntityExists(user, userId, {
        entityName: 'User',
        context: 'UserProfileService',
      });

      if (!canUserPerformAction(user!.status, 'canLogin')) {
        throw new BadRequestException(`Cannot modify wishlist of ${user!.status} account`);
      }

      const propertyObjectId = new Types.ObjectId(propertyId);

      // Check if in wishlist
      const inWishlist = user!.wishlist.some((id) => id.equals(propertyObjectId));

      if (!inWishlist) {
        throw new NotFoundException('Property not found in wishlist');
      }

      // Remove from wishlist
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            $pull: { wishlist: propertyObjectId },
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      // Decrement savedCount on property (ensure it doesn't go below 0)
      await this.propertyModel
        .findByIdAndUpdate(propertyId, {
          $inc: { savedCount: -1 },
          $max: { savedCount: 0 },
        })
        .exec();

      LoggingUtil.log(
        `Property ${propertyId} removed from wishlist for user ${userId}`,
        'UserProfileService',
      );

      return {
        propertyId,
        removed: true,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `removeFromWishlist: error removing property ${propertyId} from wishlist for user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to remove property from wishlist');
    }
  }

  /** Check if property is in user's wishlist */
  async checkWishlistStatus(userId: string, propertyId: string): Promise<WishlistCheckDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'UserProfileService',
    });
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'UserProfileService',
    });

    try {
      const user = await this.userModel.findById(userId).select('wishlist').exec();
      ValidationUtils.validateEntityExists(user, userId, {
        entityName: 'User',
        context: 'UserProfileService',
      });

      const propertyObjectId = new Types.ObjectId(propertyId);
      const isFavorited = user!.wishlist.some((id) => id.equals(propertyObjectId));

      LoggingUtil.log(
        `Wishlist status checked for property ${propertyId} by user ${userId}`,
        'UserProfileService',
      );

      return {
        propertyId,
        isFavorited,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `checkWishlistStatus: error checking wishlist status for property ${propertyId} and user ${userId}`,
        dbError.stack || String(dbError),
      );
      throw new InternalServerErrorException('Failed to check wishlist status');
    }
  }
}
