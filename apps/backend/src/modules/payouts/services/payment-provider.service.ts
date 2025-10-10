import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApsPaymentProvider } from './payment-providers/aps-payment-provider';
import { PayoutErrorCode } from '../enums/payout-error.enums';
import type {
  PaymentProvider,
  PaymentResult,
  ProviderHealthStatus,
  PopulatedPayoutDocument,
} from '../interfaces';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Payment provider service
 * Manages multiple payment providers and routes payouts to appropriate provider
 */
@Injectable()
export class PaymentProviderService {
  private readonly providers = new Map<string, PaymentProvider>();
  private readonly defaultProvider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly apsProvider: ApsPaymentProvider,
  ) {
    // Register available providers
    this.registerProvider(apsProvider);

    // Set default provider based on configuration
    this.defaultProvider = this.configService.get<string>('DEFAULT_PAYMENT_PROVIDER', 'aps');
  }

  /**
   * Register a payment provider
   */
  private registerProvider(provider: PaymentProvider): void {
    if (provider.isConfigured()) {
      this.providers.set(provider.name, provider);
      LoggingUtil.log(`Registered payment provider: ${provider.name}`, 'PaymentProviderService');
    } else {
      LoggingUtil.warn(
        `Payment provider ${provider.name} not properly configured, skipping registration`,
        'PaymentProviderService',
      );
    }
  }

  /**
   * Get available payment providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get specific payment provider
   */
  getProvider(providerName: string): PaymentProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * Get default payment provider
   */
  getDefaultProvider(): PaymentProvider | null {
    return this.getProvider(this.defaultProvider);
  }

  /**
   * Process payout using specified or default provider
   */
  async processPayout(
    payout: PopulatedPayoutDocument,
    providerName?: string,
  ): Promise<PaymentResult> {
    try {
      const provider = this.selectProvider(payout, providerName);

      if (!provider) {
        throw new Error(PayoutErrorCode.PROVIDER_UNAVAILABLE);
      }

      // Validate payout method with provider
      if (!payout.payoutMethod) {
        throw new Error(PayoutErrorCode.METHOD_NOT_POPULATED);
      }

      const isValidMethod = await provider.validatePayoutMethod(payout.payoutMethod);
      if (!isValidMethod) {
        throw new Error(PayoutErrorCode.METHOD_INVALID_TYPE);
      }

      // Check currency support
      const supportedCurrencies = provider.getSupportedCurrencies();
      if (!supportedCurrencies.includes(payout.netAmount.currency)) {
        throw new Error(PayoutErrorCode.INVALID_CURRENCY);
      }

      LoggingUtil.log('Processing payout', 'PaymentProviderService');

      return await provider.processPayout(payout);
    } catch (error) {
      LoggingUtil.errorWithException('Payout processing failed:', error, 'PaymentProviderService');
      throw error;
    }
  }

  /**
   * Check payout status using specified provider
   */
  async checkPayoutStatus(
    externalTransactionId: string,
    providerName: string,
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new Error(PayoutErrorCode.PROVIDER_UNAVAILABLE);
    }

    return await provider.checkPayoutStatus(externalTransactionId);
  }

  /**
   * Cancel payout using specified provider
   */
  async cancelPayout(externalTransactionId: string, providerName: string): Promise<boolean> {
    const provider = this.getProvider(providerName);

    if (!provider) {
      throw new Error(PayoutErrorCode.PROVIDER_UNAVAILABLE);
    }

    return await provider.cancelPayout(externalTransactionId);
  }

  /**
   * Calculate fees for all available providers
   */
  calculateFeesComparison(
    amount: number,
    currency: string,
    method: string,
  ): Record<string, number> {
    const fees: Record<string, number> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        if (provider.getSupportedCurrencies().includes(currency)) {
          fees[name] = provider.calculateProviderFees(amount, currency, method);
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to calculate fees for provider ${name}:`,
          error,
          'PaymentProviderService',
        );
      }
    }

    return fees;
  }

  /**
   * Get provider recommendations based on payout details
   */
  getProviderRecommendations(
    amount: number,
    currency: string,
    method: string,
    priority: 'cost' | 'speed' | 'reliability' = 'cost',
  ): string[] {
    const availableProviders: Array<{ name: string; score: number }> = [];

    for (const [name, provider] of this.providers.entries()) {
      if (!provider.getSupportedCurrencies().includes(currency)) {
        continue;
      }

      let score = 0;

      // Calculate score based on priority
      switch (priority) {
        case 'cost': {
          const fees = provider.calculateProviderFees(amount, currency, method);
          score = 100 - (fees / amount) * 100; // Lower fees = higher score
          break;
        }
        case 'speed':
          // Provider-specific speed scoring (could be made configurable)
          score = name === 'aps' ? 85 : 50;
          break;
        case 'reliability':
          // Provider-specific reliability scoring (could be based on historical data)
          score = name === 'aps' ? 90 : 60;
          break;
      }

      availableProviders.push({ name, score });
    }

    // Sort by score descending
    return availableProviders.sort((a, b) => b.score - a.score).map((p) => p.name);
  }

  /**
   * Select appropriate payment provider based on payout details
   */
  private selectProvider(
    payout: PopulatedPayoutDocument,
    providerName?: string,
  ): PaymentProvider | null {
    if (providerName) {
      return this.getProvider(providerName);
    }

    // Use automatic provider selection logic
    const recommendations = this.getProviderRecommendations(
      payout.netAmount.amount,
      payout.netAmount.currency,
      payout.payoutMethod?.type || '',
    );

    if (recommendations.length > 0) {
      return this.getProvider(recommendations[0]);
    }

    // Fallback to default provider
    return this.getDefaultProvider();
  }

  /**
   * Get provider health status
   */
  getProviderHealthStatus(): ProviderHealthStatus {
    const health: Record<string, boolean> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        // Simple health check - verify configuration
        health[name] = provider.isConfigured();
      } catch (error) {
        LoggingUtil.errorWithException(
          `Health check failed for provider ${name}:`,
          error,
          'PaymentProviderService',
        );
        health[name] = false;
      }
    }

    return health;
  }
}
