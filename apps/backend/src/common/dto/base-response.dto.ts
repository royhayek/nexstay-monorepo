import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: 'Operation status indicator',
    example: 'success',
    enum: ['success', 'error'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['success', 'error'])
  status!: 'success' | 'error';

  @ApiProperty({
    description: 'Response title/summary',
    example: 'Operation Completed',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Detailed response message',
    example: 'The operation was completed successfully',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({
    description: 'Response data payload',
  })
  data!: T;

  @ApiPropertyOptional({
    description: 'Additional metadata (timestamps, request info, etc.)',
    example: { timestamp: '2024-01-01T00:00:00Z', requestId: 'req-123' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Factory function to create properly typed response DTOs for Swagger
 */
export function createResponseDto<T>(DataClass: new () => T) {
  const className = `${DataClass.name}ResponseDto`;

  class TypedResponseDto extends BaseResponseDto<T> {
    @ApiProperty({ type: DataClass })
    declare data: T;

    // Set the class name for Swagger
    static readonly __name = className;
  }

  // Dynamically set the class name
  Object.defineProperty(TypedResponseDto, 'name', {
    value: className,
    configurable: false,
  });

  return TypedResponseDto;
}

/**
 * Factory function to create paginated response DTOs
 */
export function createPaginatedResponseDto<T>(ItemClass: new () => T) {
  const dataClassName = `${ItemClass.name}PaginatedDataDto`;
  const responseClassName = `${ItemClass.name}PaginatedResponseDto`;

  class TypedPaginatedDataDto {
    @ApiProperty({ type: [ItemClass] })
    items!: T[];

    @ApiProperty({ type: () => PaginationMetaDto })
    @Type(() => PaginationMetaDto)
    pagination!: PaginationMetaDto;
  }

  // Set the data class name
  Object.defineProperty(TypedPaginatedDataDto, 'name', {
    value: dataClassName,
    configurable: false,
  });

  class TypedPaginatedResponseDto extends BaseResponseDto<TypedPaginatedDataDto> {
    @ApiProperty({ type: TypedPaginatedDataDto })
    declare data: TypedPaginatedDataDto;
  }

  // Set the response class name
  Object.defineProperty(TypedPaginatedResponseDto, 'name', {
    value: responseClassName,
    configurable: false,
  });

  return TypedPaginatedResponseDto;
}

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Current page number', example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20, minimum: 1 })
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 100, minimum: 0 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 5, minimum: 0 })
  totalPages!: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage!: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPreviousPage!: boolean;

  @ApiPropertyOptional({ description: 'Next page number', example: 2 })
  nextPage?: number;

  @ApiPropertyOptional({ description: 'Previous page number' })
  previousPage?: number;
}
