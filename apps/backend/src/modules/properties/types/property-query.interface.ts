import { Types } from 'mongoose';

import {
  PropertyType,
  RoomType,
  CancellationPolicy,
  PropertyCategory,
  ViewType,
  ParkingType,
  CheckInMethod,
} from '../../../common/enums/property.enums';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';

export interface MongoQuery {
  'location.coordinates'?: {
    $geoWithin: {
      $centerSphere: [[number, number], number];
    };
  };
  $or?: Array<{ [key: string]: RegExp }>;
  $text?: { $search: string };
  name?: RegExp;
  _id?: { $nin: Types.ObjectId[] };
  propertyType?: PropertyType | { $in: PropertyType[] };
  roomType?: { $in: RoomType[] };
  categories?: { $in: PropertyCategory[] };
  viewType?: ViewType;
  parkingType?: ParkingType;
  checkInMethod?: CheckInMethod;
  pricePerNight?: {
    $gte?: number;
    $lte?: number;
  };
  'price.currency'?: string;
  accommodates?: { $gte: number };
  maxGuests?: { $gte: number };
  bedrooms?: number | { $gte: number };
  beds?: { $gte: number };
  bathrooms?: { $gte: number };
  amenities?: { $in: string[] };
  instantBooking?: boolean;
  isSuperhost?: boolean;
  cancellationPolicy?: CancellationPolicy;
  isActive?: boolean;
  isListed?: boolean;
  host?: Types.ObjectId;
  'address.city'?: RegExp;
  'address.country'?: RegExp;
  'address.state'?: RegExp;
  availableDates?: {
    $elemMatch: {
      $gte: Date;
      $lte: Date;
    };
  };
}

export interface UpdateBookingData {
  status?: BookingStatus;
  specialRequests?: string;
  estimatedArrivalTime?: string;
  cancellationReason?: string;
  paymentIntentId?: string;
  refundAmount?: number;
  updatedAt: Date;
  confirmedAt?: Date;
  paymentStatus?: PaymentStatus;
  cancelledAt?: Date;
  cancelledBy?: Types.ObjectId | string;
}

export interface PropertySearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  propertyType?: PropertyType[];
  roomType?: RoomType[];
  categories?: PropertyCategory[];
  viewType?: ViewType;
  parkingType?: ParkingType;
  checkInMethod?: CheckInMethod;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities?: string[];
  instantBook?: boolean;
  superhost?: boolean;
  cancellationPolicy?: CancellationPolicy;
  checkIn?: Date;
  checkOut?: Date;
}

export interface SortOptions {
  field: 'price.pricePerNight' | 'createdAt' | 'averageRating' | 'numberOfReviews';
  order: 'asc' | 'desc';
}
