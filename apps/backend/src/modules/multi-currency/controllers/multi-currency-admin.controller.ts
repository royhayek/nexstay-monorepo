import { Controller, Post, Body, Get, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { ExchangeRateService } from '../services/exchange-rate.service';
import type { ExchangeRateUpdate } from '../services/exchange-rate.service';

@ApiTags('Multi-Currency Management')
@Controller('admin/multi-currency')
export class MultiCurrencyAdminController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Post('exchange-rates')
  @AdminEndpoint(
    'Update exchange rate',
    'Update a specific currency exchange rate with admin privileges',
  )
  async updateExchangeRate(@Body() updateData: ExchangeRateUpdate) {
    return this.exchangeRateService.updateExchangeRate(updateData);
  }

  @Post('exchange-rates/bulk')
  @AdminEndpoint(
    'Bulk update exchange rates',
    'Update multiple exchange rates in a single operation',
  )
  async bulkUpdateExchangeRates(@Body() updates: ExchangeRateUpdate[]) {
    return this.exchangeRateService.bulkUpdateExchangeRates(updates);
  }

  @Get('exchange-rates/stale')
  @AdminEndpoint(
    'Get stale exchange rates',
    'Retrieve exchange rates that need updating based on age threshold',
  )
  async getStaleExchangeRates() {
    return this.exchangeRateService.getStaleExchangeRates();
  }

  @Patch('exchange-rates/refresh')
  @AdminEndpoint(
    'Refresh exchange rates',
    'Trigger a manual refresh of all exchange rates from external sources',
  )
  refreshExchangeRates() {
    this.exchangeRateService.refreshExchangeRates();
    return { message: 'Exchange rates refresh initiated' };
  }

  @Get('exchange-rates/:fromCurrency/:toCurrency/history')
  @AdminEndpoint(
    'Get exchange rate history',
    'Retrieve historical exchange rate data for a specific currency pair',
  )
  async getExchangeRateHistory(
    @Param('fromCurrency') fromCurrency: string,
    @Param('toCurrency') toCurrency: string,
  ) {
    return this.exchangeRateService.getExchangeRateHistory(fromCurrency, toCurrency);
  }

  @Post('initialize-defaults')
  @AdminEndpoint(
    'Initialize default exchange rates',
    'Set up default exchange rates for the platform (USD/LBP)',
  )
  async initializeDefaultRates() {
    await this.exchangeRateService.initializeDefaultRates();
    return { message: 'Default exchange rates initialized' };
  }
}
