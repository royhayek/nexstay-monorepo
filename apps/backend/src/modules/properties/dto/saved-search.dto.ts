import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsISO8601, IsArray, IsDate } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import {
  IsEnumField,
  IsSearchField,
  IsNameField,
  IsCurrencyCodeField,
  IsStringArrayField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import {
  PropertyType,
  RoomType,
  CancellationPolicy,
  PropertyCategory,
  FlexibleDateRange,
} from '../../../common/enums/property.enums';
import {
  IsPriceField,
  IsGuestCountField,
  IsCoordinateField,
} from '../validators/property.validators';

/**
 * Create Saved Search DTO
 */
export class CreateSavedSearchDto {
  @IsNameField({
    description: 'Name for this saved search',
    example: 'Beach houses in California',
  })
  name: string;

  @IsSearchField({
    description: 'Optional description for this saved search',
    example: 'Weekend getaways near the beach',
  })
  description?: string;

  // Search filters (matching PropertySearchDto)
  @IsSearchField({
    description: 'Search by property name, title or general keywords',
    example: 'beach house luxury',
  })
  search?: string;

  @IsSearchField({
    description: 'Search by location (city, neighborhood, country)',
    example: 'Beirut, Lebanon',
  })
  location?: string;

  @IsCoordinateField({ type: 'latitude' })
  latitude?: number;

  @IsCoordinateField({ type: 'longitude' })
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Search radius in kilometers', example: 10, required: false })
  radius?: number;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({ description: 'Check-in date (ISO 8601 format)', example: '2024-02-15', required: false })
  checkIn?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({ description: 'Check-out date (ISO 8601 format)', example: '2024-02-20', required: false })
  checkOut?: string;

  @IsEnumField(FlexibleDateRange, {
    description: 'Flexible date range for quick date selections',
  })
  flexibleDateRange?: FlexibleDateRange;

  @IsOptional()
  @IsArray()
  @IsEnumField(PropertyType, { isArray: true, description: 'Filter by property types' })
  propertyTypes?: PropertyType[];

  @IsOptional()
  @IsArray()
  @IsEnumField(RoomType, { isArray: true, description: 'Filter by room types' })
  roomTypes?: RoomType[];

  @IsOptional()
  @IsArray()
  @IsEnumField(PropertyCategory, { isArray: true, description: 'Filter by property categories' })
  categories?: PropertyCategory[];

  @IsPriceField({ fieldType: 'minimum' })
  minPrice?: number;

  @IsPriceField({ fieldType: 'maximum' })
  maxPrice?: number;

  @IsCurrencyCodeField({ description: 'Currency code for price filtering' })
  currency?: string;

  @IsGuestCountField({ description: 'Total number of guests' })
  guests?: number;

  @IsGuestCountField({ description: 'Number of adults' })
  adults?: number;

  @IsGuestCountField({ description: 'Number of children' })
  children?: number;

  @IsGuestCountField({ description: 'Number of infants' })
  infants?: number;

  @IsGuestCountField({ description: 'Number of bedrooms required' })
  bedrooms?: number;

  @IsGuestCountField({ description: 'Number of beds required' })
  beds?: number;

  @IsGuestCountField({ description: 'Number of bathrooms required' })
  bathrooms?: number;

  @IsStringArrayField({ description: 'Required amenities', maxItems: 20 })
  amenities?: string[];

  @IsBooleanField({ description: 'Show only instant bookable properties' })
  instantBookable?: boolean;

  @IsBooleanField({ description: 'Show only superhost properties' })
  isSuperhost?: boolean;

  @IsEnumField(CancellationPolicy, { description: 'Preferred cancellation policy' })
  cancellationPolicy?: CancellationPolicy;

  @IsSearchField({ description: 'Sort properties by' })
  sortBy?: string;

  @IsSearchField({ description: 'Sort direction' })
  sortOrder?: 'asc' | 'desc';

  @IsBooleanField({ description: 'Set as default search' })
  isDefault?: boolean;
}

/**
 * Update Saved Search DTO
 */
export class UpdateSavedSearchDto {
  @IsNameField({ description: 'Name for this saved search' })
  name?: string;

  @IsSearchField({ description: 'Optional description for this saved search' })
  description?: string;

  @IsBooleanField({ description: 'Set as default search' })
  isDefault?: boolean;

  // All other fields optional for updates (same as CreateSavedSearchDto)
  @IsSearchField({ description: 'Search by property name, title or general keywords' })
  search?: string;

  @IsSearchField({ description: 'Search by location (city, neighborhood, country)' })
  location?: string;

  @IsCoordinateField({ type: 'latitude' })
  latitude?: number;

  @IsCoordinateField({ type: 'longitude' })
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ description: 'Search radius in kilometers', required: false })
  radius?: number;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({ description: 'Check-in date (ISO 8601 format)', required: false })
  checkIn?: string;

  @IsOptional()
  @IsISO8601()
  @ApiProperty({ description: 'Check-out date (ISO 8601 format)', required: false })
  checkOut?: string;

  @IsEnumField(FlexibleDateRange, { description: 'Flexible date range for quick date selections' })
  flexibleDateRange?: FlexibleDateRange;

  @IsOptional()
  @IsArray()
  @IsEnumField(PropertyType, { isArray: true, description: 'Filter by property types' })
  propertyTypes?: PropertyType[];

  @IsOptional()
  @IsArray()
  @IsEnumField(RoomType, { isArray: true, description: 'Filter by room types' })
  roomTypes?: RoomType[];

  @IsOptional()
  @IsArray()
  @IsEnumField(PropertyCategory, { isArray: true, description: 'Filter by property categories' })
  categories?: PropertyCategory[];

  @IsPriceField({ fieldType: 'minimum' })
  minPrice?: number;

  @IsPriceField({ fieldType: 'maximum' })
  maxPrice?: number;

  @IsCurrencyCodeField({ description: 'Currency code for price filtering' })
  currency?: string;

  @IsGuestCountField({ description: 'Total number of guests' })
  guests?: number;

  @IsGuestCountField({ description: 'Number of adults' })
  adults?: number;

  @IsGuestCountField({ description: 'Number of children' })
  children?: number;

  @IsGuestCountField({ description: 'Number of infants' })
  infants?: number;

  @IsGuestCountField({ description: 'Number of bedrooms required' })
  bedrooms?: number;

  @IsGuestCountField({ description: 'Number of beds required' })
  beds?: number;

  @IsGuestCountField({ description: 'Number of bathrooms required' })
  bathrooms?: number;

  @IsStringArrayField({ description: 'Required amenities', maxItems: 20 })
  amenities?: string[];

  @IsBooleanField({ description: 'Show only instant bookable properties' })
  instantBookable?: boolean;

  @IsBooleanField({ description: 'Show only superhost properties' })
  isSuperhost?: boolean;

  @IsEnumField(CancellationPolicy, { description: 'Preferred cancellation policy' })
  cancellationPolicy?: CancellationPolicy;

  @IsSearchField({ description: 'Sort properties by' })
  sortBy?: string;

  @IsSearchField({ description: 'Sort direction' })
  sortOrder?: 'asc' | 'desc';
}

