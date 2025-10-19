# Catalog API Integration Guide - Mobile App

**Date**: 2025-10-18
**Related**: See `apps/backend/UNIFIED_CATALOG_SYSTEM_STUDY.md` for full architectural study

---

## Overview

This document outlines how the mobile app will integrate with the unified catalog API to **eliminate hardcoded enum mappings** and become fully dynamic with backend-controlled catalog data.

---

## Current Problems

### Hardcoded Enum Mappings

**Files with hardcoded mappings**:
- `app/listing/create.tsx` - Lines 315-340
- `app/listing/edit/[id].tsx` - Lines 104-130, 315-340

**Example of current approach** (❌ BAD):

```typescript
// ❌ Hardcoded mapping that must stay in sync with backend
const propertyTypeMap: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  studio: "Studio",
  villa: "Villa",
  cabin: "Cabin",
  cottage: "Cottage",
};

const roomTypeMap: Record<string, string> = {
  entire_place: "Entire place",
  entire_home: "Entire home/apt",
  private_room: "Private room",
  shared_room: "Shared room",
  hotel_room: "Hotel room",
};

const bedTypeMap: Record<string, string> = {
  single: "Single bed",
  twin: "Twin bed",
  full_double: "Full/Double bed",
  queen: "Queen bed",
  king: "King bed",
  super_king: "Super King bed",
  sofa_bed: "Sofa bed",
};
```

**Problems**:
- ❌ Hardcoded in 2 files (create + edit)
- ❌ Duplicates backend enum logic
- ❌ No i18n support
- ❌ Requires app update to change labels
- ❌ Must manually keep in sync with backend
- ❌ Increases bundle size
- ❌ Prone to bugs

---

## Solution: Dynamic Catalog API

### New Unified Catalog Endpoint

```http
GET /v1/catalogs?include=PropertyType,RoomType,BedType&locale=en
```

**Response**:
```json
{
  "success": true,
  "message": "Catalogs retrieved successfully",
  "data": {
    "PropertyType": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "key": "APARTMENT",
        "slug": "apartment",
        "label": {
          "en": "Apartment",
          "fr": "Appartement",
          "ar": "شقة"
        },
        "icon": null,
        "sortOrder": 1,
        "isVisible": true
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "key": "HOUSE",
        "slug": "house",
        "label": {
          "en": "House",
          "fr": "Maison",
          "ar": "منزل"
        },
        "icon": null,
        "sortOrder": 2,
        "isVisible": true
      }
      // ... more property types
    ],
    "RoomType": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "key": "ENTIRE_HOME",
        "slug": "entire-home-apt",
        "label": {
          "en": "Entire home/apt",
          "fr": "Logement entier",
          "ar": "المنزل بالكامل"
        },
        "icon": null,
        "sortOrder": 1,
        "isVisible": true
      }
      // ... more room types
    ],
    "BedType": [
      {
        "_id": "507f1f77bcf86cd799439031",
        "key": "QUEEN",
        "slug": "queen-bed",
        "label": {
          "en": "Queen bed",
          "fr": "Lit queen",
          "ar": "سرير كوين"
        },
        "icon": null,
        "sortOrder": 4,
        "isVisible": true
      }
      // ... more bed types
    ]
  }
}
```

---

## Implementation Steps

### Step 1: Generate API Client (When Backend Ready)

After the unified catalog endpoint is implemented in the backend:

```bash
cd apps/mobile
npm run generate-api
```

This will generate:
- `api/queries/public/catalogs/catalogs.ts`
- `api/models/public/catalogDto.ts`

### Step 2: Create Catalog Context

