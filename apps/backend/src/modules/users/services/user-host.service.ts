import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import {
  AdminActionApproval,
  AdminActionApprovalDocument,
  ApprovalActionType,
  ApprovalStatus,
  ApprovalPriority,
} from '../../../database/schemas/admin-action-approval.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserAccountIntegrationService } from './user-account-integration.service';
import {
  BecomeHostApplicationDto,
  BecomeHostDataDto,
  BecomeHostResponseDto,
  HostEligibilityDataDto,
  HostEligibilityResponseDto,
  HostApplicationStatusDataDto,
  HostApplicationStatusResponseDto,
  HostEligibilityRequirementsDto,
  HostApplicationVerificationStatusDto,
} from '../dto/become-host.dto';
import { UserDataDto } from '../dto/user-response.dto';
import { NotificationType } from '../../../common/enums/notification.enums';

/**
 * Service for managing host applications and approvals
 */
@Injectable()
export class UserHostService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AdminActionApproval.name)
    private readonly adminActionApprovalModel: Model<AdminActionApprovalDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly accountIntegrationService: UserAccountIntegrationService,
  ) {}

  /**
   * Minimum account age in days required to apply (REMOVED - Direct host access)
   */
  private readonly MIN_ACCOUNT_AGE_DAYS = 0;

  /**
   * Apply to become a host - Grants host role directly without approval
   */
  async applyToBeHost(
    userId: string,
    applicationData: BecomeHostApplicationDto,
  ): Promise<BecomeHostResponseDto> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validation: Check if user is already a host
      if (user.roles.includes(UserRole.HOST)) {
        throw new BadRequestException('You are already a host');
      }

      // Add HOST role to user directly
      user.roles.push(UserRole.HOST);
      await user.save();

      // Create host earnings account using account integration service
      await this.accountIntegrationService.createAdditionalAccountsForRoleChange(
        userId,
        user.roles,
        user.email || user.phone || 'host',
      );

      // Notify user about becoming a host
      await this.notificationsService.create({
        recipient_id: String(user._id),
        type: NotificationType.SYSTEM,
        title: 'Welcome to Hosting!',
        body: 'You are now a host. You can start listing properties and earning income.',
      });

      LoggingUtil.log(`User ${userId} became a host`, 'UserHostService');

      return {
        status: 'success',
        title: 'You\'re Now a Host',
        message: 'You can now start listing properties and earning income',
        data: {
          applicationId: String(user._id),
          status: 'approved',
          requiresVerification: false,
          nextSteps: ['Create your first property listing', 'Set up payout method for earnings'],
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `applyToBeHost: error granting host role for user ${userId}`,
        dbError.stack || String(dbError),
        'UserHostService',
      );
      throw new InternalServerErrorException('Failed to grant host role');
    }
  }

  /**
   * Get host application status
   */
  async getHostApplicationStatus(userId: string): Promise<HostApplicationStatusResponseDto> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is already a host
      const isHost = user.roles.includes(UserRole.HOST);

      // Find latest application
      const application = await this.adminActionApprovalModel
        .findOne({
          actionType: ApprovalActionType.HOST_APPLICATION,
          requestedBy: user._id,
        })
        .sort({ createdAt: -1 })
        .exec();

      const verificationStatus: HostApplicationVerificationStatusDto = {
        identityVerified: user.isIdentityVerified,
        emailVerified: user.isEmailVerified,
        phoneVerified: user.isPhoneVerified,
      };

      const data: HostApplicationStatusDataDto = {
        hasApplication: !!application,
        status: application?.status as 'pending' | 'approved' | 'rejected' | undefined,
        isHost,
        verificationStatus,
        nextSteps: this.determineNextSteps(user, application?.status),
        rejectionReason: application?.approvalComment,
      };

      return {
        status: 'success',
        title: 'Application Status',
        message: 'Host application status retrieved successfully',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `getHostApplicationStatus: error fetching status for user ${userId}`,
        dbError.stack || String(dbError),
        'UserHostService',
      );
      throw new InternalServerErrorException('Failed to fetch application status');
    }
  }

  /**
   * Check if user is eligible to become a host - Always eligible (no requirements)
   */
  async checkHostEligibility(userId: string): Promise<HostEligibilityResponseDto> {
    try {
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if already a host
      if (user.roles.includes(UserRole.HOST)) {
        return {
          status: 'success',
          title: 'Already a Host',
          message: 'You are already a host',
          data: {
            eligible: false,
            reasons: ['You are already a host'],
            requirements: {
              verified: true,
              accountAge: true,
              completedProfile: true,
            },
          },
        };
      }

      // All users are eligible - no requirements
      const data: HostEligibilityDataDto = {
        eligible: true,
        reasons: [],
        requirements: {
          verified: true,
          accountAge: true,
          completedProfile: true,
        },
      };

      return {
        status: 'success',
        title: 'Eligible to Become a Host',
        message: 'You can become a host anytime',
        data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `checkHostEligibility: error checking eligibility for user ${userId}`,
        dbError.stack || String(dbError),
        'UserHostService',
      );
      throw new InternalServerErrorException('Failed to check eligibility');
    }
  }

  /**
   * Approve host application (Admin)
   */
  async approveHostApplication(
    applicationId: string,
    adminId: string,
    notes?: string,
  ): Promise<UserDataDto> {
    try {
      const application = await this.adminActionApprovalModel.findById(applicationId).exec();

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApprovalStatus.PENDING) {
        throw new BadRequestException(
          `Application has already been ${application.status.toLowerCase()}`,
        );
      }

      const userId = application.requestedBy.toString();
      const user = await this.userModel.findById(userId).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validation: Check if user is already a host
      if (user.roles.includes(UserRole.HOST)) {
        throw new BadRequestException('User is already a host');
      }

      // Validation: Check requirements
      if (!user.isIdentityVerified) {
        throw new BadRequestException(
          'User identity must be verified before approval. Please ask the user to complete identity verification first.',
        );
      }

      // Add HOST role to user
      user.roles.push(UserRole.HOST);
      await user.save();

      // Update approval record
      application.status = ApprovalStatus.APPROVED;
      application.approvedBy = adminId as any;
      application.reviewedAt = DateUtils.now();
      application.approvalComment = notes || 'Application approved';
      application.statusHistory.push({
        status: ApprovalStatus.APPROVED,
        changedAt: DateUtils.now(),
        changedBy: adminId as any,
        comment: notes || 'Approved by admin',
      });
      await application.save();

      // Create host earnings account using account integration service
      await this.accountIntegrationService.createAdditionalAccountsForRoleChange(
        userId,
        user.roles,
        user.email || user.phone || 'host',
      );

      // Send congratulations notification
      await this.notificationsService.create({
        recipient_id: userId,
        type: NotificationType.HOST_APPLICATION_APPROVED,
        title: 'Congratulations! You\'re now a host',
        body:
          'Your host application has been approved. You can now start listing properties and earning income.',
      });

      LoggingUtil.log(`Admin ${adminId} approved host application ${applicationId}`, 'UserHostService');

      // Map user to DTO
      return this.mapUserToDto(user);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `approveHostApplication: error approving application ${applicationId}`,
        dbError.stack || String(dbError),
        'UserHostService',
      );
      throw new InternalServerErrorException('Failed to approve host application');
    }
  }

  /**
   * Reject host application (Admin)
   */
  async rejectHostApplication(
    applicationId: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    try {
      const application = await this.adminActionApprovalModel.findById(applicationId).exec();

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApprovalStatus.PENDING) {
        throw new BadRequestException(
          `Application has already been ${application.status.toLowerCase()}`,
        );
      }

      const userId = application.requestedBy.toString();

      // Update approval record
      application.status = ApprovalStatus.REJECTED;
      application.approvedBy = adminId as any;
      application.reviewedAt = DateUtils.now();
      application.approvalComment = reason;
      application.statusHistory.push({
        status: ApprovalStatus.REJECTED,
        changedAt: DateUtils.now(),
        changedBy: adminId as any,
        comment: reason,
      });
      await application.save();

      // Send rejection notification
      await this.notificationsService.create({
        recipient_id: userId,
        type: NotificationType.HOST_APPLICATION_REJECTED,
        title: 'Host Application Update',
        body: `We're unable to approve your host application at this time. Reason: ${reason}`,
      });

      LoggingUtil.log(
        `Admin ${adminId} rejected host application ${applicationId}: ${reason}`,
        'UserHostService',
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `rejectHostApplication: error rejecting application ${applicationId}`,
        dbError.stack || String(dbError),
        'UserHostService',
      );
      throw new InternalServerErrorException('Failed to reject host application');
    }
  }

  /**
   * Check if account meets minimum age requirement
   */
  private checkAccountAge(createdAt: Date): boolean {
    const daysSinceCreation = DateUtils.daysBetween(createdAt, DateUtils.now());
    return daysSinceCreation >= this.MIN_ACCOUNT_AGE_DAYS;
  }

  /**
   * Check if user profile is complete
   */
  private isProfileComplete(user: UserDocument): boolean {
    return !!(user.firstName && user.lastName && user.bio && user.avatarUrl && user.birthDate);
  }

  /**
   * Determine next steps for user based on their status
   */
  private determineNextSteps(
    user: UserDocument,
    applicationStatus?: ApprovalStatus | string,
  ): string[] {
    const nextSteps: string[] = [];

    // If application is pending
    if (applicationStatus === ApprovalStatus.PENDING) {
      if (!user.isIdentityVerified) {
        nextSteps.push('Complete identity verification to speed up approval');
      }
      nextSteps.push('Wait for admin review (typically 2-3 business days)');
      return nextSteps;
    }

    // If application is approved
    if (applicationStatus === ApprovalStatus.APPROVED || user.roles.includes(UserRole.HOST)) {
      nextSteps.push('Create your first property listing');
      nextSteps.push('Set up payout method for earnings');
      return nextSteps;
    }

    // If application is rejected
    if (applicationStatus === ApprovalStatus.REJECTED) {
      nextSteps.push('Review rejection reason');
      nextSteps.push('Address the issues mentioned');
      nextSteps.push('Reapply after 30 days');
      return nextSteps;
    }

    // If no application yet - show requirements
    if (!user.isEmailVerified) {
      nextSteps.push('Verify your email address');
    }
    if (!user.isPhoneVerified) {
      nextSteps.push('Verify your phone number');
    }
    if (!user.isIdentityVerified) {
      nextSteps.push('Complete identity verification');
    }
    if (!this.isProfileComplete(user)) {
      nextSteps.push('Complete your profile (bio, avatar, birth date)');
    }
    if (nextSteps.length === 0) {
      nextSteps.push('Submit your host application');
    }

    return nextSteps;
  }

  /**
   * Notify admins about new host application
   */
  private async notifyAdminsOfNewApplication(
    userId: string,
    applicationId: string,
  ): Promise<void> {
    try {
      // Find all admin and system_admin users
      const admins = await this.userModel
        .find({
          roles: { $in: [UserRole.ADMIN, UserRole.SYSTEM_ADMIN] },
        })
        .select('_id')
        .exec();

      // Send notification to each admin
      const notificationPromises = admins.map((admin) =>
        this.notificationsService.create({
          recipient_id: String(admin._id),
          type: NotificationType.ADMIN_ACTION_REQUIRED,
          title: 'New Host Application',
          body: `A user has applied to become a host. Review the application now.`,
          data: {
            custom_data: {
              applicationId,
              userId,
              actionType: 'host_application',
            },
          },
        }),
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      LoggingUtil.error(
        'notifyAdminsOfNewApplication: Failed to notify admins',
        error instanceof Error ? error.stack : String(error),
        'UserHostService',
      );
      // Don't throw - notification failure shouldn't block the application
    }
  }

  /**
   * Map user document to DTO
   */
  private mapUserToDto(user: UserDocument): UserDataDto {
    return {
      id: String(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
      status: user.status,
      phone: user.phone,
      bio: user.bio,
      birthDate: user.birthDate ? new Date(user.birthDate) : undefined,
      locale: user.locale,
      timezone: user.timezone,
      firstLogin: user.firstLogin,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      reviewCount: user.reviewCount,
      averageRating: user.averageRating,
      wishlist: user.wishlist.map((id) => String(id)),
      createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
    };
  }
}
