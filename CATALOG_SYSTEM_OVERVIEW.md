# Unified Catalog System - Project Overview

**Date**: 2025-10-18
**Status**: Proposal / Design Study
**Scope**: Backend + Mobile + Dashboard

---

## Quick Summary

**Problem**: Mobile app has hardcoded enum mappings (PropertyType, RoomType, BedType, etc.) that duplicate backend logic. Backend has fragmented catalog systems (EnumDisplays + AmenityCategories).

**Solution**: Consolidate into a single unified catalog system configurable from the dashboard, with mobile app fetching everything dynamically via API.

**Expected Outcome**:
- ✅ Single source of truth for all catalog data
- ✅ Dashboard controls everything (no code deployments needed)
- ✅ Mobile app has zero hardcoded mappings
- ✅ Multi-language support built-in
- ✅ Smaller mobile bundle size
- ✅ Easier maintenance

---

## Documents

### 1. Backend Architectural Study
**File**: [`apps/backend/UNIFIED_CATALOG_SYSTEM_STUDY.md`](apps/backend/UNIFIED_CATALOG_SYSTEM_STUDY.md)

**Contents**:
- Current state analysis (EnumDisplays vs AmenityCategories)
- Proposed unified schema (single `catalog_items` collection)
- Migration strategy (7-week phased rollout)
- API design (unified endpoint with versioning)
- Database design and indexing
- Risk assessment and recommendations

**Key Highlights**:
- Consolidate `enum_displays` and `amenity_categories` into `catalog_items`
- Implement `UnifiedCatalogService` replacing both old services
- Single endpoint: `GET /v1/catalogs?include=PropertyType,RoomType,Amenity`
- Version-based cache invalidation
- ~100+ catalog items to migrate

### 2. Mobile App Integration Guide
**File**: [`apps/mobile/CATALOG_API_INTEGRATION_GUIDE.md`](apps/mobile/CATALOG_API_INTEGRATION_GUIDE.md)

**Contents**:
- Current problems with hardcoded maps
- CatalogContext implementation with caching
- Step-by-step migration guide
- Component updates (PropertyTypeSelector, RoomTypeSelector, etc.)
- Caching strategy with AsyncStorage
- Error handling and offline support

**Key Highlights**:
- Remove ~100+ lines of hardcoded enum mappings
- Create `CatalogProvider` context with caching
- Update selector components to accept API data
- Implement version-based cache invalidation
- Multi-language label support

### 3. This Overview
**File**: [`CATALOG_SYSTEM_OVERVIEW.md`](CATALOG_SYSTEM_OVERVIEW.md) (you are here)

**Contents**:
- Project summary and links
- Implementation timeline
- Cross-team coordination
- Success metrics

---

## Current State

### Backend

**Fragmented Catalog Management**:
```
┌─────────────────────┐
│ EnumDisplaysModule  │  → Handles PropertyType, RoomType, BedType, etc.
└─────────────────────┘

┌─────────────────────┐
│ AmenitiesModule     │  → Handles WiFi, Parking, Pool, etc.
└─────────────────────┘

┌─────────────────────┐
│ CatalogsModule      │  → Orchestrates both above
└─────────────────────┘
```

**Collections**:
- `enum_displays` - 50+ enum display configs
- `amenity_categories` - 30-50 amenity items
- `catalog_versions` - Version tracking

### Mobile App

**Hardcoded Mappings** in:
- `app/listing/create.tsx` (lines 315-340)
- `app/listing/edit/[id].tsx` (lines 104-130, 315-340)

```typescript
// ❌ Currently hardcoded
const propertyTypeMap = {
  apartment: "Apartment",
  house: "House",
  // ... 30+ more
};

const roomTypeMap = {
  entire_place: "Entire place",
  // ... 6+ more
};

const bedTypeMap = {
  single: "Single bed",
  // ... 12+ more
};
```

**Problems**:
- Duplicated in create + edit screens
- No i18n support
- Requires app update for changes
- Prone to sync issues with backend

---

## Proposed State

### Backend

**Unified Catalog System**:
```
┌──────────────────────────┐
│ UnifiedCatalogModule     │
│                          │
│ Single Service           │
│ Single Schema            │
│ Single Collection        │
│ Single API Endpoint      │
└──────────────────────────┘
```

