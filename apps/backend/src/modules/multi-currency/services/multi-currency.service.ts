import { Injectable, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExchangeRate, ExchangeRateDocument } from '../../../database/schemas/exchange-rate.schema';
import { Currency, CurrencyDocument } from '../../../database/schemas/currency.schema';
import { ExchangeRateService } from './exchange-rate.service';
import { CurrencyFormatterService } from './currency-formatter.service';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  conversionDate: Date;
}

export interface MultiCurrencyPrice {
  usd: {
    amount: number;
    currency: 'USD';
    symbol: '$';
    formatted: string;
  };
  lbp?: {
    amount: number;
    currency: 'LBP';
    symbol: 'ل.ل';
    formatted: string;
  };
  primary: {
    amount: number;
    currency: string;
    symbol: string;
    formatted: string;
  };
}

@Injectable()
export class MultiCurrencyService {
  private readonly PRIMARY_CURRENCY = 'USD'; // Lebanon market uses USD as primary
  private readonly SECONDARY_CURRENCY = 'LBP'; // Secondary for local display

  constructor(
    @InjectModel(ExchangeRate.name)
    private readonly exchangeRateModel: Model<ExchangeRateDocument>,
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly currencyFormatter: CurrencyFormatterService,
  ) {}

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ConversionResult> {
    // Same currency, no conversion needed
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1,
        conversionDate: DateUtils.now(),
      };
    }

    // Get exchange rate
    const exchangeRate = await this.exchangeRateService.getExchangeRate(fromCurrency, toCurrency);

    if (!exchangeRate) {
      throw new BadRequestException(
        `Exchange rate not available for ${fromCurrency} to ${toCurrency}`,
      );
    }

    const convertedAmount = amount * exchangeRate.rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: this.roundCurrencyAmount(convertedAmount, toCurrency),
      convertedCurrency: toCurrency,
      exchangeRate: exchangeRate.rate,
      conversionDate: exchangeRate.lastUpdated,
    };
  }

  /**
   * Get multi-currency pricing display (USD primary, LBP secondary)
   */
  async getMultiCurrencyPrice(
    amount: number,
    baseCurrency: string = this.PRIMARY_CURRENCY,
  ): Promise<MultiCurrencyPrice> {
    const result: MultiCurrencyPrice = {
      usd: {
        amount: 0,
        currency: 'USD',
        symbol: '$',
        formatted: '',
      },
      primary: {
        amount: 0,
        currency: this.PRIMARY_CURRENCY,
        symbol: '$',
        formatted: '',
      },
    };

    // Convert to USD if needed
    if (baseCurrency === 'USD') {
      result.usd.amount = amount;
      result.primary.amount = amount;
    } else {
      const usdConversion = await this.convertCurrency(amount, baseCurrency, 'USD');
      result.usd.amount = usdConversion.convertedAmount;
      result.primary.amount = usdConversion.convertedAmount;
    }

    // Format USD
    result.usd.formatted = await this.currencyFormatter.format(result.usd.amount, 'USD');
    result.primary.formatted = result.usd.formatted;

    // Convert to LBP for secondary display
    try {
      const lbpConversion = await this.convertCurrency(result.usd.amount, 'USD', 'LBP');
      result.lbp = {
        amount: lbpConversion.convertedAmount,
        currency: 'LBP',
        symbol: 'ل.ل',
        formatted: await this.currencyFormatter.format(lbpConversion.convertedAmount, 'LBP'),
      };
    } catch (error: unknown) {
      LoggingUtil.warn(
        'LBP conversion not available: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'MultiCurrencyService',
      );
      // LBP conversion optional, don't fail if not available
    }

    return result;
  }

  /**
   * Validate currency code
   */
  async validateCurrency(currencyCode: string): Promise<boolean> {
    const currency = await this.currencyModel
      .findOne({
        isoCode: currencyCode.toUpperCase(),
        isSupported: true,
        isActive: true,
      })
      .exec();

    return !!currency;
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<Currency[]> {
    return this.currencyModel
      .find({
        isSupported: true,
        isActive: true,
      })
      .sort({ sortOrder: 1 })
      .exec();
  }

  /**
   * Get currency info
   */
  async getCurrencyInfo(currencyCode: string): Promise<Currency | null> {
    return this.currencyModel
      .findOne({
        isoCode: currencyCode.toUpperCase(),
        isActive: true,
      })
      .exec();
  }

  /**
   * Round amount to appropriate precision for currency
   */
  private roundCurrencyAmount(amount: number, currencyCode: string): number {
    // LBP typically doesn't use decimals
    if (currencyCode.toUpperCase() === 'LBP') {
      return Math.round(amount);
    }

    // Most other currencies use 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  /**
   * Get default pricing currency (USD for Lebanon market)
   */
  getPrimaryCurrency(): string {
    return this.PRIMARY_CURRENCY;
  }

  /**
   * Get secondary display currency (LBP for Lebanon market)
   */
  getSecondaryCurrency(): string {
    return this.SECONDARY_CURRENCY;
  }

  /**
   * Check if currency is primary
   */
  isPrimaryCurrency(currencyCode: string): boolean {
    return currencyCode.toUpperCase() === this.PRIMARY_CURRENCY;
  }

  /**
   * Check if currency is secondary
   */
  isSecondaryCurrency(currencyCode: string): boolean {
    return currencyCode.toUpperCase() === this.SECONDARY_CURRENCY;
  }

  /**
   * Get recommended currency for user based on location or preference
   */
  async getRecommendedCurrency(countryCode?: string, userPreference?: string): Promise<string> {
    // User preference takes priority
    if (userPreference && (await this.validateCurrency(userPreference))) {
      return userPreference.toUpperCase();
    }

    // Lebanon users get LBP as secondary option
    if (countryCode?.toLowerCase() === 'lb') {
      return this.SECONDARY_CURRENCY;
    }

    // Default to USD (primary currency)
    return this.PRIMARY_CURRENCY;
  }

  /**
   * Bulk convert prices to multiple currencies
   */
  async bulkConvertPrices(
    amounts: number[],
    fromCurrency: string,
    toCurrencies: string[],
  ): Promise<{ [currency: string]: number[] }> {
    const results: { [currency: string]: number[] } = {};

    for (const toCurrency of toCurrencies) {
      results[toCurrency] = [];

      for (const amount of amounts) {
        try {
          const conversion = await this.convertCurrency(amount, fromCurrency, toCurrency);
          results[toCurrency].push(conversion.convertedAmount);
        } catch (error: unknown) {
          LoggingUtil.warn(
            `Failed to convert ${amount} ${fromCurrency} to ${toCurrency}: ` +
              (error instanceof Error ? error.message : 'Unknown error'),
            'MultiCurrencyService',
          );
          results[toCurrency].push(amount); // Fallback to original amount
        }
      }
    }

    return results;
  }
}
