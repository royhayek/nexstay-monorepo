import { NotificationPriority, NotificationType } from '../../../common/enums/notification.enums';
import { DateUtils } from '../../../common/utils/date.utils';
import { CreateNotificationDto } from '../dto/create-notification.dto';

export class NotificationTemplates {
  /**
   * Booking-related notification templates
   */
  static bookingRequest(data: {
    hostId: string;
    guestId: string;
    guestName: string;
    propertyName: string;
    checkInDate: Date;
    checkOutDate: Date;
    bookingId: string;
    confirmationCode: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.hostId,
      sender_id: data.guestId,
      type: NotificationType.BOOKING_REQUEST,
      title: 'New Booking Request',
      body: `${data.guestName} has requested to book your property "${data.propertyName}" from ${data.checkInDate.toLocaleDateString()} to ${data.checkOutDate.toLocaleDateString()}.`,
      priority: NotificationPriority.HIGH,
      data: {
        booking_id: data.bookingId,
        guest_name: data.guestName,
        property_name: data.propertyName,
        check_in_date: DateUtils.toISO(data.checkInDate),
        check_out_date: DateUtils.toISO(data.checkOutDate),
        confirmation_code: data.confirmationCode,
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `booking_${data.bookingId}`,
    };
  }

  static bookingConfirmed(data: {
    guestId: string;
    hostId: string;
    hostName: string;
    propertyName: string;
    checkInDate: Date;
    checkOutDate: Date;
    bookingId: string;
    confirmationCode: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.guestId,
      sender_id: data.hostId,
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Booking Confirmed!',
      body: `Your booking for "${data.propertyName}" has been confirmed by ${data.hostName}. Check-in: ${data.checkInDate.toLocaleDateString()}.`,
      priority: NotificationPriority.HIGH,
      data: {
        booking_id: data.bookingId,
        host_name: data.hostName,
        property_name: data.propertyName,
        check_in_date: DateUtils.toISO(data.checkInDate),
        check_out_date: DateUtils.toISO(data.checkOutDate),
        confirmation_code: data.confirmationCode,
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `booking_${data.bookingId}`,
    };
  }

  static bookingCancelled(data: {
    recipientId: string;
    senderId: string;
    senderName: string;
    propertyName: string;
    checkInDate: Date;
    bookingId: string;
    reason?: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.recipientId,
      sender_id: data.senderId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      body: `${data.senderName} has cancelled the booking for "${data.propertyName}" scheduled for ${data.checkInDate.toLocaleDateString()}.${data.reason ? ` Reason: ${data.reason}` : ''}`,
      priority: NotificationPriority.HIGH,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        check_in_date: DateUtils.toISO(data.checkInDate),
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `booking_${data.bookingId}`,
    };
  }

  static checkInReminder(data: {
    guestId: string;
    propertyName: string;
    hostName: string;
    checkInDate: Date;
    bookingId: string;
    confirmationCode: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.guestId,
      type: NotificationType.CHECK_IN_REMINDER,
      title: 'Check-in Tomorrow',
      body: `Don't forget! Your check-in for "${data.propertyName}" with ${data.hostName} is tomorrow at ${data.checkInDate.toLocaleDateString()}.`,
      priority: NotificationPriority.NORMAL,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        host_name: data.hostName,
        check_in_date: DateUtils.toISO(data.checkInDate),
        confirmation_code: data.confirmationCode,
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `booking_${data.bookingId}`,
      scheduled_at: DateUtils.toISO(
        DateUtils.create(data.checkInDate.getTime() - 24 * 60 * 60 * 1000),
      ), // 24 hours before
    };
  }

  static checkOutReminder(data: {
    guestId: string;
    propertyName: string;
    checkOutDate: Date;
    bookingId: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.guestId,
      type: NotificationType.CHECK_OUT_REMINDER,
      title: 'Check-out Today',
      body: `Your check-out for "${data.propertyName}" is today at ${data.checkOutDate.toLocaleDateString()}. Don't forget to leave a review!`,
      priority: NotificationPriority.NORMAL,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        check_out_date: DateUtils.toISO(data.checkOutDate),
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `booking_${data.bookingId}`,
      scheduled_at: DateUtils.toISO(data.checkOutDate),
    };
  }

  /**
   * Review-related notification templates
   */
  static reviewReceived(data: {
    recipientId: string;
    reviewerId: string;
    reviewerName: string;
    propertyName: string;
    rating: number;
    reviewId: string;
    bookingId: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.recipientId,
      sender_id: data.reviewerId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New Review Received',
      body: `${data.reviewerName} left you a ${data.rating}-star review for "${data.propertyName}".`,
      priority: NotificationPriority.NORMAL,
      data: {
        review_id: data.reviewId,
        booking_id: data.bookingId,
        property_name: data.propertyName,
      },
      action_url: `/reviews/${data.reviewId}`,
      group_key: `review_${data.reviewId}`,
    };
  }

  static reviewReminder(data: {
    recipientId: string;
    propertyName: string;
    hostName: string;
    bookingId: string;
    checkOutDate: Date;
  }): CreateNotificationDto {
    return {
      recipient_id: data.recipientId,
      type: NotificationType.REVIEW_REMINDER,
      title: 'Leave a Review',
      body: `How was your stay at "${data.propertyName}" with ${data.hostName}? Share your experience with other travelers.`,
      priority: NotificationPriority.LOW,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        host_name: data.hostName,
      },
      action_url: `/bookings/${data.bookingId}/review`,
      group_key: `review_reminder_${data.bookingId}`,
      scheduled_at: DateUtils.toISO(
        DateUtils.create(data.checkOutDate.getTime() + 24 * 60 * 60 * 1000),
      ), // 24 hours after checkout
    };
  }

  /**
   * Payment-related notification templates
   */
  static paymentSuccessful(data: {
    recipientId: string;
    amount: number;
    currency: string;
    propertyName: string;
    bookingId: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.recipientId,
      type: NotificationType.PAYMENT_SUCCESSFUL,
      title: 'Payment Successful',
      body: `Your payment of ${data.currency} ${data.amount} for "${data.propertyName}" has been processed successfully.`,
      priority: NotificationPriority.HIGH,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        amount: data.amount,
        currency: data.currency,
      },
      action_url: `/bookings/${data.bookingId}`,
      group_key: `payment_${data.bookingId}`,
    };
  }

