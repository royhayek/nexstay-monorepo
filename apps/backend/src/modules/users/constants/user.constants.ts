/**
 * User module constants
 */

/**
 * Pagination constants for user listings
 */
export const USER_PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
} as const;

/**
 * Password and security constants
 */
export const USER_SECURITY_CONSTANTS = {
  PASSWORD_SALT_ROUNDS: 12,
  MONGODB_DUPLICATE_KEY_ERROR: 11000,
  MONGODB_OBJECTID_REGEX: /^[0-9a-fA-F]{24}$/,
} as const;

/**
 * Sorting constants for user operations
 */
export const USER_SORT_CONSTANTS = {
  DEFAULT_SORT_ORDER: 1,
  DISPLAY_ORDER_DEFAULT: 0,
} as const;

/**
 * User admin operations constants
 */
export const USER_ADMIN_CONSTANTS = {
  PUBLIC_MAX_LIMIT: 50,
} as const;
