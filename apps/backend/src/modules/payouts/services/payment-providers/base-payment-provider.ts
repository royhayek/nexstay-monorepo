import { LoggingUtil } from '../../../../common/utils/logging.util';
import { PayoutStatus } from '../../../../common/enums/payout.enums';
import type {
  PaymentProviderConfig,
  PaymentResult,
  PaymentProvider,
  PayoutMethodData,
  PopulatedPayoutDocument,
} from '../../interfaces';

/**
 * Base payment provider implementation
 * Provides common functionality for all payment providers
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  constructor(protected readonly config: PaymentProviderConfig) {}

  abstract get name(): string;
  abstract get supportedMethods(): string[];

  /**
   * Process a payout through the provider
   */
  abstract processPayout(payout: PopulatedPayoutDocument): Promise<PaymentResult>;

  /**
   * Check the status of a payout
   */
  abstract checkPayoutStatus(externalTransactionId: string): Promise<PaymentResult>;

  /**
   * Cancel a pending payout
   */
  abstract cancelPayout(externalTransactionId: string): Promise<boolean>;

  /**
   * Validate payout method for this provider
   */
  abstract validatePayoutMethod(payoutMethod: PayoutMethodData): Promise<boolean>;

  /**
   * Get supported currencies for this provider
   */
  abstract getSupportedCurrencies(): string[];

  /**
   * Calculate provider fees
   */
  abstract calculateProviderFees(amount: number, currency: string, method: string): number;

  /**
   * Common validation for payout processing
   */
  protected validatePayout(payout: PopulatedPayoutDocument): void {
    if (!payout) {
      throw new Error('Payout is required');
    }

    if (!payout.netAmount || payout.netAmount.amount <= 0) {
      throw new Error('Invalid payout amount');
    }

    if (!payout.payoutMethodId) {
      throw new Error('Payout method is required');
    }

    if (payout.status !== PayoutStatus.PROCESSING) {
      throw new Error(`Invalid payout status: ${payout.status}`);
    }
  }

  /**
   * Common error handling
   */
  protected handleError(
    error: Error | { message: string; response?: { data?: Record<string, string | number> } },
    context: string,
  ): PaymentResult {
    LoggingUtil.errorWithException(`${context} failed:`, error, this.constructor.name);

    const errorMessage = 'message' in error ? error.message : 'Unknown error occurred';
    const providerResponse = 'response' in error ? error.response?.data || null : null;

    return {
      success: false,
      status: PayoutStatus.FAILED,
      error: errorMessage,
      providerResponse,
    };
  }

  /**
   * Log successful operations
   */
  protected logSuccess(context: string, data: Record<string, unknown>): void {
    LoggingUtil.log(`${context} successful`, this.constructor.name, { metadata: data });
  }

  /**
   * Check if provider is configured correctly
   */
  isConfigured(): boolean {
    return !!(this.config && this.config.apiKey && this.config.environment);
  }

  /**
   * Get provider configuration (without sensitive data)
   */
  getConfig(): Partial<PaymentProviderConfig> {
    return {
      environment: this.config.environment,
      webhookUrl: this.config.webhookUrl,
      timeout: this.config.timeout,
    };
  }
}
