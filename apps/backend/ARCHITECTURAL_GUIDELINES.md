# NestJS Architectural Guidelines

This document establishes consistent patterns and best practices for the Airbnb clone backend architecture.

## Module Structure Standards

### 1. **Service Architecture Pattern**

Following the **Single Responsibility Principle**, modules should split services by responsibility:

```typescript
// ✅ RECOMMENDED: Specialized Services
src/modules/users/
├── services/
│   ├── user-core.service.ts       // CRUD operations, authentication
│   ├── user-profile.service.ts    // Profile management, preferences
│   ├── user-account.service.ts    // Account lifecycle (deactivation, deletion)
│   ├── user-admin.service.ts      // Admin operations, bulk actions
│   └── users-facade.service.ts    // Coordinates all services (public API)
└── users.service.ts               // Legacy - deprecated, use facade

// ❌ AVOID: Monolithic Services
src/modules/users/
└── users.service.ts               // 1600+ lines - too large
```

**Benefits:**

- **Maintainable**: Each service has a single, clear purpose
- **Testable**: Easier to unit test individual responsibilities
- **Scalable**: Can be independently optimized or extracted
- **Team-friendly**: Multiple developers can work on different services

### 2. **DTO Organization Patterns**

**Hierarchical DTO Structure:**

```typescript
// ✅ RECOMMENDED: Base classes with extensions
export abstract class BaseUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() email?: string;
  @ApiProperty() firstName?: string;
  // Common fields
}

export class UserSummaryDto extends BaseUserDto {
  // Minimal fields for listings
}

export class UserDataDto extends BaseUserDto {
  @ApiProperty() bio?: string;
  @ApiProperty() preferences?: UserPreferences;
  // Complete profile data
}

export class UserAdminDto extends UserDataDto {
  @ApiProperty() lastLoginAt?: Date;
  @ApiProperty() failedLoginAttempts?: number;
  // Admin-only fields
}
```

**Validation Standardization:**

```typescript
// ✅ USE: Standardized validators
@IsEmailField({
  description: 'User email address',
  example: 'user@example.com',
})
email?: string;

// ❌ AVOID: Raw validation decorators
@ApiProperty({ description: 'Email' })
@IsOptional()
@IsEmail()
email?: string;
```

### 3. **Controller Organization**

**Controller Separation:**

```typescript
// ✅ RECOMMENDED: Separate controllers by audience
users - app.controller.ts; // Public user operations
users - admin.controller.ts; // Admin-only operations
users - auth.controller.ts; // Authentication endpoints (if applicable)
```

**Base Controller Usage:**

```typescript
// ✅ ALWAYS extend BaseController
export class UsersAppController extends BaseController {
  constructor(
    private readonly usersService: UsersFacadeService,
    i18nService?: I18nService,
  ) {
    super(i18nService);
  }

  @ApiEndpoint({
    summary: 'Get user profile',
    auth: { required: true },
  })
  async getProfile(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      () => this.usersService.getMe(user._id),
      'Get user profile',
      'Profile Retrieved',
      'User profile retrieved successfully',
    );
  }
}
```

## Global Patterns

### 1. **Validation Patterns**

**Use Standardized Validators:**

```typescript
// Available standardized validators with custom examples:
@IsNameField({ example: 'Beautiful Downtown Apartment' })     // Names (firstName, lastName, etc.)
@IsEmailField({ example: 'john.doe@example.com' })           // Email addresses
@IsPhoneField({ example: '+1234567890' })                    // Phone numbers
@IsPasswordField()                                           // Passwords with complexity rules
@IsUrlField({ example: 'https://example.com/image.jpg' })   // URLs
@IsTextAreaField({ example: 'Detailed property description' }) // Long text content
@IsDateField()                                              // Date strings
@IsTimezoneField()                                          // Timezone identifiers
@IsLocaleField()                                            // Locale codes
@IsLanguageField()                                          // Language codes (en, fr, ar)
@IsSearchField({ example: 'beach house luxury' })          // Search query strings
@IsEnumField(PropertyType, { example: PropertyType.APARTMENT }) // Enum validation
@IsUuidArrayField({ example: ['507f1f77bcf86cd799439011'] }) // Array of MongoDB ObjectIds

// ✅ Domain-specific validators (when global ones don't fit)
// src/modules/properties/validators/property.validators.ts
@IsPriceField({ fieldType: 'base', example: 150 })         // Property-specific price validation
@IsGuestCountField({ description: 'Number of guests', allowZero: true }) // Guest count validation
@IsCoordinateField({ type: 'latitude', example: 33.8938 }) // Coordinate validation

// ✅ Custom example usage pattern
@IsNameField({
  required: true,
  description: 'Country name',
  example: 'Lebanon',  // Custom domain-specific example
})
country: string;
```

**Benefits:**

- **Consistent validation messages** with i18n support
- **Automatic Swagger documentation**
- **Built-in transformations** (trimming, case normalization)
- **Centralized rule changes**

### 2. **Error Handling Patterns**

**Service Error Throwing:**

```typescript
// ✅ RECOMMENDED: Use standard error codes
export class UserCoreService {
  async findById(id: string): Promise<UserDocument> {
    if (!id) throw new Error('VALIDATION_FAILED');

    const user = await this.userModel.findById(id);
    if (!user) throw new Error('NOT_FOUND');

    return user;
  }
}
```

**Controller Error Handling:**

```typescript
// ✅ AUTOMATIC: BaseController handles all standard patterns
async getUser(@Param('id') id: string) {
  return this.executeWithErrorHandlingAndMessage(
    () => this.usersService.findById(id),
    'Get user by ID',
    'User Retrieved',
    'User found successfully'
  );
}
```

**Standard Error Codes:**

