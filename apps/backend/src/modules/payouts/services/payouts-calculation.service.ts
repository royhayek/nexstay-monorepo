import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { FeeCalculationService } from '../../fees/services/fee-calculation.service';
import { PayoutFrequency } from '../../../common/enums/payout.enums';
import { IPayoutCalculationService } from '../interfaces/payout-service.interface';
import { PayoutFeeConfig } from '../interfaces';
import {
  PAYOUT_BUSINESS_CONSTANTS,
  PAYOUT_VALIDATION_CONSTANTS,
} from '../constants/payout.constants';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Service for payout calculations
 * Handles fee calculations, validations, and date calculations
 */
@Injectable()
export class PayoutsCalculationService implements IPayoutCalculationService {
  // Default fee configuration (used as fallback)
  private readonly DEFAULT_FEES: PayoutFeeConfig = {
    platformFeePercent: PAYOUT_BUSINESS_CONSTANTS.DEFAULT_PLATFORM_FEE_RATE * 100, // Convert to percentage
    processingFeePercent: 0.5, // 0.5% processing fee
    withdrawalFeeFixed: 1.5, // $1.50 fixed withdrawal fee
    taxWithholdingPercent: 0, // 0% by default (varies by jurisdiction)
    minimumPayout: PAYOUT_VALIDATION_CONSTANTS.MIN_AMOUNT,
    maximumPayout: PAYOUT_VALIDATION_CONSTANTS.MAX_AMOUNT,
  };

