# Booking HostId Type Migration

## Problem

Bookings were being created with `hostId` stored as a **string** instead of an **ObjectId**, causing the `/v1/app/bookings/host-bookings` endpoint to fail when filtering by host.

### Root Cause

In `booking-core.service.ts` line 96, the booking creation code was:
```typescript
hostId: property.hostId,  // ❌ Not converted to ObjectId
```

While `propertyId` and `guestId` were correctly converted:
```typescript
propertyId: new Types.ObjectId(dto.propertyId),  // ✅
guestId: new Types.ObjectId(guestId),            // ✅
```

## Fix Applied

### 1. Code Fix (booking-core.service.ts:96)
Changed to:
```typescript
hostId: new Types.ObjectId(property.hostId),  // ✅ Now converts to ObjectId
```

This ensures **all new bookings** will have `hostId` properly stored as ObjectId.

### 2. Data Migration (for existing bookings)

Created a migration script to fix existing bookings with string `hostId` values.

## Running the Migration

### Quick Start

```bash
cd apps/backend
npm run migrate:booking-hostid
```

### What the Migration Does

1. Scans all bookings in the database
2. Identifies bookings where `hostId` is stored as a string
3. Converts those string values to proper ObjectId type
4. Provides a detailed report of:
   - Total bookings processed
   - Number of bookings fixed
   - Number already correct (skipped)
   - Any errors encountered

### Before Running

**Recommended:** Back up your database first!

```bash
# MongoDB backup example
mongodump --uri="your-mongodb-uri" --out=./backup-before-migration
```

### Verification Queries

**Check for string hostId values (before migration):**
```javascript
db.bookings.find({ hostId: { $type: "string" } }).count()
```

**Verify all are ObjectId (after migration):**
```javascript
db.bookings.find({ hostId: { $type: "objectId" } }).count()
```

**Example of fixed booking:**
```javascript
// Before:
{
  "_id": ObjectId("68f35f5fffeb3adf483bf6a1"),
  "propertyId": ObjectId("68efedb9785d5efc2b471bfb"),
  "guestId": ObjectId("68f33baeffeb3adf483bf523"),
  "hostId": "68ee955048a7443a1da33387"  // ❌ String
}

// After:
{
  "_id": ObjectId("68f35f5fffeb3adf483bf6a1"),
  "propertyId": ObjectId("68efedb9785d5efc2b471bfb"),
  "guestId": ObjectId("68f33baeffeb3adf483bf523"),
  "hostId": ObjectId("68ee955048a7443a1da33387")  // ✅ ObjectId
}
```

## Files Modified/Created

### Modified Files:
1. `apps/backend/src/modules/bookings/services/booking-core.service.ts` (line 96)
2. `apps/backend/src/modules/bookings/bookings.module.ts` (added migration provider)
3. `apps/backend/package.json` (added migration script)

### Created Files:
1. `apps/backend/src/database/migrations/fix-booking-hostid-type.migration.ts`
2. `apps/backend/scripts/migrate-booking-hostid.ts`
3. `apps/backend/MIGRATION_BOOKING_HOSTID.md` (this file)

## Testing After Migration

1. **Run the migration:**
   ```bash
   npm run migrate:booking-hostid
   ```

2. **Verify host bookings endpoint works:**
   ```bash
   # Replace with your actual host ID and auth token
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        "http://localhost:3001/v1/app/bookings/host-bookings"
   ```

3. **Check the database directly:**
   ```javascript
   // Should return 0 after migration
   db.bookings.find({ hostId: { $type: "string" } }).count()
   ```

## Important Notes

- ✅ **Safe to run multiple times** - The migration skips bookings that already have ObjectId type
- ✅ **No downtime required** - Can be run while the application is running
- ⚠️ **One-time migration** - Only needs to be run once per environment
- ⚠️ **Backup recommended** - Always backup production data before migrations

## Rollback

If issues occur, restore from backup:
```bash
mongorestore --uri="your-mongodb-uri" --drop ./backup-before-migration
```

Note: After rollback, you'll also need to revert the code changes in `booking-core.service.ts`.
