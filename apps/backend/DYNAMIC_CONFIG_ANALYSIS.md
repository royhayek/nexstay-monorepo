# Dynamic Configuration Analysis

**Date**: 2025-10-11
**Purpose**: Identify hardcoded configurations that should be moved to dynamic configuration for easier management and flexibility.

## Summary

This document analyzes the codebase to identify static and environment-based configurations that could benefit from being made dynamic (database-driven) through the dynamic config seeder.

**Benefits of Dynamic Configuration:**
- ✅ Change configuration without code deployment
- ✅ Environment-specific tuning without code changes
- ✅ Real-time configuration updates
- ✅ Centralized configuration management
- ✅ Audit trail of configuration changes
- ✅ A/B testing and gradual rollout

---

## Configurations to Add

### 1. **Rate Limiting / IP Throttling** ⭐ HIGH PRIORITY

**Location**: `src/common/decorators/ip-throttle.decorator.ts:54-84`

**Current Hardcoded Values**:
```typescript
export const IpThrottlePresets = {
  AUTH_LOGIN: { limit: 5, ttlSeconds: 900 },        // 5 attempts per 15 minutes
  OTP_REQUEST: { limit: 3, ttlSeconds: 300 },       // 3 requests per 5 minutes
  PASSWORD_RESET: { limit: 3, ttlSeconds: 900 },   // 3 attempts per 15 minutes
  SIGNUP: { limit: 3, ttlSeconds: 3600 },          // 3 attempts per hour
  TOKEN_REFRESH: { limit: 10, ttlSeconds: 60 },    // 10 refreshes per minute
}
```

**Recommended Dynamic Configs**:
```javascript
// Category: SECURITY
{
  key: 'IP_THROTTLE_AUTH_LOGIN_LIMIT',
  value: '5',
  title: 'Login IP Rate Limit - Max Attempts',
  description: 'Maximum login attempts per IP address in time window',
  category: ConfigCategory.SECURITY,
  sortOrder: 20,
},
{
  key: 'IP_THROTTLE_AUTH_LOGIN_WINDOW_SECONDS',
  value: '900',
  title: 'Login IP Rate Limit - Time Window',
  description: 'Time window in seconds for login rate limiting (15 minutes)',
  category: ConfigCategory.SECURITY,
  sortOrder: 21,
},
{
  key: 'IP_THROTTLE_OTP_REQUEST_LIMIT',
  value: '3',
  title: 'OTP Request IP Rate Limit - Max Attempts',
  description: 'Maximum OTP requests per IP address in time window',
  category: ConfigCategory.SECURITY,
  sortOrder: 22,
},
{
  key: 'IP_THROTTLE_OTP_REQUEST_WINDOW_SECONDS',
  value: '300',
  title: 'OTP Request IP Rate Limit - Time Window',
  description: 'Time window in seconds for OTP rate limiting (5 minutes)',
  category: ConfigCategory.SECURITY,
  sortOrder: 23,
},
{
  key: 'IP_THROTTLE_PASSWORD_RESET_LIMIT',
  value: '3',
  title: 'Password Reset IP Rate Limit - Max Attempts',
  description: 'Maximum password reset attempts per IP in time window',
  category: ConfigCategory.SECURITY,
  sortOrder: 24,
},
{
  key: 'IP_THROTTLE_PASSWORD_RESET_WINDOW_SECONDS',
  value: '900',
  title: 'Password Reset IP Rate Limit - Time Window',
  description: 'Time window in seconds for password reset rate limiting (15 minutes)',
  category: ConfigCategory.SECURITY,
  sortOrder: 25,
},
{
  key: 'IP_THROTTLE_SIGNUP_LIMIT',
  value: '3',
  title: 'Signup IP Rate Limit - Max Attempts',
  description: 'Maximum signup attempts per IP address in time window',
  category: ConfigCategory.SECURITY,
  sortOrder: 26,
},
{
  key: 'IP_THROTTLE_SIGNUP_WINDOW_SECONDS',
  value: '3600',
  title: 'Signup IP Rate Limit - Time Window',
  description: 'Time window in seconds for signup rate limiting (1 hour)',
  category: ConfigCategory.SECURITY,
  sortOrder: 27,
},
{
  key: 'IP_THROTTLE_TOKEN_REFRESH_LIMIT',
  value: '10',
  title: 'Token Refresh IP Rate Limit - Max Attempts',
  description: 'Maximum token refresh requests per IP in time window',
  category: ConfigCategory.SECURITY,
  sortOrder: 28,
},
{
  key: 'IP_THROTTLE_TOKEN_REFRESH_WINDOW_SECONDS',
  value: '60',
  title: 'Token Refresh IP Rate Limit - Time Window',
  description: 'Time window in seconds for token refresh rate limiting (1 minute)',
  category: ConfigCategory.SECURITY,
  sortOrder: 29,
},
```

