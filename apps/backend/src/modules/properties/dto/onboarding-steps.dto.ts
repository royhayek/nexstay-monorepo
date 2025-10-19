import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsString, Min, ValidateNested, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNameField,
  IsTextAreaField,
} from '../../../common/validators/standardized-validators';
import { IsCatalogField } from '../../../common/validators/catalog.validators';
import {
  IsGuestCountField,
  IsPriceField,
  IsCoordinateField,
} from '../validators/property.validators';
import {
  CreatePropertyImageDto,
  CreatePriceInfoDto,
  CreateAddressDto,
  CreateCoordinatesDto,
  CreateLocationDto,
  CreatePropertyFeaturesDto,
  CreateAvailabilityInfoDto,
} from './create-property.dto';

/**
 * Step 1: Basic Information
 * Property type, room type, name, and description
 */
export class OnboardingStep1Dto {
  @IsCatalogField('PropertyType', { description: 'Property type', example: 'APARTMENT' })
  propertyType: string;

  @IsCatalogField('RoomType', { description: 'Room type', example: 'ENTIRE_HOME' })
  roomType: string;

  @IsNameField({
    required: true,
    description: 'Property name',
    example: 'Beautiful Downtown Apartment',
  })
  name: string;

  @IsTextAreaField({ required: true, description: 'Full property description' })
  description: string;

  @IsTextAreaField({ required: false, description: 'Property summary' })
  summary?: string;
}

/**
 * Step 2: Location & Address
 * Full address and geographical coordinates
 */
export class OnboardingStep2Dto {
  @ApiProperty({ description: 'Property address', type: CreateAddressDto })
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address: CreateAddressDto;

  @ApiProperty({ description: 'Property coordinates', type: CreateCoordinatesDto })
  @ValidateNested()
  @Type(() => CreateCoordinatesDto)
  coordinates: CreateCoordinatesDto;

  @ApiProperty({
    description: 'GeoJSON location for spatial queries',
    type: CreateLocationDto,
    example: { type: 'Point', coordinates: [35.5018, 33.8938] },
  })
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location: CreateLocationDto;

  @IsTextAreaField({ required: false, description: 'Neighborhood overview' })
  neighborhoodOverview?: string;

  @IsTextAreaField({ required: false, description: 'Transit information' })
  transit?: string;
}

/**
 * Step 3: Property Details
 * Bedrooms, bathrooms, guests, and bed configuration
 */
export class OnboardingStep3Dto {
  @IsGuestCountField({ description: 'Number of guests accommodated' })
  accommodates: number;

  @IsGuestCountField({ description: 'Number of bedrooms', allowZero: true })
  bedrooms: number;

  @IsGuestCountField({ description: 'Number of beds' })
  beds: number;

  @IsGuestCountField({ description: 'Number of bathrooms' })
  bathrooms: number;

  @IsCatalogField('BedType', { description: 'Bed type', example: 'QUEEN' })
  bedType: string;

  @IsTextAreaField({ required: false, description: 'Space description' })
  space?: string;
}

/**
 * Step 4: Amenities & Features
 * All amenities and property features
 */
export class OnboardingStep4Dto {
  @ApiProperty({
    description: 'Property amenities',
    type: [String],
    example: ['WiFi', 'Kitchen', 'Air conditioning'],
  })
  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @ApiProperty({ description: 'Property features and amenities', type: CreatePropertyFeaturesDto })
  @ValidateNested()
  @Type(() => CreatePropertyFeaturesDto)
  features: CreatePropertyFeaturesDto;
}

/**
 * Step 5: Photos
 * Property images (minimum 5 required)
 */
export class OnboardingStep5Dto {
  @ApiProperty({
    description: 'Property images (minimum 5 required)',
    type: [CreatePropertyImageDto],
    minItems: 5,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyImageDto)
  images: CreatePropertyImageDto[];
}

/**
 * Step 6: Pricing
 * Pricing information, discounts, and fees
 */
export class OnboardingStep6Dto {
  @ApiProperty({ description: 'Property pricing information', type: CreatePriceInfoDto })
  @ValidateNested()
  @Type(() => CreatePriceInfoDto)
  price: CreatePriceInfoDto;
}

/**
 * Step 7: Availability & Rules
 * Booking rules, cancellation policy, house rules, and availability
 */
export class OnboardingStep7Dto {
  @ApiProperty({ description: 'Minimum nights', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  minimumNights: number;

  @ApiProperty({ description: 'Maximum nights', example: 30, minimum: 1 })
  @IsNumber()
  @Min(1)
  maximumNights: number;

  @IsCatalogField('CancellationPolicy', {
    description: 'Cancellation policy',
    example: 'FLEXIBLE',
  })
  cancellationPolicy: string;

  @IsTextAreaField({ required: false, description: 'House rules' })
  houseRules?: string;

  @IsTextAreaField({ required: false, description: 'Access instructions' })
  access?: string;

  @IsTextAreaField({ required: false, description: 'Host interaction style' })
  interaction?: string;

  @IsTextAreaField({ required: false, description: 'Notes for guests' })
  notes?: string;

  @ApiProperty({ description: 'Instant bookable', example: false })
  @IsBoolean()
  instantBookable: boolean;

  @ApiProperty({ description: 'Business travel ready', example: false })
  @IsBoolean()
  isBusinessTravelReady: boolean;

  @ApiProperty({ description: 'Require guest profile picture', example: false })
  @IsBoolean()
  requireGuestProfilePicture: boolean;

  @ApiProperty({ description: 'Require guest phone verification', example: true })
  @IsBoolean()
  requireGuestPhoneVerification: boolean;

  @ApiProperty({
    description: 'Property availability information',
    type: CreateAvailabilityInfoDto,
  })
  @ValidateNested()
  @Type(() => CreateAvailabilityInfoDto)
  availability: CreateAvailabilityInfoDto;
}

/**
 * Onboarding Progress Response
 */
export class OnboardingProgressDataDto {
  @ApiProperty({ description: 'Onboarding ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Current step', enum: [
    'basic_info',
    'location',
    'property_details',
    'amenities',
    'photos',
    'pricing',
    'availability_rules',
    'completed',
  ] })
  currentStep: string;

  @ApiProperty({ description: 'Completed steps', type: [String] })
  completedSteps: string[];

  @ApiProperty({ description: 'Is onboarding completed', example: false })
  isCompleted: boolean;

  @ApiPropertyOptional({ description: 'Saved data for each step', type: Object })
  savedData?: {
    basicInfo?: OnboardingStep1Dto;
    location?: OnboardingStep2Dto;
    propertyDetails?: OnboardingStep3Dto;
    amenities?: OnboardingStep4Dto;
    photos?: OnboardingStep5Dto;
    pricing?: OnboardingStep6Dto;
    availabilityRules?: OnboardingStep7Dto;
  };

  @ApiPropertyOptional({ description: 'Created property ID', example: '507f1f77bcf86cd799439011' })
  createdPropertyId?: string;
}

/**
 * Complete Onboarding DTO
 * Used when host wants to publish the listing
 */
export class CompleteOnboardingDto {
  @ApiProperty({
    description: 'Confirm all information is correct and publish listing',
    example: true,
  })
  @IsBoolean()
  confirmAndPublish: boolean;
}
