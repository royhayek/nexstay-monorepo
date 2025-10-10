import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { CodeDeliveryMethod } from './login.dto';
import { UserDataDto } from '../../users/dto/user-response.dto';

export class SigninInitiateDataDto {
  @ApiProperty({
    description: 'Whether user exists and can proceed to password step',
    example: true,
  })
  userExists!: boolean;

  @ApiProperty({
    description: 'Session token for next step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  sessionToken!: string;

  @ApiProperty({
    description: 'Next step in the sign-in process',
    example: 'password',
    enum: ['password', 'sms_code', 'social_redirect', 'verify_signup'],
  })
  nextStep!: string;

  @ApiProperty({
    description: 'Whether password is set for this account (phone users might not have password)',
    example: true,
    required: false,
  })
  hasPassword?: boolean;

  @ApiProperty({
    description: 'Test SMS code for development (phone login only)',
    example: '123456',
    required: false,
  })
  testCode?: string;

  @ApiProperty({
    description: 'How the verification code was delivered (when applicable)',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.SMS,
    required: false,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;
}

export class SigninPasswordDataDto {
  @ApiProperty({
    description: 'Whether device verification is required',
    example: false,
  })
  requiresDeviceVerification!: boolean;

  @ApiProperty({
    description: 'JWT access token (if no device verification needed)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    description: 'JWT refresh token (if no device verification needed)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'User data (if no device verification needed)',
    type: UserDataDto,
    required: false,
  })
  user?: UserDataDto;

  @ApiProperty({
    description: 'Session token for device verification step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  sessionToken?: string;

  @ApiProperty({
    description: 'Test verification code for development',
    example: '123456',
    required: false,
  })
  testCode?: string;

  @ApiProperty({
    description:
      'How the device verification code was delivered (when device verification is required)',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.SMS,
    required: false,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;
}

export class SigninCompleteDataDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'User data',
    type: UserDataDto,
  })
  user!: UserDataDto;
}

export class SigninInitiateResponseDto extends BaseResponseDto<SigninInitiateDataDto> {
  @ApiProperty({
    description: 'Sign-in initiation data',
    type: SigninInitiateDataDto,
  })
  declare data: SigninInitiateDataDto;
}

export class SigninPasswordResponseDto extends BaseResponseDto<SigninPasswordDataDto> {
  @ApiProperty({
    description: 'Sign-in password verification data',
    type: SigninPasswordDataDto,
  })
  declare data: SigninPasswordDataDto;
}

export class SigninCompleteResponseDto extends BaseResponseDto<SigninCompleteDataDto> {
  @ApiProperty({
    description: 'Sign-in completion data with tokens',
    type: SigninCompleteDataDto,
  })
  declare data: SigninCompleteDataDto;
}
