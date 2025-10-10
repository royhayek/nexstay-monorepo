import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ConfigDeleteDataDto {
  @ApiProperty({
    description: 'Indicates if the delete operation was successful',
    example: true,
  })
  success: boolean;
}

export class ConfigDeleteResponseDto extends BaseResponseDto<ConfigDeleteDataDto> {
  @ApiProperty({
    description: 'Delete operation result',
    type: ConfigDeleteDataDto,
  })
  declare data: ConfigDeleteDataDto;
}
