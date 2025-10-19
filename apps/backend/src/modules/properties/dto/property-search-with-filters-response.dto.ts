import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { PropertyResponseDto } from './property-response.dto';

/**
 * Catalog filter option item (frontend-optimized)
 */
export class CatalogFilterOptionDto {
  @ApiProperty({ description: 'Catalog item ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'Catalog type', example: 'PropertyType' })
  catalogType?: string;

  @ApiProperty({ description: 'Unique key', example: 'APARTMENT' })
  key: string;

  @ApiProperty({ description: 'URL slug', example: 'apartment' })
  slug: string;

  @ApiProperty({
    description: 'Internationalized labels',
    example: { en: 'Apartment', fr: 'Appartement', ar: 'شقة' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  label: Record<string, string>;

  @ApiProperty({
    description: 'Internationalized descriptions',
    example: { en: 'Self-contained home with private entrance', fr: 'Maison indépendante avec entrée privée' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  description?: Record<string, string>;

  @ApiProperty({ description: 'Icon name', example: 'building', required: false })
  icon?: string;

  @ApiProperty({ description: 'Group category', example: 'accommodation', required: false })
  group?: string;

  @ApiProperty({ description: 'Sort order', example: 1 })
  sortOrder: number;

  @ApiProperty({ description: 'Visibility status', example: true })
  isVisible: boolean;
}

/**
 * Available filter options grouped by catalog type
 */
export class SearchFilterOptionsDto {
  @ApiProperty({
    description: 'Available property types',
    type: [CatalogFilterOptionDto],
    required: false,
  })
  PropertyType?: CatalogFilterOptionDto[];

  @ApiProperty({
    description: 'Available room types',
    type: [CatalogFilterOptionDto],
    required: false,
  })
  RoomType?: CatalogFilterOptionDto[];

  @ApiProperty({
    description: 'Available bed types',
    type: [CatalogFilterOptionDto],
    required: false,
  })
  BedType?: CatalogFilterOptionDto[];

  @ApiProperty({
    description: 'Available cancellation policies',
    type: [CatalogFilterOptionDto],
    required: false,
  })
  CancellationPolicy?: CatalogFilterOptionDto[];
}

/**
 * Search results with filter options data
 */
export class PropertySearchWithFiltersDataDto {
  @ApiProperty({
    description: 'Paginated property search results',
    type: () => PaginatedDto,
  })
  results: PaginatedDto<PropertyResponseDto>;

  @ApiProperty({
    description: 'Available filter options from catalog',
    type: SearchFilterOptionsDto,
  })
  filterOptions: SearchFilterOptionsDto;
}

/**
 * Complete response for property search with filter options
 */
export class PropertySearchWithFiltersResponseDto extends BaseResponseDto<PropertySearchWithFiltersDataDto> {
  @ApiProperty({ type: PropertySearchWithFiltersDataDto })
  declare data: PropertySearchWithFiltersDataDto;
}
