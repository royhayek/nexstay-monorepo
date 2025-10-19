# Unified Catalog System - Architectural Study

**Date**: 2025-10-18
**Author**: Claude Code
**Status**: Proposal / Design Study
**Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Problems with Current Architecture](#problems-with-current-architecture)
4. [Proposed Solution](#proposed-solution)
5. [Technical Design](#technical-design)
6. [Iconsax Icon System Integration](#iconsax-icon-system-integration)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Plan](#implementation-plan)
9. [API Design](#api-design)
10. [Benefits and Trade-offs](#benefits-and-trade-offs)
11. [Risk Assessment](#risk-assessment)
12. [Recommendations](#recommendations)

---

## Executive Summary

### Current Situation

The application currently has **three separate systems** for managing enums and catalog data:

1. **EnumDisplays Module** - Handles system enums (PropertyType, RoomType, BedType, etc.)
2. **AmenityCategories Module** - Handles amenities (WiFi, Parking, Pool, etc.)
3. **Catalogs Module** - Orchestration layer combining both

Additionally, the mobile app has **hardcoded enum mappings** that duplicate backend logic.

### Proposed Solution

**Consolidate all catalog data into a single unified system** with:
- One schema (`CatalogItem`) to rule them all
- One endpoint to fetch multiple catalog types
- Dashboard-configurable everything
- Zero hardcoded mappings in mobile app

### Expected Benefits

- ✅ **Single source of truth** for all catalog data
- ✅ **Fully configurable from dashboard** without code deployment
- ✅ **Reduced mobile app bundle size** by removing hardcoded data
- ✅ **Better caching strategy** with versioning
- ✅ **Easier maintenance** and consistency
- ✅ **Internationalization** built-in from the start

---

## Current State Analysis

### Module Breakdown

#### 1. EnumDisplays Module

**Location**: `src/modules/enum-displays/`

**Purpose**: Manages display configurations for TypeScript enums defined in code

**Schema** (`enum_displays` collection):
```typescript
{
  _id: ObjectId,
  enumName: SystemEnumName,        // e.g., 'PropertyType', 'RoomType'
  key: SystemEnumValue,             // e.g., 'APARTMENT', 'PRIVATE_ROOM'
  label: {                          // i18n labels
    en: string,
    fr: string,
    ar: string
  },
  sortOrder: number,
  isVisible: boolean,
  createdBy: string,
  updatedBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- ✅ Fallback to auto-generated defaults for enums without DB records
- ✅ i18n support with multi-language labels
- ✅ Frontend-optimized queries
- ✅ Catalog versioning integration
- ✅ Type-safe with SystemEnumName and SystemEnumValue types

**Handles**:
- PropertyType (38 values: Apartment, House, Villa, etc.)
- RoomType (6 values: Entire home, Private room, etc.)
- BedType (12 values: Single, Queen, King, etc.)
- CancellationPolicy (6 values: Flexible, Moderate, Strict, etc.)
- BookingStatus, PaymentStatus, UserRole, UserStatus, etc.

#### 2. AmenityCategories Module

**Location**: `src/modules/amenity-categories/`

**Purpose**: Manages amenity catalog items (WiFi, Parking, Pool, etc.)

**Schema** (`amenity_categories` collection):
```typescript
{
  _id: ObjectId,
  key: string,                      // e.g., 'WIFI', 'PARKING'
  slug: string,                     // e.g., 'wifi', 'parking'
  name: {                           // i18n names
    en: string,
    fr: string,
    ar: string
  },
  description?: {                   // i18n descriptions
    en: string,
    fr: string,
    ar: string
  },
  icon?: string,                    // e.g., 'wifi', 'car', 'pool'
  group?: string,                   // e.g., 'connectivity', 'parking'
  sortOrder: number,
  isActive: boolean,
  isDeprecated: boolean,
  deletedAt?: Date,                 // Soft delete
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Features**:
- ✅ Extended from `BaseCatalog` abstract class
- ✅ Soft delete support
- ✅ Grouping functionality
- ✅ Icon mapping
- ✅ Slug-based URLs
- ✅ Search and filtering

**Current Usage**:
- Property amenities selection in creation/edit forms
- Property search filters
- Property details display

#### 3. Catalogs Module

**Location**: `src/modules/catalogs/`

**Purpose**: Orchestration layer that combines EnumDisplays and AmenityCategories

**API Endpoint**:
```
GET /v1/catalogs?include=propertyTypes,roomTypes,amenityCategories&locale=en
```

**Response Structure**:
```typescript
{
  success: true,
  message: "Catalogs retrieved successfully",
  data: {
    propertyTypes: [...],
    roomTypes: [...],
    amenityCategories: [...],
    currencies: [...],
    // etc.
  }
}
```

**Features**:
- ✅ Selective includes via query params
- ✅ Catalog versioning for cache invalidation
- ✅ Locale-aware responses
- ✅ Combines multiple services

### Mobile App Hardcoded Mappings

**Location**: `apps/mobile/app/listing/create.tsx`, `edit/[id].tsx`

**Current Problem**: Hardcoded enum value mappings in mobile app:

```typescript
// Mobile app → Backend format mapping
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

**Issues**:
- ❌ Duplication of backend enum definitions
- ❌ Hard to maintain consistency
- ❌ Requires app update to change labels
- ❌ No i18n support
- ❌ Increases bundle size
- ❌ Prone to sync issues

### System Enums Definition

**Location**: `src/common/enums/system.enums.ts`

```typescript
export const SYSTEM_ENUMS = {
  // User related
  UserRole,
  UserStatus,
  OtpNotificationMethod,

  // Property related
  PropertyType,
  RoomType,
  BedType,
  CancellationPolicy,

  // Booking related
  BookingStatus,

  // Payment related
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentProvider,
  PaymentMethodType,
  PaymentIntentStatus,
  InvoiceStatus,
  CurrencyCode,

  // Review related
  ReviewType,

  // Notification related
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  DevicePlatform,
  NotificationChannel,
} as const;
```

**Enums NOT in SYSTEM_ENUMS** (potential additions):
- PropertyStatus, ModerationStatus, PropertyCategory
- FlexibleDateRange, ViewType, ParkingType, CheckInMethod

---

## Problems with Current Architecture

### 1. **Fragmented Catalog Management**

**Problem**: Two separate systems (EnumDisplays vs AmenityCategories) with different schemas and behaviors.

**Impact**:
- Inconsistent API patterns
- Duplicate code in services
- Confusing for developers
- Harder to add new catalog types

### 2. **Hardcoded Mobile Mappings**

**Problem**: Mobile app maintains static enum mappings that duplicate backend logic.

**Impact**:
- Requires app updates for label changes
- No i18n support for mobile
- Sync issues between platforms
- Increased maintenance burden

### 3. **Limited Flexibility**

**Problem**: Adding new enum types requires code changes and deployment.

**Impact**:
- Can't add new property types from dashboard
- Product team dependency on engineering
- Slower time-to-market for new features

### 4. **Amenity Categories as Separate Module**

**Problem**: Amenities are structurally similar to enums but treated differently.

**Analysis**:
- Both have: key, label, i18n, sortOrder, visibility
- Both need: versioning, dashboard management
- Difference: Amenities have icons and groups (but so could other catalogs!)

**Conclusion**: Amenities should be unified with enum system.

### 5. **Incomplete Enum Coverage**

**Problem**: Some enums (PropertyStatus, PropertyCategory, ViewType, ParkingType, CheckInMethod) are not in SYSTEM_ENUMS and lack display configurations.

**Impact**:
- Inconsistent data availability
- Some features can't be dashboard-configured
- Mobile app must hardcode these too

---

## Proposed Solution

### Vision

**One unified catalog system where all enumerated/catalog data is:**
- ✅ Stored in a single, flexible schema
- ✅ Configurable from dashboard
- ✅ Fetched via a single unified endpoint
- ✅ Versioned for efficient caching
- ✅ i18n-enabled by default
- ✅ Zero hardcoded mappings in client apps

### Unified Catalog Item Schema

Replace both `enum_displays` and `amenity_categories` with a single `catalog_items` collection:

```typescript
{
  _id: ObjectId,

  // Core Identity
  catalogType: string,              // e.g., 'PropertyType', 'Amenity', 'RoomType'
  key: string,                      // e.g., 'WIFI', 'APARTMENT', 'FLEXIBLE'
  slug: string,                     // e.g., 'wifi', 'apartment', 'flexible'

  // Display Information (i18n)
  label: {
    en: string,
    fr: string,
    ar: string
  },
  description?: {
    en: string,
    fr: string,
    ar: string
  },

  // Visual & Organization
  icon?: string,                    // Icon identifier
  group?: string,                   // Optional grouping
  sortOrder: number,                // Display order

  // Visibility & Status
  isVisible: boolean,               // Show in UI
  isActive: boolean,                // Available for use
  isDeprecated: boolean,            // Legacy support

  // Metadata & Extensions
  metadata?: Record<string, any>,   // Flexible additional data

  // Soft Delete
  deletedAt?: Date,

  // Audit Trail
  createdBy?: string,
  updatedBy?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Catalog Types

Instead of separate modules, define catalog types as string constants:

```typescript
export enum CatalogType {
  // Property Related
  PROPERTY_TYPE = 'PropertyType',
  ROOM_TYPE = 'RoomType',
  BED_TYPE = 'BedType',
  CANCELLATION_POLICY = 'CancellationPolicy',
  PROPERTY_STATUS = 'PropertyStatus',
  PROPERTY_CATEGORY = 'PropertyCategory',
  VIEW_TYPE = 'ViewType',
  PARKING_TYPE = 'ParkingType',
  CHECK_IN_METHOD = 'CheckInMethod',

  // Amenities
  AMENITY = 'Amenity',

  // Booking Related
  BOOKING_STATUS = 'BookingStatus',

  // Payment Related
  PAYMENT_STATUS = 'PaymentStatus',
  PAYMENT_PROVIDER = 'PaymentProvider',
  PAYMENT_METHOD_TYPE = 'PaymentMethodType',
  CURRENCY = 'Currency',

  // User Related
  USER_ROLE = 'UserRole',
  USER_STATUS = 'UserStatus',

  // Notification Related
  NOTIFICATION_TYPE = 'NotificationType',

  // ... and more
}
```

### Unified Catalog Service

Single service replacing both EnumDisplaysService and AmenityCategoriesService:

```typescript
@Injectable()
export class UnifiedCatalogService {
  constructor(
    @InjectModel('CatalogItem') private catalogModel: Model<CatalogItemDocument>,
    @InjectModel('CatalogVersion') private versionModel: Model<CatalogVersionDocument>,
  ) {}

  // Find all items for a specific catalog type
  async findByCatalogType(catalogType: CatalogType): Promise<CatalogItemDocument[]>

  // Find all items for multiple catalog types (optimized)
  async findByMultipleCatalogTypes(types: CatalogType[]): Promise<Record<string, CatalogItemDocument[]>>

  // CRUD operations
  async create(createDto: CreateCatalogItemDto, userId?: string): Promise<CatalogItemDocument>
  async update(id: string, updateDto: UpdateCatalogItemDto, userId?: string): Promise<CatalogItemDocument>
  async softDelete(id: string, userId?: string): Promise<void>

  // Frontend-optimized queries
  async findByCatalogTypeForFrontend(catalogType: CatalogType): Promise<Partial<CatalogItemDocument>[]>
  async findAllForFrontend(types?: CatalogType[]): Promise<Record<string, Partial<CatalogItemDocument>[]>>

  // Versioning
  private async incrementCatalogVersion(userId?: string): Promise<void>
}
```

---

## Technical Design

### Database Schema

**Collection**: `catalog_items`

**Indexes**:
```typescript
// Compound unique index
{ catalogType: 1, key: 1 } - unique

// Individual indexes
{ catalogType: 1, sortOrder: 1 }
{ slug: 1 }
{ isActive: 1, isVisible: 1 }
{ deletedAt: 1 }  // For soft delete queries
{ group: 1 }
```

**Schema Definition**:
```typescript
@Schema({ timestamps: true, collection: 'catalog_items' })
export class CatalogItem extends Document {
  @Prop({ required: true, index: true, type: String })
  catalogType: string;

  @Prop({ required: true, uppercase: true, type: String })
  key: string;

  @Prop({ required: true, lowercase: true, type: String })
  slug: string;

  @Prop({ type: Object, required: true })
  label: Record<string, string>;

  @Prop({ type: Object })
  description?: Record<string, string>;

  @Prop()
  icon?: string;

  @Prop()
  group?: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeprecated: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  deletedAt?: Date;

  @Prop()
  createdBy?: string;

  @Prop()
  updatedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Create indexes
CatalogItemSchema.index({ catalogType: 1, key: 1 }, { unique: true });
CatalogItemSchema.index({ catalogType: 1, sortOrder: 1 });
CatalogItemSchema.index({ slug: 1 });
CatalogItemSchema.index({ isActive: 1, isVisible: 1 });
CatalogItemSchema.index({ deletedAt: 1 });
CatalogItemSchema.index({ group: 1 });
```

### Enum Source of Truth

**Strategy**: Keep TypeScript enums as code-level constants, use database for display configurations.

**Rationale**:
- ✅ Type safety in backend code
- ✅ Compile-time validation
- ✅ Database provides i18n labels and display configs
- ✅ Fallback to auto-generated defaults if DB record missing

**Enhanced System Enums**:
```typescript
export const CATALOG_TYPE_ENUMS = {
  PropertyType: PropertyType,
  RoomType: RoomType,
  BedType: BedType,
  CancellationPolicy: CancellationPolicy,
  PropertyStatus: PropertyStatus,
  PropertyCategory: PropertyCategory,
  ViewType: ViewType,
  ParkingType: ParkingType,
  CheckInMethod: CheckInMethod,
  BookingStatus: BookingStatus,
  PaymentStatus: PaymentStatus,
  PaymentProvider: PaymentProvider,
  PaymentMethodType: PaymentMethodType,
  Currency: CurrencyCode,
  UserRole: UserRole,
  UserStatus: UserStatus,
  NotificationType: NotificationType,
  // ... etc
} as const;

export type CatalogTypeName = keyof typeof CATALOG_TYPE_ENUMS;
export type CatalogTypeValue =
  (typeof CATALOG_TYPE_ENUMS)[CatalogTypeName][keyof (typeof CATALOG_TYPE_ENUMS)[CatalogTypeName]];
```

**Special Case - Amenities**:
Amenities don't have a TypeScript enum (they're user-extensible). They exist purely in the database.

```typescript
// No enum, just catalog type constant
export const AMENITY_CATALOG_TYPE = 'Amenity';
```

### Default Display Generation

For enum values without database records, auto-generate defaults:

```typescript
private generateDefaultCatalogItem(
  catalogType: string,
  enumKey: string,
  enumValue: string
): Partial<CatalogItemDocument> {
  return {
    _id: null, // Virtual item
    catalogType,
    key: enumKey,
    slug: enumValue.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label: {
      en: this.humanizeEnumValue(enumValue),
      fr: this.humanizeEnumValue(enumValue), // TODO: Translation
      ar: this.humanizeEnumValue(enumValue), // TODO: Translation
    },
    sortOrder: 0,
    isVisible: true,
    isActive: true,
    isDeprecated: false,
  };
}

private humanizeEnumValue(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
```

---

## Iconsax Icon System Integration

### Overview

Both the **dashboard** and **mobile app** use the **Iconsax icon library**, ensuring visual consistency across platforms. Icons are **selected from the dashboard** and **stored as string names** in the database, then **dynamically rendered** in the mobile app using an icon mapper.

### Icon Flow

```
Dashboard Admin → Selects Icon → Stores "wifi" → API → Mobile App → Renders Iconsax WiFi Icon
     ↓              ↓               ↓          ↓          ↓              ↓
  Icon Picker    Icon Name       Database   Returns     Icon Mapper   <Wifi icon />
  (Iconsax UI)   (string)        (icon field) icon name  (utils/)
```

### Dashboard: Icon Selection

**Dashboard Catalog Management UI** will include an **Iconsax icon picker**:

```typescript
// Dashboard: Icon picker component
<IconPicker
  value={formData.icon}
  onChange={(iconName) => setFormData({ ...formData, icon: iconName })}
  library="iconsax"
  variant="outline"
/>

// User selects "Wifi" icon → Saves "wifi" to database
// User selects "Car" icon → Saves "car" to database
// User selects "Weight" icon → Saves "weight" to database
```

**Features**:
- Visual icon picker with search
- Preview of selected icon
- Categorized by groups (communication, transportation, etc.)
- Support for all Iconsax icon variants (Bold, Outline, Bulk, etc.)
- Validation to ensure icon name exists in Iconsax library

**Icon Name Storage**:
```json
{
  "catalogType": "Amenity",
  "key": "WIFI",
  "icon": "wifi",  // ← Icon name stored as lowercase string
  "label": { "en": "WiFi", "fr": "Wi-Fi", "ar": "واي فاي" }
}
```

### Backend: Icon Field

The `icon` field in the `CatalogItem` schema stores the **icon name as a string**:

```typescript
@Schema({ timestamps: true, collection: 'catalog_items' })
export class CatalogItem extends Document {
  // ... other fields

  @Prop()
  icon?: string;  // Icon name (e.g., 'wifi', 'car', 'pool', 'weight')

  // ... other fields
}
```

**Validation** (optional but recommended):

```typescript
// DTOs with icon validation
export class CreateCatalogItemDto {
  // ... other fields

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, { message: 'Icon name must be lowercase alphanumeric with dashes/underscores' })
  icon?: string;
}
```

**Icon Name Conventions**:
- ✅ Lowercase letters
- ✅ Numbers allowed
- ✅ Hyphens and underscores allowed
- ✅ No spaces or special characters

**Examples**:
- ✅ `wifi`
- ✅ `car`
- ✅ `pool`
- ✅ `weight`
- ✅ `air_conditioning` or `air-conditioning`
- ❌ `WiFi` (use lowercase)
- ❌ `Air Conditioning` (no spaces)

### Mobile App: Icon Mapping

**Location**: `apps/mobile/utils/icon-mapper.tsx`

The mobile app uses a **dynamic icon mapper** that converts icon name strings to Iconsax React Native components:

```typescript
import * as IconsaxIcons from "iconsax-react-native";

// Type for Iconsax icon components
type IconComponent = React.ComponentType<{
  size: number;
  color: string;
  variant?: "Bold" | "Broken" | "Bulk" | "Linear" | "Outline" | "TwoTone";
}>;

// Icon mapping: string name → React component
const ICON_MAP: Record<string, IconComponent> = {
  // Connectivity
  wifi: IconsaxIcons.Wifi,
  bluetooth: IconsaxIcons.Bluetooth,

  // Transportation & Parking
  car: IconsaxIcons.Car,
  parking: IconsaxIcons.Car,

  // Amenities
  pool: IconsaxIcons.Activity,  // Or IconsaxIcons.Swimming
  gym: IconsaxIcons.Weight,
  kitchen: IconsaxIcons.Cup,

  // Climate Control
  air_conditioning: IconsaxIcons.Wind,
  heating: IconsaxIcons.Flame,

  // ... 50+ more icons
};

/**
 * Get Iconsax icon component by name
 * @param iconName - Icon name from backend (e.g., 'wifi', 'car')
 * @returns Iconsax icon component
 */
export const getIconComponent = (iconName?: string | null): IconComponent => {
  if (!iconName) return IconsaxIcons.InfoCircle;  // Fallback

  const normalizedName = iconName.toLowerCase().trim();
  return ICON_MAP[normalizedName] || IconsaxIcons.InfoCircle;  // Fallback if not found
};

/**
 * Render an icon directly
 * @param iconName - Icon name from backend
 * @param props - Icon props (size, color, variant)
 */
export const renderIcon = (
  iconName?: string | null,
  props: { size: number; color: string; variant?: "Bold" | "Outline" }
) => {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent {...props} />;
};
```

**Usage in Components**:

```typescript
import { getIconComponent } from '@/utils/icon-mapper';

// From API:
const amenity = {
  _id: "...",
  key: "WIFI",
  icon: "wifi",  // ← From database
  label: { en: "WiFi" }
};

// Render icon:
const IconComponent = getIconComponent(amenity.icon);
<IconComponent size={24} color="#000" variant="Outline" />
```

### Icon Consistency

**Shared Icon Library**:
- Dashboard: `iconsax` (React web version)
- Mobile: `iconsax-react-native`
- Both use the **same icon names**

**Naming Convention Alignment**:

| Backend Stores | Dashboard Shows | Mobile Renders |
|----------------|-----------------|----------------|
| `"wifi"` | Wifi icon | `<Wifi />` |
| `"car"` | Car icon | `<Car />` |
| `"pool"` | Activity/Swimming icon | `<Activity />` or `<Swimming />` |
| `"weight"` | Weight icon | `<Weight />` |

### Icon Mapping Guidelines

**For Mobile Developers**:

When the dashboard admin adds a new catalog item with an icon:

1. **Check if icon exists in ICON_MAP**
   ```typescript
   import { hasIcon } from '@/utils/icon-mapper';
   hasIcon('new_amenity');  // Returns true/false
   ```

2. **Add to ICON_MAP if missing**
   ```typescript
   // In utils/icon-mapper.tsx
   const ICON_MAP: Record<string, IconComponent> = {
     // ... existing icons
     new_amenity: IconsaxIcons.SomeIcon,  // Add mapping
   };
   ```

3. **Document the mapping**
   ```typescript
   // Category: Amenities - New
   new_amenity: IconsaxIcons.SomeIcon,  // Description of what this represents
   ```

**Fallback Icon**:
If an icon name doesn't exist in ICON_MAP, the system falls back to `IconsaxIcons.InfoCircle` to prevent crashes.

### Icon Picker Implementation (Dashboard)

**Dashboard Component**:

```tsx
// Dashboard: Catalog form with icon picker
import { IconPicker } from '@/components/icon-picker';

<Form>
  <TextField name="key" label="Key" />
  <TextField name="label.en" label="Label (EN)" />

  {/* Icon Picker */}
  <IconPicker
    label="Icon"
    value={formData.icon}
    onChange={(iconName) => {
      setFormData({ ...formData, icon: iconName });
    }}
    library="iconsax"
    searchable
    categorized
  />

  <Button type="submit">Save</Button>
</Form>
```

**IconPicker Features**:
- Grid/list view of all Iconsax icons
- Search by name
- Category filtering
- Preview selected icon
- Returns icon name as lowercase string

### Icon Validation

**Backend Validation**:

Optional middleware to validate icon names:

```typescript
// src/common/constants/iconsax-icons.ts
export const VALID_ICONSAX_ICONS = [
  'wifi',
  'car',
  'pool',
  'weight',
  'activity',
  // ... complete list of valid Iconsax icon names
];

// In CreateCatalogItemDto:
@IsOptional()
@IsString()
@IsIn(VALID_ICONSAX_ICONS, { message: 'Invalid icon name. Must be a valid Iconsax icon.' })
icon?: string;
```

**Benefits**:
- Prevents typos in icon names
- Ensures mobile app can render the icon
- Clear error messages for dashboard users

### Cross-Platform Icon Documentation

**Shared Documentation**:

Create a shared icon reference document:

**File**: `/docs/ICONSAX_ICON_REFERENCE.md`

```markdown
# Iconsax Icon Reference

## Available Icons

| Icon Name | Dashboard | Mobile | Category | Description |
|-----------|-----------|--------|----------|-------------|
| wifi | ✅ | ✅ | Connectivity | WiFi/Internet |
| car | ✅ | ✅ | Transportation | Parking/Car |
| pool | ✅ | ✅ | Amenities | Swimming pool |
| weight | ✅ | ✅ | Fitness | Gym equipment |
| ... | ... | ... | ... | ... |

## Adding New Icons

1. Choose icon from [Iconsax library](https://iconsax-react.pages.dev/)
2. Use lowercase icon name (e.g., `wifi`, not `WiFi`)
3. Add to mobile `ICON_MAP` in `apps/mobile/utils/icon-mapper.tsx`
4. Test in both dashboard and mobile app
5. Update this reference document
```

### Testing Icon Integration

**Dashboard Test**:
1. Create new catalog item
2. Select icon from picker
3. Save and verify icon name in database
4. API should return `{ "icon": "wifi" }`

**Mobile Test**:
1. Fetch catalog from API
2. Verify `getIconComponent('wifi')` returns correct component
3. Render icon and verify it displays correctly
4. Test fallback for unknown icon names

**End-to-End Test**:
1. Dashboard admin adds "Gym" amenity with "weight" icon
2. Mobile app fetches catalogs
3. "Gym" displays with weight icon
4. Both dashboard and mobile show same icon

---

## Migration Strategy

### Phase 1: Preparation (Week 1)

**1.1 Create Unified Schema**
- ✅ Create `CatalogItem` schema
- ✅ Create migration script for database indexes
- ✅ Update `CatalogVersion` schema if needed

**1.2 Create Unified Service**
- ✅ Implement `UnifiedCatalogService`
- ✅ Write comprehensive unit tests
- ✅ Performance benchmarks

**1.3 Extend System Enums**
- ✅ Add missing enums to `CATALOG_TYPE_ENUMS`
- ✅ Document each catalog type

### Phase 2: Data Migration (Week 2)

**2.1 Migrate EnumDisplays → CatalogItems**

```typescript
// Migration script: src/database/migrations/migrate-enum-displays-to-catalog-items.ts

export async function migrateEnumDisplays(db: Connection) {
  const enumDisplays = await db.collection('enum_displays').find({}).toArray();

  const catalogItems = enumDisplays.map(enumDisplay => ({
    catalogType: enumDisplay.enumName,
    key: enumDisplay.key,
    slug: enumDisplay.key.toLowerCase().replace(/_/g, '-'),
    label: enumDisplay.label,
    description: null,
    icon: null,
    group: null,
    sortOrder: enumDisplay.sortOrder || 0,
    isVisible: enumDisplay.isVisible ?? true,
    isActive: true,
    isDeprecated: false,
    metadata: {},
    deletedAt: null,
    createdBy: enumDisplay.createdBy,
    updatedBy: enumDisplay.updatedBy,
    createdAt: enumDisplay.createdAt,
    updatedAt: enumDisplay.updatedAt,
  }));

  await db.collection('catalog_items').insertMany(catalogItems);
  console.log(`Migrated ${catalogItems.length} enum displays to catalog items`);
}
```

**2.2 Migrate AmenityCategories → CatalogItems**

```typescript
// Migration script: src/database/migrations/migrate-amenity-categories-to-catalog-items.ts

export async function migrateAmenityCategories(db: Connection) {
  const amenityCategories = await db.collection('amenity_categories')
    .find({ deletedAt: null })
    .toArray();

  const catalogItems = amenityCategories.map(amenity => ({
    catalogType: 'Amenity',
    key: amenity.key,
    slug: amenity.slug,
    label: amenity.name,  // name → label
    description: amenity.description,
    icon: amenity.icon,
    group: amenity.group,
    sortOrder: amenity.sortOrder,
    isVisible: true,  // All active amenities are visible
    isActive: amenity.isActive,
    isDeprecated: amenity.isDeprecated,
    metadata: {},
    deletedAt: amenity.deletedAt,
    createdBy: amenity.createdBy,
    updatedBy: amenity.updatedBy,
    createdAt: amenity.createdAt,
    updatedAt: amenity.updatedAt,
  }));

  await db.collection('catalog_items').insertMany(catalogItems);
  console.log(`Migrated ${catalogItems.length} amenity categories to catalog items`);
}
```

**2.3 Verification**

```typescript
// Verify migration integrity
export async function verifyMigration(db: Connection) {
  const enumDisplayCount = await db.collection('enum_displays').countDocuments();
  const amenityCategoryCount = await db.collection('amenity_categories')
    .countDocuments({ deletedAt: null });
  const catalogItemCount = await db.collection('catalog_items').countDocuments();

  console.log(`Enum Displays: ${enumDisplayCount}`);
  console.log(`Amenity Categories: ${amenityCategoryCount}`);
  console.log(`Catalog Items: ${catalogItemCount}`);
  console.log(`Expected: ${enumDisplayCount + amenityCategoryCount}`);

  if (catalogItemCount !== enumDisplayCount + amenityCategoryCount) {
    throw new Error('Migration count mismatch!');
  }
}
```

### Phase 3: Module Replacement (Week 3)

**3.1 Update Controllers**

Replace:
- `EnumDisplaysPublicController`
- `EnumDisplaysAdminController`
- `AmenityCategoriesPublicController`
- `AmenityCategoriesAdminController`

With:
- `CatalogsPublicController` (unified public endpoint)
- `CatalogsAdminController` (unified admin CRUD)

**3.2 Update Services**

- ✅ Replace all usages of `EnumDisplaysService` with `UnifiedCatalogService`
- ✅ Replace all usages of `AmenityCategoriesService` with `UnifiedCatalogService`
- ✅ Update `CatalogsService` to use new unified service

**3.3 Update Modules**

- ✅ Deprecate `EnumDisplaysModule` (keep for backward compatibility initially)
- ✅ Deprecate `AmenityCategoriesModule` (keep for backward compatibility initially)
- ✅ Create `UnifiedCatalogModule`
- ✅ Update `CatalogsModule` dependencies

### Phase 4: Frontend Updates (Week 4)

**4.1 Update Mobile App**

Remove hardcoded mappings in:
- `apps/mobile/app/listing/create.tsx`
- `apps/mobile/app/listing/edit/[id].tsx`

Replace with API-driven approach:
```typescript
// Before: Hardcoded
const propertyTypeMap = {
  apartment: "Apartment",
  house: "House",
  // ...
};

// After: API-driven
const { data: catalogsData } = useCatalogsPublicControllerGetCatalogs({
  include: 'PropertyType,RoomType,BedType',
  locale: userLocale
});

const propertyTypes = catalogsData?.data?.PropertyType || [];
const roomTypes = catalogsData?.data?.RoomType || [];
const bedTypes = catalogsData?.data?.BedType || [];
```

**4.2 Update Dashboard**

- ✅ Create unified catalog management UI
- ✅ Allow admins to manage all catalog types
- ✅ Icon picker for catalog items
- ✅ i18n label editing
- ✅ Sorting and visibility controls

### Phase 5: Cleanup & Optimization (Week 5)

**5.1 Remove Old Modules**

Once fully migrated and tested:
- ❌ Delete `EnumDisplaysModule`
- ❌ Delete `AmenityCategoriesModule`
- ❌ Delete old schemas and services

**5.2 Optimize Queries**

- ✅ Add database indexes
- ✅ Implement Redis caching with versioning
- ✅ Optimize frontend queries (select only needed fields)

**5.3 Documentation**

- ✅ Update API documentation
- ✅ Update architecture guides
- ✅ Create catalog management guide for admins

---

## API Design

### Public Endpoint

**Get Multiple Catalogs**

```http
GET /v1/catalogs?include=PropertyType,RoomType,Amenity&locale=en
```

**Query Parameters**:
- `include` (optional): Comma-separated list of catalog types. If omitted, returns all.
- `locale` (optional): Language code (en, fr, ar). Defaults to 'en'.

**Response**:
```json
{
  "success": true,
  "message": "Catalogs retrieved successfully",
  "data": {
    "PropertyType": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4e1a1",
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
        "_id": "60d5ec49f1b2c8b1f8e4e1a2",
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
    ],
    "RoomType": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4e2a1",
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
    ],
    "Amenity": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4e3a1",
        "key": "WIFI",
        "slug": "wifi",
        "label": {
          "en": "WiFi",
          "fr": "Wi-Fi",
          "ar": "واي فاي"
        },
        "icon": "wifi",
        "group": "connectivity",
        "sortOrder": 1,
        "isVisible": true
      },
      {
        "_id": "60d5ec49f1b2c8b1f8e4e3a2",
        "key": "PARKING",
        "slug": "parking",
        "label": {
          "en": "Free parking",
          "fr": "Parking gratuit",
          "ar": "موقف سيارات مجاني"
        },
        "icon": "car",
        "group": "parking",
        "sortOrder": 2,
        "isVisible": true
      }
    ]
  }
}
```

**Caching Strategy**:
```typescript
// Client-side caching with versioning
const catalogVersion = await getCatalogVersion(); // { version: 42 }
const cachedVersion = localStorage.getItem('catalogVersion');

if (cachedVersion !== catalogVersion.version.toString()) {
  // Fetch fresh catalogs
  const catalogs = await fetchCatalogs();
  localStorage.setItem('catalogs', JSON.stringify(catalogs));
  localStorage.setItem('catalogVersion', catalogVersion.version.toString());
} else {
  // Use cached data
  const catalogs = JSON.parse(localStorage.getItem('catalogs'));
}
```

**Get Catalog Version**

```http
GET /v1/catalogs/version
```

**Response**:
```json
{
  "success": true,
  "message": "Version retrieved successfully",
  "data": {
    "version": 42,
    "lastModified": "2025-10-18T10:30:00.000Z"
  }
}
```

### Admin Endpoints

**List Catalog Items**

```http
GET /v1/admin/catalogs/:catalogType
```

**Query Parameters**:
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 50
- `search` (optional): Search in labels and keys
- `group` (optional): Filter by group
- `isActive` (optional): Filter by active status

**Response**:
```json
{
  "success": true,
  "message": "Catalog items retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120,
      "totalPages": 3
    }
  }
}
```

**Create Catalog Item**

```http
POST /v1/admin/catalogs
```

**Request Body**:
```json
{
  "catalogType": "Amenity",
  "key": "GYM",
  "label": {
    "en": "Gym",
    "fr": "Salle de sport",
    "ar": "صالة رياضية"
  },
  "description": {
    "en": "On-site fitness center",
    "fr": "Centre de fitness sur place",
    "ar": "مركز لياقة بدنية في الموقع"
  },
  "icon": "weight",
  "group": "fitness",
  "sortOrder": 50,
  "isVisible": true,
  "isActive": true
}
```

**Update Catalog Item**

```http
PATCH /v1/admin/catalogs/:id
```

**Request Body**: Same as create, but all fields optional

**Delete Catalog Item (Soft)**

```http
DELETE /v1/admin/catalogs/:id
```

**Restore Catalog Item**

```http
POST /v1/admin/catalogs/:id/restore
```

---

## Benefits and Trade-offs

### Benefits

#### 1. **Unified Architecture**
- ✅ Single source of truth for all catalog data
- ✅ Consistent API patterns
- ✅ Easier to understand and maintain
- ✅ Less code duplication

#### 2. **Dashboard Control**
- ✅ Product team can add/modify catalogs without engineering
- ✅ Instant updates without app deployments
- ✅ A/B testing capabilities
- ✅ Market-specific customizations

#### 3. **Mobile App Benefits**
- ✅ Smaller bundle size (remove hardcoded maps)
- ✅ Dynamic content updates
- ✅ Multi-language support
- ✅ Consistent with dashboard

#### 4. **Developer Experience**
- ✅ Single API to learn
- ✅ Type-safe with TypeScript
- ✅ Better documentation
- ✅ Easier testing

#### 5. **Performance**
- ✅ Efficient caching with versioning
- ✅ Batch fetching reduces network calls
- ✅ Optimized database queries with indexes
- ✅ Frontend-optimized responses (select fields)

#### 6. **Scalability**
- ✅ Easy to add new catalog types
- ✅ Extensible metadata field
- ✅ Flexible grouping system
- ✅ Future-proof architecture

### Trade-offs

#### 1. **Migration Effort**
- ⚠️ Data migration required
- ⚠️ Breaking API changes (with deprecation period)
- ⚠️ Frontend updates needed
- ⚠️ Testing overhead

**Mitigation**: Phased rollout with backward compatibility

#### 2. **Query Complexity**
- ⚠️ Single collection for all catalog types
- ⚠️ More complex indexes
- ⚠️ Potential for slower queries if not optimized

**Mitigation**: Proper indexing, caching, and query optimization

#### 3. **Type Safety**
- ⚠️ Loss of some compile-time enum validation
- ⚠️ String-based catalog types instead of enums

**Mitigation**: Keep TypeScript enums as source of truth, use DB for display configs

#### 4. **Dashboard Complexity**
- ⚠️ More complex UI to manage all catalog types
- ⚠️ Need validation for each catalog type
- ⚠️ Icon management for different types

**Mitigation**: Good UX design with catalog type selection and contextual validation

---

## Risk Assessment

### High Risk

**None identified** - This is a refactoring of existing functionality with a clear migration path.

### Medium Risk

#### 1. **Data Migration Errors**
- **Risk**: Data loss or corruption during migration
- **Probability**: Low
- **Impact**: High
- **Mitigation**:
  - ✅ Comprehensive migration scripts with rollback
  - ✅ Test on staging environment first
  - ✅ Database backups before migration
  - ✅ Verification scripts post-migration
  - ✅ Keep old collections for 1-2 months as backup

#### 2. **API Breaking Changes**
- **Risk**: Mobile app and dashboard break with new API
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - ✅ Maintain backward compatibility initially
  - ✅ Deprecation warnings in old endpoints
  - ✅ Coordinate frontend updates
  - ✅ Feature flags for gradual rollout

### Low Risk

#### 1. **Performance Degradation**
- **Risk**: Slower queries with unified collection
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - ✅ Proper database indexes
  - ✅ Redis caching layer
  - ✅ Performance monitoring
  - ✅ Query optimization

#### 2. **Icon Mapping Issues**
- **Risk**: Icons don't display correctly in mobile app
- **Probability**: Low
- **Impact**: Low
- **Mitigation**:
  - ✅ Comprehensive icon mapping documentation
  - ✅ Fallback icon for missing mappings
  - ✅ Dashboard icon preview

---

## Recommendations

### Immediate Actions (Must Do)

1. **✅ Approve Architectural Design**
   - Review this study with technical leads
   - Get stakeholder buy-in (product, engineering, design)
   - Finalize migration timeline

2. **✅ Create Detailed Implementation Plan**
   - Break down into smaller tasks
   - Assign owners
   - Set deadlines

3. **✅ Set Up Staging Environment**
   - Clone production data to staging
   - Test migration scripts
   - Benchmark performance

### Implementation Priorities

**Priority 1: Core Infrastructure (Weeks 1-2)**
- Create unified schema
- Implement `UnifiedCatalogService`
- Write migration scripts
- Test thoroughly

**Priority 2: Data Migration (Week 3)**
- Run migration on staging
- Verify data integrity
- Performance testing

**Priority 3: API Updates (Week 4)**
- Update controllers and modules
- Deprecate old endpoints
- Update API documentation

**Priority 4: Frontend Updates (Week 5-6)**
- Mobile app API integration
- Dashboard catalog management UI
- Remove hardcoded mappings

**Priority 5: Cleanup (Week 7)**
- Remove deprecated modules
- Optimize queries
- Final documentation

### Long-term Enhancements

1. **Advanced Caching**
   - Implement Redis caching with TTL
   - Edge caching with CDN
   - Selective cache invalidation

2. **Localization Improvements**
   - Auto-translation for new catalog items
   - Locale-specific sorting rules
   - RTL support for Arabic

3. **Analytics**
   - Track catalog item usage
   - Popular amenities/property types
   - Dashboard for product insights

4. **Versioning**
   - Keep historical versions of catalogs
   - Rollback capabilities
   - Audit logs for all changes

---

## Conclusion

The proposed **Unified Catalog System** represents a significant architectural improvement that will:

- ✅ Simplify backend architecture
- ✅ Empower product team with dashboard controls
- ✅ Improve mobile app performance and maintainability
- ✅ Enable faster feature development
- ✅ Provide better user experience with i18n

**Estimated Effort**: 6-7 weeks with 1-2 engineers

**ROI**: High - One-time migration cost for long-term maintainability benefits

**Recommendation**: **Proceed with implementation** using the phased approach outlined above.

---

## Appendix

### A. Code Enum Definitions to Migrate

```typescript
// All property-related enums
PropertyType (38 values)
RoomType (6 values)
BedType (12 values)
CancellationPolicy (6 values)
PropertyStatus (4 values)
PropertyCategory (20 values)
ViewType (10 values)
ParkingType (8 values)
CheckInMethod (8 values)

// Booking-related
BookingStatus (5 values)

// Payment-related
PaymentStatus (4 values)
PaymentProvider (TBD)
PaymentMethodType (TBD)
Currency (TBD)

// User-related
UserRole (TBD)
UserStatus (TBD)

// Notification-related
NotificationType (TBD)

// Total: ~100+ catalog items from enums alone
```

### B. Amenity Categories to Migrate

Current amenity categories in production: ~30-50 items

Examples:
- WiFi, Parking, Pool, Gym, Kitchen
- Air Conditioning, Heating, Fireplace
- TV, Workspace, Washer, Dryer
- Pets Allowed, Smoking Allowed
- Wheelchair Accessible, Elevator
- etc.

### C. Database Migration Script Template

```bash
#!/bin/bash
# migrate-to-unified-catalog.sh

echo "Starting Unified Catalog Migration..."

# Backup existing collections
mongodump --db=nexstay --collection=enum_displays --out=./backup
mongodump --db=nexstay --collection=amenity_categories --out=./backup

# Run migration scripts
npm run migrate:enum-displays-to-catalog-items
npm run migrate:amenity-categories-to-catalog-items

# Verify migration
npm run verify:catalog-migration

# Create indexes
npm run create:catalog-indexes

echo "Migration complete!"
```

---

**End of Study**
