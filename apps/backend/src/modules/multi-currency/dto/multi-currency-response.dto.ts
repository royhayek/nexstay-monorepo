import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class SupportedCurrencyDto {
  @ApiProperty({ description: 'Currency code', example: 'USD' })
  code: string;

  @ApiProperty({ description: 'Currency name', example: 'US Dollar' })
  name: string;

  @ApiProperty({ description: 'Currency symbol', example: '$' })
  symbol: string;

  @ApiProperty({ description: 'Whether this currency is active', example: true })
  isActive: boolean;
}

export class CurrencyConversionDto {
  @ApiProperty({ description: 'Original amount', example: 100 })
  originalAmount: number;

  @ApiProperty({ description: 'From currency code', example: 'USD' })
  fromCurrency: string;

  @ApiProperty({ description: 'To currency code', example: 'EUR' })
  toCurrency: string;

  @ApiProperty({ description: 'Converted amount', example: 85.5 })
  convertedAmount: number;

  @ApiProperty({ description: 'Exchange rate used', example: 0.855 })
  exchangeRate: number;

  @ApiProperty({ description: 'Timestamp of conversion', example: '2024-01-01T12:00:00Z' })
  timestamp: string;
}

export class MultiCurrencyPriceDto {
  @ApiProperty({ description: 'Base currency code', example: 'USD' })
  baseCurrency: string;

  @ApiProperty({ description: 'Base amount', example: 100 })
  baseAmount: number;

  @ApiProperty({
    description: 'Prices in different currencies',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { USD: 100, EUR: 85.5, GBP: 75.2 },
  })
  prices: Record<string, number>;

  @ApiProperty({ description: 'Last updated timestamp', example: '2024-01-01T12:00:00Z' })
  lastUpdated: string;
}

export class ExchangeRateDto {
  @ApiProperty({ description: 'Base currency', example: 'USD' })
  baseCurrency: string;

  @ApiProperty({
    description: 'Exchange rates to other currencies',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { EUR: 0.855, GBP: 0.752, JPY: 110.5 },
  })
  rates: Record<string, number>;

  @ApiProperty({ description: 'Last updated timestamp', example: '2024-01-01T12:00:00Z' })
  lastUpdated: string;
}

export class FormattedCurrencyDto {
  @ApiProperty({ description: 'Formatted currency string', example: '$100.00' })
  formatted: string;

  @ApiProperty({ description: 'Currency code used', example: 'USD' })
  currency?: string;

  @ApiProperty({ description: 'Locale used for formatting', example: 'en-US' })
  locale?: string;

  @ApiProperty({ description: 'Original amount', example: 100 })
  amount?: number;
}

// Response DTOs
export class SupportedCurrenciesResponseDto extends BaseResponseDto<SupportedCurrencyDto[]> {
  @ApiProperty({ type: [SupportedCurrencyDto] })
  declare data: SupportedCurrencyDto[];
}

export class CurrencyConversionResponseDto extends BaseResponseDto<CurrencyConversionDto> {
  @ApiProperty({ type: CurrencyConversionDto })
  declare data: CurrencyConversionDto;
}

export class MultiCurrencyPriceResponseDto extends BaseResponseDto<MultiCurrencyPriceDto> {
  @ApiProperty({ type: MultiCurrencyPriceDto })
  declare data: MultiCurrencyPriceDto;
}

export class ExchangeRatesResponseDto extends BaseResponseDto<ExchangeRateDto> {
  @ApiProperty({ type: ExchangeRateDto })
  declare data: ExchangeRateDto;
}

export class FormattedCurrencyResponseDto extends BaseResponseDto<FormattedCurrencyDto> {
  @ApiProperty({ type: FormattedCurrencyDto })
  declare data: FormattedCurrencyDto;
}
