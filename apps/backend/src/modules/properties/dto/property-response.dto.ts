import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';
import { UserSummaryDto } from '../../users/dto/user-response.dto';
import {
  PropertyType,
  RoomType,
  BedType,
  CancellationPolicy,
  PropertyStatus,
} from '../../../common/enums/property.enums';

export class ImageVariantResponseDto {
  @ApiProperty({ description: 'Variant storage key' })
  key: string;

  @ApiProperty({ description: 'Variant URL' })
  url: string;

  @ApiProperty({ description: 'Variant size (thumbnail, small, medium, large, original)' })
  size: string;

  @ApiPropertyOptional({ description: 'Image width in pixels' })
  width?: number;

  @ApiPropertyOptional({ description: 'Image height in pixels' })
  height?: number;

  @ApiPropertyOptional({ description: 'Content type' })
  contentType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number;
}

export class PropertyImageResponseDto {
  @ApiProperty({ description: 'Image ID' })
  _id?: string;

  @ApiProperty({ description: 'Main image URL (original or highest quality)' })
  url: string;

  @ApiProperty({ description: 'Image storage key' })
  key: string;

  @ApiPropertyOptional({ description: 'Quick access thumbnail URL' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'Quick access medium URL' })
  mediumUrl?: string;

  @ApiPropertyOptional({ description: 'Quick access large URL' })
  largeUrl?: string;

  @ApiPropertyOptional({
    description: 'All available image variants',
    type: [ImageVariantResponseDto],
  })
  @Type(() => ImageVariantResponseDto)
  variants?: ImageVariantResponseDto[];

  @ApiPropertyOptional({ description: 'Image caption' })
  caption?: string;

  @ApiProperty({ description: 'Is primary image' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Room type' })
  roomType?: string;

  @ApiPropertyOptional({ description: 'Content type' })
  contentType?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number;
}

export class PriceInfoResponseDto {
  @ApiProperty({ description: 'Base price' })
  basePrice: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Currency symbol' })
  currencySymbol: string;

  @ApiProperty({ description: 'Price per night' })
  pricePerNight: number;

  @ApiPropertyOptional({ description: 'Weekly discount' })
  weeklyDiscount?: number;

  @ApiPropertyOptional({ description: 'Monthly discount' })
  monthlyDiscount?: number;

  @ApiPropertyOptional({ description: 'Cleaning fee' })
  cleaningFee?: number;

  @ApiPropertyOptional({ description: 'Security deposit' })
  securityDeposit?: number;

  @ApiPropertyOptional({ description: 'Extra people fee' })
  extraPeopleFee?: number;
}

export class AddressResponseDto {
  @ApiProperty({ description: 'Street address', example: 'Main Street 123' })
  street: string;

  @ApiProperty({ description: 'City name', example: 'Beirut' })
  city: string;

  @ApiProperty({ description: 'State/Province', example: 'Mount Lebanon' })
  state: string;

  @ApiProperty({ description: 'Country', example: 'Lebanon' })
  country: string;

  @ApiProperty({ description: 'Country code', example: 'LB' })
  countryCode: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: '1200' })
  postalCode: string;

  @ApiPropertyOptional({ description: 'Neighborhood/Area (Mahalla)' })
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Suburb' })
  suburb?: string;

  @ApiPropertyOptional({ description: 'Government area' })
  governmentArea?: string;

  @ApiPropertyOptional({ description: 'Market area' })
  market?: string;

  @ApiPropertyOptional({ description: 'Smart location' })
  smartLocation?: string;
}

export class CoordinatesResponseDto {
  @ApiProperty({ description: 'Latitude' })
  latitude: number;

  @ApiProperty({ description: 'Longitude' })
  longitude: number;
}

export class AvailabilityInfoResponseDto {
  @ApiProperty({ description: 'Available days in 30 days' })
  availability30: number;

  @ApiProperty({ description: 'Available days in 60 days' })
  availability60: number;

  @ApiProperty({ description: 'Available days in 90 days' })
  availability90: number;

  @ApiProperty({ description: 'Available days in 365 days' })
  availability365: number;

  @ApiPropertyOptional({ description: 'Calendar last updated' })
  calendarLastScraped?: Date;

  @ApiProperty({ description: 'Has availability' })
  hasAvailability: boolean;

  @ApiPropertyOptional({ description: 'Minimum nights average in 90 days' })
  minimumMinimumNights?: number;