/**
 * Saved Search Data DTO
 */
export class SavedSearchDataDto {
  @ApiProperty({ description: 'Saved search ID' })
  id: string;

  @ApiProperty({ description: 'Name of the saved search' })
  name: string;

  @ApiProperty({ description: 'Optional description', required: false })
  description?: string;

  @ApiProperty({ description: 'Search filters as JSON object' })
  filters: Record<string, any>;

  @ApiProperty({ description: 'Number of times this search was used', default: 0 })
  useCount: number;

  @ApiProperty({ description: 'Whether this is the default search', default: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Last time this search was used', required: false })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Date when this search was created', required: false })
  createdAt?: Date;

  @ApiProperty({ description: 'Date when this search was last updated', required: false })
  updatedAt?: Date;
}

/**
 * Search History Data DTO
 */
export class SearchHistoryDataDto {
  @ApiProperty({ description: 'Search history ID' })
  id: string;

  @ApiProperty({ description: 'Search filters as JSON object' })
  filters: Record<string, any>;

  @ApiProperty({ description: 'Number of results found', default: 0 })
  resultsCount: number;

  @ApiProperty({ description: 'Whether the search had results', default: false })
  hasResults: boolean;

  @ApiProperty({ description: 'Date when this search was performed', required: false })
  createdAt?: Date;
}

/**
 * Response DTOs
 */
export class SavedSearchResponseDto extends BaseResponseDto<SavedSearchDataDto> {
  @ApiProperty({ description: 'Saved search data', type: SavedSearchDataDto })
  declare data: SavedSearchDataDto;
}

export class SavedSearchListResponseDto extends BaseResponseDto<PaginatedDto<SavedSearchDataDto>> {
  @ApiProperty({ description: 'Paginated saved searches', type: () => PaginatedDto<SavedSearchDataDto> })
  declare data: PaginatedDto<SavedSearchDataDto>;
}

export class SearchHistoryListResponseDto extends BaseResponseDto<PaginatedDto<SearchHistoryDataDto>> {
  @ApiProperty({ description: 'Paginated search history', type: () => PaginatedDto<SearchHistoryDataDto> })
  declare data: PaginatedDto<SearchHistoryDataDto>;
}