```typescript
// From ErrorCodeEnum
UNAUTHORIZED; // 401 errors
FORBIDDEN; // 403 errors
NOT_FOUND; // 404 errors
VALIDATION_FAILED; // 400 validation errors
DUPLICATE_RESOURCE; // 409 conflict errors
INTERNAL_SERVER_ERROR; // 500 errors
INVALID_DATES; // Invalid date format errors
CONFLICT; // Resource conflict errors
```

### 3. **Response Patterns**

**Consistent Response Structure:**

```typescript
// All responses follow this pattern:
{
  "status": "success",
  "title": "Operation Title",
  "message": "Human readable message",
  "data": { /* actual data */ },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "executionTime": 150,
    "requestId": "uuid"
  }
}
```

**Factory Response DTOs:**

```typescript
// ✅ Use factory functions for typed responses
export const UserResponseDto = createResponseDto(UserDataDto);
export const UsersListResponseDto = createResponseDto(PaginatedDto<UserSummaryDto>);

// ✅ Organize operation-specific response DTOs
// src/modules/properties/dto/property-operation-response.dto.ts
export class PropertyDeletionDataDto {
  @ApiProperty({ description: 'Indicates if property was deleted', example: true })
  deleted: boolean;

  @ApiProperty({ description: 'Deleted property ID', example: '507f1f77bcf86cd799439011' })
  propertyId: string;
}

export class ImageUploadDataDto {
  @ApiProperty({ description: 'Uploaded image key', example: 'properties/image_123.jpg' })
  key: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://s3.amazonaws.com/bucket/properties/image_123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Thumbnail URL',
    example: 'https://s3.amazonaws.com/bucket/properties/image_123_thumb.jpg',
  })
  thumbnailUrl: string;

  @ApiProperty({ description: 'Image variants', type: 'array', items: { type: 'object' } })
  variants: any[];
}

// Create typed response DTOs using the factory
export const PropertyDeletionResponseDto = createResponseDto(PropertyDeletionDataDto);
export const ImageUploadResponseDto = createResponseDto(ImageUploadDataDto);

// Type aliases for return types (eliminates manual inline types)
export type PropertyDeletionResponse = BaseResponseDto<PropertyDeletionDataDto>;
export type ImageUploadResponse = BaseResponseDto<ImageUploadDataDto>;
```

### 3.1. **Pagination Patterns**

**Paginated Response Architecture:**

```typescript
// ✅ RECOMMENDED: Concrete paginated DTOs for proper OpenAPI generation
// Base paginated structure
export class PaginatedDto<T = any> {
  @ApiProperty({ 
    description: 'Array of items',
    type: 'array',
    items: { type: 'object' }
  })
  items: T[];

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20, minimum: 1 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5, minimum: 0 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrevPage: boolean;
}

// ✅ Create concrete paginated DTOs for each entity type
export class UsersPaginatedDto extends PaginatedDto<UserDataDto> {
  @ApiProperty({ type: [UserDataDto], description: 'Array of user items' })
  @Type(() => UserDataDto)
  declare items: UserDataDto[];
}

export class PropertiesPaginatedDto extends PaginatedDto<PropertyResponseDto> {
  @ApiProperty({ type: [PropertyResponseDto], description: 'Array of property items' })
  @Type(() => PropertyResponseDto)
  declare items: PropertyResponseDto[];
}

export class BookingsPaginatedDto extends PaginatedDto<BookingResponseDto> {
  @ApiProperty({ type: [BookingResponseDto], description: 'Array of booking items' })
  @Type(() => BookingResponseDto)
  declare items: BookingResponseDto[];
}

// ✅ Use concrete DTOs in response wrappers
export class AdminUsersListResponseDto extends BaseResponseDto<UsersPaginatedDto> {
  @ApiProperty({
    description: 'Paginated users list data',
    type: UsersPaginatedDto,
  })
  declare data: UsersPaginatedDto;
}

export class PropertyListResponseDto extends BaseResponseDto<PropertiesPaginatedDto> {
  @ApiProperty({
    description: 'Paginated property list data',
    type: PropertiesPaginatedDto,
  })
  declare data: PropertiesPaginatedDto;
}
```

**Why This Approach:**

- **OpenAPI Compatibility**: Works perfectly with code generators like Orval
- **Type Safety**: Full TypeScript support with proper generic typing
- **Swagger Documentation**: Clear, explicit schemas in generated documentation
- **Maintainability**: Simple, predictable pattern across all modules
- **Performance**: Avoids complex factory functions that confuse build tools

**❌ AVOID: Factory Functions for Pagination**

```typescript
// ❌ PROBLEMATIC: Complex factory functions cause Orval/OpenAPI issues
export function createPaginatedDto<T>(ItemClass: new () => T) {
  // Creates complex nested schemas that break code generators
}
```

**Controller Integration for Pagination:**

```typescript
// ✅ REQUIRED: Add @ApiExtraModels for proper Swagger schema registration
@Controller('admin/users')
@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(UserDataDto, PaginatedDto)  // Register DTOs with Swagger
export class UsersAdminController extends BaseController {
  
  @Get()
  @AdminEndpoint('Get paginated users list')
  async getUsers(
    @Query() filters: UserTableFilterDto
  ): Promise<AdminUsersListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.usersService.findAllWithFilters(filters);
        
        // Transform to paginated DTO
        const paginatedData: UsersPaginatedDto = {
          items: result.items.map(user => plainToInstance(UserDataDto, user.toObject())),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
        
        return paginatedData;
      },
      'Get users',
      'Users Retrieved',
      'Users list retrieved successfully'
    );
  }
}
```

**Benefits of This Pattern:**

- **Orval/OpenAPI Compatible**: Generates clean, parseable schemas
- **Type Safe**: Full compile-time type checking  
- **Swagger Documented**: Proper API documentation with correct item types
- **Maintainable**: Clear, explicit class definitions
- **Performant**: No runtime factory overhead

### 4. **Enum Usage Patterns**

