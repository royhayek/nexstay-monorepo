import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class LogoutDataDto {
  @ApiProperty({ example: 'Logout successful', description: 'Logout confirmation message' })
  message!: string;
}

export class LogoutResponseDto extends BaseResponseDto<LogoutDataDto> {
  @ApiProperty({
    description: 'Logout response data',
    type: LogoutDataDto,
  })
  declare data: LogoutDataDto;
}
