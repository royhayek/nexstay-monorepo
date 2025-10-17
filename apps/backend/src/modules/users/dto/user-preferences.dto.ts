import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { OtpNotificationMethod } from '../../../database/schemas/user.schema';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  IsTimezoneField,
  IsLanguageField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

export class UpdatePreferencesDto {
  @IsEnumField(OtpNotificationMethod, {
    description: 'Preferred OTP notification method',
    example: OtpNotificationMethod.EMAIL,
  })
  otpNotificationMethod?: OtpNotificationMethod;

  @IsLanguageField({
    description: 'Preferred language code',
    example: 'en',
  })
  language?: string;

  @IsTimezoneField({
    description: 'User preferred timezone',
  })
  timezone?: string;
}

export class EmailNotificationsDto {
  @ApiProperty({
    description: 'Receive booking confirmation emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  bookingConfirmation?: boolean;

  @ApiProperty({
    description: 'Receive payment receipt emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  paymentReceipt?: boolean;

  @ApiProperty({
    description: 'Receive payout notification emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  payoutNotification?: boolean;

  @ApiProperty({
    description: 'Receive new message notification emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  newMessage?: boolean;

  @ApiProperty({
    description: 'Receive review reminder emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  reviewReminder?: boolean;

  @ApiProperty({
    description: 'Receive password reset emails',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  passwordReset?: boolean;

  @ApiProperty({
    description: 'Receive marketing and promotional emails',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;
}

export class UpdateEmailPreferencesDto {
  @ApiProperty({
    description: 'Email notification preferences',
    type: EmailNotificationsDto,
    required: false,
  })
  @IsOptional()
  emailNotifications?: EmailNotificationsDto;
}

export class OtpMethodAvailabilityDto {
  @ApiProperty({
    description: 'OTP notification method',
    enum: OtpNotificationMethod,
    example: OtpNotificationMethod.EMAIL,
  })
  method: OtpNotificationMethod;

  @ApiProperty({
    description: 'Whether this method is enabled/available for the user',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Whether this is the currently selected method',
    example: true,
  })
  selected: boolean;

  @ApiProperty({
    description: 'Reason why method is disabled (if applicable)',
    example: 'Phone number not verified',
    required: false,
  })
  disabledReason?: string;
}

export class UserPreferencesDataDto {
  @ApiProperty({
    description: 'Preferred OTP notification method',
    enum: OtpNotificationMethod,
    example: OtpNotificationMethod.EMAIL,
  })
  otpNotificationMethod: OtpNotificationMethod;

  @ApiProperty({
    description: 'All available OTP notification methods with their status',
    type: [OtpMethodAvailabilityDto],
  })
  availableMethods: OtpMethodAvailabilityDto[];

  @ApiProperty({
    description: 'Preferred language code',
    example: 'en',
  })
  language: string;

  @ApiProperty({
    description: 'User timezone',
    example: 'America/New_York',
  })
  timezone: string;

  @ApiProperty({
    description: 'Email notification preferences',
    type: EmailNotificationsDto,
    required: false,
  })
  emailNotifications?: EmailNotificationsDto;
}

export class UserPreferencesResponseDto extends BaseResponseDto<UserPreferencesDataDto> {
  @ApiProperty({
    description: 'User preferences data',
    type: UserPreferencesDataDto,
  })
  declare data: UserPreferencesDataDto;
}

export class UpdatePreferencesResponseDto extends BaseResponseDto<UserPreferencesDataDto> {
  @ApiProperty({
    description: 'Updated user preferences',
    type: UserPreferencesDataDto,
  })
  declare data: UserPreferencesDataDto;
}

export class EmailPreferencesDataDto {
  @ApiProperty({
    description: 'Email notification preferences',
    type: EmailNotificationsDto,
  })
  emailNotifications: EmailNotificationsDto;
}

export class EmailPreferencesResponseDto extends BaseResponseDto<EmailPreferencesDataDto> {
  @ApiProperty({
    description: 'Email notification preferences data',
    type: EmailPreferencesDataDto,
  })
  declare data: EmailPreferencesDataDto;
}