  static paymentFailed(data: {
    recipientId: string;
    amount: number;
    currency: string;
    propertyName: string;
    bookingId: string;
    reason?: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.recipientId,
      type: NotificationType.PAYMENT_FAILED,
      title: 'Payment Failed',
      body: `Your payment of ${data.currency} ${data.amount} for "${data.propertyName}" could not be processed.${data.reason ? ` Reason: ${data.reason}` : ''} Please try again.`,
      priority: NotificationPriority.URGENT,
      data: {
        booking_id: data.bookingId,
        property_name: data.propertyName,
        amount: data.amount,
        currency: data.currency,
      },
      action_url: `/bookings/${data.bookingId}/payment`,
      group_key: `payment_${data.bookingId}`,
    };
  }

  /**
   * Property-related notification templates
   */
  static propertyApproved(data: {
    hostId: string;
    propertyName: string;
    propertyId: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.hostId,
      type: NotificationType.PROPERTY_APPROVED,
      title: 'Property Approved!',
      body: `Congratulations! Your property "${data.propertyName}" has been approved and is now live on the platform.`,
      priority: NotificationPriority.HIGH,
      data: {
        property_id: data.propertyId,
        property_name: data.propertyName,
      },
      action_url: `/properties/${data.propertyId}`,
      group_key: `property_${data.propertyId}`,
    };
  }

  static propertyRejected(data: {
    hostId: string;
    propertyName: string;
    propertyId: string;
    reason?: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.hostId,
      type: NotificationType.PROPERTY_REJECTED,
      title: 'Property Needs Updates',
      body: `Your property "${data.propertyName}" needs some updates before it can go live.${data.reason ? ` Reason: ${data.reason}` : ''} Please review and resubmit.`,
      priority: NotificationPriority.HIGH,
      data: {
        property_id: data.propertyId,
        property_name: data.propertyName,
      },
      action_url: `/properties/${data.propertyId}/edit`,
      group_key: `property_${data.propertyId}`,
    };
  }

  /**
   * System notification templates
   */
  static welcome(data: { userId: string; userName: string }): CreateNotificationDto {
    return {
      recipient_id: data.userId,
      type: NotificationType.SYSTEM_UPDATE,
      title: `Welcome to Airbnb Clone, ${data.userName}!`,
      body: 'Thank you for joining us. Start exploring amazing places to stay or list your own property.',
      priority: NotificationPriority.NORMAL,
      action_url: '/explore',
    };
  }

  static accountVerified(data: { userId: string; userName: string }): CreateNotificationDto {
    return {
      recipient_id: data.userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'Account Verified!',
      body: `Great news, ${data.userName}! Your account has been verified. You can now book properties and start hosting.`,
      priority: NotificationPriority.HIGH,
      action_url: '/profile',
    };
  }

  static securityAlert(data: {
    userId: string;
    activity: string;
    location?: string;
  }): CreateNotificationDto {
    return {
      recipient_id: data.userId,
      type: NotificationType.SECURITY_ALERT,
      title: 'Security Alert',
      body: `We detected ${data.activity} on your account${data.location ? ` from ${data.location}` : ''}. If this wasn't you, please secure your account immediately.`,
      priority: NotificationPriority.URGENT,
      action_url: '/settings/security',
    };
  }
}
