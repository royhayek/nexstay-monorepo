import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { UserDocument } from '../../../database/schemas/user.schema';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { NotificationHelperService } from '../../notifications/helpers/notification-helper.service';
import { UsersFacadeService } from '../../users/services/users-facade.service';

/**
 * Service for sending review reminder emails
 *
 * This service runs scheduled jobs to send review reminder emails to guests
 * 7 days after their checkout date, if they haven't left a review yet.
 */
@Injectable()
export class ReviewReminderService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly usersService: UsersFacadeService,
    private readonly notificationHelper: NotificationHelperService,
  ) {}

  /**
   * Scheduled job to send review reminder emails
   * Runs every day at 10:00 AM UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    name: 'send-review-reminders',
    timeZone: 'UTC',
  })
  async handleScheduledReviewReminders(): Promise<void> {
    try {
      LoggingUtil.log(
        'Starting scheduled review reminder email job...',
        'ReviewReminderService',
      );

      const result = await this.sendReviewReminders();

      LoggingUtil.log(
        `Review reminder job completed. Sent ${result.sentCount} reminders to guests.`,
        'ReviewReminderService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during scheduled review reminder job:',
        error,
        'ReviewReminderService',
      );
    }
  }

  /**
   * Send review reminder emails to guests
   * Can be called manually by admin endpoint
   *
   * @returns Statistics about sent reminders
   */
  async sendReviewReminders(): Promise<{
    sentCount: number;
    scannedCount: number;
    targetDate: Date;
  }> {
    try {
      // Calculate the target checkout date (7 days ago)
      const now = DateUtils.now();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Set time to start of day for consistent matching
      const targetDate = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
      const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

      LoggingUtil.log(
        `Looking for completed bookings that checked out on ${targetDate.toISOString()}`,
        'ReviewReminderService',
      );

      // Find checked-out bookings that checked out exactly 7 days ago
      const bookings = await this.bookingModel
        .find({
          status: BookingStatus.CHECKED_OUT,
          checkOut: { $gte: targetDate, $lt: nextDay },
        })
        .exec();

      const scannedCount = bookings.length;

      if (scannedCount === 0) {
        LoggingUtil.log(
          'No bookings found that checked out 7 days ago.',
          'ReviewReminderService',
        );
        return {
          sentCount: 0,
          scannedCount: 0,
          targetDate,
        };
      }

      LoggingUtil.log(
        `Found ${scannedCount} bookings that checked out 7 days ago. Checking for missing reviews...`,
        'ReviewReminderService',
      );

      // Filter out bookings that already have reviews
      const bookingsWithoutReviews: BookingDocument[] = [];

      for (const booking of bookings) {
        const existingReview = await this.reviewModel
          .findOne({
            bookingId: booking._id,
            reviewerId: booking.guestId,
          })
          .exec();

        if (!existingReview) {
          bookingsWithoutReviews.push(booking);
        }
      }

      LoggingUtil.log(
        `${bookingsWithoutReviews.length} bookings do not have reviews yet.`,
        'ReviewReminderService',
      );

      if (bookingsWithoutReviews.length === 0) {
        return {
          sentCount: 0,
          scannedCount,
          targetDate,
        };
      }

      // Send review reminder emails
      let sentCount = 0;
      const emailPromises = bookingsWithoutReviews.map(async (booking) => {
        try {
          // Get guest and property details
          const [guest, property] = await Promise.all([
            this.usersService.findById(String(booking.guestId)),
            this.propertyModel.findById(booking.propertyId).exec(),
          ]);

          if (!guest || !property) {
            LoggingUtil.log(
              `Skipping booking ${String(booking._id)} - missing guest or property data`,
              'ReviewReminderService',
            );
            return;
          }

          // Get host details
          const host = await this.usersService.findById(String(booking.hostId));
          const hostName = host ? `${host.firstName} ${host.lastName}` : 'your host';

          // Send review reminder notification
          await this.notificationHelper.scheduleReviewReminder(
            booking,
            property,
            host,
          );

          sentCount++;
          LoggingUtil.log(
            `Sent review reminder for booking ${String(booking._id)} to guest ${String(guest._id)}`,
            'ReviewReminderService',
          );
        } catch (error) {
          // Log error but don't fail the entire job
          LoggingUtil.errorWithException(
            `Failed to send review reminder for booking ${String(booking._id)}:`,
            error,
            'ReviewReminderService',
          );
        }
      });

      // Wait for all emails to be sent
      await Promise.allSettled(emailPromises);

      LoggingUtil.log(
        `Successfully sent ${sentCount} review reminder emails`,
        'ReviewReminderService',
      );

      return {
        sentCount,
        scannedCount,
        targetDate,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during review reminder sending:',
        error,
        'ReviewReminderService',
      );
      throw error;
    }
  }

  /**
   * Get statistics about pending review reminders
   *
   * @returns Statistics about bookings eligible for review reminders
   */
  async getReviewReminderStats(): Promise<{
    eligibleForReminder: number;
    targetDate: Date;
  }> {
    try {
      // Calculate the target checkout date (7 days ago)
      const now = DateUtils.now();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Set time to start of day
      const targetDate = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());
      const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

      // Count bookings eligible for review reminders
      const eligibleCount = await this.bookingModel
        .countDocuments({
          status: BookingStatus.CHECKED_OUT,
          checkOut: { $gte: targetDate, $lt: nextDay },
        })
        .exec();

      return {
        eligibleForReminder: eligibleCount,
        targetDate,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error getting review reminder stats:',
        error,
        'ReviewReminderService',
      );
      throw error;
    }
  }

  /**
   * Manually send a review reminder for a specific booking
   *
   * @param bookingId - Booking ID
   * @returns Success status
   */
  async sendManualReviewReminder(bookingId: string): Promise<{ success: boolean }> {
    try {
      const booking = await this.bookingModel.findById(bookingId).exec();

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== BookingStatus.CHECKED_OUT) {
        throw new Error('Can only send review reminders for checked-out bookings');
      }

      // Check if review already exists
      const existingReview = await this.reviewModel
        .findOne({
          bookingId: booking._id,
          reviewerId: booking.guestId,
        })
        .exec();

      if (existingReview) {
        throw new Error('Guest has already left a review for this booking');
      }

      // Get guest and property details
      const [guest, property] = await Promise.all([
        this.usersService.findById(String(booking.guestId)),
        this.propertyModel.findById(booking.propertyId).exec(),
      ]);

      if (!guest || !property) {
        throw new Error('Missing guest or property data');
      }

      // Get host details
      const host = await this.usersService.findById(String(booking.hostId));

      // Send review reminder notification
      await this.notificationHelper.scheduleReviewReminder(
        booking,
        property,
        host,
      );

      LoggingUtil.log(
        `Manually sent review reminder for booking ${bookingId}`,
        'ReviewReminderService',
      );

      return { success: true };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error sending manual review reminder for booking ${bookingId}:`,
        error,
        'ReviewReminderService',
      );
      throw error;
    }
  }
}
