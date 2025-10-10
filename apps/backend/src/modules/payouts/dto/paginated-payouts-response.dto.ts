import { ApiProperty } from '@nestjs/swagger';
import { PayoutResponseDto } from './payout-response.dto';
import { createPaginatedResponseDto } from '../../../common/dto/base-response.dto';

// Create paginated response DTO using factory pattern
export const PaginatedPayoutsResponse = createPaginatedResponseDto(PayoutResponseDto);

// Type alias for better code readability
export type PaginatedPayoutsResponseType = InstanceType<typeof PaginatedPayoutsResponse>;

// Keep original export for backward compatibility
export class PaginatedPayoutsResponseDto {
  @ApiProperty({ description: 'Array of payouts', type: [PayoutResponseDto] })
  payouts!: PayoutResponseDto[];

  @ApiProperty({ description: 'Total number of payouts', example: 25 })
  total!: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages!: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage!: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrevPage!: boolean;
}
