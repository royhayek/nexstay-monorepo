import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { ExchangeRate, ExchangeRateDocument } from '../../../database/schemas/exchange-rate.schema';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface ExchangeRateUpdate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source?: string;
  isManual?: boolean;
}

@Injectable()
export class ExchangeRateService {
  // Cache for frequently used rates (in-memory cache)
  private rateCache = new Map<string, { rate: number; expiry: Date; data: ExchangeRate }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(ExchangeRate.name)
    private readonly exchangeRateModel: Model<ExchangeRateDocument>,
  ) {}

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    useCache = true,
  ): Promise<ExchangeRate | null> {
    const cacheKey = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;

    // Check cache first
    if (useCache && this.rateCache.has(cacheKey)) {
      const cached = this.rateCache.get(cacheKey);
      if (cached && cached.expiry > DateUtils.now()) {
        return cached.data;
      }
      // Remove expired cache entry
      this.rateCache.delete(cacheKey);
    }

    // Fetch from database
    const exchangeRate = await this.exchangeRateModel
      .findOne({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        isActive: true,
      })
      .exec();

    if (exchangeRate && useCache) {
      // Cache the result
      this.rateCache.set(cacheKey, {
        rate: exchangeRate.rate,
        expiry: DateUtils.create(DateUtils.create(DateUtils.now().getTime() + this.CACHE_TTL_MS)),
        data: exchangeRate,
      });
    }

    return exchangeRate;
  }

  /**
   * Update or create exchange rate
   */
  async updateExchangeRate(update: ExchangeRateUpdate): Promise<ExchangeRate> {
    const { fromCurrency, toCurrency, rate, source = 'manual', isManual = true } = update;

    const filter = QueryBuilder.create()
      .addStringFilter('fromCurrency', fromCurrency.toUpperCase())
      .addStringFilter('toCurrency', toCurrency.toUpperCase())
      .build();

    const updateData = {
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate,
      lastUpdated: DateUtils.now(),
      isManual,
      source,
      isActive: true,
      $push: {
        history: {
          rate,
          timestamp: DateUtils.now(),
          source,
        },
      },
    };

    const exchangeRate = await this.exchangeRateModel.findOneAndUpdate(filter, updateData, {
      upsert: true,
      new: true,
    });

    // Clear cache for this rate
    const cacheKey = `${fromCurrency.toLowerCase()}_${toCurrency.toLowerCase()}`;
    this.rateCache.delete(cacheKey);

    LoggingUtil.log(
      `Updated exchange rate: ${fromCurrency}/${toCurrency} = ${rate} (source: ${source})`,
      'ExchangeRateService',
    );

    return exchangeRate;
  }

  /**
   * Bulk update exchange rates
   */
  async bulkUpdateExchangeRates(updates: ExchangeRateUpdate[]): Promise<ExchangeRate[]> {
    const results: ExchangeRate[] = [];

    for (const update of updates) {
      try {
        const exchangeRate = await this.updateExchangeRate(update);
        results.push(exchangeRate);
      } catch (error: unknown) {
        LoggingUtil.error(
          `Failed to update exchange rate ${update.fromCurrency}/${update.toCurrency}:`,
          error instanceof Error ? error.stack : 'Unknown error',
          'ExchangeRateService',
        );
      }
    }

    return results;
  }

  /**
   * Get all active exchange rates
   */
  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return this.exchangeRateModel
      .find({ isActive: true })
      .sort({ fromCurrency: 1, toCurrency: 1 })
      .exec();
  }

  /**
   * Get exchange rates for a specific base currency
   */
  async getExchangeRatesForCurrency(baseCurrency: string): Promise<ExchangeRate[]> {
    return this.exchangeRateModel
      .find({
        fromCurrency: baseCurrency.toUpperCase(),
        isActive: true,
      })
      .sort({ toCurrency: 1 })
      .exec();
  }

  /**
   * Initialize default exchange rates for Lebanon market (USD/LBP)
   */
  async initializeDefaultRates(): Promise<void> {
    const defaultRates = [
      {
        fromCurrency: 'USD',
        toCurrency: 'LBP',
        rate: 89500, // Approximate rate - should be updated regularly
        source: 'system_default',
        isManual: true,
      },
      {
        fromCurrency: 'LBP',
        toCurrency: 'USD',
        rate: 1 / 89500,
        source: 'system_default',
        isManual: true,
      },
    ];

    for (const rateData of defaultRates) {
      const existing = await this.exchangeRateModel
        .findOne({
          fromCurrency: rateData.fromCurrency,
          toCurrency: rateData.toCurrency,
        })
        .exec();

      if (!existing) {
        await this.updateExchangeRate(rateData);
      }
    }

    LoggingUtil.log('Default exchange rates initialized', 'ExchangeRateService');
  }

  /**
   * Get exchange rate history for a currency pair
   */
  async getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    limit = 50,
  ): Promise<any[]> {
    const exchangeRate = await this.exchangeRateModel
      .findOne({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        isActive: true,
      })
      .select('history')
      .exec();

    if (!exchangeRate || !exchangeRate.history) {
      return [];
    }

    // Return recent history, sorted by timestamp desc
    return exchangeRate.history
      .sort(
        (a, b) => DateUtils.create(b.timestamp).getTime() - DateUtils.create(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Clear exchange rate cache
   */
  clearCache(): void {
    this.rateCache.clear();
    LoggingUtil.log('Exchange rate cache cleared', 'ExchangeRateService');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.rateCache.size,
      keys: Array.from(this.rateCache.keys()),
    };
  }

  /**
   * Scheduled job to refresh exchange rates (every 2 hours)
   * In production, this should fetch from external API
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  refreshExchangeRates(): void {
    LoggingUtil.log('Starting scheduled exchange rate refresh', 'ExchangeRateService');

    try {
      // Clear cache to force fresh data
      this.clearCache();

      // In production, implement external API integration here
      // For now, we log that rates should be manually updated
      LoggingUtil.log(
        'Exchange rates refresh completed. Consider implementing external API integration for production.',
        'ExchangeRateService',
      );
    } catch (error: unknown) {
      LoggingUtil.error(
        'Failed to refresh exchange rates:',
        error instanceof Error ? error.stack : 'Unknown error',
        'ExchangeRateService',
      );
    }
  }

  /**
   * Validate exchange rate data
   */
  validateExchangeRate(rate: number): boolean {
    return (
      typeof rate === 'number' && isFinite(rate) && rate > 0 && rate < 1000000 // Reasonable upper bound
    );
  }

  /**
   * Calculate inverse rate
   */
  calculateInverseRate(rate: number): number {
    if (!this.validateExchangeRate(rate)) {
      throw new Error('Invalid exchange rate');
    }
    return 1 / rate;
  }

  /**
   * Get stale exchange rates (older than specified hours)
   */
  async getStaleExchangeRates(hoursOld = 24): Promise<ExchangeRate[]> {
    const cutoffDate = DateUtils.create(
      DateUtils.create(DateUtils.now().getTime() - hoursOld * 60 * 60 * 1000),
    );

    return this.exchangeRateModel
      .find({
        isActive: true,
        lastUpdated: { $lt: cutoffDate },
      })
      .exec();
  }
}
