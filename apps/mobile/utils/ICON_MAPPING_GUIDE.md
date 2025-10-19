# Icon Mapping System

## Overview

The mobile app uses a **dynamic icon mapping system** to render icons based on strings provided by the backend API. This ensures consistency between the dashboard and mobile app, as both use **Iconsax** icons.

## Architecture

```
Backend (Dashboard) → API → Mobile App
     ↓                ↓           ↓
 Icon Name       Icon Name   Icon Component
  (string)       (string)    (React Component)
```

### Why Dynamic Mapping?

- **Single Source of Truth**: Icons are controlled from the backend/dashboard
- **Consistency**: Both dashboard and mobile display the same icons
- **Flexibility**: New amenities/categories can be added without mobile app updates
- **Type Safety**: TypeScript ensures correct icon props

## Usage

### Basic Usage

```tsx
import { getIconComponent, renderIcon } from '@/utils/icon-mapper';

// Method 1: Get the component
const WifiIcon = getIconComponent('wifi');
<WifiIcon size={24} color="#000" variant="Outline" />

// Method 2: Render directly
{renderIcon('wifi', { size: 24, color: '#000', variant: 'Outline' })}
```

### In AmenitiesGrid Component

```tsx
import { Amenity } from '@/components/molecules/amenities-grid';

const amenities: Amenity[] = [
  {
    _id: '1',
    key: 'wifi',
    name: 'WiFi',
    icon: 'wifi', // ← This comes from the backend
  },
  {
    _id: '2',
    key: 'parking',
    name: 'Free Parking',
    icon: 'car',
  },
];

<AmenitiesGrid
  amenities={amenities}
  selectedAmenities={[]}
  onChange={(selected) => console.log(selected)}
/>
```

### With API Data

```tsx
import { useQuery } from '@tanstack/react-query';
import { amenityCategoriesPublicControllerFindAll } from '@/api/queries/public/amenity-categories-public';

const MyComponent = () => {
  const { data } = useQuery({
    queryKey: ['amenities'],
    queryFn: () => amenityCategoriesPublicControllerFindAll(),
  });

  return (
    <AmenitiesGrid
      amenities={data?.data || []}
      selectedAmenities={selectedIds}
      onChange={setSelectedIds}
    />
  );
};
```

## Adding New Icons

When the backend adds a new amenity with a new icon name, update the `ICON_MAP` in `icon-mapper.tsx`:

### Step 1: Find the Iconsax Icon Name

