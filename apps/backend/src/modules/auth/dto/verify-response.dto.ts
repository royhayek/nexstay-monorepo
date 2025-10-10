import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class VerifyDataDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (only for existing users)',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (only for existing users)',
    required: false,
  })
  refreshToken?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this was ownership verification (no account) or user verification',
  })
  ownershipVerified!: boolean;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The verified identifier',
  })
  verifiedIdentifier!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signup session token for continuing registration (only for new users)',
    required: false,
  })
  signupSessionToken?: string;
}

export class VerifyResponseDto extends BaseResponseDto<VerifyDataDto> {
  @ApiProperty({
    description: 'Email verification response data',
    type: VerifyDataDto,
  })
  declare data: VerifyDataDto;
}
