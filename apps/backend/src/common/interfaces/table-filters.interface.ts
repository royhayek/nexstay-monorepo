/**
 * Base pagination interface for all table filters
 */
export interface BasePaginationFilter {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Base search filter that extends pagination
 */
export interface BaseSearchFilter extends BasePaginationFilter {
  search?: string;
}

/**
 * User table filters for admin endpoints
 */
export interface UserTableFilter extends BaseSearchFilter {
  role?: string; // Supports comma-separated multiple roles
  status?: string; // Supports comma-separated multiple statuses
  verified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Property table filters
 */
export interface PropertyTableFilter extends BaseSearchFilter {
  propertyType?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  city?: string;
  country?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  hostId?: string;
  featured?: boolean;
  verified?: boolean;
}

/**
 * Booking table filters
 */
export interface BookingTableFilter extends BaseSearchFilter {
  status?: string;
  propertyId?: string;
  guestId?: string;
  hostId?: string;
  checkInFrom?: Date | string;
  checkInTo?: Date | string;
  checkOutFrom?: Date | string;
  checkOutTo?: Date | string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Review table filters
 */
export interface ReviewTableFilter extends BaseSearchFilter {
  propertyId?: string;
  reviewerId?: string;
  revieweeId?: string;
  minRating?: number;
  maxRating?: number;
  flagged?: boolean;
  verified?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Payment table filters
 */
export interface PaymentTableFilter extends BaseSearchFilter {
  status?: string;
  bookingId?: string;
  userId?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Message/Conversation table filters
 */
export interface MessageTableFilter extends BaseSearchFilter {
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  unreadOnly?: boolean;
  flagged?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Notification table filters
 */
export interface NotificationTableFilter extends BaseSearchFilter {
  recipientId?: string;
  type?: string;
  read?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Analytics date range filter
 */
export interface AnalyticsDateFilter {
  from: Date | string;
  to: Date | string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

/**
 * Invoice table filters
 */
export interface InvoiceTableFilter extends BaseSearchFilter {
  bookingId?: string;
  userId?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Storage/File table filters
 */
export interface StorageTableFilter extends BasePaginationFilter {
  category?: string;
  userId?: string;
  mimeType?: string;
  minSize?: number;
  maxSize?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

/**
 * Sort field configuration
 */
export interface SortField {
  field: string;
  label: string;
  default?: boolean;
}

/**
 * Common sort fields for different entities
 */
export const SORT_FIELDS = {
  users: [
    { field: 'createdAt', label: 'Created Date', default: true },
    { field: 'updatedAt', label: 'Updated Date' },
    { field: 'lastActiveAt', label: 'Last Active' },
    { field: 'firstName', label: 'First Name' },
    { field: 'lastName', label: 'Last Name' },
    { field: 'email', label: 'Email' },
  ],
  properties: [
    { field: 'createdAt', label: 'Created Date', default: true },
    { field: 'updatedAt', label: 'Updated Date' },
    { field: 'price', label: 'Price' },
    { field: 'title', label: 'Title' },
    { field: 'averageRating', label: 'Rating' },
    { field: 'reviewCount', label: 'Review Count' },
  ],
  bookings: [
    { field: 'createdAt', label: 'Created Date', default: true },
    { field: 'checkIn', label: 'Check-in Date' },
    { field: 'checkOut', label: 'Check-out Date' },
    { field: 'totalAmount', label: 'Total Amount' },
    { field: 'status', label: 'Status' },
  ],
  reviews: [
    { field: 'createdAt', label: 'Created Date', default: true },
    { field: 'rating', label: 'Rating' },
    { field: 'helpful', label: 'Helpful Count' },
  ],
  payments: [
    { field: 'createdAt', label: 'Created Date', default: true },
    { field: 'amount', label: 'Amount' },
    { field: 'status', label: 'Status' },
  ],
} as const;

/**
 * Helper type to extract sort field names
 */
export type UserSortField = (typeof SORT_FIELDS.users)[number]['field'];
export type PropertySortField = (typeof SORT_FIELDS.properties)[number]['field'];
export type BookingSortField = (typeof SORT_FIELDS.bookings)[number]['field'];
export type ReviewSortField = (typeof SORT_FIELDS.reviews)[number]['field'];
export type PaymentSortField = (typeof SORT_FIELDS.payments)[number]['field'];
