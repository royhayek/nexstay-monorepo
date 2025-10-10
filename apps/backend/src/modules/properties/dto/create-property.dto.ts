import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNameField,
  IsTextAreaField,
  IsUrlField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import {
  PropertyType,
  RoomType,
  BedType,
  CancellationPolicy,
} from '../../../common/enums/property.enums';
import {
  IsGuestCountField,
  IsPriceField,
  IsCoordinateField,
} from '../validators/property.validators';

export class CreateImageVariantDto {
  @ApiProperty({ description: 'Variant storage key', example: 'property/image_thumb.webp' })
  @IsString()
  key: string;

  @IsUrlField({
    required: true,
    description: 'Variant URL',
    example: 'https://s3.bucket.com/image-thumb.webp',
  })
  url: string;

  @ApiProperty({ description: 'Variant size', example: 'thumbnail' })
  @IsString()
  size: string;

  @ApiPropertyOptional({ description: 'Image width', example: 320, minimum: 1, maximum: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  width?: number;

  @ApiPropertyOptional({ description: 'Image height', example: 240, minimum: 1, maximum: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5000)
  height?: number;

  @ApiPropertyOptional({ description: 'Content type', example: 'image/webp' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', minimum: 1, maximum: 50 * 1024 * 1024 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50 * 1024 * 1024)
  fileSize?: number;
}

export class CreatePropertyImageDto {
  @IsUrlField({
    required: true,
    description: 'Main image URL',
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({ description: 'Image storage key', example: 'property/main_image.jpg' })
  @IsString()
  key: string;

  @IsUrlField({ required: false, description: 'Quick access thumbnail URL' })
  thumbnailUrl?: string;

  @IsUrlField({ required: false, description: 'Quick access medium URL' })
  mediumUrl?: string;

  @IsUrlField({ required: false, description: 'Quick access large URL' })
  largeUrl?: string;

  @ApiPropertyOptional({ description: 'Image variants', type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateImageVariantDto)
  variants?: CreateImageVariantDto[];

  @ApiPropertyOptional({ description: 'Image caption' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ description: 'Is primary image', example: false })
  @IsBoolean()
  isPrimary: boolean;

  @ApiPropertyOptional({ description: 'Sort order', example: 0, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Room type', example: 'bedroom' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ description: 'Content type', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes', minimum: 1, maximum: 50 * 1024 * 1024 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50 * 1024 * 1024)
  fileSize?: number;
}

export class CreatePriceInfoDto {
  @IsPriceField({ fieldType: 'base', description: 'Base price per night', example: 150 })
  basePrice: number;

  @ApiProperty({ description: 'Currency code', example: 'USD', minLength: 3, maxLength: 3 })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Currency symbol', example: '$', maxLength: 5 })
  @IsString()
  currencySymbol: string;

  @IsPriceField({ fieldType: 'perNight', description: 'Price per night', example: 150 })
  pricePerNight: number;

  @ApiPropertyOptional({
    description: 'Weekly discount percentage',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weeklyDiscount?: number;

  @ApiPropertyOptional({
    description: 'Monthly discount percentage',
    example: 20,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  monthlyDiscount?: number;

  @IsPriceField({ fieldType: 'fee', required: false, description: 'Cleaning fee', example: 50 })
  cleaningFee?: number;

  @IsPriceField({
    fieldType: 'deposit',
    required: false,
    description: 'Security deposit',
    example: 200,
  })
  securityDeposit?: number;

  @IsPriceField({ fieldType: 'fee', required: false, description: 'Extra people fee', example: 25 })
  extraPeopleFee?: number;
}

export class CreateLocationDto {
  @ApiProperty({ description: 'Location type', example: 'Point' })
  @IsString()
  type: string;

  @IsCoordinateField({
    type: 'coordinates',
    description: 'Coordinates [longitude, latitude]',
    example: [35.5018, 33.8938],
  })
  coordinates: [number, number];
}

export class CreateAddressDto {
  @IsNameField({ required: true, description: 'Street address', example: 'Main Street 123' })
  street: string;

  @IsNameField({ required: true, description: 'City name', example: 'Beirut' })
  city: string;

  @IsNameField({ required: true, description: 'State/Province', example: 'Mount Lebanon' })
  state: string;

  @IsNameField({ required: true, description: 'Country', example: 'Lebanon' })
  country: string;

  @ApiProperty({ description: 'Country code', example: 'LB', minLength: 2, maxLength: 2 })
  @IsString()
  countryCode: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: '1200' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ description: 'Neighborhood/Area (Mahalla)' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Suburb' })
  @IsOptional()
  @IsString()
  suburb?: string;

  @ApiPropertyOptional({ description: 'Government area' })
  @IsOptional()
  @IsString()
  governmentArea?: string;

  @ApiPropertyOptional({ description: 'Market area' })
  @IsOptional()
  @IsString()
  market?: string;

  @ApiPropertyOptional({ description: 'Smart location' })
  @IsOptional()
  @IsString()
  smartLocation?: string;
}

export class CreateCoordinatesDto {
  @IsCoordinateField({ type: 'latitude' })
  latitude: number;

  @IsCoordinateField({ type: 'longitude' })
  longitude: number;
}

export class CreatePropertyFeaturesDto {
  // Safety Features
  @ApiPropertyOptional({ description: 'Has smoke detector', example: true })
  @IsOptional()
  @IsBoolean()
  smokeDetector?: boolean;

  @ApiPropertyOptional({ description: 'Has carbon monoxide detector', example: true })
  @IsOptional()
  @IsBoolean()
  carbonMonoxideDetector?: boolean;

  @ApiPropertyOptional({ description: 'Has fire extinguisher', example: true })
  @IsOptional()
  @IsBoolean()
  fireExtinguisher?: boolean;

  @ApiPropertyOptional({ description: 'Has first aid kit', example: false })
  @IsOptional()
  @IsBoolean()
  firstAidKit?: boolean;

  @ApiPropertyOptional({ description: 'Has safety card', example: false })
  @IsOptional()
  @IsBoolean()
  safetyCard?: boolean;

  // Kitchen Features
  @ApiPropertyOptional({ description: 'Has kitchen', example: true })
  @IsOptional()
  @IsBoolean()
  kitchen?: boolean;

  @ApiPropertyOptional({ description: 'Has kitchenette', example: false })
  @IsOptional()
  @IsBoolean()
  kitchenette?: boolean;

  @ApiPropertyOptional({ description: 'Has refrigerator', example: true })
  @IsOptional()
  @IsBoolean()
  refrigerator?: boolean;

  @ApiPropertyOptional({ description: 'Has microwave', example: true })
  @IsOptional()
  @IsBoolean()
  microwave?: boolean;

  @ApiPropertyOptional({ description: 'Has dishwasher', example: false })
  @IsOptional()
  @IsBoolean()
  dishwasher?: boolean;

  @ApiPropertyOptional({ description: 'Has coffee maker', example: true })
  @IsOptional()
  @IsBoolean()
  coffeeMaker?: boolean;

  // Technology Features
  @ApiPropertyOptional({ description: 'Has WiFi', example: true })
  @IsOptional()
  @IsBoolean()
  wifi?: boolean;

  @ApiPropertyOptional({ description: 'Has internet', example: true })
  @IsOptional()
  @IsBoolean()
  internet?: boolean;

  @ApiPropertyOptional({ description: 'Has cable TV', example: true })
  @IsOptional()
  @IsBoolean()
  cableTv?: boolean;

  // Climate Control
  @ApiPropertyOptional({ description: 'Has air conditioning', example: true })
  @IsOptional()
  @IsBoolean()
  airConditioning?: boolean;

  @ApiPropertyOptional({ description: 'Has heating', example: true })
  @IsOptional()
  @IsBoolean()
  heating?: boolean;

  @ApiPropertyOptional({ description: 'Has hot water', example: true })
  @IsOptional()
  @IsBoolean()
  hotWater?: boolean;

  // Outdoor Features
  @ApiPropertyOptional({ description: 'Has balcony', example: false })
  @IsOptional()
  @IsBoolean()
  balcony?: boolean;

  @ApiPropertyOptional({ description: 'Has patio', example: true })
  @IsOptional()
  @IsBoolean()
  patio?: boolean;

  @ApiPropertyOptional({ description: 'Has garden', example: false })
  @IsOptional()
  @IsBoolean()
  garden?: boolean;

  @ApiPropertyOptional({ description: 'Has pool', example: false })
  @IsOptional()
  @IsBoolean()
  pool?: boolean;

  @ApiPropertyOptional({ description: 'Has hot tub', example: false })
  @IsOptional()
  @IsBoolean()
  hotTub?: boolean;

  // Parking Features
  @ApiPropertyOptional({ description: 'Has free parking', example: true })
  @IsOptional()
  @IsBoolean()
  freeParking?: boolean;

  @ApiPropertyOptional({ description: 'Has paid parking', example: false })
  @IsOptional()
  @IsBoolean()
  paidParking?: boolean;

  @ApiPropertyOptional({ description: 'Has street parking', example: false })
  @IsOptional()
  @IsBoolean()
  streetParking?: boolean;

  // Family Features
  @ApiPropertyOptional({ description: 'Is family/kid friendly', example: true })
  @IsOptional()
  @IsBoolean()
  familyKidFriendly?: boolean;

  @ApiPropertyOptional({ description: 'Has crib', example: false })
  @IsOptional()
  @IsBoolean()
  crib?: boolean;

  @ApiPropertyOptional({ description: 'Has high chair', example: false })
  @IsOptional()
  @IsBoolean()
  highChair?: boolean;

  // Accessibility Features
  @ApiPropertyOptional({ description: 'Is wheelchair accessible', example: false })
  @IsOptional()
  @IsBoolean()
  wheelchairAccessible?: boolean;

  @ApiPropertyOptional({ description: 'Has elevator in building', example: true })
  @IsOptional()
  @IsBoolean()
  elevatorInBuilding?: boolean;

  // Work Features
  @ApiPropertyOptional({ description: 'Has laptop friendly workspace', example: true })
  @IsOptional()
  @IsBoolean()
  laptopFriendlyWorkspace?: boolean;

  @ApiPropertyOptional({ description: 'Is suitable for events', example: false })
  @IsOptional()
  @IsBoolean()
  suitableForEvents?: boolean;

  // Pet Features
  @ApiPropertyOptional({ description: 'Pets allowed', example: false })
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ description: 'Pets live on property', example: false })
  @IsOptional()
  @IsBoolean()
  petsLiveOnProperty?: boolean;

  @ApiPropertyOptional({ description: 'Dog allowed', example: false })
  @IsOptional()
  @IsBoolean()
  dog?: boolean;

  @ApiPropertyOptional({ description: 'Cat allowed', example: false })
  @IsOptional()
  @IsBoolean()
  cat?: boolean;

  @ApiPropertyOptional({ description: 'Smoking allowed', example: false })
  @IsOptional()
  @IsBoolean()
  smokingAllowed?: boolean;
}

export class CreateAvailabilityInfoDto {
  @ApiProperty({
    description: 'Availability in next 30 days',
    example: 25,
    minimum: 0,
    maximum: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(30)
  availability30: number;

  @ApiProperty({
    description: 'Availability in next 60 days',
    example: 50,
    minimum: 0,
    maximum: 60,
  })
  @IsNumber()
  @Min(0)
  @Max(60)
  availability60: number;

  @ApiProperty({
    description: 'Availability in next 90 days',
    example: 75,
    minimum: 0,
    maximum: 90,
  })
  @IsNumber()
  @Min(0)
  @Max(90)
  availability90: number;

  @ApiProperty({
    description: 'Availability in next 365 days',
    example: 300,
    minimum: 0,
    maximum: 365,
  })
  @IsNumber()
  @Min(0)
  @Max(365)
  availability365: number;

  @ApiProperty({ description: 'Has availability', example: true })
  @IsBoolean()
  hasAvailability: boolean;
}

export class CreatePropertyDto {
  @IsNameField({
    required: true,
    description: 'Property name',
    example: 'Beautiful Downtown Apartment',
  })
  name: string;

  @IsTextAreaField({ required: false, description: 'Property summary' })
  summary?: string;

  @IsTextAreaField({ required: false, description: 'Space description' })
  space?: string;

  @IsTextAreaField({ required: true, description: 'Full property description' })
  description: string;

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

  @IsEnumField(PropertyType, { description: 'Property type' })
  propertyType: PropertyType;

  @IsEnumField(RoomType, { description: 'Room type' })
  roomType: RoomType;

  @IsEnumField(BedType, { description: 'Bed type' })
  bedType: BedType;

  @ApiProperty({ description: 'Minimum nights', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  minimumNights: number;

  @ApiProperty({ description: 'Maximum nights', example: 30, minimum: 1 })
  @IsNumber()
  @Min(1)
  maximumNights: number;

  @IsEnumField(CancellationPolicy, { description: 'Cancellation policy' })
  cancellationPolicy: CancellationPolicy;

  @IsGuestCountField({ description: 'Number of guests accommodated' })
  accommodates: number;

  @IsGuestCountField({ description: 'Number of bedrooms', allowZero: true })
  bedrooms: number;

  @IsGuestCountField({ description: 'Number of beds' })
  beds: number;

  @IsGuestCountField({ description: 'Number of bathrooms' })
  bathrooms: number;

  @ApiProperty({ description: 'Property pricing information', type: CreatePriceInfoDto })
  @ValidateNested()
  @Type(() => CreatePriceInfoDto)
  price: CreatePriceInfoDto;

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

  @ApiPropertyOptional({ description: 'Property images', type: [CreatePropertyImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePropertyImageDto)
  images?: CreatePropertyImageDto[];

  @ApiProperty({
    description: 'Property availability information',
    type: CreateAvailabilityInfoDto,
  })
  @ValidateNested()
  @Type(() => CreateAvailabilityInfoDto)
  availability: CreateAvailabilityInfoDto;

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
}
