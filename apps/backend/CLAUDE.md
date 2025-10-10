# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm install` - Install dependencies
- `npm run start:dev` - Run development server with auto-reload
- `npm run start:debug` - Run with debugging enabled
- `npm run build` - Build the application and copy templates
- `npm run start:prod` - Run production server

### Code Quality

- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests

### Database & Seeding

- `npm run seed` - Populate database with initial data
- `npm run migrate` - Run database migrations

### Local Development (S3)

- `npm run localstack:up` - Start LocalStack for S3 testing
- `npm run localstack:down` - Stop LocalStack services

## Architecture Overview

This is a NestJS-based Airbnb clone backend with the following key architectural patterns:

### Module Structure

The application follows NestJS modular architecture with feature-based modules:

- **Auth Module** (`src/modules/auth/`) - Authentication, JWT tokens, social login, OTP verification
- **Users Module** (`src/modules/users/`) - User management, profiles, roles (guest/host/admin)
- **Properties Module** (`src/modules/properties/`) - Property listings, advanced search, management with full CRUD operations, image handling, and admin controls
- **Bookings Module** (`src/modules/bookings/`) - Reservation system with payment integration
- **Reviews Module** (`src/modules/reviews/`) - Rating and review system for properties
- **Messaging Module** (`src/modules/messaging/`) - Real-time chat via WebSockets
- **Notifications Module** (`src/modules/notifications/`) - Push notifications via Firebase
- **Payments Module** (`src/modules/payments/`) - Payment processing with APS
- **Payouts Module** (`src/modules/payouts/`) - Host payout management and automated processing
- **Tax Module** (`src/modules/tax/`) - Tax calculation, management, and compliance features
- **Invoices Module** (`src/modules/invoices/`) - Invoice generation and PDF templates
- **Analytics Module** (`src/modules/analytics/`) - Business intelligence and reporting
- **Storage Module** (`src/modules/storage/`) - File upload and S3 integration
- **I18n Module** (`src/modules/i18n/`) - Internationalization with multi-language support
- **Config Module** (`src/modules/config/`) - Dynamic application configuration
- **Catalog System** (`src/modules/catalogs/`, `src/modules/enum-displays/`, `src/modules/amenity-categories/`) - Structured catalog management with versioning
- **Admin Module** (`src/modules/admin/`) - Administrative functions and user management
- **Common Module** (`src/common/`) - Shared utilities, guards, pipes, interceptors

### Database Layer

- **MongoDB** with Mongoose ODM
- **Schemas** in `src/database/schemas/` - User, RefreshToken, VerificationToken, AppConfig
- **Seeders** in `src/database/seeds/` for initial data population
- Environment-based configuration with validation

### Authentication & Authorization

- **JWT-based authentication** with refresh token rotation
- **Multi-provider support** - Google, Facebook, Apple OAuth
- **Role-based access control** (RBAC) with guest/host/admin roles
- **OTP verification** for email/phone via Twilio and email services
- **Global guards** applied at application level for security

### Cross-Cutting Concerns

- **Global exception filter** for consistent error responses
- **Request/response transformation** via interceptors
- **Logging interceptor** for request tracing
- **Rate limiting** with ThrottlerModule
- **Input validation** with class-validator and DTOs
- **Email templating** with Handlebars templates

### Configuration Management

- **Environment-based config** with Joi validation (`src/config/env.validation.ts`)
- **Dynamic runtime configuration** stored in database
- **Multi-environment support** (.env.development, .env.production, .env.test)

### Key Integration Points

- **AWS S3** for file storage and image processing
- **Twilio** for SMS/phone verification
- **Email service** with SMTP and optional DKIM signing
- **Firebase** for push notifications and real-time messaging
- **Payment providers** - APS (Amazon Payment Services)
- **WebSockets** for real-time messaging via Socket.IO
- **Swagger/OpenAPI** documentation at `/docs`

### AWS S3 File Storage with Image Processing