**File**: `contexts/catalog-context.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCatalogsPublicControllerGetCatalogs } from '@/api/queries/public/catalogs/catalogs';

interface CatalogItem {
  _id: string;
  key: string;
  slug: string;
  label: {
    en: string;
    fr: string;
    ar: string;
  };
  icon?: string;
  sortOrder: number;
  isVisible: boolean;
}

interface CatalogContextValue {
  propertyTypes: CatalogItem[];
  roomTypes: CatalogItem[];
  bedTypes: CatalogItem[];
  amenities: CatalogItem[];
  cancellationPolicies: CatalogItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalogVersion, setCatalogVersion] = useState<number | null>(null);

  // Get user's locale (default to 'en')
  const locale = 'en'; // TODO: Get from user preferences/device locale

  // Fetch catalogs from API
  const { data, isLoading, error, refetch } = useCatalogsPublicControllerGetCatalogs({
    include: 'PropertyType,RoomType,BedType,Amenity,CancellationPolicy',
    locale,
  });

  // Cache management
  useEffect(() => {
    const checkCatalogVersion = async () => {
      const storedVersion = await AsyncStorage.getItem('catalogVersion');
      const currentVersion = data?.data?.version;

      if (currentVersion && storedVersion !== currentVersion.toString()) {
        // Cache catalogs
        await AsyncStorage.setItem('catalogs', JSON.stringify(data?.data));
        await AsyncStorage.setItem('catalogVersion', currentVersion.toString());
        setCatalogVersion(currentVersion);
      }
    };

    if (data) {
      checkCatalogVersion();
    }
  }, [data]);

  const value: CatalogContextValue = {
    propertyTypes: data?.data?.PropertyType || [],
    roomTypes: data?.data?.RoomType || [],
    bedTypes: data?.data?.BedType || [],
    amenities: data?.data?.Amenity || [],
    cancellationPolicies: data?.data?.CancellationPolicy || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalogs = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalogs must be used within CatalogProvider');
  }
  return context;
};

// Helper hooks for specific catalog types
export const usePropertyTypes = () => {
  const { propertyTypes, isLoading, error } = useCatalogs();
  return { propertyTypes, isLoading, error };
};

export const useRoomTypes = () => {
  const { roomTypes, isLoading, error } = useCatalogs();
  return { roomTypes, isLoading, error };
};

export const useBedTypes = () => {
  const { bedTypes, isLoading, error } = useCatalogs();
  return { bedTypes, isLoading, error };
};

export const useAmenities = () => {
  const { amenities, isLoading, error } = useCatalogs();
  return { amenities, isLoading, error };
};

export const useCancellationPolicies = () => {
  const { cancellationPolicies, isLoading, error } = useCatalogs();
  return { cancellationPolicies, isLoading, error };
};
```

### Step 3: Add Provider to App Layout

**File**: `app/_layout.tsx`

```typescript
import { CatalogProvider } from '@/contexts/catalog-context';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <UnistylesRegistry theme={lightTheme}>
        <CatalogProvider>  {/* Add here */}
          <Stack>
            {/* ... */}
          </Stack>
        </CatalogProvider>
      </UnistylesRegistry>
    </QueryClientProvider>
  );
}
```

### Step 4: Update Listing Creation Screen

**File**: `app/listing/create.tsx`

**BEFORE** (❌):
```typescript
// Lines 315-340: Hardcoded maps
const propertyTypeMap: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  // ...
};

const handleSubmit = async () => {
  const submitData = {
    propertyType: propertyTypeMap[formData.propertyType] || formData.propertyType,
    roomType: roomTypeMap[formData.roomType] || formData.roomType,
    bedType: bedTypeMap[formData.bedType] || formData.bedType,
    // ...
  };
};
```

**AFTER** (✅):
```typescript
import { usePropertyTypes, useRoomTypes, useBedTypes } from '@/contexts/catalog-context';

export default function CreateListingScreen() {
  const { propertyTypes, isLoading: loadingPropertyTypes } = usePropertyTypes();
  const { roomTypes, isLoading: loadingRoomTypes } = useRoomTypes();
  const { bedTypes, isLoading: loadingBedTypes } = useBedTypes();

  // Helper function to get catalog item key by slug
  const getCatalogKeyBySlug = (items: CatalogItem[], slug: string): string => {
    const item = items.find(i => i.slug === slug);
    return item?.key || slug;
  };

  const handleSubmit = async () => {
    const submitData = {
      // Use the key from catalog items
      propertyType: getCatalogKeyBySlug(propertyTypes, formData.propertyType),
      roomType: getCatalogKeyBySlug(roomTypes, formData.roomType),
      bedType: getCatalogKeyBySlug(bedTypes, formData.bedType),
      // ...
    };
  };

  // In step 1 render:
  <FormSection title="What type of property is this?">
    {loadingPropertyTypes ? (
      <ActivityIndicator />
    ) : (
      <PropertyTypeSelector
        options={propertyTypes}
        value={formData.propertyType}
        onChange={(value) => updateFormData("propertyType", value)}
      />
    )}
  </FormSection>
}
```

### Step 5: Update Listing Edit Screen

**File**: `app/listing/edit/[id].tsx`

