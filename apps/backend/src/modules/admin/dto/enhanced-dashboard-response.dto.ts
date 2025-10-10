import { ApiProperty } from '@nestjs/swagger';
import { DashboardOverviewDto } from '../../analytics/dto/dashboard-overview.dto';
import { AdminStatsResponseDto } from './admin-stats-response.dto';

/**
 * Enhanced Dashboard Response DTO
 * Extends the analytics dashboard with admin-specific statistics
 */
export class EnhancedDashboardResponseDto extends DashboardOverviewDto {
  @ApiProperty({
    type: AdminStatsResponseDto,
    description: 'Admin-specific statistics',
  })
  adminStats!: AdminStatsResponseDto;

  @ApiProperty({
    description: 'Timestamp when dashboard was last updated',
    example: '2024-01-15T10:30:00.000Z',
  })
  declare lastUpdated: Date;
}
