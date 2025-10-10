# Response Architecture Guide

## Overview

This document defines the standardized response architecture for the Airbnb Clone Backend, ensuring consistent API responses across all modules and proper Swagger documentation.

## Core Principles

1. **Consistency**: All API responses follow the same structure
2. **Type Safety**: Full TypeScript coverage with proper generics
3. **Swagger Integration**: Automatic and accurate API documentation
4. **Extensibility**: Easy to extend while maintaining compatibility

## Base Response Structure

All API responses extend `BaseResponseDto<T>`:

```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  title: string;
  message: string;
  data: T;
  metadata?: Record<string, any>;
}
```

## Response DTO Patterns

### 1. Single Item Response

```typescript
// Data DTO
export class UserDataDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;
  // ... other fields
}

// Response DTO
export class UserResponseDto extends BaseResponseDto<UserDataDto> {
  @ApiProperty({ type: UserDataDto })
  declare data: UserDataDto;
}
```

### 2. List/Array Response

```typescript
// List data wrapper
export class UserListDataDto {
  @ApiProperty({ type: [UserDataDto] })
  users: UserDataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

// Response DTO
export class UserListResponseDto extends BaseResponseDto<UserListDataDto> {
  @ApiProperty({ type: UserListDataDto })
  declare data: UserListDataDto;
}
```

### 3. Paginated Response

```typescript
// Use existing PaginatedDto
export class UsersPaginatedDto extends PaginatedDto<UserDataDto> {
  @ApiProperty({ type: [UserDataDto] })
  @Type(() => UserDataDto)
  declare items: UserDataDto[];
}

// Response DTO
export class UserPaginatedResponseDto extends BaseResponseDto<UsersPaginatedDto> {
  @ApiProperty({ type: UsersPaginatedDto })
  declare data: UsersPaginatedDto;
}
```

### 4. Factory-Based Response (Advanced)

```typescript
// Use factory for dynamic typing
export const UserResponseDtoFactory = createResponseDto(UserDataDto);
export const UserPaginatedResponseDtoFactory = createPaginatedResponseDto(UserDataDto);
```

### 5. Operation-Specific Responses

```typescript
// For specific operations like deletion
export class UserDeletionDataDto {
  @ApiProperty({ description: 'Deleted user ID' })
  userId: string;

  @ApiProperty({ description: 'Deletion timestamp' })
  deletedAt: Date;

  @ApiProperty({ description: 'Soft delete flag' })
  isSoftDeleted: boolean;
}

export class UserDeletionResponseDto extends BaseResponseDto<UserDeletionDataDto> {
  @ApiProperty({ type: UserDeletionDataDto })
  declare data: UserDeletionDataDto;
}
```

## Pagination Standards

### Use PaginationMetaDto for ALL paginated responses:

```typescript
export class PaginationMetaDto {
  page: number;           // Current page number (1-based)
  limit: number;          // Items per page
  total: number;          // Total number of items
  totalPages: number;     // Total number of pages
  hasNextPage: boolean;   // Has next page
  hasPreviousPage: boolean; // Has previous page
  nextPage?: number;      // Next page number
  previousPage?: number;  // Previous page number
}
```

## Controller Implementation

### Standard Pattern:

```typescript
@Controller('users')
@ApiTags('Users')
export class UsersController extends BaseController {

  @Get()
  @ProtectedEndpoint('Get all users', 'Retrieve paginated list of users')
  @ApiResponse({ type: UserPaginatedResponseDto }) // Add this!
  async findAll(): Promise<UserPaginatedResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.findAll();
        return result; // Should match UsersPaginatedDto structure
      },
      'Get users',
      'Users Retrieved',
      'Users retrieved successfully',
      'Failed to retrieve users'
    );
  }
}
```

## Module-Specific Fixes Needed

### 1. Messaging Module ❌
**Issue**: Custom pagination fields instead of `PaginationMetaDto`

```typescript
// CURRENT (Incorrect):
export class PaginatedConversationsDto {
  conversations: ConversationDataDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean; // Different naming!
}

// SHOULD BE:
export class ConversationsPaginatedDto extends PaginatedDto<ConversationDataDto> {
  @ApiProperty({ type: [ConversationDataDto] })
  @Type(() => ConversationDataDto)
  declare items: ConversationDataDto[];
}
```

### 2. Properties Module ✅
**Status**: Correctly implemented - serves as reference

### 3. Auth Module ✅
**Status**: Correctly implemented

### 4. Users Module ✅
**Status**: Correctly implemented with factory pattern

### 5. Bookings Module ✅
**Status**: Correctly implemented

### 6. Storage Module ✅
**Status**: Correctly implemented

## ApiEndpoint Decorator Enhancement

Need to enhance the decorator to automatically include response types:

```typescript
// Enhanced usage
@ApiEndpoint({
  summary: 'Get user by ID',
  responseType: UserResponseDto,
  auth: { required: true }
})
async findOne(@Param('id') id: string): Promise<UserResponseDto> {
  // implementation
}
```

## Quality Checklist

For each module, verify:

- [ ] All responses extend `BaseResponseDto<T>`
- [ ] Paginated responses use `PaginatedDto<T>` and `PaginationMetaDto`
- [ ] Response DTOs have proper `@ApiProperty` decorators
- [ ] Controllers specify response types in decorators
- [ ] No inline response types or manual structures
- [ ] Consistent naming conventions
- [ ] Factory patterns used where beneficial

## Migration Strategy

1. ✅ **Properties Module**: Already compliant (reference implementation)
2. ✅ **Auth Module**: Already compliant
3. ✅ **Users Module**: Already compliant
4. ✅ **Bookings Module**: Already compliant
5. ✅ **Storage Module**: Already compliant
6. ❌ **Messaging Module**: Requires pagination standardization
7. **Other Modules**: Audit and fix as needed

## Benefits

1. **Consistent API Responses**: All endpoints follow the same structure
2. **Accurate Swagger Docs**: Automatic and reliable API documentation
3. **Type Safety**: Full TypeScript coverage prevents runtime errors
4. **Developer Experience**: Predictable response formats
5. **Maintainability**: Centralized response patterns simplify updates