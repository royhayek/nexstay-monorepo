import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ResetPasswordDataDto {
  @ApiProperty({
    example: true,
    description: 'Indicates the password was reset successfully',
  })
  success: boolean;
}

export class ResetPasswordResponseDto extends BaseResponseDto<ResetPasswordDataDto> {
  @ApiProperty({
    description: 'Password reset response data',
    type: ResetPasswordDataDto,
  })
  declare data: ResetPasswordDataDto;
}
