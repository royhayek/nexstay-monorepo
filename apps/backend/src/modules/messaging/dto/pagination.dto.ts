import { ApiProperty } from '@nestjs/swagger';
import { IsPageField, IsLimitField } from '../../../common/validators/standardized-validators';

export class PaginationDto {
  @IsPageField({ required: false })
  page?: number;

  @IsLimitField({ required: false })
  limit?: number;
}

export class PaginationResponseDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  pages: number;

  @ApiProperty({
    description: 'Whether there are more pages after current',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there are pages before current',
    example: false,
  })
  hasPrev: boolean;
}
