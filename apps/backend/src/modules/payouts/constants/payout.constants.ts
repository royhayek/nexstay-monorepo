/**
 * Payout module constants
 */
import { PayoutStatus, PayoutMethodType } from '../../../common/enums/payout.enums';

/**
 * Pagination constants for payout listings
 */
export const PAYOUT_PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
} as const;

/**
 * Payout validation constants
 */
export const PAYOUT_VALIDATION_CONSTANTS = {
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 100000,
  MIN_FEE: 0,
  MAX_FEE_PERCENT: 0.15, // 15%
  REFERENCE_PREFIX_PAYOUT: 'PO',
  REFERENCE_PREFIX_METHOD: 'PM',
  CONFIRMATION_CODE_LENGTH: 12,
} as const;

/**
 * Payout business rules constants
 */
export const PAYOUT_BUSINESS_CONSTANTS = {
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_MINIMUM_AMOUNT: 50,
  DEFAULT_ADMIN_APPROVAL_THRESHOLD: 10000,
  DEFAULT_MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_RETRY_DELAY_HOURS: 4,
  DEFAULT_HOLD_PERIOD_DAYS: 1,
  DEFAULT_MAX_PER_BATCH: 100,
  DEFAULT_PLATFORM_FEE_RATE: 0.03, // 3%
} as const;

/**
 * Payout time constants
 */
export const PAYOUT_TIME_CONSTANTS = {
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  INSTANT_ARRIVAL_MINUTES: 30,
  STANDARD_ARRIVAL_DAYS: 3,
  MANUAL_ARRIVAL_DAYS: 14,
  STANDARD_PROCESSING_DAYS: 1,
  MANUAL_PROCESSING_DAYS: 7,
} as const;

/**
 * Payout message constants
 */
export const PAYOUT_MESSAGES = {
  PAYOUT_CREATED: 'Payout created successfully',
  PAYOUT_UPDATED: 'Payout updated successfully',
  PAYOUT_CANCELLED: 'Payout cancelled successfully',
  PAYOUT_COMPLETED: 'Payout completed successfully',
  METHOD_CREATED: 'Payout method created successfully',
  METHOD_UPDATED: 'Payout method updated successfully',
  METHOD_DELETED: 'Payout method deleted successfully',
  METHOD_VERIFIED: 'Payout method verified successfully',
  PREFERENCES_UPDATED: 'Payout preferences updated successfully',
  INSUFFICIENT_EARNINGS: 'Insufficient eligible earnings',
  BELOW_MINIMUM: 'Payout amount below minimum threshold',
  ABOVE_MAXIMUM: 'Payout amount exceeds maximum threshold',
  METHOD_NOT_FOUND: 'Payout method not found',
  INVALID_BANK_DETAILS: 'Invalid bank account details',
  PROCESSING_FAILED: 'Payout processing failed',
  PROVIDER_UNAVAILABLE: 'Payment provider temporarily unavailable',
} as const;

/**
 * Payout status flow constants
 */
export const PAYOUT_STATUS_FLOW = {
  ALLOWED_TRANSITIONS: {
    [PayoutStatus.PENDING]: [PayoutStatus.PROCESSING, PayoutStatus.CANCELLED, PayoutStatus.FAILED],
    [PayoutStatus.PENDING_APPROVAL]: [PayoutStatus.PROCESSING, PayoutStatus.CANCELLED],
    [PayoutStatus.PROCESSING]: [
      PayoutStatus.IN_TRANSIT,
      PayoutStatus.FAILED,
      PayoutStatus.CANCELLED,
    ],
    [PayoutStatus.IN_TRANSIT]: [PayoutStatus.COMPLETED, PayoutStatus.FAILED, PayoutStatus.RETURNED],
    [PayoutStatus.COMPLETED]: [],
    [PayoutStatus.FAILED]: [PayoutStatus.PENDING], // Allow retry
    [PayoutStatus.CANCELLED]: [],
    [PayoutStatus.RETURNED]: [PayoutStatus.PENDING], // Allow retry after return
  } as Record<PayoutStatus, PayoutStatus[]>,
} as const;

/**
 * Payout method configuration constants
 */
export const PAYOUT_METHOD_CONSTANTS = {
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'KWD', 'BHD', 'OMR', 'QAR'],
  BANK_ACCOUNT: {
    MIN_ACCOUNT_NUMBER_LENGTH: 8,
    MAX_ACCOUNT_NUMBER_LENGTH: 34,
    REQUIRED_FIELDS: ['accountNumber', 'accountHolderName', 'bankName'],
  },
  DEBIT_CARD: {
    MIN_LAST_4_LENGTH: 4,
    MAX_LAST_4_LENGTH: 4,
    SUPPORTED_BRANDS: ['visa', 'mastercard', 'amex'],
  },
  WALLET: {
    SUPPORTED_PROVIDERS: ['paypal', 'wise', 'revolut'],
    REQUIRED_FIELDS: ['email'],
  },
} as const;