**Prefer Enums over Static Strings:**

```typescript
// ✅ RECOMMENDED: Proper enum usage
if (sortDirection === SortDirectionEnum.ASC) {
  // logic
}

if (role !== FilterValueEnum.ALL) {
  // logic
}

if (actionType === AccountActionTypeEnum.DEACTIVATE) {
  // account deactivation logic
}

// Available Enums:
- SortDirectionEnum (ASC, DESC)
- FilterValueEnum (ALL, NONE, TRUE, FALSE)
- UserRoleFilterEnum (ALL, GUEST, HOST, ADMIN)
- AccountActionTypeEnum (DEACTIVATE, DELETE)
- UserSortFieldsEnum (CREATED_AT, UPDATED_AT, FIRST_NAME, LAST_NAME, EMAIL)
- UserTableSortFieldEnum (firstName, lastName, email, role, status)
- PublicUserSortFieldEnum (firstName, lastName, joinedDate)
- PropertyType (APARTMENT, HOUSE, VILLA, STUDIO, LOFT, etc.)
- RoomType (ENTIRE_HOME, PRIVATE_ROOM, SHARED_ROOM)
- BedType (SINGLE, DOUBLE, QUEEN, KING, SOFA_BED, etc.)
- CancellationPolicy (FLEXIBLE, MODERATE, STRICT, SUPER_STRICT)

// ❌ AVOID: Static string comparisons
if (sortDirection === 'asc') {
  // brittle
}
if (actionType === 'deactivate') {
  // error-prone
}
```

### 5. **Decorator Patterns**

**Comprehensive API Documentation:**

```typescript
// ✅ USE: New comprehensive decorator
@ApiEndpoint({
  summary: 'Delete user account',
  description: 'Permanently delete user account with all associated data',
  auth: {
    required: true,
    roles: [UserRole.ADMIN]
  },
  responses: {
    success: { description: 'Account deleted successfully' },
    errors: {
      forbidden: 'Admin access required',
      notFound: 'User account not found'
    }
  }
})

// Or use quick helpers:
@PublicEndpoint('Get public user info')
@ProtectedEndpoint('Get my profile')
@AdminEndpoint('Delete user account')
```

## Database Patterns

### 1. **Schema Organization**

```typescript
// ✅ RECOMMENDED: Clear schema structure
export interface UserDocument extends Document {
  // Core identification
  _id: Types.ObjectId;
  email: string;

  // Profile information
  firstName?: string;
  lastName?: string;

  // System fields
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. **Query Patterns**

**Use Projection and Population:**

```typescript
// ✅ RECOMMENDED: Selective field loading
async findPublicProfile(id: string) {
  return this.userModel
    .findById(id)
    .select('firstName lastName avatarUrl bio')
    .lean()
    .exec();
}
```

## Testing Patterns

### 1. **Service Testing**

```typescript
// ✅ RECOMMENDED: Test specialized services
describe('UserCoreService', () => {
  // Test CRUD operations only
});

describe('UserProfileService', () => {
  // Test profile operations only
});
```

### 2. **Controller Testing**

```typescript
// ✅ RECOMMENDED: Mock facade service
const mockUsersFacadeService = {
  findById: jest.fn(),
  updateProfile: jest.fn(),
  // etc.
};
```

## File Organization

### Standard Module Structure

```
src/modules/[module-name]/
├── controllers/           # Separated by audience
│   ├── [module]-app.controller.ts      # Public operations
│   ├── [module]-admin.controller.ts    # Admin operations
│   └── [module]-[feature].controller.ts # Feature-specific
├── services/             # Specialized services
│   ├── [module]-core.service.ts        # CRUD + basic operations
│   ├── [module]-[feature].service.ts   # Feature-specific logic
│   └── [module]-facade.service.ts      # Coordination layer
├── dto/                  # Organized by purpose
│   ├── create-[entity].dto.ts
│   ├── update-[entity].dto.ts
│   ├── [entity]-response.dto.ts
│   └── [entity]-filters.dto.ts
├── entities/             # (if using TypeORM)
├── repositories/         # (if using Repository pattern)
├── [module].module.ts    # Module registration
└── [module].service.ts   # Legacy - prefer facade
```

## Performance Guidelines

### 1. **Database Optimization**

- Use `.lean()` for read-only queries
- Implement proper indexing
- Use projection to limit returned fields
- Implement pagination for list endpoints

### 2. **Response Optimization**

- Use caching where appropriate
- Implement response compression
- Use appropriate HTTP status codes
- Include execution time in metadata

## Security Guidelines

### 1. **Input Validation**

- Always validate input using standardized validators
- Use DTOs for all request/response data
- Implement rate limiting
- Sanitize user inputs

### 2. **Authentication & Authorization**

- Use role-based access control (RBAC)
- Implement proper JWT token handling
- Use guards consistently
- Log security events

## TypeScript Best Practices

### 1. **Strict Type Safety**

```typescript
// ✅ ALWAYS: Use proper types and interfaces
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  createdAfter?: Date;
  createdBefore?: Date;
}

// ✅ ALWAYS: Use enums instead of union types for known values
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// ❌ NEVER: Use any, unknown, or disable ESLint
function processUser(data: any) {
  // Wrong!
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as unknown; // Wrong!
}
```

### 2. **Proper Generic Usage**

```typescript
// ✅ RECOMMENDED: Type-safe generic functions
export function createResponseDto<T>(dataType: Type<T>) {
  class ResponseDto extends BaseResponseDto<T> {
    @ApiProperty({ type: dataType })
    data!: T;
  }
  return ResponseDto;
}

// ✅ RECOMMENDED: Proper decorator typing
export function ApiEndpoint(options: ApiEndpointOptions) {
  const decorators: (MethodDecorator | ClassDecorator)[] = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];
  return applyDecorators(...decorators);
}
```

### 3. **Interface vs Type Usage**

```typescript
// ✅ USE interfaces for object shapes that might be extended
export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
}

