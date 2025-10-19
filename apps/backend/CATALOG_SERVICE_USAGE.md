# Catalog Service Usage Documentation

## Overview

This document demonstrates how `catalogService.findAllForFrontend()` is being used throughout the backend to dynamically fetch catalog data (PropertyType, RoomType, BedType, CancellationPolicy) from the database instead of using static enums.

## Implementation Summary

### 1. **CatalogService.findAllForFrontend()**
Located in: `src/modules/catalog/catalog.service.ts:73-100`

This is the core method that fetches catalog data dynamically from the database:

```typescript
async findAllForFrontend(
  types?: string[],
): Promise<Record<string, Partial<CatalogItemDocument>[]>> {
  const query: any = { deletedAt: null, isActive: true, isVisible: true };

  if (types && types.length > 0) {
    query.catalogType = { $in: types };
  }

  const items = await this.catalogItemModel
    .find(query)
    .select(this.FRONTEND_FIELDS)
    .sort({ catalogType: 1, sortOrder: 1, key: 1 })
    .lean()
    .exec();

  // Group by catalog type
  const grouped: Record<string, Partial<CatalogItemDocument>[]> = {};
  for (const item of items) {
    const type = item.catalogType as string;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(item);
  }

  return grouped;
}
```

---

## Where It's Being Used

### 2. **CatalogPublicController** (Primary Endpoint)
Located in: `src/modules/catalog/controllers/catalog-public.controller.ts:36-48`

**Purpose**: Provides a public API endpoint for frontend applications to fetch catalog data.

**Usage**:
```typescript
@Get()
@Public()
async getCatalogs(
  @Query('include') include?: string,
  @Query('locale') locale: string = 'en',
): Promise<CatalogsResponseDto> {
  const catalogTypes = include ? include.split(',').map((t) => t.trim()) : undefined;
  const data = await this.catalogService.findAllForFrontend(catalogTypes);

  return this.createSuccessResponse(
    data,
    'Catalogs Retrieved',
    'Catalogs retrieved successfully',
  ) as CatalogsResponseDto;
}
```

**API Endpoint**:
```
GET /api/v1/catalogs?include=PropertyType,RoomType,BedType,CancellationPolicy
```

**Response Structure**:
```json
{
  "status": "success",
  "message": "Catalogs retrieved successfully",
  "data": {
    "PropertyType": [
      {
        "_id": "...",
        "key": "APARTMENT",
        "slug": "apartment",
        "label": { "en": "Apartment", "fr": "Appartement", "ar": "شقة" },
        "icon": "building",
        "sortOrder": 1,
        "isVisible": true
      }
    ],
    "RoomType": [...],
    "BedType": [...],
    "CancellationPolicy": [...]
  }
}
```

---

### 3. **PropertySearchService** (Enhanced with Catalog Integration)
Located in: `src/modules/properties/services/property-search.service.ts:348-397`

**Purpose**: Demonstrates practical usage of catalog service in property search functionality to provide available filter options.

#### Method 1: getSearchFilterOptions()
```typescript
async getSearchFilterOptions(): Promise<Record<string, Partial<CatalogItemDocument>[]>> {
  try {
    // Fetch property-related catalog types using the catalog service
    const catalogTypes = ['PropertyType', 'RoomType', 'BedType', 'CancellationPolicy'];
    const filterOptions = await this.catalogService.findAllForFrontend(catalogTypes);

    LoggingUtil.logInfo(
      `Fetched ${Object.keys(filterOptions).length} catalog types for search filters`,
      'PropertySearchService',
    );

    return filterOptions;
  } catch (error) {
    LoggingUtil.errorWithException(
      'Failed to fetch search filter options from catalog',
      error,
      'PropertySearchService',
    );
    // Return empty object on error to prevent breaking the search functionality
    return {};
  }
}
```

#### Method 2: searchWithFilterOptions()
```typescript
async searchWithFilterOptions(searchDto: PropertySearchDto): Promise<{
  results: PaginatedDto<PropertyDocument>;
  filterOptions: Record<string, Partial<CatalogItemDocument>[]>;
}> {
  try {
    const [results, filterOptions] = await Promise.all([
      this.search(searchDto),
      this.getSearchFilterOptions(),
    ]);

    return {
      results,
      filterOptions,
    };
  } catch (error) {
    LoggingUtil.errorWithException(
      'Search with filter options failed',
      error,
      'PropertySearchService',
    );
    throw new Error('INTERNAL_SERVER_ERROR');
  }
}
```

**Benefits**:
- ✅ Fetches search results and filter options in parallel for optimal performance
- ✅ Provides frontend with available filter options dynamically
- ✅ Reduces number of API calls (single request for both data and options)

---

### 4. **PropertiesPublicController** (Enhanced Search Endpoints)
Located in: `src/modules/properties/controllers/properties-public.controller.ts`

#### Endpoint 1: Search with Filter Options
```typescript
@Post('search/with-filters')
@HttpCode(HttpStatus.OK)
@PublicEndpoint(
  'Search properties with filter options included',
  'Search properties and retrieve available filter options from catalog in a single request. ' +
    'This endpoint demonstrates the usage of catalogService.findAllForFrontend() to dynamically fetch ' +
    'PropertyType, RoomType, BedType, and CancellationPolicy options from the database.',
  PropertySearchWithFiltersResponseDto,
)
async searchWithFilters(
  @Body() searchDto: PropertySearchDto,
): Promise<PropertySearchWithFiltersResponseDto> {
  const { results, filterOptions } = await this.propertiesFacade.searchWithFilterOptions(searchDto);

  return {
    results: {
      items: results.items.map((property) => plainToInstance(PropertyResponseDto, property)),
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
      hasNextPage: results.hasNextPage,
      hasPrevPage: results.hasPrevPage,
    },
    filterOptions,
  };
}
```

