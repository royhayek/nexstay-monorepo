import { ApiProperty } from '@nestjs/swagger';

/**
 * Admin Stats Response DTO
 */
export class AdminStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 1250,
  })
  totalUsers!: number;

  @ApiProperty({
    description: 'Number of active and verified users',
    example: 980,
  })
  activeUsers!: number;

  @ApiProperty({
    description: 'Number of new users registered today',
    example: 15,
  })
  newUsersToday!: number;

  @ApiProperty({
    description: 'Number of inactive users',
    example: 270,
  })
  inactiveUsers!: number;
}

/**
 * Recent Activity DTO
 */
export class RecentActivityDto {
  @ApiProperty({
    description: 'List of recent admin activities',
    type: [Object],
    example: [],
  })
  activities!: unknown[];

  @ApiProperty({
    description: 'Total count of activities',
    example: 0,
  })
  totalCount!: number;
}