  @ApiPropertyOptional({ description: 'Maximum nights average in 90 days' })
  maximumMaximumNights?: number;

  @ApiPropertyOptional({ description: 'Minimum nights average in 30 days' })
  minimumNightsAvgNtm?: number;

  @ApiPropertyOptional({ description: 'Maximum nights average in 30 days' })
  maximumNightsAvgNtm?: number;
}

export class PropertyFeaturesResponseDto {
  // Safety Features
  @ApiProperty({ description: 'Has smoke detector' })
  smokeDetector: boolean;

  @ApiProperty({ description: 'Has carbon monoxide detector' })
  carbonMonoxideDetector: boolean;

  @ApiProperty({ description: 'Has fire extinguisher' })
  fireExtinguisher: boolean;

  @ApiProperty({ description: 'Has first aid kit' })
  firstAidKit: boolean;

  @ApiProperty({ description: 'Has safety card' })
  safetyCard: boolean;

  // Kitchen
  @ApiProperty({ description: 'Has kitchen' })
  kitchen: boolean;

  @ApiProperty({ description: 'Has kitchenette' })
  kitchenette: boolean;

  @ApiProperty({ description: 'Has refrigerator' })
  refrigerator: boolean;

  @ApiProperty({ description: 'Has microwave' })
  microwave: boolean;

  // Add more features as needed
  @ApiPropertyOptional({ description: 'Has WiFi' })
  wifi?: boolean;

  @ApiPropertyOptional({ description: 'Has parking' })
  parking?: boolean;

  @ApiPropertyOptional({ description: 'Has pool' })
  pool?: boolean;
}

export class ReviewScoresResponseDto {
  @ApiPropertyOptional({ description: 'Overall rating' })
  reviewScoresRating?: number;

  @ApiPropertyOptional({ description: 'Accuracy score' })
  reviewScoresAccuracy?: number;

  @ApiPropertyOptional({ description: 'Cleanliness score' })
  reviewScoresCleanliness?: number;

  @ApiPropertyOptional({ description: 'Check-in score' })
  reviewScoresCheckin?: number;

  @ApiPropertyOptional({ description: 'Communication score' })
  reviewScoresCommunication?: number;

  @ApiPropertyOptional({ description: 'Location score' })
  reviewScoresLocation?: number;

  @ApiPropertyOptional({ description: 'Value score' })
  reviewScoresValue?: number;
}

export class PropertyResponseDto {
  @ApiProperty({ description: 'Property ID' })
  _id: string;

  @ApiPropertyOptional({ description: 'Listing URL' })
  listingUrl?: string;

  @ApiProperty({ description: 'Property name' })
  name: string;

  @ApiPropertyOptional({ description: 'Property summary' })
  summary?: string;

  @ApiPropertyOptional({ description: 'Space description' })
  space?: string;

  @ApiProperty({ description: 'Property description' })
  description: string;

  @ApiPropertyOptional({ description: 'Neighborhood overview' })
  neighborhoodOverview?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Transit information' })
  transit?: string;

  @ApiPropertyOptional({ description: 'Access information' })
  access?: string;

  @ApiPropertyOptional({ description: 'Interaction information' })
  interaction?: string;

  @ApiPropertyOptional({ description: 'House rules' })
  houseRules?: string;

  @ApiProperty({ description: 'Property type', enum: PropertyType })
  propertyType: PropertyType;

  @ApiProperty({ description: 'Room type', enum: RoomType })
  roomType: RoomType;

  @ApiProperty({ description: 'Bed type', enum: BedType })
  bedType: BedType;

  @ApiProperty({ description: 'Minimum nights' })
  minimumNights: number;

  @ApiProperty({ description: 'Maximum nights' })
  maximumNights: number;

  @ApiProperty({ description: 'Cancellation policy', enum: CancellationPolicy })
  cancellationPolicy: CancellationPolicy;

  @ApiProperty({ description: 'Accommodates' })
  accommodates: number;

  @ApiProperty({ description: 'Bedrooms' })
  bedrooms: number;

  @ApiProperty({ description: 'Beds' })
  beds: number;

  @ApiProperty({ description: 'Bathrooms' })
  bathrooms: number;

  @ApiProperty({ description: 'Pricing information' })
  @Type(() => PriceInfoResponseDto)
  price: PriceInfoResponseDto;

  @ApiProperty({ description: 'Property location' })
  @Type(() => AddressResponseDto)
  address: AddressResponseDto;

