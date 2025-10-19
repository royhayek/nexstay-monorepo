# Simplified Catalog API

**Date:** October 19, 2025
**Status:** ✅ Production-Ready

---

## Available Hooks (Simplified)

We've simplified the API to only 4 essential hooks:

### 1. `useAppContext()`
Get the full app context (rarely needed directly).

```typescript
const context = useAppContext();
```

### 2. `useCatalogs()`
Get catalog data with loading and error states.

```typescript
const { data, isLoading, error, refetch } = useCatalogs();

if (isLoading) return <LoadingState />;
if (error) return <ErrorState onRetry={refetch} />;
```

### 3. `useCatalogOptions(type)` ⭐ **Main Hook**
Get formatted options for any catalog type.

```typescript
// Get property types
const propertyTypes = useCatalogOptions('propertyTypes');

// Get room types
const roomTypes = useCatalogOptions('roomTypes');

// Get bed types
const bedTypes = useCatalogOptions('bedTypes');

// Get cancellation policies
const cancellationPolicies = useCatalogOptions('cancellationPolicies');

// Get amenities
const amenities = useCatalogOptions('amenities');
```

**Returns:**
```typescript
Array<{
  label: string;      // Translated label in current language
  value: string;      // Catalog item key (e.g., 'APARTMENT')
  icon?: string;      // Iconsax icon name
  group?: string;     // Category group
}>
```

### 4. `useSupportedLanguages()`
Get supported languages data.

```typescript
const { data, isLoading, error, refetch } = useSupportedLanguages();
```

---

## Usage Examples

### Example 1: Simple Select Field
```typescript
import { useCatalogOptions } from 'src/contexts/app';

function PropertyTypeSelector() {
  const options = useCatalogOptions('propertyTypes');

  return (
    <Select>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}
```

### Example 2: Select with Icons
```typescript
import { useCatalogOptions } from 'src/contexts/app';
import { Iconify } from 'src/components/iconify';

function AmenitiesSelector() {
  const amenities = useCatalogOptions('amenities');

  return (
    <Select>
      {amenities.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.icon && <Iconify icon={option.icon} width={20} />}
            <Typography>{option.label}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}
```

### Example 3: Multi-Checkbox Grid
```typescript
import { useCatalogOptions } from 'src/contexts/app';

function AmenitiesGrid() {
  const amenities = useCatalogOptions('amenities');

  return (
    <Grid container spacing={2}>
      {amenities.map((option) => (
        <Grid key={option.value} item xs={6} sm={4} md={3}>
          <FormControlLabel
            control={<Checkbox />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option.icon && <Iconify icon={option.icon} />}
                {option.label}
              </Box>
            }
          />
        </Grid>
      ))}
    </Grid>
  );
}
```

### Example 4: With Loading/Error States
```typescript
import { useCatalogs, useCatalogOptions } from 'src/contexts/app';
import { LoadingState } from 'src/components/loading-state';
import { ErrorState } from 'src/components/error-state';

function PropertyForm() {
  const { isLoading, error, refetch } = useCatalogs();
  const propertyTypes = useCatalogOptions('propertyTypes');

  if (isLoading) {
    return <LoadingState title="Loading form options..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load form options"
        description="Please try again"
        onRetry={refetch}
      />
    );
  }

  return (
    <Select>
      {propertyTypes.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
}
```

---

## Available Catalog Types

Pass these to `useCatalogOptions()`:

| Type | Description |
|------|-------------|
| `'propertyTypes'` | Apartment, House, Villa, etc. |
| `'roomTypes'` | Entire home, Private room, etc. |
| `'bedTypes'` | Single, Double, Queen, King, etc. |
| `'cancellationPolicies'` | Flexible, Moderate, Strict |
| `'amenities'` | WiFi, Parking, Pool, etc. |

---

## Migration from Old API

### Before (Redundant Hooks)
```typescript
// ❌ Old way - separate hook for each type
import { usePropertyTypes, useRoomTypes, useBedTypes } from 'src/contexts/app';

const propertyTypes = usePropertyTypes();
const roomTypes = useRoomTypes();
const bedTypes = useBedTypes();
```

### After (Simplified)
```typescript
// ✅ New way - one hook for all types
import { useCatalogOptions } from 'src/contexts/app';

const propertyTypes = useCatalogOptions('propertyTypes');
const roomTypes = useCatalogOptions('roomTypes');
const bedTypes = useCatalogOptions('bedTypes');
```

---

## Benefits of Simplified API

✅ **Cleaner Code**: 4 hooks instead of 12
✅ **DRY Principle**: No redundant code
✅ **Type-Safe**: Full TypeScript support
✅ **Consistent**: Same pattern for all catalog types
✅ **Flexible**: Easy to add new catalog types
✅ **Auto-Formatted**: Returns ready-to-use options
✅ **Multilingual**: Automatic translation based on current language

---

## TypeScript IntelliSense

The hook provides full autocomplete for catalog types:

```typescript
useCatalogOptions('propertyTypes')        // ✅ Valid
useCatalogOptions('roomTypes')            // ✅ Valid
useCatalogOptions('bedTypes')             // ✅ Valid
useCatalogOptions('cancellationPolicies') // ✅ Valid
useCatalogOptions('amenities')            // ✅ Valid
useCatalogOptions('invalidType')          // ❌ TypeScript error
```

---

**API Version:** Simplified v2.0
**Status:** ✅ Production-Ready
**Documentation:** Complete
