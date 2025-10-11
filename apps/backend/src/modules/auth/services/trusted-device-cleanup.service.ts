import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrustedDevice, TrustedDeviceDocument } from '../../../database/schemas/trusted-device.schema';
import { DeviceTrustConfigService } from '../../../common/services/device-trust-config.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { UsersFacadeService } from '../../users/services/users-facade.service';
import { MailService } from '../../../common/services/mail.service';

/**
 * Service for cleaning up expired trusted devices
 *
 * This service runs scheduled jobs to automatically deactivate trusted devices
 * that have been inactive beyond the configured expiry period.
 */
@Injectable()
export class TrustedDeviceCleanupService {
  constructor(
    @InjectModel(TrustedDevice.name)
    private readonly trustedDeviceModel: Model<TrustedDeviceDocument>,
    private readonly deviceTrustConfigService: DeviceTrustConfigService,
    private readonly usersService: UsersFacadeService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Scheduled job to cleanup expired trusted devices
   * Runs daily at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'cleanup-expired-trusted-devices',
    timeZone: 'UTC',
  })
  async handleScheduledCleanup(): Promise<void> {
    try {
      // Check if cleanup is enabled
      const config = await this.deviceTrustConfigService.getConfig();

      if (!config.cleanupEnabled) {
        LoggingUtil.log(
          'Trusted device cleanup is disabled. Skipping scheduled cleanup.',
          'TrustedDeviceCleanupService',
        );
        return;
      }

      LoggingUtil.log(
        'Starting scheduled trusted device cleanup job...',
        'TrustedDeviceCleanupService',
      );

      const result = await this.cleanupExpiredDevices();

      LoggingUtil.log(
        `Trusted device cleanup completed. Deactivated ${result.deactivatedCount} devices.`,
        'TrustedDeviceCleanupService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during scheduled trusted device cleanup:',
        error,
        'TrustedDeviceCleanupService',
      );
    }
  }

  /**
   * Manually trigger device cleanup (can be called by admin endpoint)
   *
   * @returns Cleanup statistics
   */
  async cleanupExpiredDevices(): Promise<{
    deactivatedCount: number;
    scannedCount: number;
    expiryThresholdDate: Date;
  }> {
    try {
      const config = await this.deviceTrustConfigService.getConfig();

      // Calculate expiry threshold date
      const now = DateUtils.now();
      const expiryThresholdMs = config.expiryDays * 24 * 60 * 60 * 1000;
      const expiryThresholdDate = new Date(now.getTime() - expiryThresholdMs);

      LoggingUtil.log(
        `Searching for active devices not used since ${expiryThresholdDate.toISOString()}`,
        'TrustedDeviceCleanupService',
      );

      // Find active devices that haven't been used within expiry period
      const expiredDevices = await this.trustedDeviceModel
        .find({
          isActive: true,
          lastUsedAt: { $lt: expiryThresholdDate },
        })
        .exec();

      const scannedCount = expiredDevices.length;

      if (scannedCount === 0) {
        LoggingUtil.log('No expired devices found.', 'TrustedDeviceCleanupService');
        return {
          deactivatedCount: 0,
          scannedCount: 0,
          expiryThresholdDate,
        };
      }

      // Deactivate expired devices
      const deviceIds = expiredDevices.map((device) => device._id);
      const updateResult = await this.trustedDeviceModel
        .updateMany(
          { _id: { $in: deviceIds } },
          {
            $set: {
              isActive: false,
              deactivatedAt: DateUtils.now(),
              deactivationReason: `Automatically deactivated due to ${config.expiryDays} days of inactivity`,
            },
          },
        )
        .exec();

      const deactivatedCount = updateResult.modifiedCount;

      LoggingUtil.log(
        `Deactivated ${deactivatedCount} expired devices (${scannedCount} found)`,
        'TrustedDeviceCleanupService',
      );

      // Group devices by user
      const devicesByUser = expiredDevices.reduce<Record<string, TrustedDeviceDocument[]>>(
        (acc, device) => {
          const userId = String(device.user);
          if (!acc[userId]) {
            acc[userId] = [];
          }
          acc[userId].push(device);
          return acc;
        },
        {},
      );

      LoggingUtil.log(
        `Affected ${Object.keys(devicesByUser).length} users`,
        'TrustedDeviceCleanupService',
      );

      // Send notifications to affected users
      await this.sendCleanupNotifications(devicesByUser, config.expiryDays);

      return {
        deactivatedCount,
        scannedCount,
        expiryThresholdDate,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during trusted device cleanup:',
        error,
        'TrustedDeviceCleanupService',
      );
      throw error;
    }
  }

  /**
   * Get cleanup statistics without performing cleanup
   *
   * @returns Statistics about devices eligible for cleanup
   */
  async getCleanupStats(): Promise<{
    eligibleForCleanup: number;
    expiryThresholdDate: Date;
    cleanupEnabled: boolean;
    expiryDays: number;
  }> {
    try {
      const config = await this.deviceTrustConfigService.getConfig();

      // Calculate expiry threshold date
      const now = DateUtils.now();
      const expiryThresholdMs = config.expiryDays * 24 * 60 * 60 * 1000;
      const expiryThresholdDate = new Date(now.getTime() - expiryThresholdMs);

      // Count devices eligible for cleanup
      const eligibleCount = await this.trustedDeviceModel
        .countDocuments({
          isActive: true,
          lastUsedAt: { $lt: expiryThresholdDate },
        })
        .exec();

      return {
        eligibleForCleanup: eligibleCount,
        expiryThresholdDate,
        cleanupEnabled: config.cleanupEnabled,
        expiryDays: config.expiryDays,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error getting cleanup stats:',
        error,
        'TrustedDeviceCleanupService',
      );
      throw error;
    }
  }

  /**
   * Send email notifications to users whose devices were deactivated
   *
   * @param devicesByUser - Map of userId to array of deactivated devices
   * @param expiryDays - Number of days of inactivity that triggered deactivation
   */
  private async sendCleanupNotifications(
    devicesByUser: Record<string, TrustedDeviceDocument[]>,
    expiryDays: number,
  ): Promise<void> {
    try {
      const notificationPromises = Object.entries(devicesByUser).map(
        async ([userId, devices]) => {
          try {
            // Get user details
            const user = await this.usersService.findById(userId);

            if (!user || !user.email) {
              LoggingUtil.log(
                `Skipping notification for user ${userId} - no email address`,
                'TrustedDeviceCleanupService',
              );
              return;
            }

            // Prepare device list for email (formatted as string)
            const deviceListText = devices
              .map((device, index) => {
                const deviceName = device.deviceName || 'Unknown Device';
                const lastUsed = device.lastUsedAt.toLocaleDateString();
                return `${index + 1}. ${deviceName} (last used: ${lastUsed})`;
              })
              .join('\n');

            // Send email notification
            await this.mailService.send(
              user.email,
              'Trusted Devices Deactivated',
              'device-cleanup',
              {
                firstName: user.firstName,
                deviceCount: devices.length,
                deviceList: deviceListText,
                expiryDays,
              },
            );

            LoggingUtil.log(
              `Sent cleanup notification to user ${userId} (${devices.length} devices)`,
              'TrustedDeviceCleanupService',
            );
          } catch (error) {
            // Log error but don't fail the entire cleanup process
            LoggingUtil.errorWithException(
              `Failed to send notification to user ${userId}:`,
              error,
              'TrustedDeviceCleanupService',
            );
          }
        },
      );

      // Wait for all notifications to complete (or fail)
      await Promise.allSettled(notificationPromises);
    } catch (error) {
      // Log error but don't fail the cleanup process
      LoggingUtil.errorWithException(
        'Error sending cleanup notifications:',
        error,
        'TrustedDeviceCleanupService',
      );
    }
  }
}
