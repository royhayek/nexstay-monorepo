import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class CatalogItemDataDto {
  @ApiProperty({ description: 'Catalog item ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'Catalog type', example: 'Amenity' })
  catalogType: string;

  @ApiProperty({ description: 'Unique key', example: 'WIFI' })
  key: string;

  @ApiProperty({ description: 'URL slug', example: 'wifi' })
  slug: string;

  @ApiProperty({
    description: 'Internationalized labels (supports any configured language codes)',
    example: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي', es: 'WiFi' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  label: Record<string, string>;

  @ApiProperty({
    description: 'Internationalized descriptions (supports any configured language codes)',
    example: { en: 'High-speed internet access', fr: 'Accès Internet haut débit' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  description?: Record<string, string>;

  @ApiProperty({ description: 'Icon name from Iconsax', example: 'wifi', required: false })
  icon?: string;

  @ApiProperty({ description: 'Group category', example: 'connectivity', required: false })
  group?: string;

  @ApiProperty({ description: 'Sort order', example: 1 })
  sortOrder: number;

  @ApiProperty({ description: 'Visibility status', example: true })
  isVisible: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Deprecated status', example: false })
  isDeprecated: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class CatalogItemResponseDto extends BaseResponseDto<CatalogItemDataDto> {
  @ApiProperty({ type: CatalogItemDataDto })
  declare data: CatalogItemDataDto;
}

export class CatalogItemListDataDto {
  @ApiProperty({ type: [CatalogItemDataDto] })
  items: CatalogItemDataDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 50, total: 120, totalPages: 3 },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class CatalogItemListResponseDto extends BaseResponseDto<CatalogItemListDataDto> {
  @ApiProperty({ type: CatalogItemListDataDto })
  declare data: CatalogItemListDataDto;
}

// Frontend-optimized response (fewer fields)
export class CatalogItemFrontendDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  label: Record<string, string>;

  @ApiProperty({
    description: 'Internationalized descriptions',
    example: { en: 'High-speed internet access', fr: 'Accès Internet haut débit' },
    required: false,
  })
  description?: Record<string, string>;

  @ApiProperty({ required: false })
  icon?: string;

  @ApiProperty({ required: false })
  group?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isVisible: boolean;
}

export class CatalogsDataDto {
  [catalogType: string]: CatalogItemFrontendDto[];
}

export class CatalogsResponseDto extends BaseResponseDto<CatalogsDataDto> {
  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { type: 'object' },
    },
    description: 'Catalogs grouped by type',
    example: {
      PropertyType: [],
      RoomType: [],
      Amenity: [],
    },
  })
  declare data: CatalogsDataDto;
}