// ✅ USE types for unions, intersections, and computed types
export type UserRole = 'guest' | 'host' | 'admin';
export type UserWithPreferences = User & { preferences: UserPreferences };
```

## Module Development Workflow

### Creating a New Module

1. **Create module structure** following the standard pattern
2. **Define schemas/entities** with proper TypeScript interfaces
3. **Create specialized services** (Core, Feature-specific, Facade)
4. **Build DTOs** with standardized validators
5. **Implement controllers** extending BaseController
6. **Add comprehensive tests** for each service layer
7. **Document API** with ApiEndpoint decorators
8. **Register module** in app.module.ts

### Modifying Existing Modules

1. **Analyze current structure** - identify monolithic patterns
2. **Plan service splitting** - map responsibilities
3. **Create specialized services** - extract functionality
4. **Update DTOs** - replace raw validators with standardized ones
5. **Refactor controllers** - use new service architecture
6. **Replace static strings** - use proper enums
7. **Update tests** - reflect new service structure
8. **Clean up unused files** - remove deprecated code

## Quality Assurance Checklist

### Before Committing Code

- [ ] **No TypeScript errors** - all types properly defined
- [ ] **No ESLint warnings** - code follows style guidelines
- [ ] **No 'any' or 'unknown' types** - use proper interfaces/types
- [ ] **No static string comparisons** - use enums instead
- [ ] **All DTOs use standardized validators** - consistent validation
- [ ] **Controllers extend BaseController** - error handling consistency
- [ ] **Services follow SRP** - single responsibility per service
- [ ] **Proper enum usage** - no magic strings
- [ ] **Comprehensive API documentation** - using ApiEndpoint decorator
- [ ] **Tests updated** - reflect architectural changes

### Code Review Focus Areas

- **Type Safety**: Verify no any/unknown usage
- **Architecture**: Confirm service separation follows SRP
- **Validation**: Ensure standardized validators used
- **Error Handling**: Check BaseController usage
- **Documentation**: Verify comprehensive API docs
- **Performance**: Review query optimization
- **Security**: Validate input sanitization

## Domain-Specific Patterns & Reference Implementations

### Bookings Module: Complete Architectural Reference

The bookings module exemplifies all recommended patterns and serves as the gold standard:

```typescript
// ✅ COMPLETE ARCHITECTURAL IMPLEMENTATION
src/modules/bookings/
├── controllers/
│   ├── bookings-app.controller.ts       // Guest & host operations (mobile/web)
│   └── bookings-admin.controller.ts     // Admin management operations
├── services/
│   ├── booking-core.service.ts          // CRUD, validation, business logic
│   ├── booking-admin.service.ts         // Admin-specific operations
│   └── booking-facade.service.ts        // Coordination & orchestration layer
├── dto/
│   ├── create-booking.dto.ts            // Nested DTOs with standardized validators
│   ├── update-booking.dto.ts            // Update operations
│   ├── booking-filters.dto.ts           // Advanced filtering (mixed validators)
│   ├── booking-response.dto.ts          // Response objects with proper typing
│   └── booking-operation-response.dto.ts // Operation-specific responses
├── types/
│   └── booking.types.ts                 // Type aliases for complex objects
├── interfaces/
│   └── booking-query.interfaces.ts      // Query interfaces and types
├── constants/
│   └── booking.constants.ts             // Business constants and validation rules
├── utils/
│   └── booking-validation.utils.ts      // Utility functions for validation
├── exceptions/
│   └── booking.exceptions.ts            // Domain-specific exceptions
└── bookings.module.ts                   // Module configuration
```

**Advanced Patterns Demonstrated:**

#### 1. **Comprehensive Service Architecture**

```typescript
// ✅ Core Service - Handles basic CRUD + business logic
@Injectable()
export class BookingCoreService {
  async createBooking(dto: CreateBookingDto, guestId: string): Promise<BookingDocument> {
    // Validation, availability checking, pricing calculation
    // Status management, conflict resolution
  }

  async findById(bookingId: string, populate: boolean = true): Promise<BookingDocument> {
    // Type-safe queries with optional population
  }

  async updateStatus(bookingId: string, status: BookingStatus, updatedBy: string) {
    // Status transition validation, audit trails
  }
}

// ✅ Admin Service - Specialized admin operations
@Injectable()
export class BookingAdminService {
  async findAllWithFilters(filters: BookingFiltersDto, pagination: PaginationDto) {
    // Complex filtering, sorting, aggregations
  }

  async forceCancelByAdmin(bookingId: string, adminId: string) {
    // Admin-only operations bypassing normal business rules
  }
}

// ✅ Facade Service - Orchestrates all operations
@Injectable()
export class BookingFacadeService {
  constructor(
    private readonly bookingCoreService: BookingCoreService,
    private readonly bookingAdminService: BookingAdminService,
  ) {}

  async getBookingById(bookingId: string, userId: string, userRole: UserRole) {
    const booking = await this.bookingCoreService.findById(bookingId);
    this.validateBookingAccess(booking, userId, userRole); // Authorization layer
    return booking;
  }

  // Role-based method delegation
  async cancelBooking(bookingId: string, userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN) {
      return await this.bookingAdminService.cancelBookingAsAdmin(bookingId, userId);
    }
    // Regular user cancellation logic...
  }
}
```

#### 2. **Advanced DTO Architecture with Nested Validation**

```typescript
// ✅ Nested DTO with standardized validators
export class CreateGuestInfoDto {
  @IsGuestCountField({
    required: true,
    description: 'Number of adults',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_ADULTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_ADULTS,
  })
  adults: number;

  @IsGuestCountField({
    description: 'Number of children',
    example: 0,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_CHILDREN,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_CHILDREN,
  })
  children: number;
}

