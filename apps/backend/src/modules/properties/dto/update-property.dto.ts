import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional, IsArray } from 'class-validator';
import {
  IsNameField,
  IsTextAreaField,
  IsStringArrayField,
  IsNumberField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import { IsCatalogField } from '../../../common/validators/catalog.validators';
import { IsGuestCountField } from '../validators/property.validators';
import {
  CreatePropertyImageDto,
  CreatePriceInfoDto,
  CreateAddressDto,
  CreateCoordinatesDto,
  CreatePropertyFeaturesDto,
  CreateAvailabilityInfoDto,
} from './create-property.dto';

export class UpdatePropertyDto {
  @IsNameField({
    required: false,
    description: 'Property name',
    example: 'Beautiful Downtown Apartment',
  })
  name?: string;

  @IsTextAreaField({ required: false, description: 'Property summary' })
  summary?: string;

  @IsTextAreaField({ required: false, description: 'Space description' })
  space?: string;

  @IsTextAreaField({ required: false, description: 'Full property description' })
  description?: string;

  @IsTextAreaField({ required: false, description: 'Neighborhood overview' })
  neighborhoodOverview?: string;

  @IsTextAreaField({ required: false, description: 'Notes for guests' })
  notes?: string;

  @IsTextAreaField({ required: false, description: 'Transit information' })
  transit?: string;

  @IsTextAreaField({ required: false, description: 'Access instructions' })
  access?: string;

  @IsTextAreaField({ required: false, description: 'Host interaction style' })
  interaction?: string;

  @IsTextAreaField({ required: false, description: 'House rules' })
  houseRules?: string;

  @IsCatalogField('PropertyType', { required: false, description: 'Property type', example: 'APARTMENT' })
  propertyType?: string;

  @IsCatalogField('RoomType', { required: false, description: 'Room type', example: 'ENTIRE_HOME' })
  roomType?: string;

  @IsCatalogField('BedType', { required: false, description: 'Bed type', example: 'QUEEN' })
  bedType?: string;

  @IsNumberField({
    required: false,
    description: 'Minimum nights',
    example: 1,
    minValue: 1,
  })
  minimumNights?: number;

  @IsNumberField({
    required: false,
    description: 'Maximum nights',
    example: 30,
    minValue: 1,
  })
  maximumNights?: number;

  @IsCatalogField('CancellationPolicy', { required: false, description: 'Cancellation policy', example: 'FLEXIBLE' })
  cancellationPolicy?: string;

  @IsGuestCountField({ required: false, description: 'Number of guests accommodated' })
  accommodates?: number;

  @IsGuestCountField({ required: false, description: 'Number of bedrooms', allowZero: true })
  bedrooms?: number;

  @IsGuestCountField({ required: false, description: 'Number of beds' })
  beds?: number;

  @IsGuestCountField({ required: false, description: 'Number of bathrooms' })
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Price information', type: CreatePriceInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePriceInfoDto)
  price?: CreatePriceInfoDto;

  @ApiPropertyOptional({ description: 'Property address', type: CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiPropertyOptional({ description: 'Property coordinates', type: CreateCoordinatesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCoordinatesDto)
  coordinates?: CreateCoordinatesDto;

  @IsStringArrayField({
    required: false,
    description: 'Property amenities',
    example: ['WiFi', 'Kitchen', 'Air conditioning'],
  })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Property features', type: CreatePropertyFeaturesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePropertyFeaturesDto)
  features?: CreatePropertyFeaturesDto;

  @ApiPropertyOptional({ description: 'Property images', type: [CreatePropertyImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyImageDto)
  images?: CreatePropertyImageDto[];

  @ApiPropertyOptional({ description: 'Availability information', type: CreateAvailabilityInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAvailabilityInfoDto)
  availability?: CreateAvailabilityInfoDto;

  @IsBooleanField({
    required: false,
    description: 'Instant bookable',
    example: false,
  })
  instantBookable?: boolean;

  @IsBooleanField({
    required: false,
    description: 'Business travel ready',
    example: false,
  })
  isBusinessTravelReady?: boolean;

  @IsBooleanField({
    required: false,
    description: 'Require guest profile picture',
    example: false,
  })
  requireGuestProfilePicture?: boolean;

  @IsBooleanField({
    required: false,
    description: 'Require guest phone verification',
    example: true,
  })
  requireGuestPhoneVerification?: boolean;
}
