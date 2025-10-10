import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import { Model } from 'mongoose';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { LoggingUtil } from '../../common/utils/logging.util';
import { JsonUtils } from '../../common/utils/json.utils';

import { MailService } from '../../common/services/mail.service';
import { SmsService } from '../../common/services/sms.service';
import {
  DevicePlatform,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '../../common/enums/notification.enums';
import { DeviceToken, DeviceTokenDocument } from '../../database/schemas/device-token.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import { UserDocument } from '../../database/schemas/user.schema';
import { UsersFacadeService } from '../users/services/users-facade.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto, UpdateDeviceTokenDto } from './dto/device-token.dto';
import { NotificationDataDto, NotificationListDataDto } from './dto/notification-response.dto';
import { EmailTemplateConfig } from './interfaces/email-template.interface';
import { NotificationDeliveryUpdate } from './interfaces/notification-filter.interface';
import { FirebaseMessage, FirebaseResponse, FirebaseService } from './services/firebase.service';
import { PreferencesUpdateResult } from './interfaces/notification.interfaces';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name)
    private readonly deviceTokenModel: Model<DeviceTokenDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly usersService: UsersFacadeService,
  ) {}

  /**
   * Create and send a notification
   */
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    try {
      // Create notification in database
      const notification = new this.notificationModel({
        ...dto,
        deliveries: [],
        is_read: false,
        is_active: true,
      });

      const savedNotification = await notification.save();

      // Send notification if not scheduled
      if (!dto.scheduled_at || DateUtils.create(dto.scheduled_at) <= DateUtils.now()) {
        await this.sendNotification(savedNotification);
      }

      LoggingUtil.log(
        `Notification created with ID: ${String(savedNotification._id)}`,
        'NotificationsService',
      );
      return savedNotification;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to create notification',
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to create notification');
    }
  }

  /**
   * Send a notification through specified channels
   */
  async sendNotification(notification: NotificationDocument): Promise<void> {
    const channels = notification.deliveries?.map((d) => d.channel) || [NotificationChannel.EMAIL];

    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.PUSH:
            await this.sendPushNotification(notification);
            break;
          case NotificationChannel.EMAIL:
            await this.sendEmailNotification(notification);
            break;
          case NotificationChannel.SMS:
            await this.sendSmsNotification(notification);
            break;
          case NotificationChannel.IN_APP:
            // In-app notifications are handled by storing in database
            await this.markDeliveryStatus(
              String(notification._id),
              channel,
              NotificationStatus.SENT,
            );
            break;
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to send notification via ${channel}`,
          error,
          'NotificationsService',
        );
        await this.markDeliveryStatus(
          String(notification._id),
          channel,
          NotificationStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }
  }

  /**
   * Send push notification via Firebase
   */
  private async sendPushNotification(notification: NotificationDocument): Promise<void> {
    if (!this.firebaseService.isInitialized()) {
      throw new Error('Firebase service not initialized');
    }

    // Get user's device tokens
    const notificationTypeFilter = this.getNotificationTypeFilter(notification.type);
    const deviceTokens = await this.deviceTokenModel
      .find({
        user_id: notification.recipient_id,
        is_active: true,
        push_enabled: true,
        ...notificationTypeFilter,
      })
      .exec();

    if (deviceTokens.length === 0) {
      LoggingUtil.warn(
        `No active device tokens found for user ${String(notification.recipient_id)}`,
        'NotificationsService',
      );
      return;
    }

    const tokens = deviceTokens.map((dt) => dt.token);
    const data = this.buildNotificationData(notification);

    const message: FirebaseMessage = {
      token: tokens[0], // Will handle multicast separately
      title: notification.title,
      body: notification.body,
      imageUrl: notification.image_url,
      data,
      priority: notification.priority,
      isSilent: notification.is_silent,
      actionUrl: notification.action_url,
    };

    if (tokens.length === 1) {
      const response = await this.firebaseService.sendToDevice(message);
      await this.handleFirebaseResponse(String(notification._id), response);
    } else {
      const multicastMessage = {
        ...message,
        tokens,
      };
      const response = await this.firebaseService.sendToMultipleDevices(multicastMessage);
      await this.handleFirebaseResponse(String(notification._id), response);
    }

    // Update device token last_used_at
    await this.deviceTokenModel
      .updateMany({ token: { $in: tokens } }, { last_used_at: DateUtils.now() })
      .exec();
  }

  /**
   * Send email notification using the existing mail service
   */
  private async sendEmailNotification(notification: NotificationDocument): Promise<void> {
    try {
      // Get user email
      const user = await this.usersService.findById(String(notification.recipient_id));
      if (!user.email) {
        LoggingUtil.warn(
          `No email found for user ${String(notification.recipient_id)}`,
          'NotificationsService',
        );
        await this.markDeliveryStatus(
          String(notification._id),
          NotificationChannel.EMAIL,
          NotificationStatus.FAILED,
          'No email address found for user',
        );
        return;
      }

      // Determine template and context based on notification type
      const { templateName, context } = this.getEmailTemplateAndContext(notification, user);

      // Send email using the appropriate template
      await this.mailService.send(user.email, notification.title, templateName, context);

      await this.markDeliveryStatus(
        String(notification._id),
        NotificationChannel.EMAIL,
        NotificationStatus.SENT,
      );

      LoggingUtil.log(`Email notification sent to ${user.email}`, 'NotificationsService');
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send email notification',
        error,
        'NotificationsService',
      );
      await this.markDeliveryStatus(
        String(notification._id),
        NotificationChannel.EMAIL,
        NotificationStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Send SMS notification using the existing SMS service
   */
  private async sendSmsNotification(notification: NotificationDocument): Promise<void> {
    try {
      // Get user phone
      const user = await this.usersService.findById(String(notification.recipient_id));
      if (!user.phone) {
        LoggingUtil.warn(
          `No phone found for user ${String(notification.recipient_id)}`,
          'NotificationsService',
        );
        await this.markDeliveryStatus(
          String(notification._id),
          NotificationChannel.SMS,
          NotificationStatus.FAILED,
          'No phone number found for user',
        );
        return;
      }

      // Create SMS message
      const message = `${notification.title}\n\n${notification.body}${
        notification.action_url ? `\n\nView details: ${notification.action_url}` : ''
      }`;

      // Send SMS
      await this.smsService.send(user.phone, message);

      await this.markDeliveryStatus(
        String(notification._id),
        NotificationChannel.SMS,
        NotificationStatus.SENT,
      );

      LoggingUtil.log(`SMS notification sent to ${user.phone}`, 'NotificationsService');
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to send SMS notification',
        error,
        'NotificationsService',
      );
      await this.markDeliveryStatus(
        String(notification._id),
        NotificationChannel.SMS,
        NotificationStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Get notifications for a user
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<NotificationListDataDto> {
    try {
      const {
        page: validPage,
        limit: validLimit,
        skip,
      } = validatePagination({
        page,
        limit,
        maxLimit: 100,
      });

      const queryBuilder = QueryBuilder.create()
        .addStringFilter('recipient_id', userId)
        .addBooleanFilter('is_active', true);

      if (unreadOnly) {
        queryBuilder.addBooleanFilter('is_read', false);
      }

      const filter = queryBuilder.build();

      const [notifications, total, unreadCount] = await Promise.all([
        this.notificationModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validLimit)
          .exec(),
        this.notificationModel.countDocuments(filter).exec(),
        this.notificationModel
          .countDocuments({
            recipient_id: userId,
            is_read: false,
            is_active: true,
          })
          .exec(),
      ]);

      const paginationResult = buildPaginatedResult(notifications, total, validPage, validLimit);

      return {
        notifications: paginationResult.data.map((n) => this.mapToResponseDto(n)),
        total: paginationResult.total,
        page: paginationResult.page,
        limit: paginationResult.limit,
        pages: paginationResult.totalPages,
        hasNext: paginationResult.hasNextPage,
        hasPrev: paginationResult.hasPrevPage,
        unread_count: unreadCount,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to fetch notifications for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    try {
      const notification = await this.notificationModel
        .findOneAndUpdate(
          {
            _id: notificationId,
            recipient_id: userId,
            is_active: true,
          },
          {
            is_read: true,
            read_at: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return notification;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Failed to mark notification ${notificationId} as read`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to update notification');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      const result = await this.notificationModel
        .updateMany(
          {
            recipient_id: userId,
            is_read: false,
            is_active: true,
          },
          {
            is_read: true,
            read_at: DateUtils.now(),
          },
        )
        .exec();

      return { modifiedCount: result.modifiedCount };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to mark all notifications as read for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to update notifications');
    }
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenDocument> {
    try {
      // Validate Firebase token if it's a push token
      if (dto.platform !== DevicePlatform.WEB && this.firebaseService.isInitialized()) {
        const isValid = await this.firebaseService.validateToken(dto.token);
        if (!isValid) {
          throw new BadRequestException('Invalid Firebase token');
        }
      }

      // Update existing token or create new one
      const deviceToken = await this.deviceTokenModel
        .findOneAndUpdate(
          { token: dto.token },
          {
            user_id: userId,
            ...dto,
            last_used_at: DateUtils.now(),
            is_active: true,
          },
          { upsert: true, new: true },
        )
        .exec();

      LoggingUtil.log(`Device token registered for user ${userId}`, 'NotificationsService');
      return deviceToken;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Failed to register device token for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to register device token');
    }
  }

  /**
   * Update device token preferences
   */
  async updateDeviceToken(
    tokenId: string,
    userId: string,
    dto: UpdateDeviceTokenDto,
  ): Promise<DeviceTokenDocument> {
    try {
      const deviceToken = await this.deviceTokenModel
        .findOneAndUpdate(
          { _id: tokenId, user_id: userId },
          { ...dto, last_used_at: DateUtils.now() },
          { new: true },
        )
        .exec();

      if (!deviceToken) {
        throw new NotFoundException('Device token not found');
      }

      return deviceToken;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Failed to update device token ${tokenId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to update device token');
    }
  }

  /**
   * Remove device token
   */
  async removeDeviceToken(tokenId: string, userId: string): Promise<void> {
    try {
      const result = await this.deviceTokenModel
        .deleteOne({ _id: tokenId, user_id: userId })
        .exec();

      if (result.deletedCount === 0) {
        throw new NotFoundException('Device token not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Failed to remove device token ${tokenId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to remove device token');
    }
  }

  /**
   * Get user's device tokens
   */
  async getUserDeviceTokens(userId: string): Promise<DeviceTokenDocument[]> {
    try {
      return await this.deviceTokenModel
        .find({ user_id: userId, is_active: true })
        .sort({ last_used_at: -1 })
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to fetch device tokens for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch device tokens');
    }
  }

  /**
   * Helper methods
   */
  private async markDeliveryStatus(
    notificationId: string,
    channel: NotificationChannel,
    status: NotificationStatus,
    error?: string,
  ): Promise<void> {
    const updateData: NotificationDeliveryUpdate = {
      'deliveries.$.status': status,
    };

    switch (status) {
      case NotificationStatus.SENT:
        updateData['deliveries.$.sent_at'] = DateUtils.now();
        break;
      case NotificationStatus.DELIVERED:
        updateData['deliveries.$.delivered_at'] = DateUtils.now();
        break;
      case NotificationStatus.FAILED:
        updateData['deliveries.$.failed_at'] = DateUtils.now();
        if (error) {
          updateData['deliveries.$.error_message'] = error;
        }
        break;
    }

    await this.notificationModel
      .updateOne({ _id: notificationId, 'deliveries.channel': channel }, updateData)
      .exec();
  }

  private async handleFirebaseResponse(
    notificationId: string,
    response: FirebaseResponse,
  ): Promise<void> {
    if (response.success) {
      await this.markDeliveryStatus(
        notificationId,
        NotificationChannel.PUSH,
        NotificationStatus.SENT,
      );
    } else {
      await this.markDeliveryStatus(
        notificationId,
        NotificationChannel.PUSH,
        NotificationStatus.FAILED,
        response.error,
      );
    }
  }

  private buildNotificationData(notification: NotificationDocument): Record<string, string> {
    const data: Record<string, string> = {
      notification_id: String(notification._id),
      type: notification.type,
    };

    if (notification.data) {
      Object.keys(notification.data).forEach((key) => {
        const notificationData = notification.data;
        if (notificationData && key in notificationData) {
          const value = notificationData[key as keyof typeof notificationData];
          if (value !== null && value !== undefined) {
            data[key] = typeof value === 'object' ? JsonUtils.safeStringify(value) : String(value);
          }
        }
      });
    }

    return data;
  }

  private getNotificationTypeFilter(type: NotificationType): Record<string, boolean> {
    const typeFilters: Record<string, Record<string, boolean>> = {
      [NotificationType.BOOKING_REQUEST]: { booking_notifications: true },
      [NotificationType.BOOKING_CONFIRMED]: { booking_notifications: true },
      [NotificationType.BOOKING_CANCELLED]: { booking_notifications: true },
      [NotificationType.REVIEW_RECEIVED]: { review_notifications: true },
      [NotificationType.NEW_MESSAGE]: { message_notifications: true },
      [NotificationType.PAYMENT_SUCCESSFUL]: { payment_notifications: true },
      [NotificationType.PAYMENT_FAILED]: { payment_notifications: true },
      [NotificationType.PROMOTIONAL]: { marketing_enabled: true },
    };

    return typeFilters[type] || {};
  }

  private getEmailTemplateAndContext(
    notification: NotificationDocument,
    user: UserDocument,
  ): EmailTemplateConfig {
    const baseContext = {
      title: notification.title,
      body: notification.body,
      actionUrl: notification.action_url,
      userName: user.firstName || 'User',
    };

    // Add notification data to context if available
    const notificationData = notification.data || {};

    switch (notification.type) {
      case NotificationType.BOOKING_CONFIRMED:
        return {
          templateName: 'booking-confirmation',
          context: {
            ...baseContext,
            guestName: user.firstName || 'Guest',
            propertyName: notificationData.property_name,
            checkInDate: notificationData.check_in_date
              ? DateUtils.create(notificationData.check_in_date).toLocaleDateString()
              : '',
            checkOutDate: notificationData.check_out_date
              ? DateUtils.create(notificationData.check_out_date).toLocaleDateString()
              : '',
            confirmationCode: notificationData.confirmation_code,
            hostName: notificationData.host_name,
          },
        };

      case NotificationType.BOOKING_REQUEST:
        return {
          templateName: 'booking-request',
          context: {
            ...baseContext,
            hostName: user.firstName || 'Host',
            guestName: notificationData.guest_name,
            propertyName: notificationData.property_name,
            checkInDate: notificationData.check_in_date
              ? DateUtils.create(notificationData.check_in_date).toLocaleDateString()
              : '',
            checkOutDate: notificationData.check_out_date
              ? DateUtils.create(notificationData.check_out_date).toLocaleDateString()
              : '',
            totalAmount: notificationData.amount,
            currency: notificationData.currency || '$',
          },
        };

      case NotificationType.BOOKING_CANCELLED:
        return {
          templateName: 'booking-cancellation',
          context: {
            ...baseContext,
            recipientName: user.firstName || 'User',
            senderName: notificationData.guest_name || notificationData.host_name || 'User',
            propertyName: notificationData.property_name,
            checkInDate: notificationData.check_in_date
              ? DateUtils.create(notificationData.check_in_date).toLocaleDateString()
              : '',
            checkOutDate: notificationData.check_out_date
              ? DateUtils.create(notificationData.check_out_date).toLocaleDateString()
              : '',
            reason: notificationData.reason,
          },
        };

      case NotificationType.CHECK_IN_REMINDER:
        return {
          templateName: 'check-in-reminder',
          context: {
            ...baseContext,
            guestName: user.firstName || 'Guest',
            propertyName: notificationData.property_name,
            checkInDate: notificationData.check_in_date
              ? DateUtils.create(notificationData.check_in_date).toLocaleDateString()
              : '',
            hostName: notificationData.host_name,
            confirmationCode: notificationData.confirmation_code,
          },
        };

      case NotificationType.REVIEW_RECEIVED:
        return {
          templateName: 'review-received',
          context: {
            ...baseContext,
            hostName: user.firstName || 'Host',
            guestName: notificationData.guest_name,
            propertyName: notificationData.property_name,
            reviewText: notificationData.review_text,
            rating: notificationData.rating,
          },
        };

      case NotificationType.WELCOME:
        return {
          templateName: 'welcome',
          context: {
            ...baseContext,
            userName: user.firstName || 'User',
          },
        };

      default:
        // Use generic notification template for other types
        return {
          templateName: 'notification',
          context: baseContext,
        };
    }
  }

  private mapToResponseDto(notification: NotificationDocument): NotificationDataDto {
    return {
      _id: String(String(notification._id)),
      recipient_id: String(notification.recipient_id),
      sender_id: notification.sender_id ? String(notification.sender_id) : undefined,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      image_url: notification.image_url,
      data: notification.data
        ? {
            ...notification.data,
            custom_data: notification.data.custom_data
              ? Object.fromEntries(notification.data.custom_data)
              : undefined,
          }
        : undefined,
      priority: notification.priority,
      deliveries: notification.deliveries || [],
      is_read: notification.is_read,
      read_at: notification.read_at,
      is_silent: notification.is_silent,
      scheduled_at: notification.scheduled_at,
      expires_at: notification.expires_at,
      is_active: notification.is_active,
      action_url: notification.action_url,
      group_key: notification.group_key,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  // Admin methods
  async findAllAdmin(filters: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    status?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    data: NotificationDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const {
        page: pageInput,
        limit: limitInput,
        search,
        type,
        status,
        userId,
        fromDate,
        toDate,
      } = filters;
      const { page, limit, skip } = validatePagination({
        page: pageInput,
        limit: limitInput,
        maxLimit: 100,
      });

      // Build query using QueryBuilder
      const queryBuilder = QueryBuilder.create()
        .addEnumFilter('type', type)
        .addEnumFilter('status', status)
        .addStringFilter('user_id', userId)
        .addDateRangeFilter('createdAt', fromDate, toDate)
        .addSearchFilter(search, {
          fields: ['title', 'message'],
          caseSensitive: false,
          exactMatch: false,
        });

      const query = queryBuilder.build();

      const [notifications, total] = await Promise.all([
        this.notificationModel
          .find(query)
          .populate('recipient', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.notificationModel.countDocuments(query).exec(),
      ]);

      return buildPaginatedResult(notifications, total, page, limit);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching notifications for admin',
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async findById(id: string): Promise<NotificationDocument> {
    if (!id) {
      throw new BadRequestException('Notification ID must be provided');
    }

    try {
      const notification = await this.notificationModel
        .findById(id)
        .populate('recipient', 'firstName lastName email')
        .exec();

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return notification;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error fetching notification ${id}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch notification');
    }
  }

  async deleteByAdmin(id: string, adminUserId: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('Notification ID must be provided');
    }

    try {
      const result = await this.notificationModel.findByIdAndDelete(id).exec();

      if (!result) {
        throw new NotFoundException('Notification not found');
      }

      LoggingUtil.log(`Notification ${id} deleted by admin ${adminUserId}`, 'NotificationsService');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error deleting notification ${id}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to delete notification');
    }
  }

  async sendBroadcastNotification(broadcastDto: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, unknown>;
    targetAudience?: string[];
  }): Promise<{ sentCount: number; failedCount: number; totalUsers: number }> {
    try {
      const { title, message, type, data, targetAudience } = broadcastDto;

      // Get target users
      let users: UserDocument[] = [];
      if (targetAudience && targetAudience.length > 0) {
        users = await this.usersService.findUsersByRoles(targetAudience);
      } else {
        users = await this.usersService.findActiveUsers();
      }

      // Send notifications to all target users
      const notifications = await Promise.allSettled(
        users.map((user: UserDocument) =>
          this.create({
            recipient_id: String(user._id),
            type: type as NotificationType,
            title,
            body: message,
            data: data as Record<string, any>,
          } as CreateNotificationDto),
        ),
      );

      const successCount = notifications.filter((result) => result.status === 'fulfilled').length;
      const failureCount = notifications.filter((result) => result.status === 'rejected').length;

      return {
        totalUsers: users.length,
        sentCount: successCount,
        failedCount: failureCount,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error sending broadcast notification',
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to send broadcast notification');
    }
  }

  async getStatisticsAdmin(filters: { from?: string; to?: string }): Promise<{
    totalNotifications: number;
    readCount: number;
    unreadCount: number;
    typeBreakdown: Record<string, number>;
    statusBreakdown: Record<string, number>;
    dateRange: { from?: string; to?: string };
  }> {
    try {
      const { from, to } = filters;

      // Build date filter
      const dateFilter: Record<string, any> = {};
      if (from || to) {
        const dateQuery: Record<string, Date> = {};
        if (from) {
          dateQuery.$gte = DateUtils.create(from);
        }
        if (to) {
          dateQuery.$lte = DateUtils.create(to);
        }
        dateFilter.createdAt = dateQuery;
      }

      // Aggregate notification statistics
      const stats = await this.notificationModel
        .aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalNotifications: { $sum: 1 },
              readCount: { $sum: { $cond: [{ $eq: ['$is_read', true] }, 1, 0] } },
              unreadCount: { $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] } },
            },
          },
        ])
        .exec();

      // Count by type
      const typeCounts = await this.notificationModel
        .aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ])
        .exec();

      // Count by status
      const statusCounts = await this.notificationModel
        .aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ])
        .exec();

      return {
        totalNotifications: Number(
          (stats[0] as { totalNotifications?: number })?.totalNotifications || 0,
        ),
        readCount: Number((stats[0] as { readCount?: number })?.readCount || 0),
        unreadCount: Number((stats[0] as { unreadCount?: number })?.unreadCount || 0),
        typeBreakdown: (typeCounts as Array<{ _id: string; count: number }>).reduce(
          (acc: Record<string, number>, item) => {
            acc[String(item._id)] = Number(item.count);
            return acc;
          },
          {} as Record<string, number>,
        ),
        statusBreakdown: (statusCounts as Array<{ _id: string; count: number }>).reduce(
          (acc: Record<string, number>, item) => {
            acc[String(item._id)] = Number(item.count);
            return acc;
          },
          {} as Record<string, number>,
        ),
        dateRange: { from, to },
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching notification statistics',
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch notification statistics');
    }
  }

  async getAllDeviceTokensAdmin(filters: {
    page: number;
    limit: number;
    platform?: string;
    userId?: string;
  }): Promise<{
    data: DeviceTokenDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const { page: pageInput, limit: limitInput, platform, userId } = filters;
      const { page, limit, skip } = validatePagination({
        page: pageInput,
        limit: limitInput,
        maxLimit: 100,
      });

      // Build query using QueryBuilder
      const query = QueryBuilder.create()
        .addEnumFilter('platform', platform)
        .addStringFilter('user_id', userId)
        .build();

      const [deviceTokens, total] = await Promise.all([
        this.deviceTokenModel
          .find(query)
          .populate('recipient', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.deviceTokenModel.countDocuments(query).exec(),
      ]);

      return buildPaginatedResult(deviceTokens, total, page, limit);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching device tokens for admin',
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to fetch device tokens');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationModel
        .countDocuments({
          user_id: userId,
          is_read: false,
        })
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting unread count for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to get unread count');
    }
  }

  async getNotificationPreferences(userId: string): Promise<{
    pushEnabled: boolean;
    marketingEnabled: boolean;
    bookingNotifications: boolean;
    reviewNotifications: boolean;
    messageNotifications: boolean;
    paymentNotifications: boolean;
    deviceCount: number;
  }> {
    try {
      // Get user's device tokens with preferences
      const deviceTokens = await this.deviceTokenModel
        .find({ user_id: userId, is_active: true })
        .exec();

      // Return aggregated preferences
      return {
        pushEnabled: deviceTokens.some((token) => token.push_enabled),
        marketingEnabled: deviceTokens.some((token) => token.marketing_enabled),
        bookingNotifications: deviceTokens.some((token) => token.booking_notifications),
        reviewNotifications: deviceTokens.some((token) => token.review_notifications),
        messageNotifications: deviceTokens.some((token) => token.message_notifications),
        paymentNotifications: deviceTokens.some((token) => token.payment_notifications),
        deviceCount: deviceTokens.length,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting notification preferences for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to get notification preferences');
    }
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      pushEnabled?: boolean;
      marketingEnabled?: boolean;
      bookingNotifications?: boolean;
      reviewNotifications?: boolean;
      messageNotifications?: boolean;
      paymentNotifications?: boolean;
    },
  ): Promise<PreferencesUpdateResult> {
    try {
      // Update all device tokens for the user
      await this.deviceTokenModel
        .updateMany(
          { user_id: userId, is_active: true },
          {
            $set: {
              push_enabled: preferences.pushEnabled,
              marketing_enabled: preferences.marketingEnabled,
              booking_notifications: preferences.bookingNotifications,
              review_notifications: preferences.reviewNotifications,
              message_notifications: preferences.messageNotifications,
              payment_notifications: preferences.paymentNotifications,
              updatedAt: DateUtils.now(),
            },
          },
        )
        .exec();

      return {
        message: 'Notification preferences updated successfully',
        preferences,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating notification preferences for user ${userId}`,
        error,
        'NotificationsService',
      );
      throw new InternalServerErrorException('Failed to update notification preferences');
    }
  }
}