- **Global S3 service** integrated for file uploads (profile pictures, property images, documents)
- **Intelligent image compression** using Sharp library for high-quality optimization
- **Multi-size image variants** automatically generated for different use cases:
  - **Profile Images**: 64px (thumbnail), 150px (small), 300px (medium), plus original
  - **Property Images**: 320x240 (thumbnail), 640x480 (small), 1024x768 (medium), 1920x1080 (large), plus original
- **WebP conversion** with JPEG fallback for maximum browser compatibility
- **File categories** for organized storage: PROFILE_IMAGES, PROPERTY_IMAGES, DOCUMENTS, TEMP
- **Advanced security validation** with magic number verification and content scanning
- **Presigned URLs** for direct client-to-S3 uploads (better performance)
- **Automatic file cleanup** when updating/deleting user content
- **Compression statistics** logging for performance monitoring

## Important Development Notes

### Template Handling

- Handlebars templates in `src/common/templates/` must be copied to `dist/` during build
- The `copy-assets.js` script handles this automatically during build process

### Environment Setup

- Create environment-specific .env files (.env.development, .env.production, .env.test)
- Required variables validated by Joi schema in `src/config/env.validation.ts`
- EMAIL_DISABLED=true for test environments to skip actual email sending

#### AWS S3 Environment Variables

```bash
# Required for production
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional - for LocalStack testing
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true

# File size limits (bytes)
MAX_FILE_SIZE=10485760          # 10MB default
MAX_PROFILE_IMAGE_SIZE=5242880   # 5MB for profiles
MAX_PROPERTY_IMAGE_SIZE=10485760 # 10MB for properties
```

### Testing

- Unit tests use Jest with `.spec.ts` files in `src/`
- E2E tests in `test/` directory with separate Jest configuration
- Test coverage reports generated in `coverage/` directory

### Code Style

- ESLint configuration with TypeScript rules in `eslint.config.mjs`
- Prettier formatting enforced via lint-staged Git hooks with the following configuration:
  ```json
  {
    "singleQuote": true,
    "semi": true,
    "printWidth": 100,
    "tabWidth": 2,
    "trailingComma": "all"
  }
  ```
- Husky for pre-commit validation
- **IMPORTANT**: Always follow these Prettier rules when writing or editing code:
  - Use single quotes for strings
  - Always include semicolons
  - Line width limit of 100 characters
  - Use 2 spaces for indentation
  - Include trailing commas in multiline structures

### Fixing TypeScript/ESLint/Lint Issues

When asked to fix TypeScript, ESLint, or general lint issues, follow this systematic approach:

1. **Check for Type Safety Violations**:
   - **NEVER use `any` or `unknown` types** - always create proper interfaces, types, or use existing ones
   - **Analyze the context** before applying fixes - understand what the data structure should be
   - **Create interfaces** when they don't exist rather than using loose types

2. **Prevent ESLint Disabling**:
   - **NEVER add ESLint disable comments** (`// eslint-disable`, `/* eslint-disable */`)
   - **Fix the underlying issue** instead of suppressing warnings
   - **Follow established patterns** from the codebase for similar scenarios

3. **Best Practice Approach**:
   - **Review surrounding code** to understand the expected data structure
   - **Use existing interfaces** from the codebase when applicable
   - **Create new interfaces** in appropriate locations (usually `src/common/interfaces/` or module-specific)
   - **Follow naming conventions** established in the project
   - **Ensure type safety** throughout the entire data flow

4. **Analysis Before Action**:
   - **Understand the purpose** of the code before making changes
   - **Check for existing similar implementations** in the codebase
   - **Verify that changes don't break functionality** by following data flow
   - **Test the solution** when possible to ensure it works correctly

### Work Documentation & Commits

- **IMPORTANT**: Before any commit, Claude must document all work in `CLAUDE_WORK_LOG.md`
- Each work session should include:
  - Date and brief description of work performed
  - List of files created, modified, or deleted
  - Purpose and reasoning behind the changes
  - Any important notes or architectural decisions
- Use this documentation to create meaningful commit messages that reference the work log entry
- This ensures project history is well-documented and changes are traceable

