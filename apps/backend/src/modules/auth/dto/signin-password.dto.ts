import {
  IsPasswordField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SigninPasswordDto {
  @IsPasswordField({
    description: 'User password',
    required: true,
    example: 'MySecurePassword123!',
  })
  password!: string;

  @ApiProperty({
    description: 'Session token from signin initiate step',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  sessionToken!: string;

  @IsBooleanField({
    description: 'Whether user wants to request SMS code instead of password (phone login only)',
    required: false,
    example: false,
  })
  @IsOptional()
  requestSmsCode?: boolean;

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