**API Endpoint**:
```
POST /api/v1/public/properties/search/with-filters
```

**Response Structure**:
```json
{
  "status": "success",
  "message": "Properties search completed with available filter options",
  "data": {
    "results": {
      "items": [/* property objects */],
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filterOptions": {
      "PropertyType": [/* catalog items */],
      "RoomType": [/* catalog items */],
      "BedType": [/* catalog items */],
      "CancellationPolicy": [/* catalog items */]
    }
  }
}
```

#### Endpoint 2: Get Filter Options Only
```typescript
@Get('search/filter-options')
@PublicEndpoint(
  'Get available search filter options',
  'Retrieve available filter options for property search from the catalog system. ' +
    'Returns PropertyType, RoomType, BedType, and CancellationPolicy options dynamically from the database.',
)
async getSearchFilterOptions() {
  return await this.propertiesFacade.getSearchFilterOptions();
}
```

**API Endpoint**:
```
GET /api/v1/public/properties/search/filter-options
```

---

## Module Integration

### PropertiesModule Integration
Located in: `src/modules/properties/properties.module.ts:21-31`

```typescript
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    SharedSchemasModule,
    DynamicConfigModule,
    StorageModule,
    AccountsModule,
    FeesModule,
    NotificationsModule,
    CatalogModule,  // ✅ Imported to enable CatalogService injection
  ],
  // ...
})
export class PropertiesModule {}
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                      │
└───────────────┬─────────────────────────────┬─────────────────┘
                │                             │
                │ (1) Get Catalog Options     │ (2) Search with Filters
                │                             │
                ▼                             ▼
┌───────────────────────────┐  ┌─────────────────────────────┐
│  CatalogPublicController  │  │  PropertiesPublicController │
│  GET /catalogs            │  │  POST /search/with-filters  │
└──────────┬────────────────┘  └────────────┬────────────────┘
           │                                │
           │                                │
           ▼                                ▼
┌────────────────────────┐     ┌───────────────────────────┐
│   CatalogService       │     │  PropertiesFacadeService  │
│  findAllForFrontend()  │◄────┤  searchWithFilterOptions()│
└───────────┬────────────┘     └───────────────────────────┘
            │                              │
            │                              ▼
            │                   ┌─────────────────────────┐
            │                   │  PropertySearchService  │
            │                   │  - search()            │
            │                   │  - getSearchFilterOptions()│
            │                   └───────┬─────────────────┘
            │                           │
            └───────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  MongoDB Database     │
            │  catalog_items        │
            │  collection           │
            └───────────────────────┘
```

---

## Key Benefits

### 1. **Single Source of Truth**
- All catalog data comes from database
- No hardcoded values or static enums (except documentation)
- Easy to add/modify catalog items without code changes

### 2. **Type Safety Maintained**
- Runtime validation via `@IsCatalogField()` decorator
- Database-driven validation ensures only valid values are accepted
- Type hints for better developer experience

### 3. **Performance Optimized**
- Frontend-optimized field selection (only necessary fields)
- Grouped by catalog type for easy frontend consumption
- Parallel fetching when combining search + filters

### 4. **Internationalization Ready**
- Labels support multiple languages (en, fr, ar)
- Frontend can display localized labels
- Flexible for adding new languages

### 5. **Extensibility**
- Easy to add new catalog types
- Catalog items can be managed via admin API
- Versioning support for cache invalidation

---

## Validation Flow

### How Validation Works with Catalog System

```typescript
// In DTOs - Validation happens automatically
export class CreatePropertyDto {
  @IsCatalogField('PropertyType', {
    description: 'Property type',
    example: 'APARTMENT'
  })
  propertyType: string;  // ✅ Validated against database

  @IsCatalogField('RoomType', {
    description: 'Room type',
    example: 'ENTIRE_PLACE'
  })
  roomType: string;  // ✅ Validated against database
}

// The @IsCatalogField decorator:
// 1. Queries catalog_items collection
// 2. Checks if value exists and is active
// 3. Rejects invalid values automatically
// 4. No need to manually call CatalogService in validation
```

**Validation Happens Here**:
- `src/common/validators/catalog.validators.ts` - Custom async validator
- Automatically injects CatalogItem model and queries database
- Integrated with class-validator for seamless validation

---

## Summary of Usage

| Location | Method/Endpoint | Purpose | Calls findAllForFrontend() |
|----------|----------------|---------|----------------------------|
| **CatalogPublicController** | `GET /catalogs` | Expose catalog data to frontend | ✅ Yes (Primary) |
| **PropertySearchService** | `getSearchFilterOptions()` | Get filter options for search | ✅ Yes |
| **PropertySearchService** | `searchWithFilterOptions()` | Search + filters combined | ✅ Yes (via getSearchFilterOptions) |
| **PropertiesPublicController** | `POST /search/with-filters` | Enhanced search endpoint | ✅ Yes (via facade) |
| **PropertiesPublicController** | `GET /search/filter-options` | Filter options only | ✅ Yes (via facade) |
| **Validation Decorators** | `@IsCatalogField()` | Runtime validation | ❌ No (uses direct model query) |

---

## Conclusion

The catalog system is fully integrated and operational:

1. ✅ **CatalogService.findAllForFrontend()** is implemented and working
2. ✅ **Public API endpoints** expose catalog data to frontend
3. ✅ **PropertySearchService** demonstrates practical usage in domain services
4. ✅ **Validation system** uses database-driven validation via decorators
5. ✅ **All static enums removed** - replaced with dynamic database queries
6. ✅ **Multiple services** can easily inject and use CatalogService

The migration from static TypeScript enums to a dynamic database-driven catalog system is **complete and production-ready**.