**Collection**:
```typescript
catalog_items: {
  _id: ObjectId,
  catalogType: string,          // 'PropertyType', 'Amenity', 'RoomType'
  key: string,                  // 'APARTMENT', 'WIFI', 'ENTIRE_HOME'
  slug: string,                 // 'apartment', 'wifi', 'entire-home'
  label: {                      // i18n labels
    en: string,
    fr: string,
    ar: string
  },
  icon?: string,                // Optional icon
  group?: string,               // Optional grouping
  sortOrder: number,
  isVisible: boolean,
  isActive: boolean,
  // ... metadata, audit fields
}
```

**API**:
```http
GET /v1/catalogs?include=PropertyType,RoomType,BedType,Amenity&locale=en

Response:
{
  "data": {
    "PropertyType": [...],
    "RoomType": [...],
    "BedType": [...],
    "Amenity": [...]
  }
}
```

### Mobile App

**Dynamic API-Driven Approach**:
```typescript
// ✅ Fetch from API
const { propertyTypes, roomTypes, bedTypes } = useCatalogs();

// ✅ Display with i18n
<PropertyTypeSelector options={propertyTypes} />

// ✅ Submit with correct keys
const submitData = {
  propertyType: getCatalogKey(propertyTypes, selectedSlug),
  // ...
};
```

**Benefits**:
- Zero hardcoded maps
- Multi-language support
- Auto-sync with backend
- Smaller bundle size

### Dashboard

**Unified Catalog Management UI**:
- Single interface to manage all catalog types
- CRUD operations for catalog items
- Icon picker
- i18n label editor
- Sorting and visibility controls
- Instant publish (no deployments)

---

## Implementation Timeline

### Backend (6-7 weeks)

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Preparation | Create schema, service, unit tests |
| 2 | Data Migration | Migrate enum_displays + amenity_categories |
| 3 | Module Replacement | Update controllers, deprecate old modules |
| 4 | Testing | E2E tests, performance benchmarks |
| 5 | API Documentation | Update Swagger, migration guides |
| 6-7 | Cleanup | Remove old modules, optimize queries |

**Owner**: Backend Team
**Estimated Effort**: 1-2 engineers

### Mobile App (2-3 days after backend ready)

| Day | Tasks |
|-----|-------|
| 1 | Generate API client, create CatalogContext |
| 2 | Update selector components, remove hardcoded maps |
| 3 | Testing, caching implementation, error handling |

**Owner**: Mobile Team
**Estimated Effort**: 1 engineer

**Dependency**: Backend unified catalog endpoint must be ready

### Dashboard (1 week after backend ready)

| Phase | Tasks |
|-------|-------|
| UI Design | Catalog management interface mockups |
| Implementation | CRUD screens, icon picker, i18n editor |
| Testing | Admin workflows, data validation |

**Owner**: Frontend/Dashboard Team
**Estimated Effort**: 1 engineer

**Dependency**: Backend unified catalog endpoint must be ready

---

## Cross-Team Coordination

### Backend → Mobile

**When Backend Completes**:
1. ✅ Notify mobile team that endpoint is ready
2. ✅ Share updated OpenAPI spec
3. ✅ Provide sample responses
4. ✅ Share migration checklist

**Mobile Team Actions**:
1. Generate API client (`npm run generate-api`)
2. Implement CatalogContext
3. Update UI components
4. Test thoroughly

### Backend → Dashboard

**When Backend Completes**:
1. ✅ Notify dashboard team
2. ✅ Share admin endpoints documentation
3. ✅ Provide sample catalog items
4. ✅ Coordinate icon system

**Dashboard Team Actions**:
1. Design catalog management UI
2. Implement CRUD operations
3. Add icon picker
4. Test admin workflows

### Mobile → Dashboard

**Icon Consistency**:
- Both use Iconsax icon library
- Mobile has icon mapper (`utils/icon-mapper.tsx`)
- Dashboard must use same icon names
- Share icon mapping documentation

---

## Success Metrics

### Technical Metrics

**Backend**:
- ✅ Single unified collection for all catalogs
- ✅ < 100ms response time for catalog API
- ✅ 100% test coverage for UnifiedCatalogService
- ✅ Zero data loss during migration

