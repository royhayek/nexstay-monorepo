import {
  IsPasswordField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import { IsNotEmpty, IsOptional } from 'class-validator';
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
}
