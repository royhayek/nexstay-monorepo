import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { CodeDeliveryMethod } from './login.dto';

export class RequestResetDataDto {
  @Expose()
  @ApiProperty({ example: true, description: 'Indicates the reset code was issued successfully.' })
  success!: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: '123456',
    description: 'Only returned in test environment to simplify E2E tests.',
  })
  testCode?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'How the password reset code was delivered',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.EMAIL,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;
}

export class RequestResetResponseDto extends BaseResponseDto<RequestResetDataDto> {
  @ApiProperty({
    description: 'Password reset request data',
    type: RequestResetDataDto,
  })
  declare data: RequestResetDataDto;
}
