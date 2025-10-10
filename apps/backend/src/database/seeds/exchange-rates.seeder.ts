import { INestApplication } from '@nestjs/common';
import { DateUtils } from '../../common/utils/date.utils';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { ExchangeRate, ExchangeRateDocument } from '../schemas/exchange-rate.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

export async function seedExchangeRates(appContext: INestApplication) {
  await runSeeder('exchange rates', async () => {
    const exchangeRateModel: Model<ExchangeRateDocument> = appContext.get(
      getModelToken(ExchangeRate.name),
    );

    const exchangeRates = [
      {
        fromCurrency: 'USD',
        toCurrency: 'LBP',
        rate: 89500, // Approximate rate - should be updated regularly
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 89500,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
      {
        fromCurrency: 'LBP',
        toCurrency: 'USD',
        rate: 1 / 89500,
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 1 / 89500,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
      {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.92,
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 0.92,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.09,
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 1.09,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
      {
        fromCurrency: 'USD',
        toCurrency: 'AED',
        rate: 3.67,
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 3.67,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
      {
        fromCurrency: 'AED',
        toCurrency: 'USD',
        rate: 0.27,
        lastUpdated: DateUtils.now(),
        isActive: true,
        isManual: true,
        source: 'system_default',
        history: [
          {
            rate: 0.27,
            timestamp: DateUtils.now(),
            source: 'system_default',
          },
        ],
      },
    ];

    const existingCount = await exchangeRateModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('exchange rates');
      return;
    }

    let createdCount = 0;
    for (const rateData of exchangeRates) {
      const existing = await exchangeRateModel
        .findOne({
          fromCurrency: rateData.fromCurrency,
          toCurrency: rateData.toCurrency,
        })
        .exec();

      if (!existing) {
        await exchangeRateModel.create({
          ...rateData,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      SeederLogger.success('exchange rates');
    } else {
      SeederLogger.skipped('exchange rates');
    }
  });
}
