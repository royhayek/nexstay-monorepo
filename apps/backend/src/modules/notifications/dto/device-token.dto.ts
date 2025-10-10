import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsEnumField,
  IsNameField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';

import { DevicePlatform } from '../../../common/enums/notification.enums';

export class RegisterDeviceTokenDto {
  @IsNameField({
    required: true,
    description: 'Firebase FCM token or device token',
    example: 'fGzQ9k4vQjey8...',
  })
  token: string;

  @IsEnumField(DevicePlatform, {
    required: true,
    description: 'Device platform',
    example: DevicePlatform.IOS,
  })
  platform: DevicePlatform;

  @IsNameField({
    description: 'Unique device identifier',
    example: 'iPhone14,5',
  })
  device_id?: string;

  @IsNameField({
    description: 'Human-readable device name',
    example: "John's iPhone",
  })
  device_name?: string;

  @IsNameField({
    description: 'App version',
    example: '1.2.3',
  })
  app_version?: string;

  @IsNameField({
    description: 'Operating system version',
    example: '16.0',
  })
  os_version?: string;

  @IsNameField({
    description: 'Device timezone',
    example: 'America/New_York',
  })
  timezone?: string;

  @IsNameField({
    description: 'Language preference',
    example: 'en',
    maxLength: 5,
  })
  language?: string;
}

export class UpdateDeviceTokenDto {
  @IsBooleanField({
    description: 'Enable/disable push notifications',
    example: true,
  })
  push_enabled?: boolean;

  @IsBooleanField({
    description: 'Enable/disable marketing notifications',
    example: false,
  })
  marketing_enabled?: boolean;

  @IsBooleanField({
    description: 'Enable/disable booking notifications',
    example: true,
  })
  booking_notifications?: boolean;

  @IsBooleanField({
    description: 'Enable/disable review notifications',
    example: true,
  })
  review_notifications?: boolean;

  @IsBooleanField({
    description: 'Enable/disable message notifications',
    example: true,
  })
  message_notifications?: boolean;

  @IsBooleanField({
    description: 'Enable/disable payment notifications',
    example: true,
  })
  payment_notifications?: boolean;

  @IsNameField({
    description: 'Device timezone',
    example: 'America/New_York',
  })
  timezone?: string;

  @IsNameField({
    description: 'Language preference',
    example: 'en',
    maxLength: 5,
  })
  language?: string;

  @IsBooleanField({
    description: 'Mark device as active/inactive',
    example: true,
  })
  is_active?: boolean;
}

export class DeviceTokenResponseDto {
  @ApiProperty({ description: 'Device token ID' })
  _id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Device token' })
  token: string;

  @ApiProperty({ description: 'Device platform', enum: DevicePlatform })
  platform: DevicePlatform;

  @ApiPropertyOptional({ description: 'Device ID' })
  device_id?: string;

  @ApiPropertyOptional({ description: 'Device name' })
  device_name?: string;

  @ApiPropertyOptional({ description: 'App version' })
  app_version?: string;

  @ApiPropertyOptional({ description: 'OS version' })
  os_version?: string;

  @ApiProperty({ description: 'Is device active' })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Last used timestamp' })
  last_used_at?: Date;

  @ApiProperty({ description: 'Push notifications enabled' })
  push_enabled: boolean;

  @ApiProperty({ description: 'Marketing notifications enabled' })
  marketing_enabled: boolean;

  @ApiProperty({ description: 'Booking notifications enabled' })
  booking_notifications: boolean;

  @ApiProperty({ description: 'Review notifications enabled' })
  review_notifications: boolean;

  @ApiProperty({ description: 'Message notifications enabled' })
  message_notifications: boolean;

  @ApiProperty({ description: 'Payment notifications enabled' })
  payment_notifications: boolean;

  @ApiPropertyOptional({ description: 'Device timezone' })
  timezone?: string;

  @ApiProperty({ description: 'Language preference' })
  language: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
