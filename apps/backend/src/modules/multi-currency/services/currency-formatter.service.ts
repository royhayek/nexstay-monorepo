import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Currency, CurrencyDocument } from '../../../database/schemas/currency.schema';

export interface FormattingOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

@Injectable()
export class CurrencyFormatterService {
  private currencyCache = new Map<string, Currency>();

  constructor(
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
  ) {}

  /**
   * Format currency amount with proper symbol and formatting
   */
  async format(
    amount: number,
    currencyCode: string,
    options: FormattingOptions = {},
  ): Promise<string> {
    const currency = await this.getCurrency(currencyCode);
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    const {
      showSymbol = true,
      showCode = false,
      locale = 'en-US',
      minimumFractionDigits,
      maximumFractionDigits,
    } = options;

    // Determine decimal places
    const decimalPlaces = currency.decimalPlaces ?? 2;
    const minFractionDigits = minimumFractionDigits ?? decimalPlaces;
    const maxFractionDigits = maximumFractionDigits ?? decimalPlaces;

    // Format the number
    const numberFormatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    });

    const formattedAmount = numberFormatter.format(amount);

    // Build formatted string
    let formatted = '';

    if (showSymbol && currency.symbol) {
      // Handle different currency symbol positions
      if (this.isSymbolPrefix(currencyCode)) {
        formatted = `${currency.symbol}${formattedAmount}`;
      } else {
        formatted = `${formattedAmount} ${currency.symbol}`;
      }
    } else {
      formatted = formattedAmount;
    }

    if (showCode) {
      formatted += ` ${currencyCode.toUpperCase()}`;
    }

    return formatted;
  }

  /**
   * Format for display in UI (with symbol, appropriate locale)
   */
  async formatForDisplay(
    amount: number,
    currencyCode: string,
    userLocale?: string,
  ): Promise<string> {
    const locale = this.getLocaleForCurrency(currencyCode, userLocale);

    return this.format(amount, currencyCode, {
      showSymbol: true,
      locale,
    });
  }

  /**
   * Format for API responses (with symbol and code)
   */
  async formatForAPI(amount: number, currencyCode: string): Promise<string> {
    return this.format(amount, currencyCode, {
      showSymbol: true,
      showCode: true,
      locale: 'en-US',
    });
  }

  /**
   * Format minimal (just amount with symbol)
   */
  async formatMinimal(amount: number, currencyCode: string): Promise<string> {
    return this.format(amount, currencyCode, {
      showSymbol: true,
      showCode: false,
    });
  }

  /**
   * Format for Lebanon market (USD primary, LBP secondary)
   */
  async formatForLebanon(
    usdAmount: number,
    lbpAmount?: number,
  ): Promise<{
    primary: string;
    secondary?: string;
    combined?: string;
  }> {
    const primary = await this.formatForDisplay(usdAmount, 'USD');

    let secondary: string | undefined;
    let combined: string | undefined;

    if (lbpAmount) {
      secondary = await this.formatForDisplay(lbpAmount, 'LBP');
      combined = `${primary} (${secondary})`;
    }

    return { primary, secondary, combined };
  }

  /**
   * Parse formatted currency string back to number
   */
  async parseFormattedAmount(
    formattedAmount: string,
    currencyCode: string,
  ): Promise<number | null> {
    const currency = await this.getCurrency(currencyCode);
    if (!currency) {
      return null;
    }

    // Remove currency symbol and code
    let cleaned = formattedAmount
      .replace(currency.symbol, '')
      .replace(new RegExp(currencyCode, 'gi'), '')
      .trim();

    // Remove common formatting characters but keep decimal separator
    cleaned = cleaned.replace(/[,\s]/g, '');

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Get currency information with caching
   */
  private async getCurrency(currencyCode: string): Promise<Currency | null> {
    const upperCode = currencyCode.toUpperCase();

    if (this.currencyCache.has(upperCode)) {
      return this.currencyCache.get(upperCode) || null;
    }

    const currency = await this.currencyModel
      .findOne({
        isoCode: upperCode,
        isActive: true,
      })
      .exec();

    if (currency) {
      this.currencyCache.set(upperCode, currency);
    }

    return currency;
  }

  /**
   * Determine if currency symbol goes before or after amount
   */
  private isSymbolPrefix(currencyCode: string): boolean {
    const prefixCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    return prefixCurrencies.includes(currencyCode.toUpperCase());
  }

  /**
   * Get appropriate locale for currency
   */
  private getLocaleForCurrency(currencyCode: string, userLocale?: string): string {
    if (userLocale) {
      return userLocale;
    }

    // Default locales for specific currencies
    const localeMap: { [key: string]: string } = {
      USD: 'en-US',
      EUR: 'en-GB', // Or could be 'de-DE', 'fr-FR', etc.
      GBP: 'en-GB',
      LBP: 'ar-LB', // Lebanese Arabic
      AED: 'ar-AE',
      SAR: 'ar-SA',
    };

    return localeMap[currencyCode.toUpperCase()] || 'en-US';
  }

  /**
   * Format currency range (e.g., "$100 - $200")
   */
  async formatRange(
    minAmount: number,
    maxAmount: number,
    currencyCode: string,
    options: FormattingOptions = {},
  ): Promise<string> {
    const minFormatted = await this.format(minAmount, currencyCode, options);
    const maxFormatted = await this.format(maxAmount, currencyCode, options);

    return `${minFormatted} - ${maxFormatted}`;
  }

  /**
   * Format percentage for fees (e.g., "3.0%")
   */
  formatPercentage(percentage: number, decimals = 1): string {
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Format large numbers with abbreviations (e.g., "1.2K", "1.5M")
   */
  async formatAbbreviated(
    amount: number,
    currencyCode: string,
    options: FormattingOptions = {},
  ): Promise<string> {
    const currency = await this.getCurrency(currencyCode);
    const symbol = currency?.symbol || currencyCode;

    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    } else {
      return this.format(amount, currencyCode, options);
    }
  }

  /**
   * Clear currency cache
   */
  clearCache(): void {
    this.currencyCache.clear();
  }

  /**
   * Get formatting examples for different currencies
   */
  async getFormattingExamples(): Promise<{ [currency: string]: string[] }> {
    const examples: { [currency: string]: string[] } = {};
    const currencies = ['USD', 'LBP', 'EUR', 'AED'];
    const amounts = [100, 1500.5, 25000];

    for (const currency of currencies) {
      examples[currency] = [];
      for (const amount of amounts) {
        try {
          const formatted = await this.formatForDisplay(amount, currency);
          examples[currency].push(formatted);
        } catch {
          examples[currency].push(`${amount} ${currency}`);
        }
      }
    }

    return examples;
  }
}
