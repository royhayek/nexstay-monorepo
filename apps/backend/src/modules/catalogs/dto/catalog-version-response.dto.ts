import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class CatalogVersionDataDto {
  @ApiProperty({ example: 1, description: 'Current catalog version number' })
  version: number;

  @ApiProperty({ example: '2024-10-11T10:30:00.000Z', description: 'Last modified timestamp' })
  lastModified: Date;
}

export class CatalogVersionResponseDto extends BaseResponseDto<CatalogVersionDataDto> {
  @ApiProperty({ type: CatalogVersionDataDto })
  declare data: CatalogVersionDataDto;
}
