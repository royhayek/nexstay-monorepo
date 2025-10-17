import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { NotificationsService } from '../notifications.service';
import { NotificationTemplates } from './notification-templates';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { PropertyDocument } from '../../../database/schemas/property.schema';
import { ReviewDocument } from '../../../database/schemas/review.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { NotificationType, NotificationPriority } from '../../../common/enums/notification.enums';
import { InvoiceDocument } from '../../../database/schemas/invoice.schema';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { InvoiceEmailOptions } from '../../../common/interfaces/invoice.interfaces';

@Injectable()
export class NotificationHelperService {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Helper method to check if user has enabled a specific email notification type
   */
  private async checkEmailPreference(
    userId: string,
    preferenceType: keyof NonNullable<UserDocument['preferences']>['emailNotifications'],
  ): Promise<boolean> {
    try {
      const user = await this.userModel.findById(userId).select('preferences').lean().exec();
      if (!user || !user.preferences || !user.preferences.emailNotifications) {
        // Default to enabled if preferences not set
        return preferenceType !== 'marketingEmails'; // Marketing emails default to false
      }
      const emailPreferences = user.preferences.emailNotifications;
      const preference = emailPreferences[preferenceType];
      return preference !== undefined ? preference : preferenceType !== 'marketingEmails';
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error checking email preference for user ${userId}`,
        error,
        'NotificationHelperService',
      );
      // Default to enabled on error (except marketing)
      return preferenceType !== 'marketingEmails';
    }
  }

  /**
   * Send booking-related notifications
   */
  async sendBookingRequestNotification(
    booking: BookingDocument,
    property: PropertyDocument,
    guest: UserDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.bookingRequest({
        hostId: String(booking.hostId),
        guestId: String(booking.guestId),
        guestName: `${guest.firstName} ${guest.lastName}`,
        propertyName: property.name,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        bookingId: String(booking._id),
        confirmationCode: booking.confirmationCode || '',
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Booking request notification sent for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send booking request notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendBookingConfirmedNotification(
    booking: BookingDocument,
    property: PropertyDocument,
    host: UserDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.bookingConfirmed({
        guestId: String(booking.guestId),
        hostId: String(booking.hostId),
        hostName: `${host.firstName} ${host.lastName}`,
        propertyName: property.name,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        bookingId: String(booking._id),
        confirmationCode: booking.confirmationCode || '',
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Booking confirmed notification sent for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send booking confirmed notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendBookingCancelledNotification(
    booking: BookingDocument,
    property: PropertyDocument,
    cancelledBy: UserDocument,
    recipientId: string,
    reason?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.bookingCancelled({
        recipientId,
        senderId: String(cancelledBy._id),
        senderName: `${cancelledBy.firstName} ${cancelledBy.lastName}`,
        propertyName: property.name,
        checkInDate: booking.checkIn,
        bookingId: String(booking._id),
        reason,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Booking cancelled notification sent for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send booking cancelled notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async scheduleCheckInReminder(
    booking: BookingDocument,
    property: PropertyDocument,
    host: UserDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.checkInReminder({
        guestId: String(booking.guestId),
        propertyName: property.name,
        hostName: `${host.firstName} ${host.lastName}`,
        checkInDate: booking.checkIn,
        bookingId: String(booking._id),
        confirmationCode: booking.confirmationCode || '',
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Check-in reminder scheduled for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to schedule check-in reminder',
        error,
        'NotificationHelperService',
      );
    }
  }

  async scheduleCheckOutReminder(
    booking: BookingDocument,
    property: PropertyDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.checkOutReminder({
        guestId: String(booking.guestId),
        propertyName: property.name,
        checkOutDate: booking.checkOut,
        bookingId: String(booking._id),
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Check-out reminder scheduled for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to schedule check-out reminder',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send review-related notifications
   */
  async sendReviewReceivedNotification(
    review: ReviewDocument,
    property: PropertyDocument,
    reviewer: UserDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.reviewReceived({
        recipientId: String(review.revieweeId),
        reviewerId: String(review.reviewerId),
        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
        propertyName: property.name,
        rating: review.overallRating || 0,
        reviewId: String(review._id),
        bookingId: String(review.bookingId),
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Review received notification sent for review ${String(review._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send review received notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async scheduleReviewReminder(
    booking: BookingDocument,
    property: PropertyDocument,
    host: UserDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.reviewReminder({
        recipientId: String(booking.guestId),
        propertyName: property.name,
        hostName: `${host.firstName} ${host.lastName}`,
        bookingId: String(booking._id),
        checkOutDate: booking.checkOut,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Review reminder scheduled for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to schedule review reminder',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send payment-related notifications
   */
  async sendPaymentSuccessfulNotification(
    booking: BookingDocument,
    property: PropertyDocument,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.paymentSuccessful({
        recipientId: String(booking.guestId),
        amount: booking.pricing.totalAmount,
        currency: booking.pricing.currency,
        propertyName: property.name,
        bookingId: String(booking._id),
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Payment successful notification sent for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send payment successful notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendPaymentFailedNotification(
    booking: BookingDocument,
    property: PropertyDocument,
    reason?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.paymentFailed({
        recipientId: String(booking.guestId),
        amount: booking.pricing.totalAmount,
        currency: booking.pricing.currency,
        propertyName: property.name,
        bookingId: String(booking._id),
        reason,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Payment failed notification sent for booking ${String(booking._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send payment failed notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send property-related notifications
   */
  async sendPropertyApprovedNotification(property: PropertyDocument): Promise<void> {
    try {
      const notification = NotificationTemplates.propertyApproved({
        hostId: String(property.hostId),
        propertyName: property.name,
        propertyId: String(property._id),
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Property approved notification sent for property ${String(property._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send property approved notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendPropertyRejectedNotification(
    property: PropertyDocument,
    reason?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.propertyRejected({
        hostId: String(property.hostId),
        propertyName: property.name,
        propertyId: String(property._id),
        reason,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Property rejected notification sent for property ${String(property._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send property rejected notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendFirstListingCongratulations(
    property: PropertyDocument,
    host: UserDocument,
  ): Promise<void> {
    try {
      // Get property image (first image if available)
      const propertyImage =
        property.images && property.images.length > 0 ? property.images[0].url : undefined;

      // Get location string from address
      const propertyLocation = property.address
        ? `${property.address.city || ''}${property.address.city && property.address.country ? ', ' : ''}${property.address.country || ''}`
        : 'Unknown Location';

      const notification = NotificationTemplates.firstListingCongratulations({
        hostId: String(property.hostId),
        hostName: `${host.firstName} ${host.lastName}`,
        hostEmail: host.email || 'host@example.com', // Fallback email
        propertyId: String(property._id),
        propertyName: property.name,
        propertyType: property.propertyType,
        propertyLocation,
        propertyImage,
        nightlyRate: property.price?.basePrice || 0,
        currency: property.price?.currency || 'USD',
        publishedDate: property.createdAt || new Date(),
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `First listing congratulations sent for property ${String(property._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send first listing congratulations',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send system notifications
   */
  async sendWelcomeNotification(user: UserDocument): Promise<void> {
    try {
      const notification = NotificationTemplates.welcome({
        userId: String(user._id),
        userName: user.firstName || 'User',
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Welcome notification sent to user ${String(user._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send welcome notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendAccountVerifiedNotification(user: UserDocument): Promise<void> {
    try {
      const notification = NotificationTemplates.accountVerified({
        userId: String(user._id),
        userName: user.firstName || 'User',
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Account verified notification sent to user ${String(user._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send account verified notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  async sendSecurityAlertNotification(
    user: UserDocument,
    activity: string,
    location?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.securityAlert({
        userId: String(user._id),
        activity,
        location,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Security alert notification sent to user ${String(user._id)}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send security alert notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send invoice-related notifications
   */
  sendInvoiceEmail(
    invoice: InvoiceDocument,
    emailOptions: InvoiceEmailOptions,
    pdfBuffer?: Buffer,
  ): void {
    try {
      // This is a placeholder for invoice email sending
      // In a real implementation, this would integrate with email service
      LoggingUtil.log(
        `Invoice email sent for invoice ${invoice.invoiceNumber}`,
        'NotificationHelperService',
        {
          metadata: {
            recipientEmail: emailOptions.to,
            invoiceNumber: invoice.invoiceNumber,
            hasPdfAttachment: !!pdfBuffer,
          },
        },
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send invoice email',
        error,
        'NotificationHelperService',
      );
      throw error;
    }
  }

  /**
   * Send message-related notifications
   */
  async sendNewMessageNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string,
    propertyName?: string,
    bookingId?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.newMessage({
        recipientId,
        senderId,
        senderName,
        messagePreview,
        conversationId,
        propertyName,
        bookingId,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `New message notification sent to user ${recipientId}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send new message notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send payout-related notifications
   */
  async sendPayoutProcessedNotification(
    hostId: string,
    payoutId: string,
    amount: number,
    currency: string,
    payoutDate: Date,
    expectedArrival: Date,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.payoutProcessed({
        hostId,
        payoutId,
        amount,
        currency,
        payoutDate,
        expectedArrival,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Payout processed notification sent for payout ${payoutId}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send payout processed notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Send authentication-related notifications
   */
  async sendPasswordResetNotification(
    userId: string,
    userEmail: string,
    userName: string,
    resetToken: string,
    expiryTime: string,
    ipAddress?: string,
    location?: string,
  ): Promise<void> {
    try {
      const notification = NotificationTemplates.passwordReset({
        userId,
        userEmail,
        userName,
        resetToken,
        expiryTime,
        ipAddress,
        location,
      });

      await this.notificationsService.create(notification);
      LoggingUtil.log(
        `Password reset notification sent to user ${userId}`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send password reset notification',
        error,
        'NotificationHelperService',
      );
    }
  }

  /**
   * Batch notifications for multiple recipients
   */
  async sendBulkNotification(
    recipientIds: string[],
    title: string,
    body: string,
    type: NotificationType,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      const notifications = recipientIds.map((recipientId) => ({
        recipient_id: recipientId,
        type,
        title,
        body,
        data,
        priority: NotificationPriority.NORMAL,
      }));

      await Promise.all(
        notifications.map((notification) => this.notificationsService.create(notification)),
      );

      LoggingUtil.log(
        `Bulk notification sent to ${recipientIds.length} recipients`,
        'NotificationHelperService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send bulk notification',
        error,
        'NotificationHelperService',
      );
    }
  }
}
