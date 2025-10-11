import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { BookingConfigService } from '../../../common/services/booking-config.service';
import { DateUtils } from '../../../common/utils/date.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { UsersFacadeService } from '../../users/services/users-facade.service';
import { MailService } from '../../../common/services/mail.service';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';

/**
 * Service for automatically canceling unpaid bookings
 *
 * This service runs scheduled jobs to automatically cancel bookings that remain
 * unpaid beyond the configured time limit, freeing up property availability.
 */
@Injectable()
export class BookingAutoCancelService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly bookingConfigService: BookingConfigService,
    private readonly usersService: UsersFacadeService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Scheduled job to auto-cancel unpaid bookings
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'auto-cancel-unpaid-bookings',
    timeZone: 'UTC',
  })
  async handleScheduledCancellation(): Promise<void> {
    try {
      LoggingUtil.log(
        'Starting scheduled unpaid bookings auto-cancellation job...',
        'BookingAutoCancelService',
      );

      const result = await this.cancelUnpaidBookings();

      LoggingUtil.log(
        `Auto-cancellation completed. Cancelled ${result.cancelledCount} unpaid bookings.`,
        'BookingAutoCancelService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during scheduled booking auto-cancellation:',
        error,
        'BookingAutoCancelService',
      );
    }
  }

  /**
   * Manually trigger unpaid booking cancellation (can be called by admin endpoint)
   *
   * @returns Cancellation statistics
   */
  async cancelUnpaidBookings(): Promise<{
    cancelledCount: number;
    scannedCount: number;
    cancellationThresholdDate: Date;
  }> {
    try {
      const config = await this.bookingConfigService.getConfig();

      // Calculate cancellation threshold date
      const now = DateUtils.now();
      const autoCancelHoursMs = config.autoCancelUnpaidHours * 60 * 60 * 1000;
      const cancellationThresholdDate = new Date(now.getTime() - autoCancelHoursMs);

      LoggingUtil.log(
        `Searching for unpaid bookings created before ${cancellationThresholdDate.toISOString()}`,
        'BookingAutoCancelService',
      );

      // Find bookings that are pending payment and created beyond threshold
      const unpaidBookings = await this.bookingModel
        .find({
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: { $lt: cancellationThresholdDate },
        })
        .exec();

      const scannedCount = unpaidBookings.length;

      if (scannedCount === 0) {
        LoggingUtil.log('No unpaid bookings found for cancellation.', 'BookingAutoCancelService');
        return {
          cancelledCount: 0,
          scannedCount: 0,
          cancellationThresholdDate,
        };
      }

      // Cancel unpaid bookings
      const bookingIds = unpaidBookings.map((booking) => booking._id);
      const updateResult = await this.bookingModel
        .updateMany(
          { _id: { $in: bookingIds } },
          {
            $set: {
              status: BookingStatus.CANCELLED,
              cancelledAt: DateUtils.now(),
              cancellationReason: `Automatically cancelled due to payment not received within ${config.autoCancelUnpaidHours} hours`,
            },
          },
        )
        .exec();

      const cancelledCount = updateResult.modifiedCount;

      LoggingUtil.log(
        `Cancelled ${cancelledCount} unpaid bookings (${scannedCount} found)`,
        'BookingAutoCancelService',
      );

      // Log per-property summary
      const bookingsByProperty = unpaidBookings.reduce<Record<string, number>>((acc, booking) => {
        const propertyId = String(booking.propertyId);
        acc[propertyId] = (acc[propertyId] || 0) + 1;
        return acc;
      }, {});

      LoggingUtil.log(
        `Freed up ${Object.keys(bookingsByProperty).length} properties`,
        'BookingAutoCancelService',
      );

      // Send notifications to affected guests
      await this.sendCancellationNotifications(unpaidBookings, config.autoCancelUnpaidHours);

      return {
        cancelledCount,
        scannedCount,
        cancellationThresholdDate,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error during unpaid booking cancellation:',
        error,
        'BookingAutoCancelService',
      );
      throw error;
    }
  }

  /**
   * Get auto-cancellation statistics without performing cancellation
   *
   * @returns Statistics about bookings eligible for auto-cancellation
   */
  async getAutoCancelStats(): Promise<{
    eligibleForCancellation: number;
    cancellationThresholdDate: Date;
    autoCancelHours: number;
  }> {
    try {
      const config = await this.bookingConfigService.getConfig();

      // Calculate cancellation threshold date
      const now = DateUtils.now();
      const autoCancelHoursMs = config.autoCancelUnpaidHours * 60 * 60 * 1000;
      const cancellationThresholdDate = new Date(now.getTime() - autoCancelHoursMs);

      // Count bookings eligible for cancellation
      const eligibleCount = await this.bookingModel
        .countDocuments({
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: { $lt: cancellationThresholdDate },
        })
        .exec();

      return {
        eligibleForCancellation: eligibleCount,
        cancellationThresholdDate,
        autoCancelHours: config.autoCancelUnpaidHours,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error getting auto-cancel stats:',
        error,
        'BookingAutoCancelService',
      );
      throw error;
    }
  }

  /**
   * Get time remaining before a booking will be auto-cancelled
   *
   * @param bookingId - Booking ID to check
   * @returns Hours remaining, or null if not eligible for auto-cancellation
   */
  async getTimeRemainingForBooking(bookingId: string): Promise<number | null> {
    try {
      const booking = await this.bookingModel.findById(bookingId).exec();

      if (!booking) {
        return null;
      }

      // Only applicable for pending unpaid bookings
      if (
        booking.status !== BookingStatus.PENDING ||
        booking.paymentStatus !== PaymentStatus.PENDING
      ) {
        return null;
      }

      const config = await this.bookingConfigService.getConfig();
      const now = DateUtils.now();
      const createdTime = booking.createdAt.getTime();
      const autoCancelMs = config.autoCancelUnpaidHours * 60 * 60 * 1000;
      const cancelTime = createdTime + autoCancelMs;

      const remainingMs = cancelTime - now.getTime();
      const remainingHours = Math.max(0, remainingMs / (60 * 60 * 1000));

      return Math.round(remainingHours * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting time remaining for booking ${bookingId}:`,
        error,
        'BookingAutoCancelService',
      );
      throw error;
    }
  }

  /**
   * Send email notifications to guests whose bookings were cancelled
   *
   * @param bookings - Array of cancelled bookings
   * @param autoCancelHours - Number of hours that triggered auto-cancellation
   */
  private async sendCancellationNotifications(
    bookings: BookingDocument[],
    autoCancelHours: number,
  ): Promise<void> {
    try {
      const notificationPromises = bookings.map(async (booking) => {
        try {
          // Get guest details
          const guest = await this.usersService.findById(String(booking.guestId));

          if (!guest || !guest.email) {
            LoggingUtil.log(
              `Skipping notification for booking ${String(booking._id)} - no guest email`,
              'BookingAutoCancelService',
            );
            return;
          }

          // Get property details
          const property = await this.propertyModel.findById(booking.propertyId).exec();

          // Send email notification
          await this.mailService.send(guest.email, 'Booking Automatically Cancelled', 'booking-auto-cancel', {
            firstName: guest.firstName,
            bookingId: String(booking._id),
            confirmationCode: booking.confirmationCode || 'N/A',
            propertyName: property?.name || 'Property',
            checkInDate: booking.checkIn.toLocaleDateString(),
            checkOutDate: booking.checkOut.toLocaleDateString(),
            totalAmount: booking.pricing.totalAmount,
            currency: booking.pricing.currency,
            autoCancelHours,
          });

          LoggingUtil.log(
            `Sent cancellation notification for booking ${String(booking._id)}`,
            'BookingAutoCancelService',
          );
        } catch (error) {
          // Log error but don't fail the entire cancellation process
          LoggingUtil.errorWithException(
            `Failed to send notification for booking ${String(booking._id)}:`,
            error,
            'BookingAutoCancelService',
          );
        }
      });

      // Wait for all notifications to complete (or fail)
      await Promise.allSettled(notificationPromises);
    } catch (error) {
      // Log error but don't fail the cancellation process
      LoggingUtil.errorWithException(
        'Error sending cancellation notifications:',
        error,
        'BookingAutoCancelService',
      );
    }
  }
}
