import { IsNotEmpty } from 'class-validator';
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
}
