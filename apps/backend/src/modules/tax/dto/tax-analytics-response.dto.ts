import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class TaxTypeBreakdownDto {
  @ApiProperty({ description: 'Tax type name' })
  type: string;

  @ApiProperty({ description: 'Total amount for this tax type' })
  amount: number;

  @ApiProperty({ description: 'Percentage of total taxes' })
  percentage: number;
}

export class MonthlyTrendDto {
  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2024-01' })
  month: string;

  @ApiProperty({ description: 'Total tax amount for the month' })
  amount: number;
}

export class TaxAnalyticsDataDto {
  @ApiProperty({ description: 'Total tax collected' })
  totalTaxCollected: number;

  @ApiProperty({ description: 'Total tax remitted' })
  totalTaxRemitted: number;

  @ApiProperty({ description: 'Total tax owed' })
  totalTaxOwed: number;

  @ApiProperty({ description: 'Compliance rate percentage' })
  complianceRate: number;

  @ApiProperty({
    description: 'Top tax types by amount',
    type: [TaxTypeBreakdownDto],
  })
  topTaxTypes: TaxTypeBreakdownDto[];

  @ApiProperty({
    description: 'Monthly tax trends',
    type: [MonthlyTrendDto],
  })
  monthlyTrends: MonthlyTrendDto[];
}

export class TaxAnalyticsResponseDto extends BaseResponseDto<TaxAnalyticsDataDto> {
  @ApiProperty({
    description: 'Tax analytics data',
    type: TaxAnalyticsDataDto,
  })
  declare data: TaxAnalyticsDataDto;
}