  // Cache for configuration to avoid repeated DB calls
  private configCache: Map<string, PayoutFeeConfig> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private feeCalculationService: FeeCalculationService) {}

  /**
   * Calculate all fees for a payout using unified fee calculation service
   */
  async calculateFees(
    amount: number,
    currency: string,
  ): Promise<{
    platformFee: number;
    processingFee: number;
    withdrawalFee: number;
    taxWithholding: number;
    totalFees: number;
  }> {
    // Use unified fee calculation service for consistent fee calculation
    const hostCommission = await this.feeCalculationService.calculateHostCommission(amount);
    const processingFee = await this.feeCalculationService.calculateProcessingFee(amount);

    // For now, withdrawal fee and tax withholding remain 0 as per unified structure
    const withdrawalFee = 0;
    const taxWithholding = 0;

    // Host commission is what the platform takes (our "platform fee")
    const platformFee = hostCommission;

    const totalFees = this.roundAmount(
      platformFee + processingFee + withdrawalFee + taxWithholding,
    );

    LoggingUtil.debug(
      `Calculated fees for amount ${amount} ${currency}`,
      'PayoutsCalculationService',
    );

    return {
      platformFee,
      processingFee,
      withdrawalFee,
      taxWithholding,
      totalFees,
    };
  }

  /**
   * Calculate net amount after fees
   */
  async calculateNetAmount(grossAmount: number, currency: string): Promise<number> {
    const fees = await this.calculateFees(grossAmount, currency);
    const netAmount = this.roundAmount(grossAmount - fees.totalFees);

    LoggingUtil.debug(
      `Net amount for ${grossAmount} ${currency}: ${netAmount}`,
      'PayoutsCalculationService',
    );
    return netAmount;
  }

  /**
   * Calculate next payout date based on frequency
   */
  calculateNextPayoutDate(frequency: PayoutFrequency, lastPayoutDate?: Date): Date {
    const baseDate = lastPayoutDate || DateUtils.now();
    const nextDate = DateUtils.create(baseDate);

    switch (frequency) {
      case PayoutFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(1, 0, 0, 0); // 1 AM daily
        break;

      case PayoutFrequency.WEEKLY: {
        // Next Monday at 1 AM
        const daysUntilMonday = (8 - nextDate.getDay()) % 7 || 7;
        nextDate.setDate(nextDate.getDate() + daysUntilMonday);
        nextDate.setHours(1, 0, 0, 0);
        break;
      }

      case PayoutFrequency.MONTHLY:
        // First day of next month at 1 AM
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(1);
        nextDate.setHours(1, 0, 0, 0);
        break;

      case PayoutFrequency.MANUAL:
      default:
        // No automatic payout
        return DateUtils.create(0);
    }

    return nextDate;
  }

  /**
   * Validate payout amount against business rules
   */
  async validatePayoutAmount(
    amount: number,
    currency: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const config = await this.getFeeConfiguration(currency);

    if (amount < config.minimumPayout) {
      errors.push(`Amount must be at least ${config.minimumPayout} ${currency}`);
    }

    if (amount > config.maximumPayout) {
      errors.push(`Amount cannot exceed ${config.maximumPayout} ${currency}`);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }

    // Check if amount has more than 2 decimal places
    if (Math.round(amount * 100) / 100 !== amount) {
      errors.push('Amount cannot have more than 2 decimal places');
    }

    // Check if net amount after fees is positive
    const netAmount = await this.calculateNetAmount(amount, currency);
    if (netAmount <= 0) {
      errors.push('Amount is too small after fees');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate estimated arrival date for a payout
   */
  calculateEstimatedArrival(provider: string, type: string): Date {
    const now = DateUtils.now();
    const arrivalDate = DateUtils.create(now);

    // Different providers and types have different processing times
    const processingDays = this.getProcessingDays(provider, type);

    // Add business days (excluding weekends)
    let daysAdded = 0;
    while (daysAdded < processingDays) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
      // Skip weekends
      if (arrivalDate.getDay() !== 0 && arrivalDate.getDay() !== 6) {
        daysAdded++;
      }
    }

    return arrivalDate;
  }

  /**
   * Calculate platform earnings from a payout
   */
  async calculatePlatformEarnings(
    grossAmount: number,
    currency: string,
  ): Promise<{
    platformRevenue: number;
    processingCosts: number;
    netRevenue: number;
  }> {
    const fees = await this.calculateFees(grossAmount, currency);

    // Platform keeps the platform fee
    const platformRevenue = fees.platformFee;

    // Processing and withdrawal fees are costs
    const processingCosts = fees.processingFee + fees.withdrawalFee;

    // Net revenue for the platform
    const netRevenue = this.roundAmount(platformRevenue - processingCosts);

    return {
      platformRevenue,
      processingCosts,
      netRevenue,
    };
  }

  /**
   * Calculate batch payout summary
   */
  async calculateBatchSummary(payouts: Array<{ amount: number; currency: string }>): Promise<{
    totalGrossAmount: number;
    totalFees: number;
    totalNetAmount: number;
    averagePayoutAmount: number;
    payoutCount: number;
  }> {
    let totalGrossAmount = 0;
    let totalFees = 0;
    let totalNetAmount = 0;

    for (const payout of payouts) {
      totalGrossAmount += payout.amount;
      const fees = await this.calculateFees(payout.amount, payout.currency);
      totalFees += fees.totalFees;
      totalNetAmount += await this.calculateNetAmount(payout.amount, payout.currency);
    }

    return {
      totalGrossAmount: this.roundAmount(totalGrossAmount),
      totalFees: this.roundAmount(totalFees),
      totalNetAmount: this.roundAmount(totalNetAmount),
      averagePayoutAmount: this.roundAmount(totalGrossAmount / payouts.length),
      payoutCount: payouts.length,
    };
  }

  /**
   * Get fee configuration for a currency
   */
  private async getFeeConfiguration(currency: string): Promise<PayoutFeeConfig> {
    const cacheKey = `config_${currency}`;
    const now = DateUtils.nowTimestamp();

    // Check cache first
    if (this.configCache.has(cacheKey)) {
      const cacheTime = this.cacheExpiry.get(cacheKey) || 0;
      if (now < cacheTime) {
        return this.configCache.get(cacheKey)!;
      }
    }

    try {
      // Load configuration from dynamic config service
      const config = await this.loadConfigFromService();

      // Cache the result
      this.configCache.set(cacheKey, config);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

      return config;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Failed to load payout configuration for ${currency}:`,
        error,
        'PayoutsCalculationService',
      );

      // Return default configuration as fallback
      LoggingUtil.warn(
        `Using default payout configuration for ${currency}`,
        'PayoutsCalculationService',
      );
      return this.DEFAULT_FEES;
    }
  }

  /**
   * Load configuration values from unified fee service and dynamic config
   */
  private async loadConfigFromService(): Promise<PayoutFeeConfig> {
    try {
      // Get configuration from unified fee calculation service
      const feeConfig = await this.feeCalculationService.getFeeConfiguration();
      const payoutConfig = await this.feeCalculationService.getPayoutConfig();

      return {
        platformFeePercent: feeConfig.hostCommissionRate * 100, // Convert to percentage
        processingFeePercent: feeConfig.processingFees.bank * 100, // Default to bank processing fee
        withdrawalFeeFixed: 0, // Not used in unified structure
        taxWithholdingPercent: 0, // Not used in unified structure
        minimumPayout: payoutConfig.minimumAmount,
        maximumPayout: payoutConfig.maximumAmount,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to load payout configurations from unified fee service:',
        error,
        'PayoutsCalculationService',
      );
      throw error;
    }
  }

  /**
   * Clear configuration cache (useful for testing or forced refresh)
   */
  public clearConfigCache(): void {
    this.configCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get processing days based on provider and type
   */
  private getProcessingDays(provider: string, type: string): number {
    // Processing times in business days
    const processingTimes: Record<string, Record<string, number>> = {
      aps: {
        instant: 1,
        standard: 3,
        manual: 5,
        emergency: 1,
      },
      bank_transfer: {
        instant: 1,
        standard: 5,
        manual: 7,
        emergency: 2,
      },
      manual: {
        instant: 1,
        standard: 7,
        manual: 10,
        emergency: 3,
      },
    };

    return processingTimes[provider]?.[type] || 5;
  }

  /**
   * Round amount to 2 decimal places
   */
  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }
}
