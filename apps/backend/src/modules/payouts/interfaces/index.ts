import { PayoutMethodType, PayoutStatus } from '../../../common/enums/payout.enums';
import type { PopulatedPayoutDocument } from './payout-types.interface';

// Re-export service interfaces
export type {
  IPayoutsCoreService,
  IPayoutsMethodService,
  IPayoutsProcessingService,
  CreatePayoutData,
  PopulatedBookingDocument,
  PayoutFeeConfig,
} from './service.interfaces';

/**
 * =============================================================================
 * CORE PAYOUT INTERFACES
 * =============================================================================
 */

/**
 * Express request interfaces for payouts module
 */
export interface PayoutRequest extends Request {
  method: string;
  url: string;
  user?: {
    _id: string;
    role: string;
    email: string;
  };
}

/**
 * Payout response data structures
 */
export interface PayoutResponseData {
  id?: string;
  grossAmount?: {
    amount: number;
    currency: string;
  };
  netAmount?: {
    amount: number;
    currency: string;
  };
  status?: string;
  totalEarnings?: number;
  bookingsCount?: number;
  totalProcessed?: number;
  successful?: number;
  failed?: number;
  pagination?: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

/**
 * =============================================================================
 * PAYOUT METHOD INTERFACES
 * =============================================================================
 */

/**
 * Bank account details interface
 */
export interface BankAccountDetails {
  accountNumber: string;
  routingNumber?: string;
  bankCode?: string;
  accountType?: 'checking' | 'savings';
  accountHolderName: string;
  bankName?: string;
  swiftCode?: string;
}

/**
 * Digital wallet details interface
 */
export interface DigitalWalletDetails {
  email?: string;
  phoneNumber?: string;
  walletProvider?: string;
  walletId?: string;
}

/**
 * Debit card details interface
 */
export interface DebitCardDetails {
  last4: string;
  brand: string;
  country: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
}

/**
 * Payout method data interface
 */
export interface PayoutMethodData {
  type: PayoutMethodType;
  isDefault?: boolean;
  bankDetails?: BankAccountDetails;
  walletDetails?: DigitalWalletDetails;
  cardDetails?: DebitCardDetails;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Payout method validation result
 */
export interface PayoutMethodValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    bankAccount?: boolean;
    digitalWallet?: boolean;
    debitCard?: boolean;
  };
}

/**
 * =============================================================================
 * PAYMENT PROVIDER INTERFACES
 * =============================================================================
 */

/**
 * Payment provider configuration interface
 */
export interface PaymentProviderConfig {
  apiKey: string;
  apiSecret?: string;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Payment processing result interface
 */
export interface PaymentResult {
  success: boolean;
  status: PayoutStatus;
  externalTransactionId?: string;
  providerTransactionId?: string;
  estimatedArrival?: Date;
  error?: string;
  providerResponse?: Record<string, string | number | undefined> | null;
  fees?: {
    amount: number;
    currency: string;
  };
}

/**
 * Payment provider interface
 */
export interface PaymentProvider {
  readonly name: string;
  readonly supportedMethods: string[];

  /**
   * Process a payout through the provider
   */
  processPayout(payout: PopulatedPayoutDocument): Promise<PaymentResult>;

  /**
   * Check the status of a payout
   */
  checkPayoutStatus(externalTransactionId: string): Promise<PaymentResult>;

  /**
   * Cancel a pending payout
   */
  cancelPayout(externalTransactionId: string): Promise<boolean>;

  /**
   * Validate payout method for this provider
   */
  validatePayoutMethod(payoutMethod: PayoutMethodData): Promise<boolean>;

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[];

  /**
   * Calculate provider fees
   */
  calculateProviderFees(amount: number, currency: string, method: string): number;

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;

  /**
   * Get provider configuration (without sensitive data)
   */
  getConfig(): Partial<PaymentProviderConfig>;
}

/**
 * Webhook payload interface
 */
export interface PaymentWebhookPayload {
  eventType: string;
  transactionId: string;
  status: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  providerData?: Record<string, string | number | boolean>;
}

/**
 * =============================================================================
 * ADMIN CONTROLLER INTERFACES
 * =============================================================================
 */

/**
 * Admin payout query filters
 */
export interface AdminPayoutFilters {
  status?: PayoutStatus[];
  hostId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  provider?: string;
}

/**
 * Batch payout result
 */
export interface BatchPayoutResult {
  batchId: string;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

/**
 * Provider health status
 */
export interface ProviderHealthStatus {
  [providerName: string]: boolean;
}

/**
 * Payout statistics response interface
 */
export interface PayoutStatsResponse {
  totalPayouts: number;
  totalAmount: number;
  completedPayouts: number;
  failedPayouts: number;
  pendingPayouts: number;
}

/**
 * Payout stat item interface for statistics calculation
 */
export interface PayoutStatItem {
  _id?: string;
  grossAmount?: {
    amount: number;
    currency: string;
  };
  netAmount?: {
    amount: number;
    currency: string;
  };
  status: PayoutStatus;
  createdAt?: Date;
  processedAt?: Date;
}

/**
 * Mock APS transfer response interface (for development)
 */
export interface MockApsTransferResponse {
  response_code: string;
  response_message: string;
  fort_id: string;
  merchant_reference: string;
  amount: string;
  currency: string;
  status: string;
  payment_option?: string;
  [key: string]: string | undefined; // Index signature for additional properties
}

/**
 * Mock APS status response interface (for development)
 */
export interface MockApsStatusResponse {
  response_code: string;
  response_message: string;
  fort_id: string;
  merchant_reference: string;
  transaction_status: string;
  transaction_date: string;
  amount: string;
  currency: string;
  status?: string;
  [key: string]: string | undefined; // Index signature for additional properties
}

// Re-export types from other interface files
export type { PopulatedPayoutDocument };
