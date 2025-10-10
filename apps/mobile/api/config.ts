import { SERVICES_CONFIG } from "../config/services";

// API Configuration - Only API-related settings
export const API_CONFIG = {
  // Base URL from centralized config
  BASE_URL: SERVICES_CONFIG.API.BASE_URL,

  // Timeout in milliseconds
  TIMEOUT: SERVICES_CONFIG.API.TIMEOUT,

  // API Version
  VERSION: SERVICES_CONFIG.API.VERSION,

  // Request configuration
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Retry configuration for failed requests
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RETRY_MULTIPLIER: 2,
    RETRY_CONDITIONS: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
  },

  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 100,
    BURST_LIMIT: 10,
  },

  // Cache configuration
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    MAX_AGE: 60 * 60 * 1000, // 1 hour
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// API Response Messages
export const API_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  UNAUTHORIZED: "You are not authorized. Please login again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SUCCESS: "Operation completed successfully.",
  CREATED: "Resource created successfully.",
  UPDATED: "Resource updated successfully.",
  DELETED: "Resource deleted successfully.",
} as const;