**Implementation Impact**: Medium - Requires updating `IpThrottlePresets` to read from dynamic config

---

### 2. **Audit Log Retention** ⭐ HIGH PRIORITY

**Location**: `src/database/schemas/audit-log.schema.ts:136-138`

**Current Hardcoded Value**:
```typescript
// TTL index to automatically delete old audit logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
```

**Recommended Dynamic Configs**:
```javascript
// Category: SECURITY
{
  key: 'AUDIT_LOG_RETENTION_DAYS',
  value: '90',
  title: 'Audit Log Retention Period',
  description: 'Days to retain audit logs before automatic deletion (GDPR compliance)',
  category: ConfigCategory.SECURITY,
  sortOrder: 30,
},
{
  key: 'AUDIT_LOG_SUSPICIOUS_ACTIVITY_THRESHOLD',
  value: '5',
  title: 'Suspicious Activity Failure Threshold',
  description: 'Number of failed attempts from same IP to trigger suspicious activity alert',
  category: ConfigCategory.SECURITY,
  sortOrder: 31,
},
{
  key: 'AUDIT_LOG_SUSPICIOUS_ACTIVITY_WINDOW_MINUTES',
  value: '15',
  title: 'Suspicious Activity Detection Window',
  description: 'Time window in minutes for detecting suspicious activity patterns',
  category: ConfigCategory.SECURITY,
  sortOrder: 32,
},
```

**Implementation Impact**: High - Requires MongoDB TTL index to be recreated when value changes (admin operation)

**Note**: MongoDB TTL indexes are created at schema definition time. To make this truly dynamic, you would need:
1. Admin endpoint to update TTL index
2. Background job to apply new TTL index
3. Or accept that it requires service restart

---

### 3. **Identity Verification Limits** ⭐ MEDIUM PRIORITY

**Location**: `src/modules/identity-verification/identity-verification.service.ts:34-35`

**Current Hardcoded Values**:
```typescript
private readonly MAX_VERIFICATION_ATTEMPTS = 3;
private readonly VERIFICATION_EXPIRY_DAYS = 365; // 1 year
```

**Recommended Dynamic Configs**:
```javascript
// Category: SECURITY
{
  key: 'IDENTITY_VERIFICATION_MAX_ATTEMPTS',
  value: '3',
  title: 'Identity Verification Max Attempts',
  description: 'Maximum number of identity verification submissions allowed per user',
  category: ConfigCategory.SECURITY,
  sortOrder: 33,
},
{
  key: 'IDENTITY_VERIFICATION_EXPIRY_DAYS',
  value: '365',
  title: 'Identity Verification Validity Period',
  description: 'Days until approved identity verification expires and requires renewal',
  category: ConfigCategory.SECURITY,
  sortOrder: 34,
},
{
  key: 'IDENTITY_VERIFICATION_AUTO_REVIEW_ENABLED',
  value: 'false',
  title: 'Enable Auto Identity Verification Review',
  description: 'Enable automatic verification review using AI/ML (if available)',
  category: ConfigCategory.SECURITY,
  sortOrder: 35,
},
```

**Implementation Impact**: Low - Simple service property injection

---

### 4. **Device Trust Settings** ⭐ MEDIUM PRIORITY

**Location**: `src/database/schemas/trusted-device.schema.ts`

**Current Status**: Schema exists but no configurable limits

**Recommended Dynamic Configs**:
```javascript
// Category: SECURITY
{
  key: 'TRUSTED_DEVICE_MAX_PER_USER',
  value: '10',
  title: 'Maximum Trusted Devices Per User',
  description: 'Maximum number of devices a user can trust simultaneously',
  category: ConfigCategory.SECURITY,
  sortOrder: 36,
},
{
  key: 'TRUSTED_DEVICE_EXPIRY_DAYS',
  value: '90',
  title: 'Trusted Device Expiration',
  description: 'Days of inactivity before a trusted device is automatically removed',
  category: ConfigCategory.SECURITY,
  sortOrder: 37,
},
{
  key: 'TRUSTED_DEVICE_VERIFICATION_REQUIRED',
  value: 'true',
  title: 'Require Device Verification',
  description: 'Require SMS/email verification for new device trust',
  category: ConfigCategory.SECURITY,
  sortOrder: 38,
},
{
  key: 'TRUSTED_DEVICE_CLEANUP_ENABLED',
  value: 'true',
  title: 'Enable Trusted Device Auto-Cleanup',
  description: 'Automatically cleanup inactive trusted devices',
  category: ConfigCategory.SECURITY,
  sortOrder: 39,
},
```

