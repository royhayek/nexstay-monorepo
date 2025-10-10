import { ApiProperty } from '@nestjs/swagger';
import { AuthMethod } from './login.dto';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class CheckIdentifierDataDto {
  @ApiProperty({
    description: 'Whether an account already exists for this identifier',
    example: true,
  })
  exists!: boolean;

  @ApiProperty({
    description: 'Authentication methods already available for this account',
    enum: AuthMethod,
    isArray: true,
    example: [AuthMethod.EMAIL, AuthMethod.GOOGLE],
  })
  methods!: AuthMethod[];

  @ApiProperty({
    description: 'Test OTP code sent for new user signup (development only)',
    example: '123456',
    required: false,
  })
  testCode?: string;
}

export class CheckIdentifierResponseDto extends BaseResponseDto<CheckIdentifierDataDto> {
  @ApiProperty({
    description: 'Check identifier data',
    type: CheckIdentifierDataDto,
  })
  declare data: CheckIdentifierDataDto;
}
