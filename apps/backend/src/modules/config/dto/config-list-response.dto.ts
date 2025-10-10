import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ConfigDataDto } from './config-response.dto';

export class ConfigListResponseDto extends BaseResponseDto<ConfigDataDto[]> {
  @ApiProperty({
    description: 'List of all configurations',
    type: [ConfigDataDto],
  })
  declare data: ConfigDataDto[];
}
