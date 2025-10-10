# Global App Context

The Global App Context provides centralized access to application-wide data that needs to be fetched once and shared across the entire application, such as catalog data containing static and dynamic enums, amenity categories, and enum displays.

## Overview

The App Context fetches and caches catalog data from the `/v1/catalogs` endpoint once when the application loads, making this consolidated data available throughout the component tree without requiring multiple API calls.

## File Structure

```
src/contexts/app/
├── app-context.ts          # React context definition
├── app-provider.tsx        # Provider component with API integration
├── use-app-context.ts      # Hook for consuming context
├── types.ts                # TypeScript interfaces
└── index.ts                # Barrel exports
```

## Key Features

- **Single Source of Truth**: Fetches complete catalog data once at app startup
- **Optimized Caching**: Configured with 5-minute stale time and 10-minute cache time
- **Error Handling**: Provides error state and manual refetch functionality
- **Loading States**: Tracks loading state for UI feedback
- **Type Safety**: Full TypeScript support with proper typing

## API Integration

Uses the auto-generated API hook `useCatalogsControllerGetCatalogsV1` which fetches from:
- **Endpoint**: `GET /v1/catalogs`
- **Response Type**: `CatalogDataDto`
  - `dynamicEnums`: Dynamic enums (manageable by admin)
  - `enumDisplays`: Enum display configurations
  - `amenityCategories`: Amenity category data
  - Additional catalog data as configured

## Usage

### Basic Usage

```tsx
import { useAppContext } from 'src/contexts/app';

function MyComponent() {
  const { catalog, isLoading, error, refetch } = useAppContext();
  
  if (isLoading) return <div>Loading catalog...</div>;
  if (error) return <div>Error loading catalog: {error.message}</div>;
  
  // Access dynamic enums
  const dynamicEnums = catalog?.dynamicEnums;
  
  // Access amenity categories
  const amenityCategories = catalog?.amenityCategories;
  
  // Access enum displays
  const enumDisplays = catalog?.enumDisplays;
  
  return (
    <div>
      <h3>Property Types</h3>
      {dynamicEnums?.property_types?.map(type => (
        <div key={type.id}>{type.name}</div>
      ))}
      
      <h3>Amenity Categories</h3>
      {amenityCategories?.map(category => (
        <div key={category._id}>{category.name}</div>
      ))}
    </div>
  );
}
```

### Accessing Different Catalog Data

```tsx
function CatalogDataExamples() {
  const { catalog } = useAppContext();
  
  // Dynamic enums (manageable by admin)
  const propertyTypes = catalog?.dynamicEnums?.property_types;
  const amenities = catalog?.dynamicEnums?.amenities;
  const bedTypes = catalog?.dynamicEnums?.bed_types;
  const cancellationPolicies = catalog?.dynamicEnums?.cancellation_policies;
  const paymentProviders = catalog?.dynamicEnums?.payment_providers;
  const currencies = catalog?.dynamicEnums?.currencies;
  const notificationTypes = catalog?.dynamicEnums?.notification_types;
  
  // Amenity categories
  const amenityCategories = catalog?.amenityCategories;
  
  // Enum displays
  const enumDisplays = catalog?.enumDisplays;
  
  return <div>Your component with catalog data</div>;
}
```

### Error Handling and Refetching

```tsx
function CatalogManager() {
  const { catalog, isLoading, error, refetch } = useAppContext();
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (error) {
    return (
      <div>
        <p>Failed to load catalog: {error.message}</p>
        <button onClick={handleRefresh}>Retry</button>
      </div>
    );
  }
  
  return <div>Your component</div>;
}
```

## Context Value Interface

```typescript
interface AppContextValue {
  catalog: CatalogDataDto | null;     // The fetched catalog data
  isLoading: boolean;                 // Loading state
  error: Error | null;                // Error state
  refetch: () => void;                // Manual refetch function
}
```

## Data Structure

The `CatalogDataDto` contains consolidated application data:

```typescript
interface CatalogDataDto {
  dynamicEnums: DynamicEnums;         // Admin-manageable enums
  enumDisplays: EnumDisplays;         // Enum display configurations
  amenityCategories: AmenityCategory[]; // Amenity categories
  // Additional catalog data as configured
}
```

**Dynamic enums** include categories like:
- `property_types` - Different property types (apartment, house, etc.)
- `amenities` - Available amenities (wifi, parking, etc.)
- `bed_types` - Types of beds available
- `cancellation_policies` - Booking cancellation policies
- `payment_providers` - Supported payment methods
- `currencies` - Supported currencies
- `notification_types` - Types of notifications

**Amenity categories** provide organized groupings for amenities with multilingual support.

**Enum displays** configure how enums are displayed in the UI with custom labels and visibility settings.

## Integration

The `AppProvider` is integrated into the main application layout in `src/app/layout.tsx`:

```tsx
<ReactQueryProvider>
  <I18nProvider lang={appConfig.i18nLang}>
    <AuthProvider>
      <AppProvider>
        <SettingsProvider>
          {/* Rest of app */}
        </SettingsProvider>
      </AppProvider>
    </AuthProvider>
  </I18nProvider>
</ReactQueryProvider>
```

## Caching Configuration

The context is configured with optimal caching settings:

- **Stale Time**: 5 minutes - Data is considered fresh for 5 minutes
- **Cache Time**: 10 minutes - Data remains in cache for 10 minutes after last use
- **Refetch on Window Focus**: Disabled - Prevents unnecessary refetches
- **Refetch on Mount**: Enabled - Ensures fresh data on component mount

## Benefits

1. **Performance**: Single API call for all catalog data
2. **Consistency**: Same consolidated data across all components  
3. **Caching**: Intelligent caching reduces server load
4. **Developer Experience**: Simple hook interface
5. **Type Safety**: Full TypeScript support
6. **Error Handling**: Built-in error states and recovery
7. **Comprehensive**: Access to enums, categories, and display configurations in one place

## Best Practices

1. **Use Sparingly**: Only fetch data that's truly global and static-ish
2. **Handle Loading States**: Always check `isLoading` before using data
3. **Error Boundaries**: Implement error boundaries for graceful failures
4. **Type Guards**: Use optional chaining when accessing nested catalog data
5. **Memoization**: Consider memoizing derived computations from catalog data
6. **Selective Access**: Only access the parts of the catalog you need in each component

## Extending the Context

To add more global data to the context:

1. Update the `AppContextValue` interface in `types.ts`
2. Modify the `AppProvider` to fetch additional data
3. Update the context documentation

Example:

```tsx
// types.ts
interface AppContextValue {
  enums: EnumsForFrontendDto | null;
  settings: AppSettings | null;  // New global data
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

## Troubleshooting

### Common Issues

1. **Context not available**: Ensure component is wrapped by `AppProvider`
2. **Stale data**: Use `refetch()` to manually refresh
3. **Type errors**: Check if using optional chaining for nested access
4. **Performance issues**: Verify caching configuration is appropriate

### Debug Tips

```tsx
function DebugEnums() {
  const { enums, isLoading, error } = useAppContext();
  
  console.log('Enums state:', { enums, isLoading, error });
  
  return <div>Check console for enum data</div>;
}
```