**Implementation Impact**: Medium - Requires new service logic for device limits and cleanup

---

### 5. **Booking Limits & Business Rules** ⭐ LOW PRIORITY (Already partially covered)

**Location**: `src/modules/bookings/constants/booking.constants.ts`

**Current Hardcoded Values**:
```typescript
export const BOOKING_VALIDATION_CONSTANTS = {
  MIN_ADULTS: 1,
  MAX_ADULTS: 16,
  MIN_CHILDREN: 0,
  MAX_CHILDREN: 10,
  MIN_INFANTS: 0,
  MAX_INFANTS: 5,
  MIN_TOTAL_GUESTS: 1,
  MAX_TOTAL_GUESTS: 20,
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 365,
  MIN_BASE_AMOUNT: 0,
  MAX_BASE_AMOUNT: 100000,
};

export const BOOKING_BUSINESS_CONSTANTS = {
  MAX_ADVANCE_BOOKING_DAYS: 365,
  MIN_ADVANCE_BOOKING_HOURS: 2,
  CANCELLATION_GRACE_PERIOD_HOURS: 24,
  AUTO_CANCEL_UNPAID_HOURS: 24,
  DEFAULT_CHECKIN_TIME: '15:00',
  DEFAULT_CHECKOUT_TIME: '11:00',
};

export const BOOKING_PAGINATION_CONSTANTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
};
```

**Analysis**: Most of these are already in dynamic config or are validation constants that should remain hardcoded. Additional candidates:

```javascript
// Category: BOOKING
{
  key: 'BOOKING_MAX_ADULTS',
  value: '16',
  title: 'Maximum Adults Per Booking',
  description: 'Maximum number of adults allowed in a single booking',
  category: ConfigCategory.BOOKING,
  sortOrder: 20,
},
{
  key: 'BOOKING_MAX_CHILDREN',
  value: '10',
  title: 'Maximum Children Per Booking',
  description: 'Maximum number of children allowed in a single booking',
  category: ConfigCategory.BOOKING,
  sortOrder: 21,
},
{
  key: 'BOOKING_MAX_INFANTS',
  value: '5',
  title: 'Maximum Infants Per Booking',
  description: 'Maximum number of infants allowed in a single booking',
  category: ConfigCategory.BOOKING,
  sortOrder: 22,
},
{
  key: 'BOOKING_MAX_TOTAL_GUESTS',
  value: '20',
  title: 'Maximum Total Guests Per Booking',
  description: 'Maximum total number of guests (adults + children + infants) per booking',
  category: ConfigCategory.BOOKING,
  sortOrder: 23,
},
{
  key: 'BOOKING_MAX_ADVANCE_DAYS',
  value: '365',
  title: 'Maximum Advance Booking Days',
  description: 'Maximum number of days in advance a booking can be made',
  category: ConfigCategory.BOOKING,
  sortOrder: 24,
},
{
  key: 'BOOKING_MIN_ADVANCE_HOURS',
  value: '2',
  title: 'Minimum Advance Booking Hours',
  description: 'Minimum hours before check-in that a booking can be made',
  category: ConfigCategory.BOOKING,
  sortOrder: 25,
},
{
  key: 'BOOKING_AUTO_CANCEL_UNPAID_HOURS',
  value: '24',
  title: 'Auto-Cancel Unpaid Booking Timeout',
  description: 'Hours after which unpaid bookings are automatically cancelled',
  category: ConfigCategory.BOOKING,
  sortOrder: 26,
},
{
  key: 'BOOKING_DEFAULT_CHECKIN_TIME',
  value: '15:00',
  title: 'Default Check-In Time',
  description: 'Default check-in time for properties (24-hour format)',
  category: ConfigCategory.BOOKING,
  sortOrder: 27,
},
{
  key: 'BOOKING_DEFAULT_CHECKOUT_TIME',
  value: '11:00',
  title: 'Default Check-Out Time',
  description: 'Default check-out time for properties (24-hour format)',
  category: ConfigCategory.BOOKING,
  sortOrder: 28,
},
```

**Implementation Impact**: Low - These are validation rules used in DTOs and services

---

### 6. **Pagination Defaults** ⭐ LOW PRIORITY

**Location**: Multiple modules use hardcoded pagination

