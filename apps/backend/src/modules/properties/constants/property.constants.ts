/**
 * Property constants and commonly used values
 */
export const PROPERTY_CONSTANTS = {
  DEFAULT_COORDINATES: {
    LATITUDE: 0,
    LONGITUDE: 0,
  },
  DEFAULT_RADIUS_KM: 10,
  MAX_RADIUS_KM: 100,
  MIN_RADIUS_KM: 1,
} as const;

/**
 * String representations for boolean filters
 */
export const BOOLEAN_FILTER_VALUES = {
  TRUE: 'true',
  FALSE: 'false',
} as const;

/**
 * Property status values
 */
export const PROPERTY_STATUS_VALUES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  DELETED: 'deleted',
  SUSPENDED: 'suspended',
} as const;

/**
 * Property moderation status values
 */
export const MODERATION_STATUS_VALUES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FLAGGED: 'flagged',
} as const;

/**
 * Property search sort options
 */
export const PROPERTY_SORT_OPTIONS = {
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  RATING_DESC: 'rating_desc',
  DISTANCE_ASC: 'distance_asc',
  DATE_DESC: 'created_desc',
  DATE_ASC: 'created_asc',
  POPULARITY_DESC: 'popularity_desc',
} as const;

/**
 * Property aggregation pipeline constants
 */
export const AGGREGATION_CONSTANTS = {
  STATISTICS_LIMIT: 10,
  REVIEW_SAMPLE_SIZE: 100,
} as const;

/**
 * Helper functions for boolean string conversion
 */
export const BooleanStringUtils = {
  /**
   * Convert string to boolean with proper validation
   */
  parseBoolean: (value?: string): boolean | undefined => {
    if (value === BOOLEAN_FILTER_VALUES.TRUE) return true;
    if (value === BOOLEAN_FILTER_VALUES.FALSE) return false;
    return undefined;
  },

  /**
   * Convert boolean to filter string
   */
  toBooleanString: (value: boolean): string => {
    return value ? BOOLEAN_FILTER_VALUES.TRUE : BOOLEAN_FILTER_VALUES.FALSE;
  },
} as const;