  @ApiProperty({ description: 'Property coordinates' })
  @Type(() => CoordinatesResponseDto)
  coordinates: CoordinatesResponseDto;

  @ApiProperty({ description: 'Property amenities' })
  amenities: string[];

  @ApiProperty({ description: 'Property features' })
  @Type(() => PropertyFeaturesResponseDto)
  features: PropertyFeaturesResponseDto;

  @ApiProperty({ description: 'Availability information' })
  @Type(() => AvailabilityInfoResponseDto)
  availability: AvailabilityInfoResponseDto;

  @ApiPropertyOptional({ description: 'Review scores' })
  @Type(() => ReviewScoresResponseDto)
  reviewScores?: ReviewScoresResponseDto;

  @ApiProperty({ description: 'Property images', type: [PropertyImageResponseDto] })
  @Type(() => PropertyImageResponseDto)
  images: PropertyImageResponseDto[];

  @ApiProperty({ description: 'Property host information', type: UserSummaryDto })
  @Type(() => UserSummaryDto)
  host: UserSummaryDto;

  @ApiProperty({ description: 'Number of reviews' })
  numberOfReviews: number;

  @ApiPropertyOptional({ description: 'Average rating' })
  averageRating?: number;

  @ApiProperty({ description: 'Instant bookable' })
  instantBookable: boolean;

  @ApiProperty({ description: 'Property status', enum: PropertyStatus })
  status: PropertyStatus;

  @ApiProperty({ description: 'Is business travel ready' })
  isBusinessTravelReady: boolean;

  @ApiProperty({ description: 'Require guest profile picture' })
  requireGuestProfilePicture: boolean;

  @ApiProperty({ description: 'Require guest phone verification' })
  requireGuestPhoneVerification: boolean;

  @ApiProperty({ description: 'Maintenance mode' })
  maintenanceMode: boolean;

  @ApiPropertyOptional({ description: 'Maintenance start date' })
  maintenanceStart?: Date;

  @ApiPropertyOptional({ description: 'Maintenance end date' })
  maintenanceEnd?: Date;

  @ApiPropertyOptional({ description: 'Maintenance reason' })
  maintenanceReason?: string;

  @ApiPropertyOptional({ description: 'Weekly price' })
  weeklyPrice?: number;

  @ApiPropertyOptional({ description: 'Monthly price' })
  monthlyPrice?: number;

  @ApiPropertyOptional({ description: 'Security deposit' })
  securityDeposit?: number;

  @ApiPropertyOptional({ description: 'Cleaning fee' })
  cleaningFee?: number;

  @ApiPropertyOptional({ description: 'Extra people fee' })
  extraPeople?: number;

  @ApiPropertyOptional({ description: 'First review date' })
  firstReview?: Date;

  @ApiPropertyOptional({ description: 'Last review date' })
  lastReview?: Date;

  @ApiPropertyOptional({ description: 'Reviews per month' })
  reviewsPerMonth?: number;

  @ApiPropertyOptional({ description: 'Picture URL' })
  pictureUrl?: string;

  @ApiPropertyOptional({ description: 'XL Picture URL' })
  xlPictureUrl?: string;

  @ApiPropertyOptional({ description: 'Calendar last scraped' })
  calendarLastScraped?: Date;

  @ApiPropertyOptional({ description: 'Last scraped date' })
  lastScraped?: Date;

  @ApiPropertyOptional({ description: 'Calendar updated date' })
  calendarUpdated?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

// Create a concrete paginated DTO for properties to ensure proper Swagger generation
export class PropertiesPaginatedDto extends PaginatedDto<PropertyResponseDto> {
  @ApiProperty({ type: [PropertyResponseDto], description: 'Array of property items' })
  @Type(() => PropertyResponseDto)
  declare items: PropertyResponseDto[];
}

export class PropertyListResponseDto extends BaseResponseDto<PropertiesPaginatedDto> {
  @ApiProperty({
    description: 'Paginated property list data',
    type: PropertiesPaginatedDto,
  })
  declare data: PropertiesPaginatedDto;
}

export class SinglePropertyResponseDto extends BaseResponseDto<PropertyResponseDto> {
  @ApiProperty({
    description: 'Property data',
    type: PropertyResponseDto,
  })
  declare data: PropertyResponseDto;
}

export class PropertyArrayResponseDto extends BaseResponseDto<PropertyResponseDto[]> {
  @ApiProperty({
    description: 'Array of property data',
    type: [PropertyResponseDto],
  })
  declare data: PropertyResponseDto[];
}
