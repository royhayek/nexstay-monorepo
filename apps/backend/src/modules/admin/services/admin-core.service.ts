import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { BulkActionDto } from '../dto/admin-filters.dto';
import { BulkOperationResultDto } from '../dto/admin-operation-response.dto';

/**
 * Admin Core Service
 * Handles basic admin operations, user management, and bulk administrative actions
 * Enhanced with comprehensive admin functionality following architectural guidelines
 */
@Injectable()
export class AdminCoreService {
  private static readonly CONTEXT = AdminCoreService.name;

  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /**
   * Get admin statistics overview
   */
  async getAdminStats() {
    try {
      const totalUsers = await this.userModel.countDocuments();
      const activeUsers = await this.userModel.countDocuments({
        isActive: true,
        isEmailVerified: true,
      });
      const newUsersToday = await this.userModel.countDocuments({
        createdAt: { $gte: DateUtils.startOfDay(DateUtils.now()) },
      });

      const stats = {
        totalUsers,
        activeUsers,
        newUsersToday,
        inactiveUsers: totalUsers - activeUsers,
        verificationRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        growthRate: newUsersToday, // This could be enhanced with weekly/monthly comparisons
      };

      LoggingUtil.log('Admin stats retrieved', AdminCoreService.CONTEXT, { metadata: stats });
      return stats;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to get admin stats', error, AdminCoreService.CONTEXT);
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Execute bulk administrative actions
   */
  async executeBulkAction(bulkAction: BulkActionDto): Promise<BulkOperationResultDto> {
    const startTime = Date.now();
    const result: BulkOperationResultDto = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      successfulIds: [],
      failedItems: [],
      executionTime: 0,
      completedAt: DateUtils.now(),
    };

    try {
      LoggingUtil.log('Starting bulk action', AdminCoreService.CONTEXT, {
        metadata: {
          action: bulkAction.action,
          targetCount: bulkAction.targetIds?.length || 0,
          reason: bulkAction.reason,
        },
      });

      const targetIds = bulkAction.targetIds || [];
      result.totalProcessed = targetIds.length;

      // Execute bulk action based on action type
      switch (bulkAction.action) {
        case 'deactivate_users':
          await this.bulkDeactivateUsers(targetIds, result);
          break;
        case 'activate_users':
          await this.bulkActivateUsers(targetIds, result);
          break;
        case 'delete_inactive_users':
          await this.bulkDeleteInactiveUsers(targetIds, result);
          break;
        case 'send_notification':
          await this.bulkSendNotification(targetIds, result, bulkAction.reason);
          break;
        default:
          throw new Error(`Unsupported bulk action: ${bulkAction.action}`);
      }

      result.executionTime = Date.now() - startTime;
      result.completedAt = DateUtils.now();

      LoggingUtil.log('Bulk action completed', AdminCoreService.CONTEXT, {
        metadata: {
          action: bulkAction.action,
          totalProcessed: result.totalProcessed,
          successful: result.successful,
          failed: result.failed,
          executionTime: result.executionTime,
        },
      });

      return result;
    } catch (error) {
      result.executionTime = Date.now() - startTime;
      LoggingUtil.errorWithException('Bulk action failed', error, AdminCoreService.CONTEXT, {
        metadata: {
          action: bulkAction.action,
          executionTime: result.executionTime,
        },
      });
      throw new Error('BULK_ACTION_FAILED');
    }
  }

  // Private bulk operation methods
  private async bulkDeactivateUsers(
    userIds: string[],
    result: BulkOperationResultDto,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        const updateResult = await this.userModel.updateOne(
          { _id: userId },
          { isActive: false, deactivatedAt: DateUtils.now() },
        );

        if (updateResult.matchedCount > 0) {
          result.successful++;
          result.successfulIds.push(userId);
        } else {
          result.failed++;
          result.failedItems.push({ id: userId, error: 'User not found' });
        }
      } catch (error) {
        result.failed++;
        result.failedItems.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async bulkActivateUsers(
    userIds: string[],
    result: BulkOperationResultDto,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        const updateResult = await this.userModel.updateOne(
          { _id: userId },
          { isActive: true, reactivatedAt: DateUtils.now() },
        );

        if (updateResult.matchedCount > 0) {
          result.successful++;
          result.successfulIds.push(userId);
        } else {
          result.failed++;
          result.failedItems.push({ id: userId, error: 'User not found' });
        }
      } catch (error) {
        result.failed++;
        result.failedItems.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async bulkDeleteInactiveUsers(
    userIds: string[],
    result: BulkOperationResultDto,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        // Only delete users who have been inactive for more than 30 days
        const user = await this.userModel.findOne({
          _id: userId,
          isActive: false,
          deactivatedAt: { $lt: DateUtils.subtractDays(DateUtils.now(), 30) },
        });

        if (user) {
          await this.userModel.deleteOne({ _id: userId });
          result.successful++;
          result.successfulIds.push(userId);
        } else {
          result.failed++;
          result.failedItems.push({
            id: userId,
            error: 'User not eligible for deletion (not inactive long enough)',
          });
        }
      } catch (error) {
        result.failed++;
        result.failedItems.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private async bulkSendNotification(
    userIds: string[],
    result: BulkOperationResultDto,
    message?: string,
  ): Promise<void> {
    // Mock implementation for sending notifications
    for (const userId of userIds) {
      try {
        // In a real implementation, this would integrate with the notifications service
        const user = await this.userModel.findById(userId);
        if (user) {
          // Mock notification sending
          LoggingUtil.log('Notification sent to user', AdminCoreService.CONTEXT, {
            metadata: {
              userId,
              email: user.email,
              message,
            },
          });
          result.successful++;
          result.successfulIds.push(userId);
        } else {
          result.failed++;
          result.failedItems.push({ id: userId, error: 'User not found' });
        }
      } catch (error) {
        result.failed++;
        result.failedItems.push({
          id: userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get user management statistics
   */
  async getUserManagementStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        recentSignups,
        hostUsers,
        guestUsers,
        suspendedUsers,
      ] = await Promise.all([
        this.userModel.countDocuments(),
        this.userModel.countDocuments({ isActive: true }),
        this.userModel.countDocuments({ isEmailVerified: true }),
        this.userModel.countDocuments({
          createdAt: { $gte: DateUtils.subtractDays(DateUtils.now(), 7) },
        }),
        this.userModel.countDocuments({ roles: 'host' }),
        this.userModel.countDocuments({ roles: 'guest' }),
        this.userModel.countDocuments({ isActive: false }),
      ]);

      const stats = {
        totalUsers,
        activeUsers,
        verifiedUsers,
        recentSignups,
        hostUsers,
        guestUsers,
        suspendedUsers,
        verificationRate: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      };

      LoggingUtil.log('User management stats retrieved', AdminCoreService.CONTEXT, {
        metadata: stats,
      });
      return stats;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get user management stats',
        error,
        AdminCoreService.CONTEXT,
      );
      throw new Error('STATS_RETRIEVAL_FAILED');
    }
  }

  /**
   * Get recent admin activities (enhanced placeholder)
   */
  async getRecentActivities() {
    try {
      // This is a placeholder implementation
      // In a full implementation, this would query an admin activity log table
      type UserLeanResult = {
        _id: Types.ObjectId;
        email?: string;
        createdAt: Date;
        updatedAt?: Date;
        isActive: boolean;
      };

      const recentUsers: UserLeanResult[] = await this.userModel
        .find({}, 'email createdAt updatedAt isActive')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean<UserLeanResult[]>();

      const activities = recentUsers.map((user, index) => ({
        id: `activity_${index}`,
        type: 'USER_MANAGEMENT',
        description: `User ${user.email || 'Unknown'} ${user.isActive ? 'activated' : 'deactivated'}`,
        performedBy: 'system',
        targetId: user._id.toHexString(),
        targetType: 'user',
        createdAt: user.updatedAt || user.createdAt,
      }));

      LoggingUtil.log('Recent activities retrieved (placeholder)', AdminCoreService.CONTEXT, {
        metadata: { count: activities.length },
      });

      return {
        activities,
        totalCount: activities.length,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get recent activities',
        error,
        AdminCoreService.CONTEXT,
      );
      return {
        activities: [],
        totalCount: 0,
      };
    }
  }
}
