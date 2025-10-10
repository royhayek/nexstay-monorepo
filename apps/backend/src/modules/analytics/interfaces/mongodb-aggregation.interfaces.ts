import { Types } from 'mongoose';

/**
 * Interfaces for MongoDB aggregation results
 * These interfaces define the expected structure of aggregation pipeline results
 */

export interface BookingStatusAggregationResult {
  _id: string;
  count: number;
  revenue?: number;
}

export interface TopHostAggregationResult {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  totalBookings: number;
  totalRevenue: number;
  totalProperties: number;
  averageRating?: number;
  reviewCount: number;
  responseRate?: number;
  createdAt: Date;
  lastActiveAt?: Date;
  isVerified?: boolean;
}

export interface YearlyStatsAggregationResult {
  _id: number; // year
  statuses: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
}

export interface PopulatedReview {
  _id: Types.ObjectId;
  reviewer?: {
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
  property?: {
    name?: string;
    images?: Array<{ url?: string }>;
  };
  booking?: {
    confirmationCode?: string;
  };
  publicReview?: string;
  overallRating?: number;
  createdAt: Date;
}

export interface PopulatedBooking {
  _id: Types.ObjectId;
  guest?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profileImage?: string;
  };
  property?: {
    name?: string;
    images?: Array<{ url?: string }>;
    address?: {
      city?: string;
    };
  };
  checkIn?: Date;
  checkOut?: Date;
  status?: string;
  pricing?: {
    totalAmount?: number;
    currency?: string;
  };
  totalAmount?: number;
  nights?: number;
  guests?: {
    totalGuests?: number;
  };
  confirmationCode?: string;
  createdAt: Date;
}

export interface PopulatedInvoice {
  _id: Types.ObjectId;
  invoiceNumber?: string;
  bookingId?: {
    _id: Types.ObjectId;
  };
  pricing?: {
    totalAmount?: number;
    currency?: string;
  };
  status: string;
  createdAt: Date;
  dueDate?: Date;
  description?: string;
}

export interface FilterQuery {
  deletedAt?: null;
  status?: string;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  propertyId?: string;
  guestId?: string;
  hostId?: string;
  totalAmount?: {
    $gte?: number;
    $lte?: number;
  };
}
