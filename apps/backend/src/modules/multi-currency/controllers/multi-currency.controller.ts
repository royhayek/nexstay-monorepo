import { Controller, Get, Query, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { MultiCurrencyService } from '../services/multi-currency.service';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { CurrencyFormatterService } from '../services/currency-formatter.service';
import {
  SupportedCurrenciesResponseDto,
  CurrencyConversionResponseDto,
  MultiCurrencyPriceResponseDto,
  ExchangeRatesResponseDto,
  FormattedCurrencyResponseDto,
} from '../dto/multi-currency-response.dto';

@ApiTags('Multi-Currency')
@Controller('multi-currency')
export class MultiCurrencyController {
  constructor(
    private readonly multiCurrencyService: MultiCurrencyService,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly currencyFormatterService: CurrencyFormatterService,
  ) {}

  @Get('supported-currencies')
  @PublicEndpoint(
    'Get supported currencies',
    'Retrieve a list of all currencies supported by the platform',
    SupportedCurrenciesResponseDto,
  )
  async getSupportedCurrencies() {
    return this.multiCurrencyService.getSupportedCurrencies();
  }

  @Get('convert')
  @PublicEndpoint(
    'Convert currency amount',
    'Convert an amount from one currency to another using current exchange rates',
    CurrencyConversionResponseDto,
  )
  @ApiQuery({ name: 'amount', type: Number, description: 'Amount to convert' })
  @ApiQuery({ name: 'from', type: String, description: 'From currency code' })
  @ApiQuery({ name: 'to', type: String, description: 'To currency code' })
  async convertCurrency(
    @Query('amount') amount: number,
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    if (!amount || !fromCurrency || !toCurrency) {
      throw new BadRequestException('Missing required parameters');
    }

    return this.multiCurrencyService.convertCurrency(amount, fromCurrency, toCurrency);
  }

  @Get('multi-price/:amount/:currency')
  @PublicEndpoint(
    'Get multi-currency price display',
    'Display a price amount in multiple currencies for comparison',
    MultiCurrencyPriceResponseDto,
  )
  async getMultiCurrencyPrice(
    @Param('amount') amount: number,
    @Param('currency') currency: string,
  ) {
    return this.multiCurrencyService.getMultiCurrencyPrice(amount, currency);
  }

  @Get('exchange-rates')
  @PublicEndpoint(
    'Get all exchange rates',
    'Retrieve current exchange rates for all supported currency pairs',
    ExchangeRatesResponseDto,
  )
  async getExchangeRates() {
    return this.exchangeRateService.getAllExchangeRates();
  }

  @Get('format/:amount/:currency')
  @PublicEndpoint(
    'Format currency amount',
    'Format a currency amount according to locale-specific formatting rules',
    FormattedCurrencyResponseDto,
  )
  async formatCurrency(
    @Param('amount') amount: number,
    @Param('currency') currency: string,
    @Query('locale') locale?: string,
  ) {
    return {
      formatted: await this.currencyFormatterService.formatForDisplay(amount, currency, locale),
    };
  }
}