export class CreateBookingDto {
  @IsUuidField({
    required: true,
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId: string;

  @IsDateField({
    required: true,
    description: 'Check-in date',
    example: '2025-10-10',
  })
  checkIn: string;

  @ApiProperty({ description: 'Guest information' })
  @ValidateNested()
  @Type(() => CreateGuestInfoDto)
  guests: CreateGuestInfoDto;

  @IsTimeField({
    description: 'Estimated arrival time',
    example: '15:00',
  })
  estimatedArrivalTime?: string;
}
```

#### 3. **Mixed Validation Strategy for Complex Filters**

```typescript
// ✅ Strategic use of both standardized and raw validators
export class BookingTableFilterDto {
  // Standardized validators for common cases
  @IsSearchField({ example: 'BK-2024' })
  search?: string;

  // Raw validators for specific pagination/filtering logic
  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc' = 'desc';
}
```

#### 4. **Comprehensive Operation Response DTOs**

```typescript
// ✅ Operation-specific response structures
export class BookingCancelledDto {
  @ApiProperty({ description: 'Cancelled booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Refund amount if applicable' })
  refundAmount?: number;

  @ApiProperty({ description: 'Cancellation fee if applicable' })
  cancellationFee?: number;

  @ApiProperty({ description: 'Cancelled at timestamp' })
  cancelledAt: Date;

  @ApiProperty({ description: 'Cancelled by' })
  cancelledBy: string;
}

export class BookingStatsDto {
  @ApiProperty({ description: 'Total number of bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Status breakdown' })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Monthly statistics', type: [MonthlyStatDto] })
  monthlyStats: MonthlyStatDto[];
}

// Factory pattern for consistent response wrapping
export const BookingCancelledResponseDto = createResponseDto(BookingCancelledDto);
export const BookingStatsResponseDto = createResponseDto(BookingStatsDto);
```

#### 5. **Advanced Controller Patterns**

```typescript
// ✅ Role-based endpoint organization
@Controller('app/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsAppController extends BaseController {
  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings (Guest bookings)' })
  async getMyBookings(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ): Promise<BookingListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingsService.getGuestBookings(
          String(user._id),
          { status: status as BookingStatus },
          { page, limit: Math.min(limit, 100) },
        );

        const items = result.items.map((booking) =>
          plainToInstance(BookingResponseDto, booking.toObject()),
        );

        return { items, total: result.total, page: result.page /* ... */ };
      },
      'Get my bookings',
      'My Bookings Retrieved',
      'Bookings retrieved successfully',
      'Failed to retrieve bookings',
    );
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GUEST, UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  async cancel(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      () => this.bookingsService.cancelBooking(id, String(user._id), user.roles[0]),
      'Cancel booking',
      'Booking Cancelled',
      'Booking cancelled successfully',
      'Failed to cancel booking',
    );
  }
}
```

#### 6. **Exception Handling & Domain Errors**

```typescript
// ✅ Domain-specific exceptions with proper typing
export class BookingNotFoundException extends BadRequestException {
  constructor(bookingId?: string) {
    super(bookingId ? `Booking with ID ${bookingId} not found` : 'Booking not found');
  }
}

export class PropertyNotAvailableException extends ConflictException {
  constructor(checkIn: string, checkOut: string, propertyId?: string) {
    super(`Property ${propertyId || ''} is not available for dates ${checkIn} to ${checkOut}`);
  }
}

export class BookingValidationException extends BadRequestException {
  constructor(message: string, field?: string) {
    super({
      message,
      field,
      error: 'BOOKING_VALIDATION_ERROR',
    });
  }
}
```

### Property Module Example (Advanced Reference)

The properties module demonstrates additional advanced patterns:

```typescript
// ✅ RECOMMENDED: Specialized services with clear responsibilities
src/modules/properties/
├── services/
│   ├── properties-core.service.ts     // CRUD operations
│   ├── properties-search.service.ts   // Search and filtering
│   ├── properties-admin.service.ts    // Admin operations
│   └── properties-facade.service.ts   // Coordination layer
├── controllers/
│   ├── properties-app.controller.ts    // Host operations
│   ├── properties-admin.controller.ts  // Admin operations
│   └── properties-public.controller.ts // Public search
├── dto/
│   ├── create-property.dto.ts          // With standardized validators
│   ├── property-search.dto.ts          // Advanced search parameters
│   ├── property-response.dto.ts        // Response objects
│   └── property-operation-response.dto.ts // Operation-specific responses
└── validators/
    └── property.validators.ts           // Domain-specific validators only
```

**Key Principles Demonstrated:**

1. **Response DTO Architecture** - Eliminates repetitive response structures
2. **Validator Hierarchy** - Global validators with domain-specific extensions
3. **Controller Separation** - Different audiences (app/admin/public)
4. **Type Safety** - No `any` types, proper response DTOs
5. **Consistent Error Handling** - BaseController usage throughout

### Module Quality Assessment Framework

Use this systematic approach to evaluate module quality:

```typescript
// Quality Assessment Criteria (A-F grading scale)

// ✅ A+ Grade Requirements (95-100%) - Gold Standard:
- 100% standardized validators with domain-specific extensions
- Zero `any`/`unknown` types throughout codebase
- Complete response DTO architecture with operation-specific DTOs
- Full service separation (Core, Admin, Facade pattern)
- Comprehensive API documentation with examples
- Domain-specific exception handling
- Full test coverage (>95%)
- Advanced patterns (nested DTOs, mixed validation strategies)
- Type aliases and interfaces for complex structures
- Constants and utility organization
- Role-based authorization at service level
- Proper pagination patterns with concrete paginated DTOs
- @ApiExtraModels decorators on all controllers using paginated responses
- Orval/OpenAPI compatibility verified

