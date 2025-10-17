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

  @IsUrlField({
    description: 'Property image URL',
    example: 'https://example.com/images/property.jpg',
  })
  property_image?: string;

  @IsNameField({
    description: 'Property location',
    example: 'New York, NY',
  })
  property_location?: string;

  @IsNameField({
    description: 'Property type',
    example: 'Apartment',
  })
  property_type?: string;

  @IsPriceField({
    description: 'Nightly rate',
    example: 150.00,
    minValue: 0,
  })
  nightly_rate?: number;

  @IsDateField({
    description: 'Property published date',
    example: '2024-01-15',
  })
  published_date?: string;

  @IsUrlField({
    description: 'Property URL',
    example: 'https://example.com/properties/123',
  })
  property_url?: string;

  @IsUrlField({
    description: 'Host dashboard URL',
    example: 'https://example.com/dashboard',
  })
  dashboard_url?: string;

  @IsUrlField({
    description: 'Host guide URL',
    example: 'https://example.com/host-guide',
  })
  host_guide_url?: string;

  @IsUrlField({
    description: 'Pricing tips URL',
    example: 'https://example.com/pricing-tips',
  })
  pricing_tips_url?: string;

  @IsUrlField({
    description: 'Photos guide URL',
    example: 'https://example.com/photos-guide',
  })
  photos_guide_url?: string;

  @IsUrlField({
    description: 'Safety guide URL',
    example: 'https://example.com/safety-guide',
  })
  safety_guide_url?: string;

  @IsNameField({
    description: 'Support email address',
    example: 'support@nexstay.com',
  })
  support_email?: string;

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

  // Payment-related fields
  @IsNameField({
    description: 'Payment receipt number',
    example: 'RCP-2024-001',
  })
  receipt_number?: string;

  @IsDateField({
    description: 'Payment date',
    example: '2024-01-15',
  })
  payment_date?: string;

  @IsNameField({
    description: 'Payment method',
    example: 'Credit Card',
  })
  payment_method?: string;

  @IsNameField({
    description: 'Transaction ID',
    example: 'TXN-123456789',
  })
  transaction_id?: string;

  @IsPriceField({
    description: 'Price per night',
    example: 150.00,
    minValue: 0,
  })
  price_per_night?: number;

  @IsPriceField({
    description: 'Number of nights',
    example: 3,
    minValue: 1,
  })
  nights?: number;

  @IsPriceField({
    description: 'Subtotal amount',
    example: 450.00,
    minValue: 0,
  })
  subtotal?: number;

  @IsPriceField({
    description: 'Service fee',
    example: 45.00,
    minValue: 0,
  })
  service_fee?: number;

  @IsPriceField({
    description: 'Cleaning fee',
    example: 25.00,
    minValue: 0,
  })
  cleaning_fee?: number;

  @IsPriceField({
    description: 'Taxes',
    example: 35.00,
    minValue: 0,
  })
  taxes?: number;

  // Payout-related fields
  @IsUuidField({
    description: 'Payout ID',
    example: '507f1f77bcf86cd799439015',
  })
  payout_id?: string;

  @IsDateField({
    description: 'Payout processing date',
    example: '2024-01-15',
  })
  payout_date?: string;

  @IsDateField({
    description: 'Expected arrival date for payout',
    example: '2024-01-18',
  })
  expected_arrival?: string;

  @IsNameField({
    description: 'Transfer time description',
    example: '3-5 business days',
  })
  transfer_time?: string;

  @IsNameField({
    description: 'Payment method type',
    example: 'Bank Account',
  })
  payment_method_type?: string;

  @IsNameField({
    description: 'Payment method details',
    example: 'Ending in ****1234',
  })
  payment_method_details?: string;

  @IsPriceField({
    description: 'Gross earnings',
    example: 500.00,
    minValue: 0,
  })
  gross_earnings?: number;

  @IsPriceField({
    description: 'Adjustments',
    example: 10.00,
  })
  adjustments?: number;

  @IsDateField({
    description: 'Next payout date',
    example: '2024-02-01',
  })
  next_payout_date?: string;

  @IsPriceField({
    description: 'Pending earnings',
    example: 250.00,
    minValue: 0,
  })
  pending_earnings?: number;

  // Message-related fields
  @IsUuidField({
    description: 'Conversation ID',
    example: '507f1f77bcf86cd799439016',
  })
  conversation_id?: string;

  @IsNameField({
    description: 'Sender name',
    example: 'John Doe',
  })
  sender_name?: string;

  @IsTextAreaField({
    description: 'Message preview',
    example: 'Hello, I have a question about...',
  })
  message_preview?: string;

  @IsPriceField({
    description: 'Unread message count',
    example: 3,
    minValue: 0,
  })
  unread_count?: number;

  // Password reset fields
  @IsNameField({
    description: 'Password reset token',
    example: 'reset-token-123456',
  })
  reset_token?: string;

  @IsNameField({
    description: 'Token expiry time description',
    example: '1 hour',
  })
  expiry_time?: string;

  @IsNameField({
    description: 'Request IP address',
    example: '192.168.1.1',
  })
  ip_address?: string;

  @IsNameField({
    description: 'Request location',
    example: 'San Francisco, CA',
  })
  location?: string;

  @IsNameField({
    description: 'Request device information',
    example: 'Chrome on macOS',
  })
  device?: string;

  @IsNameField({
    description: 'User email address',
    example: 'user@example.com',
  })
  user_email?: string;

  @IsNameField({
    description: 'User name',
    example: 'John Doe',
  })
  user_name?: string;

  // Review-related fields
  @IsDateField({
    description: 'Review deadline',
    example: '2024-01-30',
  })
  review_deadline?: string;

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
