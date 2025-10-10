import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxJurisdiction } from '../schemas/tax-jurisdiction.schema';
import { TaxRate } from '../schemas/tax-rate.schema';
import {
  TaxType,
  TaxCalculationMethod,
  TaxApplicability,
  TaxStatus,
  TaxJurisdictionLevel,
} from '../../common/enums/tax.enums';
import { SeederLogger, runSeeder } from './seeder.helpers';
import { DateUtils } from '../../common/utils/date.utils';

/**
 * Seed tax jurisdictions and tax rates
 */
export async function seedTaxData(appContext: INestApplication): Promise<void> {
  await runSeeder('tax data', async () => {
    const TaxJurisdictionModel = appContext.get<Model<TaxJurisdiction>>(
      getModelToken('TaxJurisdiction'),
    );
    const TaxRateModel = appContext.get<Model<TaxRate>>(getModelToken('TaxRate'));

    const existingJurisdictions = await TaxJurisdictionModel.countDocuments();
    const existingRates = await TaxRateModel.countDocuments();

    if (existingJurisdictions > 0 && existingRates > 0) {
      SeederLogger.skipped('tax data');
      return;
    }

    // Clear existing data if partially seeded
    await TaxRateModel.deleteMany({});
    await TaxJurisdictionModel.deleteMany({});

    // Seed Tax Jurisdictions
    const jurisdictions = [
      // Lebanon
      {
        name: 'Lebanon',
        code: 'LB',
        level: TaxJurisdictionLevel.COUNTRY,
        country: 'LB',
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        description: 'National jurisdiction for Lebanon',
      },
      {
        name: 'Beirut',
        code: 'LB-BEI',
        level: TaxJurisdictionLevel.CITY,
        country: 'LB',
        city: 'Beirut',
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        description: 'City jurisdiction for Beirut',
      },
      {
        name: 'Mount Lebanon',
        code: 'LB-ML',
        level: TaxJurisdictionLevel.PROVINCE,
        country: 'LB',
        state: 'Mount Lebanon',
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        description: 'Provincial jurisdiction for Mount Lebanon',
      },
      {
        name: 'Jounieh',
        code: 'LB-ML-JOU',
        level: TaxJurisdictionLevel.CITY,
        country: 'LB',
        state: 'Mount Lebanon',
        city: 'Jounieh',
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        description: 'City jurisdiction for Jounieh',
      },
    ];

    const createdJurisdictions = await TaxJurisdictionModel.insertMany(jurisdictions);

    // Helper function to find jurisdiction by code
    const findJurisdiction = (code: string) =>
      createdJurisdictions.find((j) => j.code === code)?._id;

    // Seed Tax Rates
    const taxRates = [
      // Lebanon Taxes
      {
        name: 'Lebanon VAT',
        type: TaxType.VAT,
        jurisdictionId: findJurisdiction('LB'),
        calculationMethod: TaxCalculationMethod.PERCENTAGE,
        rate: 11.0,
        applicability: TaxApplicability.GUEST_PAID,
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        priority: 1,
        description: 'Lebanon Value Added Tax (TVA) - 11% on accommodation services',
      },
      {
        name: 'Beirut Municipality Tax',
        type: TaxType.CITY_TAX,
        jurisdictionId: findJurisdiction('LB-BEI'),
        calculationMethod: TaxCalculationMethod.PERCENTAGE,
        rate: 2.0,
        applicability: TaxApplicability.GUEST_PAID,
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        priority: 2,
        description: 'Beirut municipality tax on short-term rentals',
      },
      {
        name: 'Lebanon Tourism Tax',
        type: TaxType.TOURISM_TAX,
        jurisdictionId: findJurisdiction('LB'),
        calculationMethod: TaxCalculationMethod.PER_NIGHT,
        rate: 2.0,
        fixedAmount: 2.0,
        applicability: TaxApplicability.GUEST_PAID,
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        priority: 3,
        description: 'Lebanon tourism promotion tax - 2 USD per night',
        minimumStayDays: 1,
        maximumStayDays: 30,
      },
      {
        name: 'Mount Lebanon Service Tax',
        type: TaxType.SERVICE_TAX,
        jurisdictionId: findJurisdiction('LB-ML'),
        calculationMethod: TaxCalculationMethod.PERCENTAGE,
        rate: 1.5,
        applicability: TaxApplicability.HOST_PAID,
        status: TaxStatus.ACTIVE,
        effectiveFrom: DateUtils.create('2020-01-01'),
        priority: 4,
        description: 'Mount Lebanon governorate service tax',
      },
    ];

    // Filter out tax rates with undefined jurisdictionId
    const validTaxRates = taxRates.filter((rate) => rate.jurisdictionId);

    await TaxRateModel.insertMany(validTaxRates);

    SeederLogger.success('tax data');
  });
}