// ✅ A Grade Requirements (90-94%) - Excellent:
- All standardized validators used
- Zero `any` types
- Complete response DTO architecture
- Proper service separation (at least 3 specialized services)
- Comprehensive API documentation
- Custom exception handling
- High test coverage (>85%)
- Operation-specific response DTOs
- Consistent error handling patterns
- Concrete paginated DTOs with proper typing
- @ApiExtraModels usage on relevant controllers

// ✅ B Grade Requirements (80-89%) - Good:
- Most standardized validators used (>80%)
- Minimal `any` types (< 3 total)
- Basic response DTO usage with factory pattern
- Some service separation (at least 2 services)
- Good API documentation with most endpoints documented
- BaseController usage throughout
- Moderate test coverage (>70%)
- Basic operation response DTOs

// ✅ C Grade Requirements (70-79%) - Acceptable:
- Mixed validator usage (50%+ standardized)
- Limited `any` types (< 5 total)
- Some response DTO usage
- Basic service separation or facade pattern
- Basic API documentation
- Some test coverage (>50%)

// ❌ D Grade Requirements (60-69%) - Needs Improvement:
- Raw validators mixed with some standardized
- Multiple `any` types (5-10)
- Manual response structures prevalent
- Monolithic services with some separation attempts
- Incomplete documentation
- Limited test coverage (>30%)

// ❌ F Grade (< 60%) - Major Refactoring Required:
- Primarily raw validators
- Extensive `any` type usage (>10)
- No response DTO architecture
- Monolithic services
- Poor or missing documentation
- Minimal or no test coverage
```

### Advanced Architectural Patterns

#### 1. **Complex Query & Filtering Patterns**

```typescript
// ✅ Advanced interface definitions for complex queries
export interface BookingFiltersDto {
  // Basic filters with enum validation
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;

  // ID-based filters
  guestId?: string;
  hostId?: string;
  propertyId?: string;

  // Date range filters
  checkInFrom?: string;
  checkInTo?: string;
  checkOutFrom?: string;
  checkOutTo?: string;

  // Numeric range filters
  minAmount?: number;
  maxAmount?: number;

  // Search capabilities
  search?: string;
}

export interface BookingListResponse {
  items: BookingDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ✅ Type aliases for complex return types
export type UserBookingFilters = Pick<BookingFiltersDto, 'status' | 'propertyId'>;
export type AdminBookingFilters = BookingFiltersDto;
```

#### 2. **Role-Based Service Architecture**

```typescript
// ✅ Service methods with role-based authorization
@Injectable()
export class BookingFacadeService {
  async getBookingById(bookingId: string, userId: string, userRole: UserRole) {
    const booking = await this.bookingCoreService.findById(bookingId);
    this.validateBookingAccess(booking, userId, userRole);
    return booking;
  }

  async cancelBooking(bookingId: string, userId: string, userRole: UserRole, reason?: string) {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);

      // Role-based logic delegation
      if (userRole === UserRole.ADMIN) {
        return await this.bookingAdminService.cancelBookingAsAdmin(bookingId, userId, reason);
      }

      // Validate user permissions for regular users
      const userObjectId = new Types.ObjectId(userId);
      const isGuest = booking.guestId.equals(userObjectId);
      const isHost = booking.hostId.equals(userObjectId);

      if (!isGuest && !isHost) {
        throw new ForbiddenException('Access denied to cancel this booking');
      }

      // Apply business rules for regular cancellations
      this.validateCancellationRules(booking);
      return await this.bookingCoreService.updateStatus(bookingId, BookingStatus.CANCELLED, userId);
    } catch (error) {
      this.logger.error(`Error cancelling booking ${bookingId} by user ${userId}:`, error);
      throw error;
    }
  }

  // Private authorization validation methods
  private validateBookingAccess(booking: BookingDocument, userId: string, userRole: UserRole) {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM_ADMIN) {
      return; // Admin has access to everything
    }

    const userObjectId = new Types.ObjectId(userId);
    const isGuest = booking.guestId.equals(userObjectId);
    const isHost = booking.hostId.equals(userObjectId);

    if (!isGuest && !isHost) {
      throw new ForbiddenException('Access denied to view this booking');
    }
  }
}
```

#### 3. **Constants & Configuration Organization**

```typescript
// ✅ Comprehensive constants organization
export const BOOKING_VALIDATION_CONSTANTS = {
  MIN_ADULTS: 1,
  MAX_ADULTS: 16,
  MIN_CHILDREN: 0,
  MAX_CHILDREN: 10,
  MIN_INFANTS: 0,
  MAX_INFANTS: 5,
  MIN_TOTAL_GUESTS: 1,
  MAX_TOTAL_GUESTS: 20,
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 365,
} as const;

export const BOOKING_BUSINESS_CONSTANTS = {
  DEFAULT_CURRENCY: 'USD',
  CONFIRMATION_CODE_LENGTH: 8,
  CANCELLATION_DEADLINE_HOURS: 24,
  AUTO_CONFIRM_TIMEOUT_HOURS: 24,
} as const;

export const BOOKING_STATUS_FLOW = {
  ALLOWED_TRANSITIONS: {
    [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED]: [BookingStatus.CHECKED_IN, BookingStatus.CANCELLED],
    [BookingStatus.CHECKED_IN]: [BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED],
    [BookingStatus.CHECKED_OUT]: [], // Terminal state
    [BookingStatus.CANCELLED]: [], // Terminal state
  },
} as const;

export const BOOKING_MESSAGES = {
  BOOKING_NOT_FOUND: 'Booking not found',
  BOOKING_NOT_CANCELLABLE: 'Booking cannot be cancelled at this stage',
  PROPERTY_NOT_AVAILABLE: 'Property is not available for the selected dates',
  INVALID_STATUS_TRANSITION: 'Invalid booking status transition',
  GUEST_CAPACITY_EXCEEDED: 'Guest count exceeds property capacity',
} as const;
```

#### 4. **Utility Functions & Validation Helpers**

```typescript
// ✅ Utility class organization
export class BookingValidationUtils {
  /**
   * Validate booking date ranges with business rules
   */
  static validateBookingDates(checkIn: string, checkOut: string): void {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if dates are valid
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      throw new BookingValidationException('Invalid date format', 'dates');
    }

