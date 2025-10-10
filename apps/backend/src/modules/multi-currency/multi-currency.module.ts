import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExchangeRate, ExchangeRateSchema } from '../../database/schemas/exchange-rate.schema';
import { Currency, CurrencySchema } from '../../database/schemas/currency.schema';
import { MultiCurrencyService } from './services/multi-currency.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { CurrencyFormatterService } from './services/currency-formatter.service';
import { MultiCurrencyController } from './controllers/multi-currency.controller';
import { MultiCurrencyAdminController } from './controllers/multi-currency-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExchangeRate.name, schema: ExchangeRateSchema },
      { name: Currency.name, schema: CurrencySchema },
    ]),
  ],
  controllers: [MultiCurrencyController, MultiCurrencyAdminController],
  providers: [MultiCurrencyService, ExchangeRateService, CurrencyFormatterService],
  exports: [MultiCurrencyService, ExchangeRateService, CurrencyFormatterService],
})
export class MultiCurrencyModule {}