Visit the [Iconsax documentation](https://iconsax-react.pages.dev/) to find the icon you need.

### Step 2: Add to ICON_MAP

```tsx
// In utils/icon-mapper.tsx
import * as IconsaxIcons from "iconsax-react-native";

const ICON_MAP: Record<string, IconComponent> = {
  // ... existing mappings

  // Add your new icon
  gym: IconsaxIcons.Weight,
  sauna: IconsaxIcons.Health,
  fireplace: IconsaxIcons.Flame,
};
```

### Step 3: Test

```tsx
{renderIcon('gym', { size: 24, color: '#000', variant: 'Outline' })}
```

## Icon Naming Conventions

### Backend Icon Names

The backend should use **lowercase, snake_case** for icon names:

✅ Good:
- `wifi`
- `air_conditioning`
- `pets_allowed`

❌ Bad:
- `WiFi`
- `airConditioning`
- `Pets-Allowed`

### Mapping Strategy

1. **Exact Match**: Map backend name directly to Iconsax icon
   ```tsx
   wifi: IconsaxIcons.Wifi,
   ```

2. **Alias**: Create multiple mappings for the same icon
   ```tsx
   air_conditioning: IconsaxIcons.Wind,
   ac: IconsaxIcons.Wind,
   ```

3. **Semantic Mapping**: Map related concepts to appropriate icons
   ```tsx
   parking: IconsaxIcons.Car,
   pool: IconsaxIcons.Activity,
   ```

## Fallback Behavior

If an icon name is not found in the map:

```tsx
// Returns InfoCircle icon as fallback
const icon = getIconComponent('unknown_icon'); // → InfoCircle

// Check if icon exists
if (hasIcon('wifi')) {
  // Icon exists in map
}
```

## Utility Functions

### `getIconComponent(iconName)`

Returns the Iconsax icon component for the given name.

**Parameters:**
- `iconName` (string | null | undefined): Icon name from backend

**Returns:**
- Icon component or fallback (InfoCircle)

**Example:**
```tsx
const Icon = getIconComponent('wifi');
<Icon size={24} color="#000" variant="Bold" />
```

### `renderIcon(iconName, props)`

Renders an icon element directly.

**Parameters:**
- `iconName` (string | null | undefined): Icon name from backend
- `props` (object): Icon props (size, color, variant)

**Returns:**
- React element with the icon

**Example:**
```tsx
{renderIcon('wifi', { size: 24, color: '#000', variant: 'Outline' })}
```

### `hasIcon(iconName)`

Checks if an icon exists in the map.

**Parameters:**
- `iconName` (string | null | undefined): Icon name to check

**Returns:**
- `true` if icon exists, `false` otherwise

**Example:**
```tsx
if (hasIcon('wifi')) {
  console.log('WiFi icon is available');
}
```

### `getAvailableIcons()`

Returns all available icon names.

**Returns:**
- Array of strings

**Example:**
```tsx
const icons = getAvailableIcons();
// ['wifi', 'parking', 'pool', ...]
```

## Icon Variants

Iconsax icons support multiple visual variants:

- **Bold**: Solid, filled style
- **Broken**: Dashed, broken lines
- **Bulk**: Two-tone effect
- **Linear**: Simple line style
- **Outline**: Outlined style
- **TwoTone**: Dual color style

**Example:**
```tsx
<Icon size={24} color="#000" variant="Bold" />
<Icon size={24} color="#000" variant="Outline" />
```

## Best Practices

### 1. Always Use the Mapper

❌ **Don't** import icons directly:
```tsx
import { Wifi } from 'iconsax-react-native';
```

✅ **Do** use the mapper:
```tsx
import { getIconComponent } from '@/utils/icon-mapper';
const WifiIcon = getIconComponent('wifi');
```

### 2. Handle Missing Icons Gracefully

```tsx
const IconComponent = getIconComponent(amenity.icon);
// Always works, falls back to InfoCircle if not found
```

### 3. Keep ICON_MAP Organized

Group related icons together with comments:

```tsx
const ICON_MAP: Record<string, IconComponent> = {
  // Connectivity & Tech
  wifi: IconsaxIcons.Wifi,
  bluetooth: IconsaxIcons.Bluetooth,

  // Transportation & Parking
  car: IconsaxIcons.Car,
  parking: IconsaxIcons.Car,

  // ... etc
};
```

### 4. Document New Mappings

When adding new icons, add a comment explaining the mapping:

```tsx
// Gym equipment amenity
gym: IconsaxIcons.Weight,
```

## Troubleshooting

### Icon Not Showing

1. **Check the icon name from backend:**
   ```tsx
   console.log('Icon name:', amenity.icon);
   ```

2. **Verify icon exists in map:**
   ```tsx
   import { hasIcon } from '@/utils/icon-mapper';
   console.log('Has icon:', hasIcon(amenity.icon));
   ```

3. **Add to ICON_MAP if missing:**
   ```tsx
   my_new_icon: IconsaxIcons.SomeIcon,
   ```

### Wrong Icon Displayed

- The fallback InfoCircle means the icon name doesn't exist in ICON_MAP
- Add the correct mapping to ICON_MAP

### Icon Name Case Issues

- Icon names are automatically normalized to lowercase
- `WiFi`, `wifi`, and `WIFI` all map to the same icon
- Always use lowercase in ICON_MAP keys

## Integration with Backend

### Backend Structure

The backend amenity/category schema includes an `icon` field:

```ts
interface AmenityCategory {
  _id: string;
  key: string;
  name: Record<string, string>;
  icon?: string; // ← Icon name (e.g., 'wifi')
  sortOrder: number;
  isActive: boolean;
}
```

### API Response Example

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "key": "wifi",
      "name": { "en": "WiFi", "fr": "Wi-Fi" },
      "icon": "wifi",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

### Dashboard Controls

The dashboard admin panel controls:
- Which icons are assigned to amenities
- Icon names must match ICON_MAP keys
- New icons can be added through the admin interface

## Migration Guide

### Updating Existing Components

If you have components using hardcoded icon imports:

**Before:**
```tsx
import { Wifi, Car } from 'iconsax-react-native';

const amenities = [
  { label: 'WiFi', icon: Wifi },
  { label: 'Parking', icon: Car },
];
```

**After:**
```tsx
import { getIconComponent } from '@/utils/icon-mapper';

const amenities = [
  { label: 'WiFi', icon: 'wifi' },
  { label: 'Parking', icon: 'car' },
];

// In render:
const Icon = getIconComponent(amenity.icon);
<Icon size={24} />
```

## Support

For questions or issues:
1. Check this documentation first
2. Review the icon-mapper.tsx source code
3. Consult the team lead for architectural decisions
4. Update ICON_MAP when backend adds new amenities
