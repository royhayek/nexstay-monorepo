import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../../../common/enums/notification.enums';

export class NotificationDataResponseDto {
  @ApiPropertyOptional({ description: 'Related booking ID' })
  booking_id?: string;

  @ApiPropertyOptional({ description: 'Related property ID' })
  property_id?: string;

  @ApiPropertyOptional({ description: 'Related review ID' })
  review_id?: string;

  @ApiPropertyOptional({ description: 'Related message ID' })
  message_id?: string;

  @ApiPropertyOptional({ description: 'Amount for payment notifications' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Currency for payment notifications' })
  currency?: string;

  @ApiPropertyOptional({ description: 'Property name' })
  property_name?: string;

  @ApiPropertyOptional({ description: 'Guest name' })
  guest_name?: string;

  @ApiPropertyOptional({ description: 'Host name' })
  host_name?: string;

  @ApiPropertyOptional({ description: 'Check-in date' })
  check_in_date?: Date;

  @ApiPropertyOptional({ description: 'Check-out date' })
  check_out_date?: Date;

  @ApiPropertyOptional({ description: 'Booking confirmation code' })
  confirmation_code?: string;

  @ApiPropertyOptional({ description: 'Additional custom data' })
  custom_data?: Record<string, string>;
}

export class NotificationDeliveryResponseDto {
  @ApiProperty({ description: 'Delivery channel', enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty({ description: 'Delivery status', enum: NotificationStatus })
  status: NotificationStatus;

  @ApiPropertyOptional({ description: 'Sent timestamp' })
  sent_at?: Date;

  @ApiPropertyOptional({ description: 'Delivered timestamp' })
  delivered_at?: Date;

  @ApiPropertyOptional({ description: 'Read timestamp' })
  read_at?: Date;

  @ApiPropertyOptional({ description: 'Failed timestamp' })
  failed_at?: Date;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error_message?: string;

  @ApiPropertyOptional({ description: 'External delivery ID' })
  external_id?: string;
}

export class NotificationDataDto {
  @ApiProperty({ description: 'Notification ID' })
  _id: string;

  @ApiProperty({ description: 'Recipient user ID' })
  recipient_id: string;

  @ApiPropertyOptional({ description: 'Sender user ID' })
  sender_id?: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification body' })
  body: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  image_url?: string;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  data?: NotificationDataResponseDto;

  @ApiProperty({ description: 'Notification priority', enum: NotificationPriority })
  priority: NotificationPriority;

  @ApiProperty({
    description: 'Delivery attempts',
    type: [NotificationDeliveryResponseDto],
  })
  deliveries: NotificationDeliveryResponseDto[];

  @ApiProperty({ description: 'Is notification read' })
  is_read: boolean;

  @ApiPropertyOptional({ description: 'Read timestamp' })
  read_at?: Date;

  @ApiProperty({ description: 'Is silent notification' })
  is_silent: boolean;

  @ApiPropertyOptional({ description: 'Scheduled delivery time' })
  scheduled_at?: Date;

  @ApiPropertyOptional({ description: 'Expiration time' })
  expires_at?: Date;

  @ApiProperty({ description: 'Is notification active' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Action URL' })
  action_url?: string;

  @ApiPropertyOptional({ description: 'Group key' })
  group_key?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class NotificationListDataDto {
  @ApiProperty({
    description: 'List of notifications',
    type: [NotificationDataDto],
  })
  notifications: NotificationDataDto[];

  @ApiProperty({ description: 'Total number of notifications' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of notifications per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  pages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;

  @ApiProperty({ description: 'Number of unread notifications' })
  unread_count: number;
}

export class NotificationListResponseDto extends BaseResponseDto<NotificationListDataDto> {
  @ApiProperty({
    description: 'Notification list response data',
    type: NotificationListDataDto,
  })
  declare data: NotificationListDataDto;
}

export class NotificationResponseDto extends BaseResponseDto<NotificationDataDto> {
  @ApiProperty({
    description: 'Notification response data',
    type: NotificationDataDto,
  })
  declare data: NotificationDataDto;
}
