import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsOtpCodeField } from '../../../common/validators/standardized-validators';

export class SigninVerifyDeviceDto {
  @IsOtpCodeField({
    description: 'Verification code sent to email or phone',
    required: true,
    example: '123456',
  })
  code!: string;

  @ApiProperty({
    description: 'Session token from signin password step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  sessionToken!: string;

  @ApiProperty({
    description: 'User agent string for device fingerprinting',
    required: false,
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'IP address for device fingerprinting',
    required: false,
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
