import { ApiProperty } from '@nestjs/swagger';
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
