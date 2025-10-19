import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PropertyStatus,
  PropertyCategory,
  ViewType,
  ParkingType,
  CheckInMethod,
} from '../../common/enums/property.enums';

export type PropertyDocument = Property & Document;

/**
 * Image Variant Schema for responsive images
 */
@Schema({ _id: false })
export class ImageVariant {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  size: string; // 'thumbnail' | 'small' | 'medium' | 'large' | 'original'

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  contentType?: string;

  @Prop()
  fileSize?: number;
}

export const ImageVariantSchema = SchemaFactory.createForClass(ImageVariant);

/**
 * Property Image Schema
 */
@Schema({ _id: false })
export class PropertyImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  key: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  mediumUrl?: string;

  @Prop()
  largeUrl?: string;

  @Prop({ type: [ImageVariantSchema], default: [] })
  variants: ImageVariant[];

  @Prop()
  caption?: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop()
  roomType?: string;

  @Prop()
  contentType?: string;

  @Prop()
  fileSize?: number;
}

export const PropertyImageSchema = SchemaFactory.createForClass(PropertyImage);

/**
 * Price Information Schema
 */
@Schema({ _id: false })
export class PriceInfo {
  @Prop({ required: true })
  basePrice: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, default: '$' })
  currencySymbol: string;

  @Prop({ required: true })
  pricePerNight: number;

  @Prop()
  weeklyDiscount?: number;

  @Prop()
  monthlyDiscount?: number;

  @Prop()
  cleaningFee?: number;

  @Prop()
  serviceFee?: number;

  @Prop()
  extraPeople?: number;

  @Prop()
  securityDeposit?: number;
}

export const PriceInfoSchema = SchemaFactory.createForClass(PriceInfo);

/**
 * Address Schema
 */
@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  countryCode: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop()
  neighborhood?: string;

  @Prop()
  suburb?: string;

  @Prop()
  governmentArea?: string;

  @Prop()
  market?: string;

  @Prop()
  smartLocation?: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

/**
 * Coordinates Schema
 */
@Schema({ _id: false })
export class Coordinates {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: false })
  isExactLocation: boolean;
}

export const CoordinatesSchema = SchemaFactory.createForClass(Coordinates);

/**
 * Property Features Schema
 */
@Schema({ _id: false })
export class PropertyFeatures {
  @Prop({ default: false })
  instantBookable: boolean;

  @Prop({ default: false })
  isBusinessTravelReady: boolean;

  @Prop({ default: false })
  allowsPets: boolean;

  @Prop({ default: false })
  allowsSmoking: boolean;

  @Prop({ default: false })
  allowsEvents: boolean;

  @Prop({ default: false })
  hasWifi: boolean;

  @Prop({ default: false })
  hasParking: boolean;

  @Prop({ default: false })
  hasPool: boolean;

  @Prop({ default: false })
  hasGym: boolean;

  @Prop({ default: false })
  hasKitchen: boolean;

  @Prop({ default: false })
  hasWasher: boolean;

  @Prop({ default: false })
  hasDryer: boolean;

  @Prop({ default: false })
  hasAirConditioning: boolean;

  @Prop({ default: false })
  hasHeating: boolean;

  @Prop({ default: false })
  hasTv: boolean;

  @Prop({ default: false })
  hasElevator: boolean;

  @Prop({ default: false })
  wheelchairAccessible: boolean;
}

export const PropertyFeaturesSchema = SchemaFactory.createForClass(PropertyFeatures);

/**
 * Availability Information Schema
 */
@Schema({ _id: false })
export class AvailabilityInfo {
  @Prop({ default: 30 })
  availability30: number;

  @Prop({ default: 60 })
  availability60: number;

  @Prop({ default: 90 })
  availability90: number;

  @Prop({ default: 365 })
  availability365: number;

  @Prop({ default: true })
  hasAvailability: boolean;

  @Prop()
  calendarUpdatedAt?: Date;
}

export const AvailabilityInfoSchema = SchemaFactory.createForClass(AvailabilityInfo);

/**
 * Review Scores Schema
 */
@Schema({ _id: false })
export class ReviewScores {
  @Prop()
  reviewScoresRating?: number;

  @Prop()
  reviewScoresAccuracy?: number;

  @Prop()
  reviewScoresCleanliness?: number;

  @Prop()
  reviewScoresCheckin?: number;

  @Prop()
  reviewScoresCommunication?: number;

  @Prop()
  reviewScoresLocation?: number;

  @Prop()
  reviewScoresValue?: number;
}

export const ReviewScoresSchema = SchemaFactory.createForClass(ReviewScores);

/**
 * Main Property Schema
 */
@Schema({ timestamps: true, collection: 'properties' })
export class Property {
  // Basic Information
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  summary?: string;

  @Prop()
  space?: string;

  @Prop()
  neighborhood?: string;

  @Prop()
  transit?: string;

  @Prop()
  access?: string;

  @Prop()
  interaction?: string;

  @Prop()
  houseRules?: string;

  @Prop()
  notes?: string;

  // Property Type & Classification (validated against catalog items)
  @Prop({ required: true, type: String })
  propertyType: string;

  @Prop({ required: true, type: String })
  roomType: string;

  @Prop({ required: true, type: String })
  bedType: string;

