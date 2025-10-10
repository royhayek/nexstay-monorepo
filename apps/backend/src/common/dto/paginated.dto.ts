import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic Paginated DTO using Swagger's @ApiExtraModels pattern
 * This is the industry standard approach for handling generics in NestJS/Swagger
 *
 * Usage in DTOs:
 * ```typescript
 * export class UserListResponseDto extends BaseResponseDto<PaginatedDto<UserDataDto>> {
 *   @ApiProperty({
 *     type: 'object',
 *     properties: {
 *       items: {
 *         type: 'array',
 *         items: { $ref: getSchemaPath(UserDataDto) },
 *       },
 *       total: { type: 'number' },
 *       page: { type: 'number' },
 *       limit: { type: 'number' },
 *       totalPages: { type: 'number' },
 *       hasNextPage: { type: 'boolean' },
 *       hasPrevPage: { type: 'boolean' },
 *     },
 *   })
 *   declare data: PaginatedDto<UserDataDto>;
 * }
 * ```
 *
 * Usage in Controllers:
 * ```typescript
 * @ApiExtraModels(UserDataDto, PaginatedDto)
 * @Controller('users')
 * export class UsersController {
 *   @Get()
 *   @ApiOkResponse({ type: UserListResponseDto })
 *   async getUsers(): Promise<UserListResponseDto> {
 *     // ...
 *   }
 * }
 * ```
 */
export class PaginatedDto<T = any> {
  @ApiProperty({
    description: 'Array of items',
    type: 'array',
    items: { type: 'object' },
  })
  items: T[];

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
    type: 'number',
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    minimum: 1,
    type: 'number',
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    type: 'number',
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
    minimum: 0,
    type: 'number',
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
    type: 'boolean',
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
    type: 'boolean',
  })
  hasPrevPage: boolean;
}

/**
 * Simple approach: Just use the generic PaginatedDto with proper typing in response DTOs
 * This avoids complex factory functions that can confuse OpenAPI generators like Orval
 *
 * For specific use cases where you need explicit typing in Swagger,
 * create concrete classes that extend PaginatedDto in individual modules
 */