**BEFORE** (❌):
```typescript
// Lines 104-130: Hardcoded reverse maps
const propertyTypeMap: Record<string, string> = {
  "Apartment": "apartment",
  "House": "house",
  // ...
};

useEffect(() => {
  if (propertyData?.data) {
    setFormData({
      propertyType: propertyTypeMap[property.propertyType] || property.propertyType.toLowerCase(),
      // ...
    });
  }
}, [propertyData]);
```

**AFTER** (✅):
```typescript
import { usePropertyTypes, useRoomTypes, useBedTypes } from '@/contexts/catalog-context';

export default function EditListingScreen() {
  const { propertyTypes } = usePropertyTypes();
  const { roomTypes } = useRoomTypes();
  const { bedTypes } = useBedTypes();

  // Helper function to get slug by key
  const getCatalogSlugByKey = (items: CatalogItem[], key: string): string => {
    const item = items.find(i => i.key === key);
    return item?.slug || key.toLowerCase();
  };

  useEffect(() => {
    if (propertyData?.data && propertyTypes.length > 0) {
      const property = propertyData.data;

      setFormData({
        propertyType: getCatalogSlugByKey(propertyTypes, property.propertyType),
        roomType: getCatalogSlugByKey(roomTypes, property.roomType),
        bedType: getCatalogSlugByKey(bedTypes, property.bedType),
        // ...
      });
    }
  }, [propertyData, propertyTypes, roomTypes, bedTypes]);
}
```

### Step 6: Update Selection Components

**File**: `components/molecules/property-type-selector.tsx`

**BEFORE** (❌):
```typescript
const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', icon: Building },
  { value: 'house', label: 'House', icon: Home },
  // ... hardcoded
];

export const PropertyTypeSelector = ({ value, onChange }) => {
  return (
    <View>
      {PROPERTY_TYPES.map((type) => (
        <SelectionCard
          key={type.value}
          title={type.label}
          // ...
        />
      ))}
    </View>
  );
};
```

**AFTER** (✅):
```typescript
import { getIconComponent } from '@/utils/icon-mapper';

interface CatalogItem {
  _id: string;
  key: string;
  slug: string;
  label: { en: string; fr: string; ar: string };
  icon?: string;
  sortOrder: number;
}

interface PropertyTypeSelectorProps {
  options: CatalogItem[];  // From API
  value: string;
  onChange: (value: string) => void;
}

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  options,
  value,
  onChange,
}) => {
  const { theme } = useUnistyles();

  // Get localized label (use user's locale preference)
  const getLabel = (item: CatalogItem, locale: string = 'en'): string => {
    return item.label[locale] || item.label.en;
  };

  return (
    <View style={styles.grid}>
      {options
        .filter(item => item.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((type) => {
          const IconComponent = type.icon ? getIconComponent(type.icon) : null;

          return (
            <SelectionCard
              key={type._id}
              title={getLabel(type)}
              icon={IconComponent ? <IconComponent size={24} /> : undefined}
              selected={value === type.slug}
              onPress={() => onChange(type.slug)}
            />
          );
        })}
    </View>
  );
};
```

**Similarly update**:
- `room-type-selector.tsx`
- `bed-type-selector.tsx`

---

## Benefits

### 1. **No Hardcoded Mappings**
- ✅ Zero enum maps in mobile code
- ✅ Single source of truth in backend
- ✅ Automatic sync with backend changes

### 2. **Smaller Bundle Size**
- ✅ Remove ~100+ lines of hardcoded data
- ✅ No duplication between create/edit screens
- ✅ Cleaner codebase

### 3. **Multi-language Support**
- ✅ Labels in English, French, Arabic
- ✅ User sees catalogs in their preferred language
- ✅ Easy to add more languages

### 4. **Dynamic Updates**
- ✅ Dashboard can add new property types
- ✅ Mobile app gets updates automatically
- ✅ No app submission required

### 5. **Caching & Performance**
- ✅ Version-based cache invalidation
- ✅ Fetch once on app launch
- ✅ Persist to AsyncStorage
- ✅ Reduced API calls

---

## Caching Strategy

### Version-Based Caching

```typescript
// On app launch
const storedVersion = await AsyncStorage.getItem('catalogVersion');
const { data: versionData } = await getCatalogVersion();

if (!storedVersion || storedVersion !== versionData.version.toString()) {
  // Fetch fresh catalogs
  const catalogs = await getCatalogs();
  await AsyncStorage.setItem('catalogs', JSON.stringify(catalogs));
  await AsyncStorage.setItem('catalogVersion', versionData.version.toString());
} else {
  // Use cached catalogs
  const cachedCatalogs = await AsyncStorage.getItem('catalogs');
  // Use cached data
}
```

