import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { NotificationResponseDto } from './notification-response.dto';

/**
 * Data DTOs for notification operations
 */

export class UnreadCountDataDto {
  @ApiProperty({ description: 'Number of unread notifications', example: 5 })
  unreadCount: number;
}

export class NotificationUpdateDataDto {
  @ApiProperty({ description: 'Update operation result', example: 'success' })
  result: unknown;
}

export class PreferencesUpdateResultDto {
  @ApiProperty({ description: 'Updated preferences', example: { email: true, push: false } })
  preferences: Record<string, boolean>;

  @ApiProperty({ description: 'Update status', example: 'success' })
  status: string;
}

export class BroadcastResultDto {
  @ApiProperty({ description: 'Number of successfully sent notifications', example: 145 })
  sentCount: number;

  @ApiProperty({ description: 'Number of failed notifications', example: 5 })
  failedCount: number;

  @ApiProperty({ description: 'Total number of users targeted', example: 150 })
  totalUsers: number;
}

export class NotificationStatisticsDto {
  @ApiProperty({ description: 'Total notifications', example: 5000 })
  totalNotifications: number;

  @ApiProperty({ description: 'Total read notifications', example: 4500 })
  readCount: number;

  @ApiProperty({ description: 'Total unread notifications', example: 500 })
  unreadCount: number;

  @ApiProperty({
    description: 'Notifications breakdown by type',
    example: { booking: 300, message: 200, system: 100 },
  })
  typeBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Notifications breakdown by status',
    example: { read: 4500, unread: 500 },
  })
  statusBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Date range for statistics',
    example: { from: '2024-01-01', to: '2024-01-31' },
  })
  dateRange: { from?: string; to?: string };
}

export class AdminNotificationListDataDto {
  @ApiProperty({
    description: 'Array of notifications',
    type: [Object],
  })
  notifications: unknown[];

  @ApiProperty({ description: 'Total number of notifications', example: 250 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 13 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

export class NotificationDeleteDataDto {
  @ApiProperty({
    description: 'Indicates if the delete operation was successful',
    example: true,
  })
  deleted: boolean;
}

export class DeviceTokenDataDto {
  @ApiProperty({ description: 'Device token ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439012' })
  userId: string;

  @ApiProperty({
    description: 'Device token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  token: string;

  @ApiProperty({ description: 'Platform type', example: 'ios' })
  platform: string;

  @ApiProperty({ description: 'Device name', example: 'iPhone 12' })
  deviceName?: string;

  @ApiProperty({ description: 'Is token active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last updated date', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class DeviceTokenListDataDto {
  @ApiProperty({ description: 'Array of device tokens', type: [DeviceTokenDataDto] })
  tokens: DeviceTokenDataDto[];

  @ApiProperty({ description: 'Total number of tokens', example: 250 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 50 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

/**
 * Response DTOs for notification operations
 */

// Unread count response
export class UnreadCountResponseDto extends BaseResponseDto<UnreadCountDataDto> {
  @ApiProperty({ type: UnreadCountDataDto })
  declare data: UnreadCountDataDto;
}

// Notification update response
export class NotificationUpdateResponseDto extends BaseResponseDto<NotificationUpdateDataDto> {
  @ApiProperty({ type: NotificationUpdateDataDto })
  declare data: NotificationUpdateDataDto;
}

// Preferences update response
export class PreferencesUpdateResponseDto extends BaseResponseDto<PreferencesUpdateResultDto> {
  @ApiProperty({ type: PreferencesUpdateResultDto })
  declare data: PreferencesUpdateResultDto;
}

// Single notification response
export class SingleNotificationResponseDto extends BaseResponseDto<NotificationResponseDto> {
  @ApiProperty({ type: NotificationResponseDto })
  declare data: NotificationResponseDto;
}

// Broadcast result response
export class BroadcastResultResponseDto extends BaseResponseDto<BroadcastResultDto> {
  @ApiProperty({ type: BroadcastResultDto })
  declare data: BroadcastResultDto;
}

// Notification statistics response
export class NotificationStatisticsResponseDto extends BaseResponseDto<NotificationStatisticsDto> {
  @ApiProperty({ type: NotificationStatisticsDto })
  declare data: NotificationStatisticsDto;
}

// Notification delete response
export class NotificationDeleteResponseDto extends BaseResponseDto<NotificationDeleteDataDto> {
  @ApiProperty({ type: NotificationDeleteDataDto })
  declare data: NotificationDeleteDataDto;
}

// Device token list response
export class DeviceTokenListResponseDto extends BaseResponseDto<DeviceTokenListDataDto> {
  @ApiProperty({ type: DeviceTokenListDataDto })
  declare data: DeviceTokenListDataDto;
}

// Admin notification list response
export class AdminNotificationListResponseDto extends BaseResponseDto<AdminNotificationListDataDto> {
  @ApiProperty({ type: AdminNotificationListDataDto })
  declare data: AdminNotificationListDataDto;
}
