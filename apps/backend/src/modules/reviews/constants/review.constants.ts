/**
 * Review validation constants
 */
export const REVIEW_VALIDATION_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_PUBLIC_REVIEW_LENGTH: 10,
  MAX_PUBLIC_REVIEW_LENGTH: 1000,
  MAX_PRIVATE_FEEDBACK_LENGTH: 500,
  MAX_MODERATION_REASON_LENGTH: 250,
} as const;

/**
 * Review business constants
 */
export const REVIEW_BUSINESS_CONSTANTS = {
  REVIEW_DEADLINE_DAYS: 14, // Days after checkout to submit review
  AUTO_APPROVE_THRESHOLD: 4.0, // Auto-approve reviews with rating >= 4.0
  FLAG_THRESHOLD: 2.0, // Auto-flag reviews with rating < 2.0
  MINIMUM_REVIEW_LENGTH: 20, // Minimum characters for meaningful review
} as const;

/**
 * Review moderation actions
 */
export const REVIEW_MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  FLAG: 'flag',
  UNFLAG: 'unflag',
  HIDE: 'hide',
  SHOW: 'show',
} as const;

/**
 * Review status messages
 */
export const REVIEW_MESSAGES = {
  REVIEW_NOT_FOUND: 'Review not found',
  BOOKING_NOT_FOUND: 'Booking not found',
  PROPERTY_NOT_FOUND: 'Property not found',
  ALREADY_REVIEWED: 'You have already reviewed this booking',
  BOOKING_NOT_COMPLETED: 'You can only review completed bookings',
  REVIEW_DEADLINE_PASSED: 'Review deadline has passed',
  UNAUTHORIZED_REVIEWER: 'You can only review bookings you were involved in',
  INVALID_REVIEW_TYPE: 'Invalid review type for this user role',
  PROPERTY_MISMATCH: 'Property ID does not match booking',
  INVALID_REVIEWEE: 'Invalid reviewee ID for this booking',
  MODERATION_SUCCESS: 'Review moderation completed successfully',
  REVIEW_CREATED: 'Review created successfully',
  REVIEW_UPDATED: 'Review updated successfully',
  REVIEW_DELETED: 'Review deleted successfully',
} as const;

/**
 * Review sorting fields
 */
export const REVIEW_SORT_FIELDS = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  RATING: 'overallRating',
  HELPFUL: 'helpfulCount',
} as const;

/**
 * Review query limits
 */
export const REVIEW_QUERY_LIMITS = {
  MAX_PUBLIC_PAGE_SIZE: 50,
  MAX_ADMIN_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_SEARCH_RESULTS: 1000,
} as const;