### Internationalization (i18n)

- **Multi-language support** for English, French, and Arabic
- **Translation files** in `src/i18n/` organized by language and namespace
- **Automatic language detection** via middleware based on Accept-Language header
- **RTL support** for Arabic language
- **Translation key constants** in `src/common/constants/translation-keys.ts`
- **Validation message translation** integrated with class-validator-i18n

### **MANDATORY: Follow Architectural Guidelines**

**ALWAYS refer to and follow the patterns established in `ARCHITECTURAL_GUIDELINES.md`:**

- **Service Architecture**: Use specialized services (Core, Profile, Account, Admin) with Facade pattern
- **Standardized Validators**: ALWAYS use `@IsEmailField()`, `@IsNameField()`, `@IsUuidArrayField()`, etc. instead of raw validators
  - **Custom Examples Support**: All standardized validators now support custom examples: `@IsNameField({ example: 'Beautiful Downtown Apartment' })`
  - **Domain-Specific Validators**: Create domain validators (like `@IsPriceField()`, `@IsCoordinateField()`) only when global ones don't fit
- **Response DTO Architecture**: Use `BaseResponseDto` with factory pattern to eliminate repetitive response structures
  - **Operation-Specific DTOs**: Create dedicated response DTOs for different operations (e.g., `PropertyDeletionResponse`, `ImageUploadResponse`)
  - **NO INLINE TYPES**: NEVER use inline return types like `Promise<{ status: string; message: string; data: SomeDto }>`. ALWAYS create and use proper Response DTOs that extend `BaseResponseDto<T>`
  - **Type Aliases**: Use proper type aliases instead of manual inline response types
- **Enum Usage**: NEVER use static strings - use proper enums (SortDirectionEnum.ASC, AccountActionTypeEnum.DEACTIVATE, PropertyType.APARTMENT)
- **Error Handling**: Extend BaseController and use standard error codes (NOT_FOUND, VALIDATION_FAILED, etc.)
- **API Documentation**: Use `@ApiEndpoint()` decorator or helpers like `@PublicEndpoint()`, `@ProtectedEndpoint()` with responseType parameter for proper Swagger documentation
- **DTO Inheritance**: Follow BaseUserDto → UserSummaryDto → UserDataDto → UserAdminDto hierarchy patterns
- **Type Safety**: Use proper generics, interfaces, and Type<T> - never any/unknown types and don't use inline types
- **File Organization**: Follow standard module structure with specialized services and organized DTOs
- **Module Quality Assessment**: Use systematic A-F grading criteria to evaluate module quality and completeness

### **Properties Module: Architectural Reference Implementation**

The Properties module serves as the reference implementation for all architectural patterns:

**Completed Architectural Improvements (2024):**

- ✅ **Full Response DTO Architecture**: Eliminated all manual inline response types using `BaseResponseDto` factory pattern
- ✅ **Standardized Validators**: 100% coverage with custom examples support (`@IsNameField({ example: 'Beautiful Downtown Apartment' })`)
- ✅ **Controller Separation**: Three specialized controllers (app, admin, public) for different audiences
- ✅ **Type Safety**: Zero `any` types, all responses properly typed with dedicated DTOs
- ✅ **Service Architecture**: Facade pattern with specialized services (future enhancement planned)
- ✅ **Comprehensive Validation**: Advanced search DTO with proper enum validation and field-specific rules

**File Structure:**

```
src/modules/properties/
├── controllers/
│   ├── properties-app.controller.ts      # Host operations
│   ├── properties-admin.controller.ts    # Admin management
│   └── properties-public.controller.ts   # Public search
├── dto/
│   ├── create-property.dto.ts            # Standardized validators
│   ├── property-search.dto.ts            # Advanced search params
│   ├── property-response.dto.ts          # Response objects
│   └── property-operation-response.dto.ts # Operation responses
├── validators/
│   └── property.validators.ts            # Domain-specific only
└── services/
    └── properties-facade.service.ts      # Coordination layer
```

**Quality Grade**: A (95%) - Serves as template for other modules
