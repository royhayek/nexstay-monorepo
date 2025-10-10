import { Injectable } from '@nestjs/common';
import { DynamicConfigService } from '../../config/config.service';
import {
  FEE_CONFIG_KEYS,
  FEE_STRUCTURE_DEFAULTS,
  FEE_CALCULATION_CONSTANTS,
  FeeBreakdown,
  FeeConfiguration,
  PaymentMethod,
} from '../constants/fee-structure.constants';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Unified Fee Calculation Service
 * Single source of truth for all marketplace fee calculations
 * Replaces scattered fee logic across booking, payout, and split-payment modules
 */
@Injectable()
export class FeeCalculationService {
  constructor(private readonly configService: DynamicConfigService) {}

  /**
   * Get comprehensive fee configuration from dynamic config
   */
  async getFeeConfiguration(): Promise<FeeConfiguration> {
    try {
      const [
        guestServiceFeeRate,
        hostCommissionRate,
        processingFeeCard,
        processingFeeBank,
        processingFeeWallet,
        processingFeeFixed,
        occupancyTaxRate,
        vatRate,
        minServiceFee,
        maxServiceFee,
        minProcessingFee,
        maxProcessingFee,
      ] = await Promise.all([
        this.configService.get(
          FEE_CONFIG_KEYS.GUEST_SERVICE_FEE_RATE,
          FEE_STRUCTURE_DEFAULTS.GUEST_SERVICE_FEE_RATE,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.HOST_COMMISSION_RATE,
          FEE_STRUCTURE_DEFAULTS.HOST_COMMISSION_RATE,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.PROCESSING_FEE_CARD,
          FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_CARD,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.PROCESSING_FEE_BANK,
          FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_BANK,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.PROCESSING_FEE_WALLET,
          FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_WALLET,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.PROCESSING_FEE_FIXED,
          FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_FIXED,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.OCCUPANCY_TAX_RATE,
          FEE_STRUCTURE_DEFAULTS.OCCUPANCY_TAX_RATE,
        ),
        this.configService.get(FEE_CONFIG_KEYS.VAT_RATE, FEE_STRUCTURE_DEFAULTS.VAT_RATE),
        this.configService.get(
          FEE_CONFIG_KEYS.MIN_SERVICE_FEE,
          FEE_STRUCTURE_DEFAULTS.MIN_SERVICE_FEE,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.MAX_SERVICE_FEE,
          FEE_STRUCTURE_DEFAULTS.MAX_SERVICE_FEE,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.MIN_PROCESSING_FEE,
          FEE_STRUCTURE_DEFAULTS.MIN_PROCESSING_FEE,
        ),
        this.configService.get(
          FEE_CONFIG_KEYS.MAX_PROCESSING_FEE,
          FEE_STRUCTURE_DEFAULTS.MAX_PROCESSING_FEE,
        ),
      ]);

      return {
        guestServiceFeeRate: parseFloat(guestServiceFeeRate),
        hostCommissionRate: parseFloat(hostCommissionRate),
        processingFees: {
          card: parseFloat(processingFeeCard),
          bank: parseFloat(processingFeeBank),
          wallet: parseFloat(processingFeeWallet),
          fixed: parseFloat(processingFeeFixed),
        },
        taxRates: {
          occupancy: parseFloat(occupancyTaxRate),
          vat: parseFloat(vatRate),
        },
        limits: {
          minServiceFee: parseFloat(minServiceFee),
          maxServiceFee: parseFloat(maxServiceFee),
          minProcessingFee: parseFloat(minProcessingFee),
          maxProcessingFee: parseFloat(maxProcessingFee),
        },
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to load fee configuration, using fallback defaults:',
        error,
        'FeeCalculationService',
      );
      return this.getFallbackFeeConfiguration();
    }
  }

