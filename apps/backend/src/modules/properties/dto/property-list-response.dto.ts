import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PropertyResponseDto } from './property-response.dto';

/**
 * Data DTO for property array responses
 */
export class PropertyArrayDataDto {
  @ApiProperty({
    description: 'Array of properties',
    type: [PropertyResponseDto],
  })
  properties: PropertyResponseDto[];

  @ApiProperty({
    description: 'Total number of properties',
    example: 25,
  })
  total: number;
}

/**
 * Response DTO for multiple properties (non-paginated)
 */
export class PropertyArrayResponseDto extends BaseResponseDto<PropertyResponseDto[]> {
  @ApiProperty({
    description: 'Array of properties',
    type: [PropertyResponseDto],
  })
  declare data: PropertyResponseDto[];
}