### Cache Invalidation

When backend admins modify catalogs (add/edit/delete), the catalog version increments:
- Version 1 → Version 2

Mobile app detects version change and refetches fresh data.

### TTL (Time-To-Live)

Optional: Add TTL to force refresh after X hours even if version unchanged:

```typescript
const lastFetch = await AsyncStorage.getItem('catalogLastFetch');
const now = Date.now();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

if (!lastFetch || now - parseInt(lastFetch) > TTL) {
  // Force refresh
  refetch();
  await AsyncStorage.setItem('catalogLastFetch', now.toString());
}
```

---

## Error Handling

### API Failures

```typescript
const { data, isLoading, error, refetch } = useCatalogs();

if (error) {
  return (
    <View>
      <Text>Failed to load catalogs</Text>
      <Button onPress={refetch}>Retry</Button>
    </View>
  );
}
```

### Offline Support

Use cached catalogs when offline:

```typescript
useEffect(() => {
  const loadCachedCatalogs = async () => {
    if (error) {
      // Try to load from cache
      const cached = await AsyncStorage.getItem('catalogs');
      if (cached) {
        setCatalogs(JSON.parse(cached));
      }
    }
  };

  loadCachedCatalogs();
}, [error]);
```

---

## Testing

### Unit Tests

```typescript
describe('CatalogContext', () => {
  it('should fetch catalogs on mount', async () => {
    const { result } = renderHook(() => useCatalogs(), {
      wrapper: CatalogProvider,
    });

    await waitFor(() => {
      expect(result.current.propertyTypes.length).toBeGreaterThan(0);
    });
  });

  it('should cache catalogs with version', async () => {
    // Test caching logic
  });
});
```

### Integration Tests

```typescript
describe('Listing Creation with Catalogs', () => {
  it('should load property types from API', async () => {
    render(<CreateListingScreen />);

    await waitFor(() => {
      expect(screen.getByText('Apartment')).toBeTruthy();
      expect(screen.getByText('House')).toBeTruthy();
    });
  });

  it('should submit correct enum keys', async () => {
    // Mock API
    const createPropertyMock = jest.fn();

    render(<CreateListingScreen />);

    // Select "Apartment" (slug: "apartment")
    fireEvent.press(screen.getByText('Apartment'));

    // Submit
    fireEvent.press(screen.getByText('Create Listing'));

    await waitFor(() => {
      expect(createPropertyMock).toHaveBeenCalledWith({
        propertyType: 'APARTMENT',  // Key, not slug
        // ...
      });
    });
  });
});
```

---

## Migration Checklist

- [ ] Backend implements unified catalog endpoint
- [ ] Generate API client with `npm run generate-api`
- [ ] Create `CatalogContext` with caching logic
- [ ] Add `CatalogProvider` to app layout
- [ ] Update `PropertyTypeSelector` to accept options prop
- [ ] Update `RoomTypeSelector` to accept options prop
- [ ] Update `BedTypeSelector` to accept options prop
- [ ] Remove hardcoded maps from `create.tsx`
- [ ] Remove hardcoded maps from `edit/[id].tsx`
- [ ] Test create listing flow
- [ ] Test edit listing flow
- [ ] Test offline mode with cached data
- [ ] Test multi-language support
- [ ] Update documentation

---

## Related Files

**To Update**:
- `app/listing/create.tsx` - Remove hardcoded maps
- `app/listing/edit/[id].tsx` - Remove hardcoded maps
- `components/molecules/property-type-selector.tsx` - Accept options prop
- `components/molecules/room-type-selector.tsx` - Accept options prop
- `components/molecules/bed-type-selector.tsx` - Accept options prop

**To Create**:
- `contexts/catalog-context.tsx` - Catalog provider with caching

**To Reference**:
- `contexts/amenity-context.tsx` - Similar pattern (if exists)
- `utils/icon-mapper.tsx` - Icon mapping system

---

## Summary

By migrating from hardcoded enum mappings to the unified catalog API, the mobile app will be:
- ✅ **More maintainable** - No sync issues with backend
- ✅ **Smaller** - Less code, smaller bundle
- ✅ **More flexible** - Dashboard controls all catalogs
- ✅ **Better UX** - Multi-language support
- ✅ **Future-proof** - Easy to extend

**Estimated effort**: 2-3 days after backend implementation is complete.
