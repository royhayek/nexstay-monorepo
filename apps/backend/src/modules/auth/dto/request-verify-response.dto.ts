import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { CodeDeliveryMethod } from './login.dto';

export class RequestVerifyDataDto {
  @Expose()
  @ApiProperty({
    example: true,
    description: 'Indicates the verification code was sent successfully.',
  })
  success!: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: '123456',
    description: 'Only returned in test environment to simplify E2E tests.',
  })
  testCode?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'How the verification code was delivered',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.EMAIL,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;
}

export class RequestVerifyResponseDto extends BaseResponseDto<RequestVerifyDataDto> {
  @ApiProperty({
    description: 'Email verification request data',
    type: RequestVerifyDataDto,
  })
  declare data: RequestVerifyDataDto;
}
