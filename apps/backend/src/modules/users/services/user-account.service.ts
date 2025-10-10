import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { Model } from 'mongoose';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { AccountActionTypeEnum } from '../../../common/enums/account-action.enums';

import { User, UserDocument } from '../../../database/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenDocument,
} from '../../../database/schemas/verification-token.schema';
import {
  AccountActionReason,
  AccountActionReasonDocument,
  AccountActionType,
} from '../../../database/schemas/account-action-reason.schema';

import { DeactivateAccountDto } from '../dto/deactivate-account.dto';
import { DeactivateAccountDataDto } from '../dto/deactivate-account-response.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { DeleteAccountDataDto } from '../dto/delete-account.response';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * User account lifecycle management service
 * Handles account deactivation, deletion, and related operations
 */
@Injectable()
export class UserAccountService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(VerificationToken.name)
    private readonly vtModel: Model<VerificationTokenDocument>,
    @InjectModel(AccountActionReason.name)
    private readonly reasonModel: Model<AccountActionReasonDocument>,
  ) {}

  /** Delete user account (GDPR compliance) */
  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<DeleteAccountDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId');

    try {
      const user = await this.userModel.findById(userId).exec();
      ValidationUtils.validateEntityExists(user, userId, { entityName: 'User' });

      // Validate reason
      const reason = await this.reasonModel
        .findOne({
          _id: dto.reasonId,
          actionType: AccountActionType.DELETION,
          isActive: true,
        })
        .exec();

      ValidationUtils.validateEntityExists(reason, String(dto.reasonId), {
        entityName: 'Deletion reason',
      });

      if (!reason) {
        throw new NotFoundException('Deletion reason not found');
      }

      // Check if custom reason is required for "Other reason" option
      const isOtherReason = reason.title.toLowerCase().includes('other');
      if (isOtherReason && !dto.customReason?.trim()) {
        throw new BadRequestException('Custom reason is required when selecting "Other reason"');
      }

      // 1) Remove auth artifacts
      await Promise.all([
        this.refreshTokenModel.deleteMany({ user: user!._id }).exec(),
        this.vtModel.deleteMany({ user: user!._id }).exec(),
      ]);

      // 2) Hard-delete user
      await this.userModel.deleteOne({ _id: user!._id }).exec();

      const finalReason = isOtherReason && dto.customReason ? dto.customReason : reason.title;
      LoggingUtil.log(
        `Account deleted for user ${userId} - Reason: ${finalReason}`,
        'UserAccountService',
      );

      return {
        message: 'Account deleted successfully',
        deletedAt: DateUtils.now(),
        reason: reason.title,
        customReason: isOtherReason ? dto.customReason : undefined,
      };
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      LoggingUtil.error(
        `deleteAccount: error for ${userId}`,
        err instanceof Error ? err.stack : String(err),
        'UserAccountService',
      );
      throw new InternalServerErrorException('Failed to delete account');
    }
  }

  /** Deactivate user account */
  async deactivateAccount(
    userId: string,
    dto: DeactivateAccountDto,
  ): Promise<DeactivateAccountDataDto> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      if (user.status === UserStatus.DEACTIVATED) {
        throw new BadRequestException('Account is already deactivated');
      }

      // Validate reason
      const reason = await this.reasonModel
        .findOne({
          _id: dto.reasonId,
          actionType: AccountActionType.DEACTIVATION,
          isActive: true,
        })
        .exec();

      if (!reason) {
        throw new BadRequestException('Invalid deactivation reason');
      }

      // Check if custom reason is required for "Other reason" option
      const isOtherReason = reason.title.toLowerCase().includes('other');
      if (isOtherReason && !dto.customReason?.trim()) {
        throw new BadRequestException('Custom reason is required when selecting "Other reason"');
      }

      // Update user to deactivated status
      await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            status: UserStatus.DEACTIVATED,
            updatedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      // Revoke all refresh tokens to force logout
      await this.refreshTokenModel.deleteMany({ user: userId }).exec();

      // Clean up verification tokens
      await this.vtModel.deleteMany({ user: userId }).exec();

      const finalReason = isOtherReason && dto.customReason ? dto.customReason : reason.title;
      LoggingUtil.log(
        `Account deactivated for user ${userId} - Reason: ${finalReason}`,
        'UserAccountService',
      );

      return {
        message: 'Account deactivated successfully',
        deactivatedAt: DateUtils.now(),
        reason: reason.title,
        customReason: isOtherReason ? dto.customReason : undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `deactivateAccount: error deactivating user ${userId}`,
        dbError.stack || String(dbError),
        'UserAccountService',
      );
      throw new InternalServerErrorException('Failed to deactivate account');
    }
  }

  /** Get available deactivation reasons */
  async getDeactivationReasons(): Promise<AccountActionReasonDocument[]> {
    try {
      return await this.reasonModel
        .find({
          actionType: AccountActionType.DEACTIVATION,
          isActive: true,
        })
        .sort({ sortOrder: 1, title: 1 })
        .exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'getDeactivationReasons: error fetching reasons',
        dbError.stack || String(dbError),
        'UserAccountService',
      );
      throw new InternalServerErrorException('Failed to fetch deactivation reasons');
    }
  }

  /** Get available deletion reasons */
  async getDeletionReasons(): Promise<AccountActionReasonDocument[]> {
    try {
      return await this.reasonModel
        .find({
          actionType: AccountActionType.DELETION,
          isActive: true,
        })
        .sort({ sortOrder: 1, title: 1 })
        .exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'getDeletionReasons: error fetching reasons',
        dbError.stack || String(dbError),
        'UserAccountService',
      );
      throw new InternalServerErrorException('Failed to fetch deletion reasons');
    }
  }

  /** Get account action reasons by type */
  async getAccountActionReasons(actionType: AccountActionTypeEnum): Promise<
    Array<{
      _id: string;
      type: string;
      title: string;
      description: string;
      displayOrder: number;
      isActive: boolean;
    }>
  > {
    try {
      let reasons: AccountActionReasonDocument[] = [];

      if (
        actionType === AccountActionTypeEnum.DEACTIVATE ||
        actionType === AccountActionTypeEnum.DELETE
      ) {
        reasons =
          actionType === AccountActionTypeEnum.DEACTIVATE
            ? await this.getDeactivationReasons()
            : await this.getDeletionReasons();

        return reasons.map((reason) => ({
          _id: String(reason._id),
          type: actionType,
          title: reason.title,
          description: reason.description || '',
          displayOrder: reason.sortOrder || 0,
          isActive: reason.isActive,
        }));
      }

      return [];
    } catch (error) {
      LoggingUtil.error(
        `Error getting account action reasons for ${actionType}`,
        error instanceof Error ? error.stack : undefined,
        'UserAccountService',
      );
      throw new InternalServerErrorException('Failed to get account action reasons');
    }
  }
}
