/**
 * Unified Fee Structure Constants
 * Single source of truth for all marketplace fees
 * Based on industry best practices (Airbnb, Stripe Connect, etc.)
 */

// Fallback values when dynamic config fails
export const FEE_STRUCTURE_DEFAULTS = {
  // Guest charges (booking time)
  GUEST_SERVICE_FEE_RATE: '0.03', // 3% service fee charged to guests

  // Host charges (payout time)
  HOST_COMMISSION_RATE: '0.07', // 7% platform commission from hosts

  // Payment processing fees by method
  PROCESSING_FEE_CARD: '0.029', // 2.9% credit/debit cards
  PROCESSING_FEE_BANK: '0.005', // 0.5% bank transfers
  PROCESSING_FEE_WALLET: '0.01', // 1.0% digital wallets
  PROCESSING_FEE_FIXED: '0.30', // $0.30 fixed fee per transaction

  // Tax rates
  OCCUPANCY_TAX_RATE: '0.05', // 5% occupancy tax
  VAT_RATE: '0.20', // 20% VAT (where applicable)

  // Fee limits
  MIN_SERVICE_FEE: '1.00', // Minimum service fee
  MAX_SERVICE_FEE: '100.00', // Maximum service fee
  MIN_PROCESSING_FEE: '0.30', // Minimum processing fee
  MAX_PROCESSING_FEE: '50.00', // Maximum processing fee

  // Payout settings
  PAYOUT_MINIMUM_AMOUNT: '50',
  PAYOUT_MAXIMUM_AMOUNT: '100000',
  PAYOUT_HOLD_PERIOD_DAYS: '1',
  PAYOUT_PROCESSING_DAYS: '3',

  // Refund settings
  REFUND_PROCESSING_DAYS: '5',
  REFUND_ADMIN_THRESHOLD: '500',
  REFUND_REQUIRE_ADMIN_APPROVAL: 'true',
} as const;

// Dynamic configuration keys - unified naming
export const FEE_CONFIG_KEYS = {
  // Guest-facing charges
  GUEST_SERVICE_FEE_RATE: 'GUEST_SERVICE_FEE_RATE',

  // Host-facing charges
  HOST_COMMISSION_RATE: 'HOST_COMMISSION_RATE',

  // Processing fees by payment method
  PROCESSING_FEE_CARD: 'PROCESSING_FEE_CARD',
  PROCESSING_FEE_BANK: 'PROCESSING_FEE_BANK',
  PROCESSING_FEE_WALLET: 'PROCESSING_FEE_WALLET',
  PROCESSING_FEE_FIXED: 'PROCESSING_FEE_FIXED',

  // Tax rates
  OCCUPANCY_TAX_RATE: 'OCCUPANCY_TAX_RATE',
  VAT_RATE: 'VAT_RATE',

  // Fee limits
  MIN_SERVICE_FEE: 'MIN_SERVICE_FEE',
  MAX_SERVICE_FEE: 'MAX_SERVICE_FEE',
  MIN_PROCESSING_FEE: 'MIN_PROCESSING_FEE',
  MAX_PROCESSING_FEE: 'MAX_PROCESSING_FEE',

  // Payout configuration
  PAYOUT_MINIMUM_AMOUNT: 'PAYOUT_MINIMUM_AMOUNT',
  PAYOUT_MAXIMUM_AMOUNT: 'PAYOUT_MAXIMUM_AMOUNT',
  PAYOUT_HOLD_PERIOD_DAYS: 'PAYOUT_HOLD_PERIOD_DAYS',
  PAYOUT_PROCESSING_DAYS: 'PAYOUT_PROCESSING_DAYS',

  // Refund configuration
  REFUND_PROCESSING_DAYS: 'REFUND_PROCESSING_DAYS',
  REFUND_ADMIN_THRESHOLD: 'REFUND_ADMIN_THRESHOLD',
  REFUND_REQUIRE_ADMIN_APPROVAL: 'REFUND_REQUIRE_ADMIN_APPROVAL',
} as const;

// Fee calculation constants (static - not configurable)
export const FEE_CALCULATION_CONSTANTS = {
  AMOUNT_PRECISION_TOLERANCE: 0.01,
  PERCENTAGE_PRECISION: 4, // 4 decimal places for percentages
  CURRENCY_PRECISION: 2, // 2 decimal places for currency amounts
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
} as const;

// Fee types enumeration
export enum FeeType {
  GUEST_SERVICE_FEE = 'guest_service_fee',
  HOST_COMMISSION = 'host_commission',
  PROCESSING_FEE = 'processing_fee',
  OCCUPANCY_TAX = 'occupancy_tax',
  VAT = 'vat',
  CLEANING_FEE = 'cleaning_fee',
  SECURITY_DEPOSIT = 'security_deposit',
}

// Payment method enumeration for processing fees
export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  CASH = 'cash',
}

// Fee calculation breakdown interface
export interface FeeBreakdown {
  baseAmount: number;
  guestServiceFee: number;
  hostCommission: number;
  processingFee: number;
  occupancyTax: number;
  vat: number;
  totalGuestPayment: number;
  totalHostPayout: number;
  totalPlatformRevenue: number;
  currency: string;
}

// Fee configuration interface
export interface FeeConfiguration {
  guestServiceFeeRate: number;
  hostCommissionRate: number;
  processingFees: {
    card: number;
    bank: number;
    wallet: number;
    fixed: number;
  };
  taxRates: {
    occupancy: number;
    vat: number;
  };
  limits: {
    minServiceFee: number;
    maxServiceFee: number;
    minProcessingFee: number;
    maxProcessingFee: number;
  };
}
