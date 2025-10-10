import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class AmenityCategoryDataDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ description: 'Localized names' })
  name: Record<string, string>;

  @ApiPropertyOptional({ description: 'Localized descriptions' })
  description?: Record<string, string>;

  @ApiPropertyOptional()
  group?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;
}

export class AmenityCategoryResponseDto extends BaseResponseDto<AmenityCategoryDataDto> {
  @ApiProperty({
    description: 'Amenity category data',
    type: () => AmenityCategoryDataDto,
  })
  declare data: AmenityCategoryDataDto;
}

export class AmenityCategoryListDataDto {
  @ApiProperty({ description: 'Amenity categories', type: () => [AmenityCategoryDataDto] })
  categories: AmenityCategoryDataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  pages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class AmenityCategoryListResponseDto extends BaseResponseDto<AmenityCategoryListDataDto> {
  @ApiProperty({
    description: 'Paginated amenity category list data',
    type: () => AmenityCategoryListDataDto,
  })
  declare data: AmenityCategoryListDataDto;
}

export class AmenityCategorySimpleListResponseDto extends BaseResponseDto<
  AmenityCategoryDataDto[]
> {
  @ApiProperty({
    description: 'Simple list of amenity categories',
    type: () => [AmenityCategoryDataDto],
  })
  declare data: AmenityCategoryDataDto[];
}

export class AmenityCategoryDeleteDataDto {
  @ApiProperty({
    description: 'Indicates if the delete operation was successful',
    example: true,
  })
  deleted: boolean;

  @ApiProperty({
    description: 'The ID of the deleted amenity category',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;
}

export class AmenityCategoryDeleteResponseDto extends BaseResponseDto<AmenityCategoryDeleteDataDto> {
  @ApiProperty({
    description: 'Delete operation result',
    type: AmenityCategoryDeleteDataDto,
  })
  declare data: AmenityCategoryDeleteDataDto;
}
