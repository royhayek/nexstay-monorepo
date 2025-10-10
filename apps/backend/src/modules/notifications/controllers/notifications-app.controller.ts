import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { NotificationsService } from '../notifications.service';
import { RegisterDeviceTokenDto } from '../dto/device-token.dto';
import {
  NotificationResponseDto,
  NotificationListResponseDto,
} from '../dto/notification-response.dto';
import { SuccessResponseDto } from '../dto/success-response.dto';
import type { NotificationDocument } from '../../../database/schemas/notification.schema';
import type {
  NotificationPreferences,
  PreferencesUpdateResult,
} from '../interfaces/notification.interfaces';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

/**
 * App Controller for Notifications
 * Handles notification operations for mobile app and website users
 */
@Controller('app/notifications')
@ApiTags('Notifications')
export class NotificationsAppController extends BaseController {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  @Get()
  @ProtectedEndpoint(
    'Get user notifications',
    'Retrieve paginated list of user notifications with optional filtering for unread only',
  )
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'unread_only',
    required: false,
    type: Boolean,
    description: 'Show only unread notifications (default: false)',
  })
  @ApiOkResponse({
    description: 'Notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async findAll(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unread_only', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ): Promise<NotificationListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.notificationsService.findByUserId(
          String(user._id),
          page,
          limit,
          unreadOnly,
        );
      },
      'Get user notifications',
      'Notifications Retrieved',
      'Notifications retrieved successfully',
      'Failed to retrieve notifications',
    );
  }

  @Put(':id/read')
  @ProtectedEndpoint('Mark notification as read', 'Mark a specific notification as read by its ID')
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiOkResponse({
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<BaseResponseDto<NotificationResponseDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const notification: NotificationDocument = await this.notificationsService.markAsRead(
          id,
          String(user._id),
        );
        return notification.toObject() as NotificationResponseDto;
      },
      'Mark notification as read',
      'Notification Marked as Read',
      'Notification marked as read successfully',
      'Failed to mark notification as read',
    );
  }

  @Put('mark-all-read')
  @ProtectedEndpoint(
    'Mark all notifications as read',
    'Mark all user notifications as read in a single operation',
  )
  @ApiOkResponse({
    description: 'All notifications marked as read',
    type: SuccessResponseDto,
  })
  async markAllAsRead(
    @CurrentUser() user: UserDocument,
  ): Promise<BaseResponseDto<{ modifiedCount: number }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.notificationsService.markAllAsRead(String(user._id));
        return { success: true, modifiedCount: result.modifiedCount };
      },
      'Mark all notifications as read',
      'All Notifications Marked as Read',
      'All notifications marked as read successfully',
      'Failed to mark all notifications as read',
    );
  }

  @Put('device-token')
  @ProtectedEndpoint(
    'Register device token for push notifications',
    'Register or update device token for Firebase Cloud Messaging push notifications',
  )
  @ApiOkResponse({
    description: 'Device token registered successfully',
    type: SuccessResponseDto,
  })
  async registerDeviceToken(
    @Body() deviceTokenDto: RegisterDeviceTokenDto,
    @CurrentUser() user: UserDocument,
  ): Promise<BaseResponseDto<{ success: boolean }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.notificationsService.registerDeviceToken(String(user._id), deviceTokenDto);
        return { success: true };
      },
      'Register device token',
      'Device Token Registered',
      'Device token registered successfully',
      'Failed to register device token',
    );
  }

  @Put('device-token/remove')
  @ProtectedEndpoint(
    'Remove device token',
    'Remove device token to stop receiving push notifications on the device',
  )
  @ApiOkResponse({
    description: 'Device token removed successfully',
    type: SuccessResponseDto,
  })
  async removeDeviceToken(
    @Body() body: { token: string },
    @CurrentUser() user: UserDocument,
  ): Promise<BaseResponseDto<{ success: boolean }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.notificationsService.removeDeviceToken(String(user._id), body.token);
        return { success: true };
      },
      'Remove device token',
      'Device Token Removed',
      'Device token removed successfully',
      'Failed to remove device token',
    );
  }

  @Get('unread-count')
  @ProtectedEndpoint(
    'Get unread notifications count',
    'Get the total count of unread notifications for the current user',
  )
  @ApiOkResponse({
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(
    @CurrentUser() user: UserDocument,
  ): Promise<{ status: 'success'; message: string; data: { unreadCount: number } }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const count = await this.notificationsService.getUnreadCount(String(user._id));
        return { unreadCount: count };
      },
      'Get unread count',
      'Unread Count Retrieved',
      'Unread count retrieved successfully',
      'Failed to retrieve unread count',
    );
  }

  @Get('preferences')
  @ProtectedEndpoint(
    'Get notification preferences',
    'Retrieve current notification preferences including push, marketing, and category settings',
  )
  @ApiOkResponse({
    description: 'Notification preferences retrieved successfully',
  })
  async getPreferences(
    @CurrentUser() user: UserDocument,
  ): Promise<{ status: 'success'; message: string; data: unknown }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return (await this.notificationsService.getNotificationPreferences(
          String(user._id),
        )) as unknown;
      },
      'Get notification preferences',
      'Preferences Retrieved',
      'Notification preferences retrieved successfully',
      'Failed to retrieve notification preferences',
    );
  }

  @Put('preferences')
  @ProtectedEndpoint(
    'Update notification preferences',
    'Update notification preferences for push notifications, marketing, and specific categories',
  )
  @ApiOkResponse({
    description: 'Notification preferences updated successfully',
  })
  async updatePreferences(
    @Body() preferences: NotificationPreferences,
    @CurrentUser() user: UserDocument,
  ): Promise<{ status: 'success'; message: string; data: PreferencesUpdateResult }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.notificationsService.updateNotificationPreferences(
          String(user._id),
          preferences,
        );
      },
      'Update notification preferences',
      'Preferences Updated',
      'Notification preferences updated successfully',
      'Failed to update notification preferences',
    );
  }
}