  /**
   * Calculate complete fee breakdown for a booking
   * This is the main fee calculation method used across all modules
   */
  async calculateFeeBreakdown(
    baseAmount: number,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
    currency = 'USD',
    options: {
      includeOccupancyTax?: boolean;
      includeVAT?: boolean;
      applyServiceFeeLimits?: boolean;
    } = {},
  ): Promise<FeeBreakdown> {
    const config = await this.getFeeConfiguration();

    const {
      includeOccupancyTax = true,
      includeVAT = false,
      applyServiceFeeLimits = true,
    } = options;

    // Calculate guest service fee
    let guestServiceFee = baseAmount * config.guestServiceFeeRate;

    // Apply service fee limits if enabled
    if (applyServiceFeeLimits) {
      guestServiceFee = Math.max(
        config.limits.minServiceFee,
        Math.min(guestServiceFee, config.limits.maxServiceFee),
      );
    }

    // Calculate taxes
    const occupancyTax = includeOccupancyTax ? baseAmount * config.taxRates.occupancy : 0;
    const vat = includeVAT ? (baseAmount + guestServiceFee) * config.taxRates.vat : 0;

    // Calculate processing fee based on payment method
    const processingFeeRate = this.getProcessingFeeRate(paymentMethod, config);
    const totalBeforeProcessing = baseAmount + guestServiceFee + occupancyTax + vat;
    let processingFee = totalBeforeProcessing * processingFeeRate + config.processingFees.fixed;

    // Apply processing fee limits
    processingFee = Math.max(
      config.limits.minProcessingFee,
      Math.min(processingFee, config.limits.maxProcessingFee),
    );

    // Calculate host commission (deducted from base amount)
    const hostCommission = baseAmount * config.hostCommissionRate;

    // Calculate totals
    const totalGuestPayment = baseAmount + guestServiceFee + occupancyTax + vat + processingFee;
    const totalHostPayout = baseAmount - hostCommission - processingFee;
    const totalPlatformRevenue = guestServiceFee + hostCommission;

    // Round all amounts to currency precision
    return {
      baseAmount: this.roundToCurrency(baseAmount),
      guestServiceFee: this.roundToCurrency(guestServiceFee),
      hostCommission: this.roundToCurrency(hostCommission),
      processingFee: this.roundToCurrency(processingFee),
      occupancyTax: this.roundToCurrency(occupancyTax),
      vat: this.roundToCurrency(vat),
      totalGuestPayment: this.roundToCurrency(totalGuestPayment),
      totalHostPayout: this.roundToCurrency(Math.max(0, totalHostPayout)), // Ensure non-negative
      totalPlatformRevenue: this.roundToCurrency(totalPlatformRevenue),
      currency,
    };
  }

  /**
   * Calculate guest service fee only (for booking module)
   */
  async calculateGuestServiceFee(baseAmount: number): Promise<number> {
    const config = await this.getFeeConfiguration();
    let serviceFee = baseAmount * config.guestServiceFeeRate;

    // Apply limits
    serviceFee = Math.max(
      config.limits.minServiceFee,
      Math.min(serviceFee, config.limits.maxServiceFee),
    );

    return this.roundToCurrency(serviceFee);
  }

  /**
   * Calculate host commission (for payout module)
   */
  async calculateHostCommission(baseAmount: number): Promise<number> {
    const config = await this.getFeeConfiguration();
    const commission = baseAmount * config.hostCommissionRate;
    return this.roundToCurrency(commission);
  }

  /**
   * Calculate processing fee (for payment module)
   */
  async calculateProcessingFee(
    amount: number,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
  ): Promise<number> {
    const config = await this.getFeeConfiguration();
    const processingFeeRate = this.getProcessingFeeRate(paymentMethod, config);
    let processingFee = amount * processingFeeRate + config.processingFees.fixed;

    // Apply limits
    processingFee = Math.max(
      config.limits.minProcessingFee,
      Math.min(processingFee, config.limits.maxProcessingFee),
    );

    return this.roundToCurrency(processingFee);
  }

  /**
   * Get payout configuration (for payout module)
   */
  async getPayoutConfig(): Promise<{
    minimumAmount: number;
    maximumAmount: number;
    holdPeriodDays: number;
    processingDays: number;
  }> {
    const [minimumAmount, maximumAmount, holdPeriodDays, processingDays] = await Promise.all([
      this.configService.get(
        FEE_CONFIG_KEYS.PAYOUT_MINIMUM_AMOUNT,
        FEE_STRUCTURE_DEFAULTS.PAYOUT_MINIMUM_AMOUNT,
      ),
      this.configService.get(
        FEE_CONFIG_KEYS.PAYOUT_MAXIMUM_AMOUNT,
        FEE_STRUCTURE_DEFAULTS.PAYOUT_MAXIMUM_AMOUNT,
      ),
      this.configService.get(
        FEE_CONFIG_KEYS.PAYOUT_HOLD_PERIOD_DAYS,
        FEE_STRUCTURE_DEFAULTS.PAYOUT_HOLD_PERIOD_DAYS,
      ),
      this.configService.get(
        FEE_CONFIG_KEYS.PAYOUT_PROCESSING_DAYS,
        FEE_STRUCTURE_DEFAULTS.PAYOUT_PROCESSING_DAYS,
      ),
    ]);

    return {
      minimumAmount: parseFloat(minimumAmount),
      maximumAmount: parseFloat(maximumAmount),
      holdPeriodDays: parseInt(holdPeriodDays),
      processingDays: parseInt(processingDays),
    };
  }

