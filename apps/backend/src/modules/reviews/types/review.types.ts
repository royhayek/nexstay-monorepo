import { Types, FilterQuery } from 'mongoose';
import { ReviewDocument } from '../../../database/schemas/review.schema';
import { PropertyDocument } from '../../../database/schemas/property.schema';
import { UserDocument } from '../../../database/schemas/user.schema';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { ReviewType } from '../../../common/enums/property.enums';

/**
 * Query interface for review database operations
 */
export interface ReviewQuery extends FilterQuery<ReviewDocument> {
  propertyId?: Types.ObjectId;
  reviewerId?: Types.ObjectId;
  revieweeId?: Types.ObjectId;
  reviewType?: ReviewType;
  overallRating?: {
    $gte?: number;
    $lte?: number;
  };
  isFlagged?: boolean;
  isApproved?: boolean;
  isHidden?: { $ne: boolean } | boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  $or?: Array<{
    publicReview?: { $regex: string; $options: string };
    privateFeedback?: { $regex: string; $options: string };
    moderationReason?: { $regex: string; $options: string };
  }>;
}

/**
 * Update data structure for review moderation
 */
export interface ReviewUpdateData {
  moderatedBy: Types.ObjectId;
  moderatedAt: Date;
  moderationReason?: string;
  updatedAt: Date;
  isApproved?: boolean;
  isFlagged?: boolean;
  isHidden?: boolean;
}

/**
 * Aggregation result for review statistics
 */
export interface AggregationResult {
  _id: number | null;
  averageRating?: number;
  count?: number;
}

/**
 * Property average calculation result
 */
export interface PropertyAverageResult {
  _id: null;
  totalReviews: number;
  averageRating?: number;
  averageAccuracy?: number;
  averageCommunication?: number;
  averageCleanliness?: number;
  averageLocation?: number;
  averageCheckIn?: number;
  averageValue?: number;
}

/**
 * Review fields for average calculation
 */
export interface ReviewRatings {
  overallRating?: number;
  accuracy?: number;
  communication?: number;
  cleanliness?: number;
  location?: number;
  checkIn?: number;
  value?: number;
}

/**
 * Paginated review result
 */
export interface PaginatedReviewResult<T = ReviewDocument> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Review averages result
 */
export interface ReviewAverages {
  totalReviews: number;
  averageRating?: number;
  averageOverallRating?: number;
  averageAccuracy?: number;
  averageCommunication?: number;
  averageCleanliness?: number;
  averageLocation?: number;
  averageCheckIn?: number;
  averageValue?: number;
}

/**
 * Populated Review Document with virtual fields
 */
export interface PopulatedReviewDocument extends ReviewDocument {
  property?: PropertyDocument;
  booking?: BookingDocument;
  reviewer?: UserDocument;
  reviewee?: UserDocument;
  moderator?: UserDocument;
}

/**
 * Lean review document with populated reviewer (for public API)
 */
export interface LeanPopulatedReview {
  _id: unknown;
  propertyId: unknown;
  bookingId: unknown;
  reviewerId: unknown;
  revieweeId: unknown;
  reviewType: ReviewType;
  overallRating?: number;
  accuracy?: number;
  communication?: number;
  cleanliness?: number;
  location?: number;
  checkIn?: number;
  value?: number;
  publicReview?: string;
  privateFeedback?: string;
  isFlagged: boolean;
  isApproved: boolean;
  isHidden: boolean;
  moderatedBy?: unknown;
  moderatedAt?: Date;
  moderationReason?: string;
  reviewer?: {
    _id: unknown;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  reviewee?: {
    _id: unknown;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  property?: {
    _id: unknown;
    name: string;
    images?: string[];
    address?: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lean review document for admin with additional populated fields (using virtual field names)
 */
export interface LeanPopulatedAdminReview {
  _id: unknown;
  propertyId: unknown;
  bookingId: unknown;
  reviewerId: unknown;
  revieweeId: unknown;
  property?: {
    _id: unknown;
    name: string;
    images?: string[];
    address?: unknown;
  };
  booking?: {
    _id: unknown;
    confirmationCode: string;
    checkIn: Date;
    checkOut: Date;
  };
  reviewer?: {
    _id: unknown;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  reviewee?: {
    _id: unknown;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  reviewType: ReviewType;
  overallRating?: number;
  accuracy?: number;
  communication?: number;
  cleanliness?: number;
  location?: number;
  checkIn?: number;
  value?: number;
  publicReview?: string;
  privateFeedback?: string;
  isFlagged: boolean;
  isApproved: boolean;
  isHidden: boolean;
  moderatedBy?: unknown;
  moderatedAt?: Date;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
