import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { RegistrationState } from '../../../database/schemas/user.schema';
import { CodeDeliveryMethod } from './login.dto';
import { UserDataDto } from '../../users/dto/user-response.dto';

export class SignupInitiateDataDto {
  @ApiProperty({
    description: 'Whether the contact verification was sent successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Test OTP code (development only)',
    example: '123456',
    required: false,
  })
  testCode?: string;

  @ApiProperty({
    description: 'Current registration state',
    enum: RegistrationState,
    example: RegistrationState.CONTACT_PENDING,
  })
  registrationState!: RegistrationState;

  @ApiProperty({
    description: 'How the verification code was delivered',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.EMAIL,
    required: false,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;
}

export class SignupVerifyContactDataDto {
  @ApiProperty({
    description: 'Temporary session token for next step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  sessionToken!: string;

  @ApiProperty({
    description: 'Next step in the registration process',
    example: 'complete_profile',
  })
  nextStep!: string;

  @ApiProperty({
    description: 'Current registration state',
    enum: RegistrationState,
    example: RegistrationState.PROFILE_INCOMPLETE,
  })
  registrationState!: RegistrationState;
}

export class SignupCompleteDataDto {
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

  @ApiProperty({
    description: 'User registration state',
    enum: RegistrationState,
    example: RegistrationState.PROFILE_COMPLETE,
  })
  registrationState!: RegistrationState;

  @ApiProperty({
    description: 'Whether user has provided secondary contact info',
    example: true,
  })
  hasSecondaryContact!: boolean;

  @ApiProperty({
    description: 'Type of missing contact (email or phone)',
    example: 'email',
    enum: ['email', 'phone'],
    required: false,
  })
  missingContactType?: 'email' | 'phone';

  @ApiProperty({
    description: 'Whether secondary contact needs verification',
    example: false,
    required: false,
  })
  secondaryContactNeedsVerification?: boolean;
}

export class SignupInitiateResponseDto extends BaseResponseDto<SignupInitiateDataDto> {
  @ApiProperty({
    description: 'Signup initiation data',
    type: SignupInitiateDataDto,
  })
  declare data: SignupInitiateDataDto;
}

export class SignupVerifyContactResponseDto extends BaseResponseDto<SignupVerifyContactDataDto> {
  @ApiProperty({
    description: 'Signup contact verification data',
    type: SignupVerifyContactDataDto,
  })
  declare data: SignupVerifyContactDataDto;
}

export class SignupCompleteResponseDto extends BaseResponseDto<SignupCompleteDataDto> {
  @ApiProperty({
    description: 'Signup completion data with tokens',
    type: SignupCompleteDataDto,
  })
  declare data: SignupCompleteDataDto;
}