    // Check if check-in is not in the past
    if (checkInDate < today) {
      throw new BookingValidationException('Check-in date cannot be in the past', 'checkIn');
    }

    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      throw new BookingValidationException('Check-out must be after check-in', 'checkOut');
    }

    // Calculate nights and validate range
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (nights < BOOKING_VALIDATION_CONSTANTS.MIN_NIGHTS) {
      throw new BookingValidationException(
        `Minimum stay is ${BOOKING_VALIDATION_CONSTANTS.MIN_NIGHTS} night(s)`,
        'nights',
      );
    }

    if (nights > BOOKING_VALIDATION_CONSTANTS.MAX_NIGHTS) {
      throw new BookingValidationException(
        `Maximum stay is ${BOOKING_VALIDATION_CONSTANTS.MAX_NIGHTS} nights`,
        'nights',
      );
    }
  }

  /**
   * Generate unique confirmation codes
   */
  static generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < BOOKING_BUSINESS_CONSTANTS.CONFIRMATION_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Calculate pricing with business logic
   */
  static calculateBookingPricing(property: PropertyDocument, nights: number): BookingPricing {
    const pricePerNight = Number(property.pricePerNight) || 0;
    const cleaningFeeValue = Number(property.cleaningFee) || 0;

    const baseAmount = pricePerNight * nights;
    const cleaningFee = cleaningFeeValue;
    const serviceFee = Math.round(baseAmount * 0.1); // 10% service fee
    const occupancyTaxes = Math.round(baseAmount * 0.05); // 5% occupancy taxes

    return {
      baseAmount,
      cleaningFee,
      serviceFee,
      occupancyTaxes,
      totalAmount: baseAmount + cleaningFee + serviceFee + occupancyTaxes,
      currency: BOOKING_BUSINESS_CONSTANTS.DEFAULT_CURRENCY,
    };
  }
}
```

## Migration Path

### From Monolithic to Specialized Services

1. **Identify responsibilities** in existing service
2. **Extract specialized services** one at a time
3. **Create facade service** to coordinate
4. **Update controllers** to use facade
5. **Deprecate monolithic service** gradually

### From Raw Validation to Standardized

1. **Replace email validation** with `@IsEmailField()`
2. **Replace phone validation** with `@IsPhoneField()`
3. **Replace name validation** with `@IsNameField()`
4. **Replace password validation** with `@IsPasswordField()`
5. **Replace array validation** with `@IsUuidArrayField()`
6. **Continue with other field types**

### From Static Strings to Enums

1. **Identify static string comparisons** in codebase
2. **Create appropriate enums** in dedicated files
3. **Replace comparisons** with enum usage
4. **Update related DTOs** to use enum validation
5. **Verify no magic strings remain**

## Common Pitfalls to Avoid

### 1. **Type Safety Violations**

```typescript
// ❌ NEVER do this
function process(data: any): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data;
}

// ✅ Do this instead
function process<T>(data: T): T {
  return data;
}
```

### 2. **Service Coupling**

```typescript
// ❌ AVOID: Direct service dependencies
export class UserProfileService {
  constructor(
    private readonly userService: UsersService, // Monolithic coupling
  ) {}
}

// ✅ PREFERRED: Use facade or specific services
export class UserProfileService {
  constructor(
    private readonly userCoreService: UserCoreService, // Specific dependency
  ) {}
}
```

### 3. **File Corruption During Refactoring**

```typescript
// When using replace_all=true, be extremely careful!
// Always backup files before bulk replacements
// Verify no duplicate functions are created
```

### 4. **Inheritance Issues**

```typescript
// ❌ PROBLEM: Property name conflicts with base class
export class I18nPublicController extends BaseController {
  constructor(private readonly i18nService: I18nService) {} // Conflicts with base
}

// ✅ SOLUTION: Use different property names
export class I18nPublicController extends BaseController {
  constructor(private readonly translationService: I18nService) {} // No conflict
}
```

### 5. **Mixed Validation Strategy Misuse**

```typescript
// ❌ WRONG: Using raw validators for common fields
export class BookingDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  guestEmail: string; // Should use @IsEmailField()

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20; // Correct - specific pagination logic
}

// ✅ CORRECT: Strategic validator usage
export class BookingDto {
  @IsEmailField({
    required: true,
    example: 'guest@example.com',
  })
  guestEmail: string; // Standardized for common field

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20; // Raw validators for specific business logic
}
```

### 6. **Response DTO Anti-Patterns**

```typescript
// ❌ AVOID: Manual response structure creation
@Get('bookings')
async getBookings(): Promise<{
  status: string;
  data: any;
  message: string
}> {
  // Manual response construction
  return {
    status: 'success',
    data: bookings,
    message: 'Success'
  };
}

// ✅ CORRECT: Use response DTO factory
@Get('bookings')
async getBookings(): Promise<BookingListResponseDto> {
  return this.executeWithErrorHandlingAndMessage(
    () => this.bookingsService.findAll(),
    'Get bookings',
    'Bookings Retrieved',
    'Bookings retrieved successfully'
  );
}
```

### 7. **Facade Service Anti-Patterns**

```typescript
// ❌ WRONG: Facade just delegating without coordination
export class BookingFacadeService {
  async createBooking(dto: CreateBookingDto) {
    return this.bookingCoreService.createBooking(dto); // No coordination
  }
}