**Mobile**:
- ✅ Zero hardcoded enum mappings
- ✅ -5KB bundle size reduction
- ✅ < 500ms catalog load time (with caching)
- ✅ 100% offline support with cached data

**Dashboard**:
- ✅ Admins can add new catalog items without engineering
- ✅ < 5 minutes to publish new property type
- ✅ i18n support for all 3 languages

### Business Metrics

- ✅ **Faster time-to-market**: Add new property types without app updates
- ✅ **Better UX**: Multi-language catalog labels
- ✅ **Reduced engineering effort**: -50% time spent on catalog maintenance
- ✅ **Product autonomy**: Product team controls catalogs from dashboard

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration errors | High | Low | Backup, verification scripts, staged rollout |
| API breaking changes | High | Medium | Backward compatibility, deprecation warnings |
| Performance issues | Medium | Low | Caching, indexing, load testing |
| Icon mapping inconsistencies | Low | Medium | Shared icon documentation, fallback icons |

---

## Decision Log

### ✅ Approved Decisions

1. **Keep TypeScript enums in code** - Maintain type safety, use DB for display configs only
2. **Use single collection** - `catalog_items` instead of multiple collections
3. **Version-based caching** - Increment version on catalog changes for cache invalidation
4. **Soft deletes** - Never hard delete catalog items (data integrity)
5. **Fallback to defaults** - Auto-generate display configs for enums without DB records

### ⏳ Pending Decisions

1. **Translation strategy** - Auto-translate? Manual translation? Third-party service?
2. **Icon library expansion** - Stay with Iconsax or support custom icons?
3. **Advanced features** - Scheduling, A/B testing, market-specific catalogs?

### ❌ Rejected Alternatives

1. **Separate collections** - Too fragmented, rejected in favor of unified collection
2. **Client-side enum definitions** - Creates sync issues, rejected in favor of API-driven
3. **No caching** - Poor performance, rejected in favor of version-based caching

---

## Next Steps

### Immediate (This Week)

- [ ] Review this proposal with technical leads
- [ ] Get stakeholder approval (product, engineering, design)
- [ ] Set up project tracking (Jira/GitHub issues)
- [ ] Assign team owners

### Short-term (Next 2 Weeks)

- [ ] Backend: Start Phase 1 (schema + service implementation)
- [ ] Mobile: Prepare for integration (review current mappings)
- [ ] Dashboard: Design mockups for catalog management UI

### Mid-term (Weeks 3-6)

- [ ] Backend: Complete migration and API updates
- [ ] Mobile: Integrate with new catalog API
- [ ] Dashboard: Implement management interface

### Long-term (Week 7+)

- [ ] Full system testing
- [ ] Documentation updates
- [ ] Production deployment
- [ ] Monitor and optimize

---

## Questions & Answers

**Q: Why not just keep the current system?**
A: Current system is fragmented, requires app updates for changes, no i18n, and hard to maintain.

**Q: What happens if the API is down?**
A: Mobile app uses cached catalogs from AsyncStorage. Works offline.

**Q: Can we add new property types without code changes?**
A: Yes! After this migration, admins can add new catalog items from dashboard.

**Q: How do we handle translations?**
A: Database stores labels in multiple languages (en/fr/ar). Initially use English, expand later.

**Q: What about backward compatibility?**
A: Maintain old endpoints during migration period, then deprecate with warnings.

**Q: Is this too much work?**
A: One-time migration effort (6-7 weeks) for long-term maintainability benefits. High ROI.

---

## Resources

- [Backend Study - Full Details](apps/backend/UNIFIED_CATALOG_SYSTEM_STUDY.md)
- [Mobile Integration Guide](apps/mobile/CATALOG_API_INTEGRATION_GUIDE.md)
- [Icon Mapping Guide](apps/mobile/utils/ICON_MAPPING_GUIDE.md)
- [Backend Architectural Guidelines](apps/backend/ARCHITECTURAL_GUIDELINES.md)

---

## Contact

**Questions or feedback?**
- Backend team lead
- Mobile team lead
- Product owner

---

**Last Updated**: 2025-10-18
**Next Review**: After stakeholder approval
