# Catalog System Migration Guide

This document describes the migration from the generic DynamicConfig module to the new structured catalog system.

## Overview

The old DynamicConfig system has been replaced with:

1. **Fixed System Enums** - Enums that represent core business logic states
2. **Enum Display Configurations** - Admin-configurable display settings for system enums
3. **Concrete Catalog Modules** - Specific modules for different catalog types
4. **Catalog Versioning** - Version tracking and ETag caching support
5. **Aggregated API** - Single endpoint to fetch multiple catalogs efficiently

## New Architecture

### System Enums
Fixed enums in code that cannot be changed at runtime:
- BookingStatus
- PaymentStatus, PaymentTransactionStatus, InvoiceStatus
- ReviewType
- NotificationStatus, NotificationPriority, DevicePlatform, NotificationChannel
- PaymentMethodType

### Catalog Modules
Concrete modules for dashboard-managed data:
- `amenity-categories` - Amenity categories
- `amenities` - Amenities with category references
- `bed-types` - Bed types
- `property-types` - Property types
- `room-types` - Room types
- `cancellation-policies` - Cancellation policies with rules
- `currencies` - Currencies with ISO codes and symbols
- `notification-types` - Notification types with templates
- `payment-providers` - Payment providers with credentials (redacted in responses)

## API Endpoints

### Catalog Aggregator
```
GET /catalogs?include=amenityCategories,currencies&locale=en
```
Returns requested catalogs with ETag caching support.

### Enum Displays (System Admin only)
```
GET /enum-displays
POST /enum-displays
PUT /enum-displays/:enumName/:key
DELETE /enum-displays/:enumName/:key
```

### Individual Catalog Modules (Catalog Editor/System Admin)
```
GET /amenity-categories
POST /amenity-categories
PUT /amenity-categories/:id
DELETE /amenity-categories/:id
PUT /amenity-categories/:id/deprecate
PUT /amenity-categories/:id/restore
```

Similar endpoints exist for all catalog modules.

## Role-Based Access Control

- **SystemAdmin** - Full access to enum displays and provider credentials
- **CatalogEditor** - Access to catalog management (excluding credentials)
- **Read access** - Available to all authenticated users

## Migration Process

1. **Run Migration Script**:
   ```bash
   npm run migrate:dynamic-config
   ```

2. **Update Client Code**:
   - Replace DynamicConfig API calls with new catalog endpoints
   - Use the aggregated `/catalogs` endpoint for bulk fetching
   - Implement ETag caching for performance

3. **Legacy Support**:
   - A backwards-compatible adapter is temporarily available
   - Marked as deprecated and will be removed in future versions

## Version Management

The catalog system includes automatic versioning:
- Version increments on any create/update/deprecate operation
- ETag headers support client-side caching
- Version endpoint: `GET /catalogs/version`

## Benefits

1. **Type Safety** - Fixed enums prevent invalid states
2. **Performance** - ETag caching and single-request aggregation
3. **Security** - Proper RBAC and credential protection
4. **Maintainability** - Structured, purpose-built modules
5. **Scalability** - Versioning and efficient caching

## Migration Checklist

- [ ] Run migration script
- [ ] Update frontend to use new endpoints
- [ ] Test role-based access controls
- [ ] Verify ETag caching works
- [ ] Remove legacy DynamicConfig usage
- [ ] Update documentation and API specs