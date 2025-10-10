import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { CodeDeliveryMethod } from './login.dto';

export class AddSecondaryContactDataDto {
  @ApiProperty({
    description: 'Whether the secondary contact was added successfully',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Whether verification is required for the added contact',
    example: true,
  })
  verificationRequired!: boolean;

  @ApiProperty({
    description: 'How the verification code was delivered (if required)',
    enum: CodeDeliveryMethod,
    example: CodeDeliveryMethod.EMAIL,
    required: false,
  })
  codeDeliveryMethod?: CodeDeliveryMethod;

  @ApiProperty({
    description: 'Test verification code (development only)',
    example: '123456',
    required: false,
  })
  testCode?: string;
}

export class AddSecondaryContactResponseDto extends BaseResponseDto<AddSecondaryContactDataDto> {
  @ApiProperty({
    description: 'Add secondary contact response data',
    type: AddSecondaryContactDataDto,
  })
  declare data: AddSecondaryContactDataDto;
}