/**
 * Payout fee configuration constants
 */
export const PAYOUT_FEE_CONSTANTS = {
  DEFAULT_PROCESSING_FEES: {
    [PayoutMethodType.BANK_ACCOUNT]: 0.005, // 0.5%
    [PayoutMethodType.DEBIT_CARD]: 0.015, // 1.5%
    [PayoutMethodType.WALLET]: 0.01, // 1%
  },
  DEFAULT_WITHDRAWAL_FEES: {
    [PayoutMethodType.BANK_ACCOUNT]: {
      RATE: 0.001, // 0.1%
      MAX: 25, // $25 max
    },
    [PayoutMethodType.DEBIT_CARD]: {
      FIXED: 1.5, // $1.50 fixed
    },
    [PayoutMethodType.WALLET]: {
      FIXED: 0, // Free for wallets
    },
  },
} as const;

/**
 * Payout provider configuration constants
 */
export const PAYOUT_PROVIDER_CONSTANTS = {
  APS: {
    SUPPORTED_METHODS: ['bank_transfer', 'debit_card', 'digital_wallet'],
    SUPPORTED_CURRENCIES: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'KWD', 'BHD', 'OMR', 'QAR'],
    BASE_FEES: {
      AED: 2.0,
      DEFAULT: 0.5,
    },
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
  },
  STRIPE: {
    SUPPORTED_METHODS: ['bank_transfer', 'debit_card'],
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP'],
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
  },
  PAYPAL: {
    SUPPORTED_METHODS: ['digital_wallet'],
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP'],
    TIMEOUT: 30000,
    MAX_RETRIES: 3,
  },
} as const;

/**
 * Payout configuration keys for dynamic config service
 * Updated to use unified fee structure
 */
export const PAYOUT_CONFIG_KEYS = {
  // Core settings (use unified fee config)
  MINIMUM_AMOUNT: 'PAYOUT_MINIMUM_AMOUNT',
  MAXIMUM_AMOUNT: 'PAYOUT_MAXIMUM_AMOUNT',
  HOLD_PERIOD_DAYS: 'PAYOUT_HOLD_PERIOD_DAYS',
  PROCESSING_DAYS: 'PAYOUT_PROCESSING_DAYS',

  // Provider settings
  DEFAULT_PAYMENT_PROVIDER: 'DEFAULT_PAYMENT_PROVIDER',

  // APS settings
  APS_ACCESS_CODE: 'APS_ACCESS_CODE',
  APS_SHA_REQUEST_PHRASE: 'APS_SHA_REQUEST_PHRASE',
  APS_ENVIRONMENT: 'APS_ENVIRONMENT',
  APS_WEBHOOK_URL: 'APS_WEBHOOK_URL',
} as const;

/**
 * Performance monitoring constants
 */
export const PAYOUT_PERFORMANCE_CONSTANTS = {
  THRESHOLDS: {
    CREATE_PAYOUT: 5000, // 5 seconds
    CALCULATE_EARNINGS: 3000, // 3 seconds
    BATCH_PROCESS: 60000, // 1 minute
    GET_PAYOUTS: 2000, // 2 seconds
    CREATE_PAYOUT_METHOD: 3000, // 3 seconds
    UPDATE_PREFERENCES: 2000, // 2 seconds
    RETRY_PAYOUT: 10000, // 10 seconds
  },
  ALERT_LEVELS: {
    WARNING: 0.8, // 80% of threshold
    CRITICAL: 1.5, // 150% of threshold
  },
} as const;

/**
 * Operation type constants for monitoring
 */
export const PAYOUT_OPERATION_TYPES = {
  CREATE_PAYOUT: 'CREATE_PAYOUT',
  CALCULATE_EARNINGS: 'CALCULATE_EARNINGS',
  BATCH_PROCESS: 'BATCH_PROCESS',
  GET_PAYOUTS: 'GET_PAYOUTS',
  CREATE_PAYOUT_METHOD: 'CREATE_PAYOUT_METHOD',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  RETRY_PAYOUT: 'RETRY_PAYOUT',
  UNKNOWN_OPERATION: 'UNKNOWN_OPERATION',
} as const;

/**
 * Route pattern constants for operation detection
 */
export const PAYOUT_ROUTE_PATTERNS = {
  CREATE_PAYOUT: { method: 'POST', pattern: '/payouts', exclude: 'batch' },
  CALCULATE_EARNINGS: { method: 'GET', pattern: 'eligible-earnings' },
  BATCH_PROCESS: { method: 'POST', pattern: 'batch' },
  GET_PAYOUTS: { method: 'GET', pattern: '/payouts' },
  CREATE_PAYOUT_METHOD: { method: 'POST', pattern: 'methods' },
  UPDATE_PREFERENCES: { method: 'PUT', pattern: 'preferences' },
  RETRY_PAYOUT: { method: 'PUT', pattern: 'retry' },
} as const;