// ✅ CORRECT: Facade coordinating multiple services and adding value
export class BookingFacadeService {
  async createBooking(dto: CreateBookingDto, guestId: string) {
    // Coordinate multiple services and add authorization logic
    const booking = await this.bookingCoreService.createBooking(dto, guestId);

    // Additional coordination logic
    await this.notificationService.sendBookingConfirmation(booking);
    await this.analyticsService.trackBookingCreated(booking);

    return booking;
  }
}
```

### 8. **Pagination Anti-Patterns**

```typescript
// ❌ WRONG: Using factory functions for pagination (breaks Orval/OpenAPI)
const UsersPaginatedDto = createPaginatedDto(UserDataDto);
export class AdminUsersListResponseDto extends BaseResponseDto<InstanceType<typeof UsersPaginatedDto>> {
  // Complex typing that confuses code generators
}

// ❌ WRONG: Generic pagination without proper typing
export class UsersListResponseDto extends BaseResponseDto<PaginatedDto<UserDataDto>> {
  @ApiProperty({
    type: 'object', // Vague typing
    description: 'Paginated data'
  })
  declare data: PaginatedDto<UserDataDto>; // Items show as string[] in Swagger
}

// ❌ WRONG: Missing @ApiExtraModels
@Controller('users')
export class UsersController {
  // Missing @ApiExtraModels(UserDataDto, PaginatedDto)
  async getUsers(): Promise<AdminUsersListResponseDto> {
    // Results in broken OpenAPI schemas
  }
}

// ✅ CORRECT: Concrete paginated DTOs with proper controller setup
export class UsersPaginatedDto extends PaginatedDto<UserDataDto> {
  @ApiProperty({ type: [UserDataDto], description: 'Array of user items' })
  @Type(() => UserDataDto)
  declare items: UserDataDto[];
}

export class AdminUsersListResponseDto extends BaseResponseDto<UsersPaginatedDto> {
  @ApiProperty({
    description: 'Paginated users list data',
    type: UsersPaginatedDto,
  })
  declare data: UsersPaginatedDto;
}

@Controller('admin/users')
@ApiExtraModels(UserDataDto, PaginatedDto) // Required for proper schema generation
export class UsersAdminController extends BaseController {
  async getUsers(): Promise<AdminUsersListResponseDto> {
    // Clean, typed, Orval-compatible responses
  }
}
```

## Implementation Checklist

### Pre-Implementation Planning

- [ ] **Analyze existing module structure** - Identify current patterns and issues
- [ ] **Define service boundaries** - Map out Core, Admin, Facade responsibilities
- [ ] **Plan DTO hierarchy** - Design standardized validator usage strategy
- [ ] **Design response architecture** - Plan operation-specific DTOs
- [ ] **Map exception scenarios** - Define domain-specific exceptions
- [ ] **Plan migration strategy** - Determine safe refactoring approach

### During Implementation

- [ ] **Create specialized services first** - Start with Core service, then Admin, finally Facade
- [ ] **Implement DTOs with standardized validators** - Use appropriate validation strategy
- [ ] **Build response DTOs using factory pattern** - Ensure consistent response structure
- [ ] **Create concrete paginated DTOs** - Build specific paginated classes for each entity type
- [ ] **Add @ApiExtraModels decorators** - Register DTOs with Swagger on relevant controllers
- [ ] **Add comprehensive error handling** - Include domain-specific exceptions
- [ ] **Implement role-based authorization** - Add proper access controls
- [ ] **Add utility functions and constants** - Organize business logic properly
- [ ] **Update controllers to use new architecture** - Extend BaseController consistently

### Post-Implementation Validation

- [ ] **Run type checking** - Ensure zero `any`/`unknown` types
- [ ] **Test all endpoints** - Verify functionality and error handling
- [ ] **Review API documentation** - Ensure comprehensive Swagger docs
- [ ] **Validate response consistency** - Check all responses use proper DTOs
- [ ] **Test pagination responses** - Verify items show correct types (not string[])
- [ ] **Validate Orval/OpenAPI compatibility** - Test code generation works properly
- [ ] **Check @ApiExtraModels usage** - Ensure proper Swagger schema registration
- [ ] **Check service dependencies** - Ensure proper separation of concerns
- [ ] **Run tests** - Verify all functionality works as expected
- [ ] **Performance testing** - Ensure no regressions in response times

### Quality Assessment

- [ ] **Grade module using framework** - Apply A-F grading criteria
- [ ] **Code review with architectural focus** - Check for pattern compliance
- [ ] **Security review** - Validate authorization and input sanitization
- [ ] **Documentation review** - Ensure comprehensive API documentation
- [ ] **Test coverage analysis** - Verify adequate test coverage

## Continuous Improvement

### Regular Architecture Reviews

- **Monthly Module Assessment** - Grade all modules using quality framework
- **Quarterly Pattern Updates** - Update guidelines based on lessons learned
- **Annual Architecture Refactoring** - Major improvements to established patterns

### Knowledge Sharing

- **Architecture Documentation** - Keep guidelines updated with real examples
- **Code Review Training** - Ensure all developers understand patterns
- **Pattern Libraries** - Build reusable components following guidelines

### Tooling & Automation

- **Linting Rules** - Enforce architectural patterns via ESLint
- **Code Generation** - Create templates following established patterns
- **Automated Quality Checks** - Build tools to assess module quality automatically

This comprehensive architectural approach ensures:

- **Consistency** across all modules through standardized patterns
- **Maintainability** through clear separation of concerns and proper abstraction
- **Scalability** with modular design that can grow with business needs
- **Developer Experience** with predictable patterns and comprehensive documentation
- **Type Safety** with proper TypeScript usage eliminating runtime errors
- **Code Quality** through systematic patterns, reviews, and continuous improvement
- **Business Logic Clarity** with domain-specific exceptions and proper validation
- **Performance** through optimized query patterns and proper data flow
- **Security** through role-based authorization and input validation
- **Testing** with clear service boundaries enabling comprehensive test coverage
