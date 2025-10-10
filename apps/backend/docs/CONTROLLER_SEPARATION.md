# Controller Separation Pattern

This document outlines the new controller organization pattern for separating concerns between app, admin, and public endpoints.

## Overview

The application now uses separate controllers for different types of endpoints to improve maintainability, security, and API documentation clarity.

## Controller Types

### 1. App Controllers (`/app/*`)
**Purpose**: Handle functionality for mobile app and website users (guests and hosts)
**Route Prefix**: `app/`
**Swagger Tag**: Module-specific (e.g., "Users", "Properties", "Bookings")
**Authentication**: Required (JWT)
**Documentation**: `/api/docs`

**Example**: `UsersAppController` at `/app/users`
- User profile management
- Account settings
- Personal preferences
- Profile image upload

### 2. Admin Controllers (`/admin/*`)
**Purpose**: Handle administrative operations for dashboard and management
**Route Prefix**: `admin/`
**Swagger Tag**: Module-specific with "Management" suffix (e.g., "User Management", "Property Management")
**Authentication**: Required (JWT + Admin/System Admin/Moderator roles)
**Documentation**: `/admin/docs`

**Example**: `UsersAdminController` at `/admin/users`
- User management and moderation
- Bulk operations
- Status toggles
- Administrative reporting

### 3. Public Controllers (`/public/*`)
**Purpose**: Handle publicly accessible operations without authentication
**Route Prefix**: `public/`
**Swagger Tag**: Module-specific with "Public" prefix (e.g., "Public Users", "Public Properties")
**Authentication**: Not required
**Documentation**: `/public/docs`

**Example**: `UsersPublicController` at `/public/users`
- User registration
- Public profile viewing (if implemented)

## Swagger Documentation Structure

The application now provides three separate Swagger documentation interfaces:

1. **App API Documentation** - `/api/docs`
   - Contains endpoints for mobile and web app users
   - Focused on guest and host functionality
   
2. **Admin API Documentation** - `/admin/docs`
   - Contains administrative and management endpoints
   - Focused on system administration and moderation
   
3. **Public API Documentation** - `/public/docs`
   - Contains publicly accessible endpoints
   - No authentication required

## Implementation Pattern

### File Structure
```
src/modules/{module}/
├── controllers/
│   ├── {module}-app.controller.ts     # App endpoints
│   ├── {module}-admin.controller.ts   # Admin endpoints
│   └── {module}-public.controller.ts  # Public endpoints
├── {module}.controller.ts              # Original controller (for backward compatibility)
├── {module}.service.ts
└── {module}.module.ts
```

### Controller Template

#### App Controller Template
```typescript
@Controller('app/{module}')
@ApiTags('{Module}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class {Module}AppController extends BaseController {
  // User-facing endpoints for guests and hosts
}
```

#### Admin Controller Template
```typescript
@Controller('admin/{module}')
@ApiTags('{Module} Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class {Module}AdminController extends BaseController {
  // Administrative endpoints with role-based access
}
```

#### Public Controller Template
```typescript
@Controller('public/{module}')
@ApiTags('Public {Module}')
export class {Module}PublicController extends BaseController {
  // Public endpoints without authentication
}
```

### Module Configuration

Update the module to include all controller types:

```typescript
@Module({
  controllers: [
    {Module}Controller,      // Original (for backward compatibility)
    {Module}AppController,
    {Module}AdminController,
    {Module}PublicController,
  ],
  // ... other configuration
})
export class {Module}Module {}
```

## Role-Based Access Control

### Standard Roles
- **GUEST**: Basic user role
- **HOST**: Property owner/manager
- **ADMIN**: Site administrator
- **SYSTEM_ADMIN**: Full system access
- **MODERATOR**: Content moderation
- **SUPPORT**: Customer support

### Role Assignments by Controller Type

#### App Controllers
- Typically require `@UseGuards(JwtAuthGuard)` only
- Access based on user ownership of resources
- Role checks for specific operations (e.g., host-only endpoints)

#### Admin Controllers
- Always require `@UseGuards(JwtAuthGuard, RolesGuard)`
- Use `@Roles()` decorator to specify required roles
- Common patterns:
  - `@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)` - Admin operations
  - `@Roles(UserRole.SYSTEM_ADMIN)` - System-level operations
  - `@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)` - Content moderation

#### Public Controllers
- No authentication required
- Use `@Public()` decorator to bypass global auth guards

## Migration Strategy

### Phase 1: Parallel Implementation (Current)
- Keep original controllers for backward compatibility
- Implement new separated controllers alongside
- Both sets of endpoints are available

### Phase 2: Client Migration
- Update frontend applications to use new endpoints
- Monitor usage of old endpoints
- Provide deprecation notices

### Phase 3: Cleanup
- Remove original controllers once migration is complete
- Update documentation and examples

## Benefits

1. **Separation of Concerns**: Clear distinction between different types of functionality
2. **Security**: Admin endpoints are clearly separated and protected
3. **Documentation**: Clean, focused API documentation for different audiences
4. **Maintainability**: Easier to maintain and update specific functionality
5. **Testing**: Easier to test specific controller types in isolation
6. **Scalability**: Different deployment strategies for different controller types

## Best Practices

1. **Consistent Naming**: Use the pattern `{Module}{Type}Controller`
2. **Route Consistency**: Always use appropriate prefixes (`app/`, `admin/`, `public/`)
3. **Swagger Tags**: Use descriptive tags that clearly identify the controller type
4. **Role Validation**: Always validate roles for admin endpoints
5. **Error Handling**: Use consistent error handling patterns across all controller types
6. **Documentation**: Keep Swagger documentation up to date with clear descriptions

## Example Usage

### App Endpoint (User Profile)
```
GET /app/users/profile
Authorization: Bearer {jwt_token}
```

### Admin Endpoint (User Management)
```
GET /admin/users
Authorization: Bearer {admin_jwt_token}
Role: ADMIN, SYSTEM_ADMIN, or MODERATOR required
```

### Public Endpoint (User Registration)
```
POST /public/users
No authentication required
```

## Future Considerations

1. **API Versioning**: Consider version-specific controllers
2. **Rate Limiting**: Different limits for different controller types
3. **Caching**: Controller-type-specific caching strategies
4. **Monitoring**: Separate metrics for each controller type
5. **Load Balancing**: Route different controller types to different server instances