  @Prop({ type: [String], enum: PropertyCategory, default: [] })
  categories: PropertyCategory[];

  // New property attributes (Phase 1)
  @Prop({ type: String, enum: ViewType })
  viewType?: ViewType;

  @Prop({ type: String, enum: ParkingType })
  parkingType?: ParkingType;

  @Prop({ type: String, enum: CheckInMethod })
  checkInMethod?: CheckInMethod;

  @Prop({ required: true, min: 1, default: 1 })
  minimumNights: number;

  @Prop({ required: true, min: 1, default: 30 })
  maximumNights: number;

  @Prop({ required: true, type: String })
  cancellationPolicy: string;

  // Capacity
  @Prop({ required: true, min: 1 })
  accommodates: number;

  @Prop({ required: true, min: 0 })
  bedrooms: number;

  @Prop({ required: true, min: 1 })
  beds: number;

  @Prop({ required: true, min: 0 })
  bathrooms: number;

  @Prop({ required: true, min: 1, default: 1 })
  maxGuests: number;

  // Pricing
  @Prop({ type: PriceInfoSchema, required: true })
  price: PriceInfo;

  @Prop({ required: true })
  pricePerNight: number;

  @Prop()
  weeklyPrice?: number;

  @Prop()
  monthlyPrice?: number;

  @Prop()
  cleaningFee?: number;

  @Prop()
  serviceFee?: number;

  @Prop()
  securityDeposit?: number;

  @Prop()
  extraPeople?: number;

  // Location
  @Prop({ type: AddressSchema, required: true })
  address: Address;

  @Prop({ type: CoordinatesSchema, required: true })
  coordinates: Coordinates;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  // Amenities & Features
  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: PropertyFeaturesSchema, required: true })
  features: PropertyFeatures;

  // Images & Media
  @Prop({ type: [PropertyImageSchema], default: [] })
  images: PropertyImage[];

  @Prop()
  pictureUrl?: string;

  @Prop()
  xlPictureUrl?: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop()
  mediumUrl?: string;

  // Availability & Calendar
  @Prop({ type: AvailabilityInfoSchema, required: true })
  availability: AvailabilityInfo;

  @Prop({ type: [Date], default: [] })
  availableDates: Date[];

  @Prop()
  calendarLastScraped?: Date;

  // Host Information
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  // Reviews & Ratings
  @Prop({ type: [Types.ObjectId], ref: 'Review', default: [] })
  reviews: Types.ObjectId[];

  @Prop({ type: ReviewScoresSchema })
  reviewScores?: ReviewScores;

  @Prop({ default: 0 })
  numberOfReviews: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ min: 0, max: 5, default: 0 })
  rating: number;

  @Prop()
  firstReview?: Date;

  @Prop()
  lastReview?: Date;

  // Status & Verification
  @Prop({ type: String, enum: PropertyStatus, default: PropertyStatus.DRAFT })
  status: PropertyStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verifiedAt?: Date;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isListed: boolean;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop({ default: 0 })
  reportCount: number;

  @Prop({ type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' })
  moderationStatus: string;

  @Prop()
  moderatedAt?: Date;

  @Prop()
  moderationReason?: string;

  // Booking & Statistics
  @Prop({ default: 0 })
  bookingCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  savedCount: number;

  @Prop({ default: true })
  instantBooking: boolean;

  @Prop({ default: false })
  isSuperhost: boolean;

  // SEO & External
  @Prop()
  listingUrl?: string;

  @Prop()
  slug?: string;

  @Prop()
  externalId?: string;

  @Prop()
  lastScraped?: Date;

  // Metadata
  @Prop()
  source?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  deletedAt?: Date;

  // Timestamps added by schema options
  createdAt?: Date;
  updatedAt?: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Add indexes
PropertySchema.index({ location: '2dsphere' });
PropertySchema.index({ hostId: 1 });
PropertySchema.index({ status: 1 }); // Index for the new status field
PropertySchema.index({ isActive: 1, isListed: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ categories: 1 }); // Index for categories filtering
PropertySchema.index({ 'address.city': 1, 'address.country': 1 });
PropertySchema.index({ pricePerNight: 1 });
PropertySchema.index({ rating: -1 });
PropertySchema.index({ createdAt: -1 });
PropertySchema.index({ slug: 1 }, { unique: true, sparse: true });
// Phase 1: New indexes for enhanced filtering
PropertySchema.index({ viewType: 1 });
PropertySchema.index({ parkingType: 1 });
PropertySchema.index({ checkInMethod: 1 });
// Text index for full-text search on name and description
PropertySchema.index({ name: 'text', description: 'text', title: 'text' });

// Virtual for full address
PropertySchema.virtual('fullAddress').get(function () {
  const addr = this.address;
  if (!addr) return '';
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.postalCode}, ${addr.country}`;
});

// Virtual for host population
PropertySchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

// Transform to ensure status field is always present and include virtuals
PropertySchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Ensure status field exists with default value
    if (!ret.status) {
      ret.status = PropertyStatus.DRAFT;
    }
    return ret;
  },
});

PropertySchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    // Ensure status field exists with default value
    if (!ret.status) {
      ret.status = PropertyStatus.DRAFT;
    }
    return ret;
  },
});

// Export type for ImageSchema (used by management service)
export type ImageSchema = PropertyImage;
