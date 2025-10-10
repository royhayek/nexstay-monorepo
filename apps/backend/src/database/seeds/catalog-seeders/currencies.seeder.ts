import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Currency, CurrencyDocument } from '../../schemas/currency.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedCurrencies(appContext: INestApplication) {
  await runSeeder('currencies', async () => {
    const currencyModel: Model<CurrencyDocument> = appContext.get(getModelToken(Currency.name));

    const currencies = [
      {
        key: 'USD',
        slug: 'usd',
        name: { en: 'US Dollar', fr: 'Dollar américain', ar: 'دولار أمريكي' },
        isoCode: 'USD',
        symbol: '$',
        isSupported: true,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'EUR',
        slug: 'eur',
        name: { en: 'Euro', fr: 'Euro', ar: 'يورو' },
        isoCode: 'EUR',
        symbol: '€',
        isSupported: true,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'GBP',
        slug: 'gbp',
        name: { en: 'British Pound', fr: 'Livre sterling', ar: 'جنيه إسترليني' },
        isoCode: 'GBP',
        symbol: '£',
        isSupported: true,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'AED',
        slug: 'aed',
        name: { en: 'UAE Dirham', fr: 'Dirham des EAU', ar: 'درهم إماراتي' },
        isoCode: 'AED',
        symbol: 'د.إ',
        isSupported: true,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SAR',
        slug: 'sar',
        name: { en: 'Saudi Riyal', fr: 'Riyal saoudien', ar: 'ريال سعودي' },
        isoCode: 'SAR',
        symbol: 'ر.س',
        isSupported: true,
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LBP',
        slug: 'lbp',
        name: { en: 'Lebanese Pound', fr: 'Livre libanaise', ar: 'ليرة لبنانية' },
        isoCode: 'LBP',
        symbol: 'ل.ل',
        decimalPlaces: 0, // LBP typically doesn't use decimal places
        isSupported: true,
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await currencyModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('currencies');
      return;
    }

    let createdCount = 0;
    for (const currency of currencies) {
      const existing = await currencyModel.findOne({ key: currency.key }).exec();

      if (!existing) {
        await currencyModel.create({
          ...currency,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      SeederLogger.success('currencies');
    } else {
      SeederLogger.skipped('currencies');
    }
  });
}
