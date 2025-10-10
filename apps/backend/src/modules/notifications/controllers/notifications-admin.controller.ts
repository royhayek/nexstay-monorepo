import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { NotificationsService } from '../notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  SingleNotificationResponseDto,
  BroadcastResultResponseDto,
  NotificationStatisticsResponseDto,
  AdminNotificationListResponseDto,
  NotificationDeleteResponseDto,
  DeviceTokenListResponseDto,
} from '../dto/notification-operation-response.dto';
import type { NotificationDocument } from '../../../database/schemas/notification.schema';

// Broadcast notification interfaces
interface BroadcastNotificationDto {
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
  targetAudience?: string[];
}

interface BroadcastResult {
  sentCount: number;
  failedCount: number;
  totalUsers: number;
}

interface NotificationStatistics {
  totalNotifications: number;
  readCount: number;
  unreadCount: number;
  typeBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  dateRange: { from?: string; to?: string };
}

/**
 * Admin Controller for Notifications
 * Handles administrative notification operations
 */
@Controller('admin/notifications')
@ApiTags('Notifications Management')
export class NotificationsAdminController extends BaseController {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  @Post()
  @AdminEndpoint(
    'Create a new notification (Admin/Moderator only)',
    'Create a new notification with administrative privileges',
    SingleNotificationResponseDto,
  )
  @ApiBody({ type: CreateNotificationDto })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<{ status: 'success'; message: string; data: NotificationDocument }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.notificationsService.create(createNotificationDto);
      },
      'Create notification',
      'Create New Notification',
      'Notification created successfully',
      'Failed to create notification',
    );
  }

  @Get('all')
  @AdminEndpoint(
    'Get all notifications with filtering (Admin only)',
    'Retrieve all notifications with comprehensive filtering and pagination for administrative management',
    AdminNotificationListResponseDto,
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
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by notification title or content',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by recipient user ID',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    type: Boolean,
    description: 'Filter by read status',
  })
  async getAllNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
  ): Promise<{ status: 'success'; message: string; data: unknown }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.notificationsService.findAllAdmin({
          page,
          limit: Math.min(limit, 100),
          search,
          type,
          userId,
        });

        const notifications = result.data.map((notification) => notification.toObject() as unknown);

        return {
          notifications,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get all notifications',
      'Admin Notifications List',
      'Notifications retrieved successfully',
      'Failed to retrieve notifications',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get notification by ID (Admin only)',
    'Retrieve detailed notification information by its unique ID',
    SingleNotificationResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async getNotificationById(
    @Param('id') id: string,
  ): Promise<{ status: 'success'; message: string; data: NotificationResponseDto }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const notification = await this.notificationsService.findById(id);
        return notification.toObject() as NotificationResponseDto;
      },
      'Get notification by ID',
      'Notification Details',
      'Notification retrieved successfully',
      'Failed to retrieve notification',
    );
  }

  @Delete(':id')
  @AdminEndpoint(
    'Delete notification (Admin only)',
    'Permanently delete a notification by its unique ID',
    NotificationDeleteResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.notificationsService.deleteByAdmin(id, String(adminUser._id));
        return { deleted: true };
      },
      'Delete notification',
      'Notification Deleted',
      'Notification deleted successfully',
      'Failed to delete notification',
    );
  }

  @Post('broadcast')
  @AdminEndpoint(
    'Send broadcast notification to all users (Admin only)',
    'Send targeted broadcast notifications to multiple users with filtering criteria',
    BroadcastResultResponseDto,
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Notification title' },
        message: { type: 'string', description: 'Notification message' },
        type: { type: 'string', description: 'Notification type' },
        data: { type: 'object', description: 'Additional data' },
        userFilters: {
          type: 'object',
          properties: {
            roles: { type: 'array', items: { type: 'string' } },
            countries: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
          description: 'User filtering criteria',
        },
      },
      required: ['title', 'message', 'type'],
    },
  })
  async sendBroadcast(
    @Body() broadcastDto: BroadcastNotificationDto,
  ): Promise<{ status: 'success'; message: string; data: BroadcastResult }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.notificationsService.sendBroadcastNotification(broadcastDto);
        const safeResult = result as BroadcastResult;
        return {
          sentCount: Number(safeResult.sentCount),
          failedCount: Number(safeResult.failedCount),
          totalUsers: Number(safeResult.totalUsers),
        };
      },
      'Send broadcast notification',
      'Broadcast Notification',
      'Broadcast notification sent successfully',
      'Failed to send broadcast notification',
    );
  }

  @Get('statistics/overview')
  @AdminEndpoint(
    'Get notification statistics overview (Admin only)',
    'Retrieve comprehensive notification statistics and analytics data',
    NotificationStatisticsResponseDto,
  )
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (YYYY-MM-DD)' })
  async getNotificationStatistics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<{ status: 'success'; message: string; data: NotificationStatistics }> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return (await this.notificationsService.getStatisticsAdmin({
          from,
          to,
        })) as NotificationStatistics;
      },
      'Get notification statistics',
      'Notification Analytics Overview',
      'Notification statistics retrieved successfully',
      'Failed to retrieve notification statistics',
    );
  }

  @Get('device-tokens/all')
  @AdminEndpoint(
    'Get all device tokens (Admin only)',
    'Retrieve all registered device tokens for push notification management',
    DeviceTokenListResponseDto,
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
    description: 'Items per page (default: 50, max: 100)',
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    type: String,
    description: 'Filter by platform (ios, android, web)',
  })
  async getAllDeviceTokens(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('platform') platform?: string,
  ): Promise<BaseResponseDto<any>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.notificationsService.getAllDeviceTokensAdmin({
          page,
          limit: Math.min(limit, 100),
          platform,
        });
      },
      'Get all device tokens',
      'Device Tokens Management',
      'Device tokens retrieved successfully',
      'Failed to retrieve device tokens',
    );
  }
}