**Recommended Dynamic Configs**:
```javascript
// Category: GENERAL
{
  key: 'API_DEFAULT_PAGE_LIMIT',
  value: '20',
  title: 'API Default Page Limit',
  description: 'Default number of items per page for API responses',
  category: ConfigCategory.GENERAL,
  sortOrder: 10,
},
{
  key: 'API_MAX_PAGE_LIMIT',
  value: '100',
  title: 'API Maximum Page Limit',
  description: 'Maximum number of items per page allowed in API requests',
  category: ConfigCategory.GENERAL,
  sortOrder: 11,
},
```

**Implementation Impact**: Low - Already mostly covered by `SEARCH_RESULTS_PER_PAGE`

---

## Implementation Priority

### Phase 1: Critical Security Configurations ⭐⭐⭐
1. **IP Throttling Limits** (10 configs)
   - Immediate security impact
   - Allows rapid response to attack patterns
   - Easy to implement

2. **Audit Log Retention** (3 configs)
   - GDPR compliance
   - Storage management
   - Requires careful MongoDB TTL implementation

### Phase 2: Identity & Device Security ⭐⭐
3. **Identity Verification Limits** (3 configs)
   - Compliance and security
   - Moderate implementation complexity

4. **Device Trust Settings** (4 configs)
   - Enhanced security
   - Requires new service logic

### Phase 3: Business Rules ⭐
5. **Booking Limits** (9 configs)
   - Business flexibility
   - Low implementation complexity

6. **Pagination Defaults** (2 configs)
   - Nice to have
   - Already partially covered

---

## Implementation Notes

### For Developers

1. **Reading Dynamic Config**:
   ```typescript
   constructor(private readonly configService: DynamicConfigService) {}

   async getIpThrottleConfig() {
     const limit = await this.configService.getNumber('IP_THROTTLE_AUTH_LOGIN_LIMIT', 5);
     const windowSeconds = await this.configService.getNumber('IP_THROTTLE_AUTH_LOGIN_WINDOW_SECONDS', 900);
     return { limit, ttlSeconds: windowSeconds };
   }
   ```

2. **Caching Strategy**:
   - Cache config values for 5-15 minutes to reduce DB load
   - Use config change events to invalidate cache
   - For security-critical configs, consider shorter TTL (1-2 minutes)

3. **Validation**:
   - Add validation rules for config values (min/max, format)
   - Prevent invalid configurations that could break the system
   - Log all config changes for audit

4. **MongoDB TTL Index Updates**:
   ```typescript
   // For AUDIT_LOG_RETENTION_DAYS - requires admin operation
   async updateAuditLogRetention(days: number) {
     await this.auditLogModel.collection.dropIndex('createdAt_1');
     await this.auditLogModel.collection.createIndex(
       { createdAt: 1 },
       { expireAfterSeconds: days * 86400 }
     );
   }
   ```

---

## Current Dynamic Config Coverage

✅ **Already Dynamic**:
- Session & token expiration
- OTP settings (length, TTL, max attempts, cooldown)
- Password reset settings
- Booking cancellation windows
- Payment fees and thresholds
- File upload limits
- Email/SMS notification toggles
- Payment provider settings
- Invoice settings
- Payout settings
- Split payment configuration
- Language and currency defaults
- Search pagination

❌ **Not Dynamic (This Document)**:
- IP throttling rate limits (10 configs)
- Audit log retention (3 configs)
- Identity verification limits (3 configs)
- Device trust settings (4 configs)
- Additional booking limits (9 configs)
- API pagination defaults (2 configs)

**Total New Configs Proposed**: 31 configurations

---

## Recommendations

1. ✅ **Start with Phase 1** (IP Throttling + Audit Log) - Highest security impact
2. ✅ **Create Config Admin UI** - Allow admins to modify these without database access
3. ✅ **Add Config Validation** - Prevent invalid values that could break security
4. ✅ **Implement Config Change Logging** - Audit trail of who changed what and when
5. ✅ **Add Config Presets** - Dev, Staging, Production presets for easy environment setup
6. ✅ **Document Impact** - Each config should document what happens when changed
7. ✅ **Add Unit Tests** - Test that configs are properly applied

---

## Questions to Consider

1. **Should rate limits be adjustable per-environment automatically?**
   - Dev: More lenient (for testing)
   - Staging: Moderate
   - Production: Strictest

2. **Should there be config approval workflow for critical security settings?**
   - Prevent accidental disabling of security features
   - Require 2FA for critical config changes

3. **Should configs support A/B testing or gradual rollout?**
   - Example: "Apply stricter rate limits to 10% of users first"

4. **Should there be config snapshots/versioning?**
   - Ability to rollback to previous config state
   - Config change history

---

**End of Analysis**
