import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsISO8601, Min, Max, IsArray } from 'class-validator';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import {
  IsEnumField,
  IsSearchField,
  IsPageField,
  IsLimitField,
  IsCurrencyCodeField,
  IsStringArrayField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import { PropertyType, RoomType, CancellationPolicy } from '../../../common/enums/property.enums';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';
import {
  IsPriceField,
  IsGuestCountField,
  IsCoordinateField,
} from '../validators/property.validators';
import { PROPERTY_SORT_OPTIONS } from '../constants/property.constants';
import { PAGINATION_CONSTANTS } from '../constants/pagination.constants';
import type {
  PropertySearchParams,
  PropertySearchItem,
  PropertyDropdownResult,
} from '../interfaces/property-search.interface';

/**
 * Enhanced Property Search DTO with standardized validators
 * Implements all search parameters with proper validation, documentation, and type safety
 */
export class PropertySearchDto implements PropertySearchParams {
  // ========== Pagination ==========
  @IsPageField({ description: 'Page number for pagination' })
  page?: number = PAGINATION_CONSTANTS.DEFAULT_PAGE;

  @IsLimitField({
    description: 'Number of items per page',
    maxValue: 50,
  })
  limit?: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT;

  // ========== Search ==========
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

  // ========== Location-Based Search ==========
  @IsCoordinateField({ type: 'latitude' })
  latitude?: number;

  @IsCoordinateField({ type: 'longitude' })
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'validation.MUST_BE_NUMBER' })
  @Min(0.1, { message: 'validation.MIN_VALUE' })
  @Max(50, { message: 'validation.MAX_VALUE' })
  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 0.1,
    maximum: 50,
    required: false,
  })
  radius?: number;

  // ========== Dates ==========
  @IsOptional()
  @IsISO8601({}, { message: 'validation.INVALID_DATE_FORMAT' })
  @ApiProperty({
    description: 'Check-in date (ISO 8601 format)',
    example: '2024-02-15',
    required: false,
  })
  checkIn?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'validation.INVALID_DATE_FORMAT' })
  @ApiProperty({
    description: 'Check-out date (ISO 8601 format)',
    example: '2024-02-20',
    required: false,
  })
  checkOut?: string;

  // ========== Property Types ==========
  @IsOptional()
  @IsArray({ message: 'validation.MUST_BE_ARRAY' })
  @IsEnumField(PropertyType, {
    isArray: true,
    description: 'Filter by property types',
    example: [PropertyType.APARTMENT, PropertyType.HOUSE],
  })
  propertyTypes?: PropertyType[];

  @IsOptional()
  @IsArray({ message: 'validation.MUST_BE_ARRAY' })
  @IsEnumField(RoomType, {
    isArray: true,
    description: 'Filter by room types',
    example: [RoomType.ENTIRE_HOME, RoomType.PRIVATE_ROOM],
  })
  roomTypes?: RoomType[];

  // ========== Pricing ==========
  @IsPriceField({ fieldType: 'minimum' })
  minPrice?: number;

  @IsPriceField({ fieldType: 'maximum' })
  maxPrice?: number;

  @IsCurrencyCodeField({
    description: 'Currency code for price filtering',
    example: 'USD',
  })
  currency?: string;

  // ========== Guest Requirements ==========
  @IsGuestCountField({ description: 'Total number of guests' })
  guests?: number;

  @IsGuestCountField({ description: 'Number of adults' })
  adults?: number;

  @IsGuestCountField({ description: 'Number of children' })
  children?: number;

  @IsGuestCountField({ description: 'Number of infants' })
  infants?: number;

  // ========== Property Features ==========
  @IsGuestCountField({ description: 'Number of bedrooms required' })
  bedrooms?: number;

  @IsGuestCountField({ description: 'Number of beds required' })
  beds?: number;

  @IsGuestCountField({ description: 'Number of bathrooms required' })
  bathrooms?: number;

  // ========== Amenities ==========
  @IsStringArrayField({
    description: 'Required amenities',
    example: ['wifi', 'kitchen', 'parking'],
    maxItems: 20,
  })
  amenities?: string[];

  // ========== Host and Booking Preferences ==========
  @IsBooleanField({
    description: 'Show only instant bookable properties',
    example: true,
  })
  instantBookable?: boolean;

  @IsBooleanField({
    description: 'Show only superhost properties',
    example: true,
  })
  isSuperhost?: boolean;

  @IsEnumField(CancellationPolicy, {
    description: 'Preferred cancellation policy',
  })
  cancellationPolicy?: CancellationPolicy;

  // ========== Sorting ==========
  @IsEnumField({ ...PROPERTY_SORT_OPTIONS } as const, {
    description: 'Sort properties by',
    example: PROPERTY_SORT_OPTIONS.RATING_DESC,
  })
  sortBy?: string = PROPERTY_SORT_OPTIONS.DATE_DESC;

  @IsEnumField(SortDirectionEnum, {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
  })
  sortOrder?: 'asc' | 'desc' = SortDirectionEnum.DESC;
}

/**
 * Property search result item DTO
 */
export class PropertySearchItemDto implements PropertySearchItem {
  @ApiProperty({ description: 'Property ID' })
  _id: string;

  @ApiProperty({ description: 'Property name' })
  name: string;

  @ApiProperty({ description: 'Property location', required: false })
  location?: string;

  @ApiProperty({ description: 'Price per night', required: false })
  pricePerNight?: number;

  @ApiProperty({ description: 'Average rating', required: false })
  rating?: number;

  @ApiProperty({ description: 'Main image URL', required: false })
  imageUrl?: string;
}

/**
 * Property search list DTO for dropdown responses
 */
export class PropertySearchListDto implements PropertyDropdownResult {
  @ApiProperty({ description: 'Properties list', type: [PropertySearchItemDto] })
  properties: PropertySearchItemDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

/**
 * Complete property search response with pagination
 */
export class PropertySearchResponseDto extends BaseResponseDto<
  PaginatedDto<PropertySearchItemDto>
> {
  @ApiProperty({
    description: 'Paginated property search results',
    type: () => PaginatedDto<PropertySearchItemDto>,
  })
  declare data: PaginatedDto<PropertySearchItemDto>;
}

/**
 * Property dropdown response for search suggestions
 */
export class PropertyDropdownResponseDto extends BaseResponseDto<PropertySearchListDto> {
  @ApiProperty({
    description: 'Property search suggestions',
    type: PropertySearchListDto,
  })
  declare data: PropertySearchListDto;
}
