import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

/**
 * Base pagination DTO for API requests
 *
 * NOTE: The default and maximum values here are compile-time constraints for validation.
 * At runtime, use PaginationUtils.normalizePagination() which loads dynamic configuration
 * from the database via PaginationConfigService, allowing changes without code deployment.
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (starting from 1)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
