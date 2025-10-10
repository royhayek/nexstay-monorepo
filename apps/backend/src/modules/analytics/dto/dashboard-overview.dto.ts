import { ApiProperty } from '@nestjs/swagger';

export class MetricCardDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  change: number;

  @ApiProperty()
  changeType: 'increase' | 'decrease' | 'neutral';

  @ApiProperty()
  period: string;

  @ApiProperty({ required: false })
  unit?: string;
}

export class PlatformDistributionDto {
  @ApiProperty()
  platform: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  color: string;
}

export class RegionalDataDto {
  @ApiProperty()
  region: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  code: string;
}

export class TimeSeriesDataDto {
  @ApiProperty()
  period: string;

  @ApiProperty()
  value: number;

  @ApiProperty({ required: false })
  breakdown?: Record<string, number>;
}

export class TopHostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  responseRate: number;

  @ApiProperty()
  joinDate: Date;
}

export class InvoiceOverviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  dueDate: Date;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: [MetricCardDto] })
  metrics: MetricCardDto[];

  @ApiProperty({ type: [PlatformDistributionDto] })
  platformDistribution: PlatformDistributionDto[];

  @ApiProperty({ type: [RegionalDataDto] })
  regionalData: RegionalDataDto[];

  @ApiProperty({ type: [TimeSeriesDataDto] })
  monthlyTrends: TimeSeriesDataDto[];

  @ApiProperty({ type: [TopHostDto] })
  topHosts: TopHostDto[];

  @ApiProperty({ type: [InvoiceOverviewDto] })
  recentInvoices: InvoiceOverviewDto[];

  @ApiProperty()
  lastUpdated: Date;
}
