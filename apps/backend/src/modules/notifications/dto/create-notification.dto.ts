import { Type } from 'class-transformer';
import { ValidateNested, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsUuidField,
  IsEnumField,
  IsNameField,
  IsUrlField,
  IsPriceField,
  IsCurrencyCodeField,
  IsDateField,
  IsTextAreaField,
  IsRatingField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';

import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../../../common/enums/notification.enums';

export class NotificationDataDto {
  @IsUuidField({
    description: 'Related booking ID',
    example: '507f1f77bcf86cd799439011',
  })
  booking_id?: string;

  @IsUuidField({
    description: 'Related property ID',
    example: '507f1f77bcf86cd799439012',
  })
  property_id?: string;

  @IsUuidField({
    description: 'Related review ID',
    example: '507f1f77bcf86cd799439013',
  })
  review_id?: string;

  @IsUuidField({
    description: 'Related message ID',
    example: '507f1f77bcf86cd799439014',
  })
  message_id?: string;

  @IsPriceField({
    description: 'Amount for payment notifications',
    example: 299.99,
    minValue: 0,
  })
  amount?: number;

  @IsCurrencyCodeField({
    description: 'Currency for payment notifications',
    example: 'USD',
  })
  currency?: string;

  @IsNameField({
    description: 'Property name',
    example: 'Cozy Downtown Apartment',
  })
  property_name?: string;

  @IsNameField({
    description: 'Guest name',
    example: 'John Smith',
  })
  guest_name?: string;

  @IsNameField({
    description: 'Host name',
    example: 'Jane Doe',
  })
  host_name?: string;

  @IsDateField({
    description: 'Check-in date',
    example: '2024-01-15',
  })
  check_in_date?: string;

  @IsDateField({
    description: 'Check-out date',
    example: '2024-01-20',
  })
  check_out_date?: string;

  @IsNameField({
    description: 'Booking confirmation code',
    example: 'BK-2024-001',
  })
  confirmation_code?: string;

  @IsTextAreaField({
    description: 'Cancellation or other reason',
    example: 'Change in travel plans',
  })
  reason?: string;

  @IsTextAreaField({
    description: 'Review text content',
    example: 'Great stay! Highly recommended.',
  })
  review_text?: string;

  @IsRatingField({
    description: 'Review rating (1-5)',
    example: 5,
  })
  rating?: number;

  @ApiPropertyOptional({ description: 'Additional custom data' })
  @IsOptional()
  custom_data?: Record<string, string>;
}

export class CreateNotificationDto {
  @IsUuidField({
    required: true,
    description: 'Recipient user ID',
    example: '507f1f77bcf86cd799439011',
  })
  recipient_id: string;

  @IsUuidField({
    description: 'Sender user ID',
    example: '507f1f77bcf86cd799439012',
  })
  sender_id?: string;

  @IsEnumField(NotificationType, {
    required: true,
    description: 'Notification type',
    example: NotificationType.BOOKING_CONFIRMED,
  })
  type: NotificationType;

  @IsNameField({
    required: true,
    description: 'Notification title',
    example: 'Booking Confirmed',
    maxLength: 100,
  })
  title: string;

  @IsTextAreaField({
    required: true,
    description: 'Notification body/message',
    example: 'Your booking has been confirmed for Downtown Apartment.',
    maxLength: 500,
  })
  body: string;

  @IsUrlField({
    description: 'Image URL for rich notifications',
    example: 'https://example.com/images/notification.jpg',
  })
  image_url?: string;

  @ApiPropertyOptional({ description: 'Additional notification data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data?: NotificationDataDto;

  @IsEnumField(NotificationPriority, {
    description: 'Notification priority',
    example: NotificationPriority.NORMAL,
  })
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Delivery channels',
    enum: NotificationChannel,
    isArray: true,
  })
  @IsOptional()
  channels?: NotificationChannel[];

  @IsBooleanField({
    description: 'Silent notification (no sound/vibration)',
    example: false,
  })
  is_silent?: boolean;

  @IsDateField({
    description: 'Schedule notification for later',
    example: '2024-01-15T10:00:00Z',
  })
  scheduled_at?: string;

  @IsDateField({
    description: 'Notification expiration time',
    example: '2024-01-20T23:59:59Z',
  })
  expires_at?: string;

  @IsUrlField({
    description: 'Action URL or deep link',
    example: 'myapp://booking/123',
  })
  action_url?: string;

  @IsNameField({
    description: 'Group key for related notifications',
    example: 'booking-updates',
  })
  group_key?: string;
}