  /**
   * Validate fee amounts against configuration limits
   */
  async validateFeeAmounts(
    baseAmount: number,
    paymentMethod: PaymentMethod = PaymentMethod.CARD,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const config = await this.getFeeConfiguration();
    const breakdown = await this.calculateFeeBreakdown(baseAmount, paymentMethod);
    const errors: string[] = [];

    // Validate service fee limits
    if (breakdown.guestServiceFee < config.limits.minServiceFee) {
      errors.push(
        `Service fee ${breakdown.guestServiceFee} is below minimum ${config.limits.minServiceFee}`,
      );
    }
    if (breakdown.guestServiceFee > config.limits.maxServiceFee) {
      errors.push(
        `Service fee ${breakdown.guestServiceFee} exceeds maximum ${config.limits.maxServiceFee}`,
      );
    }

    // Validate processing fee limits
    if (breakdown.processingFee < config.limits.minProcessingFee) {
      errors.push(
        `Processing fee ${breakdown.processingFee} is below minimum ${config.limits.minProcessingFee}`,
      );
    }
    if (breakdown.processingFee > config.limits.maxProcessingFee) {
      errors.push(
        `Processing fee ${breakdown.processingFee} exceeds maximum ${config.limits.maxProcessingFee}`,
      );
    }

    // Validate host payout is positive
    if (breakdown.totalHostPayout <= 0) {
      errors.push(`Host payout ${breakdown.totalHostPayout} must be positive`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get processing fee rate based on payment method
   */
  private getProcessingFeeRate(paymentMethod: PaymentMethod, config: FeeConfiguration): number {
    switch (paymentMethod) {
      case PaymentMethod.CARD:
        return config.processingFees.card;
      case PaymentMethod.BANK_TRANSFER:
        return config.processingFees.bank;
      case PaymentMethod.DIGITAL_WALLET:
        return config.processingFees.wallet;
      default:
        return config.processingFees.card; // Default to card processing
    }
  }

  /**
   * Round amount to currency precision (2 decimal places)
   */
  private roundToCurrency(amount: number): number {
    return (
      Math.round(amount * Math.pow(10, FEE_CALCULATION_CONSTANTS.CURRENCY_PRECISION)) /
      Math.pow(10, FEE_CALCULATION_CONSTANTS.CURRENCY_PRECISION)
    );
  }

  /**
   * Fallback fee configuration when dynamic config fails
   */
  private getFallbackFeeConfiguration(): FeeConfiguration {
    LoggingUtil.warn('Using fallback fee configuration', 'FeeCalculationService');

    return {
      guestServiceFeeRate: parseFloat(FEE_STRUCTURE_DEFAULTS.GUEST_SERVICE_FEE_RATE),
      hostCommissionRate: parseFloat(FEE_STRUCTURE_DEFAULTS.HOST_COMMISSION_RATE),
      processingFees: {
        card: parseFloat(FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_CARD),
        bank: parseFloat(FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_BANK),
        wallet: parseFloat(FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_WALLET),
        fixed: parseFloat(FEE_STRUCTURE_DEFAULTS.PROCESSING_FEE_FIXED),
      },
      taxRates: {
        occupancy: parseFloat(FEE_STRUCTURE_DEFAULTS.OCCUPANCY_TAX_RATE),
        vat: parseFloat(FEE_STRUCTURE_DEFAULTS.VAT_RATE),
      },
      limits: {
        minServiceFee: parseFloat(FEE_STRUCTURE_DEFAULTS.MIN_SERVICE_FEE),
        maxServiceFee: parseFloat(FEE_STRUCTURE_DEFAULTS.MAX_SERVICE_FEE),
        minProcessingFee: parseFloat(FEE_STRUCTURE_DEFAULTS.MIN_PROCESSING_FEE),
        maxProcessingFee: parseFloat(FEE_STRUCTURE_DEFAULTS.MAX_PROCESSING_FEE),
      },
    };
  }
}
