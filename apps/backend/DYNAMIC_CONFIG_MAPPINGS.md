# Dynamic Configuration Mappings

This document tracks where each dynamic configuration value is used in the codebase and how it's integrated.

## Phase 1 Configurations (Implemented)

### IP Throttling Configurations (10 configs)

All IP throttling configs are dynamically loaded via `IpThrottleConfigService` and injected into `IpThrottlerGuard`.

| Config Key | Default Value | Mapped Location | Status |
|------------|---------------|-----------------|--------|
| `IP_THROTTLE_AUTH_LOGIN_LIMIT` | 5 | `ip-throttle-config.service.ts:20` → `ip-throttler.guard.ts:81` | ✅ Mapped |
| `IP_THROTTLE_AUTH_LOGIN_WINDOW_SECONDS` | 900 (15 min) | `ip-throttle-config.service.ts:21` → `ip-throttler.guard.ts:81` | ✅ Mapped |
| `IP_THROTTLE_OTP_REQUEST_LIMIT` | 3 | `ip-throttle-config.service.ts:36` → `ip-throttler.guard.ts:82-83` | ✅ Mapped |
| `IP_THROTTLE_OTP_REQUEST_WINDOW_SECONDS` | 300 (5 min) | `ip-throttle-config.service.ts:37` → `ip-throttler.guard.ts:82-83` | ✅ Mapped |
| `IP_THROTTLE_PASSWORD_RESET_LIMIT` | 3 | `ip-throttle-config.service.ts:52` → `ip-throttler.guard.ts:84-85` | ✅ Mapped |
| `IP_THROTTLE_PASSWORD_RESET_WINDOW_SECONDS` | 900 (15 min) | `ip-throttle-config.service.ts:53` → `ip-throttler.guard.ts:84-85` | ✅ Mapped |
| `IP_THROTTLE_SIGNUP_LIMIT` | 3 | `ip-throttle-config.service.ts:68` → `ip-throttler.guard.ts:86-87` | ✅ Mapped |
| `IP_THROTTLE_SIGNUP_WINDOW_SECONDS` | 3600 (1 hour) | `ip-throttle-config.service.ts:69` → `ip-throttler.guard.ts:86-87` | ✅ Mapped |
| `IP_THROTTLE_TOKEN_REFRESH_LIMIT` | 10 | `ip-throttle-config.service.ts:84` → `ip-throttler.guard.ts:88-89` | ✅ Mapped |
| `IP_THROTTLE_TOKEN_REFRESH_WINDOW_SECONDS` | 60 (1 min) | `ip-throttle-config.service.ts:85` → `ip-throttler.guard.ts:88-89` | ✅ Mapped |

**How it works:**
1. Controller uses decorator: `@IpThrottle(IpThrottlePresets.AUTH_LOGIN)`
2. `IpThrottlerGuard` intercepts requests (registered as global guard in `app.module.ts:121`)
3. Guard reads decorator metadata and determines which preset is being used
4. Guard calls appropriate method in `IpThrottleConfigService` to load dynamic config
5. Guard applies dynamic rate limit or falls back to static preset if config fails to load

**Integration Points:**
- Service: `src/common/services/ip-throttle-config.service.ts`
- Guard: `src/common/guards/ip-throttler.guard.ts` (lines 35-99)
- Module: `src/common/common.module.ts`
- Registration: `src/app.module.ts:95,121`
- Decorator: `src/common/decorators/ip-throttle.decorator.ts`
- Usage: `src/modules/auth/controllers/auth-public.controller.ts` (multiple endpoints)

### Audit Log Configurations (3 configs)

| Config Key | Default Value | Mapped Location | Status |
|------------|---------------|-----------------|--------|
| `AUDIT_LOG_RETENTION_DAYS` | 90 | `audit-log-cleanup.service.ts:29-40` | ✅ Mapped |
| `AUDIT_LOG_SUSPICIOUS_ACTIVITY_THRESHOLD` | 5 | `audit-log.service.ts:212` | ✅ Mapped |
| `AUDIT_LOG_SUSPICIOUS_ACTIVITY_WINDOW_MINUTES` | 15 | `audit-log.service.ts:210` | ✅ Mapped |

**How it works:**
- `AuditLogService.getSuspiciousActivity()` method loads thresholds dynamically via `ConfigCacheHelper`
- If threshold/window parameters are provided to the method, they override the dynamic config
- If not provided, the method loads from dynamic config with fallbacks
- `AuditLogCleanupService` runs daily at 2 AM UTC to delete logs older than retention period
- Manual cleanup can be triggered via `manualCleanup()` method for testing or admin actions

**Integration Points:**
- Service: `src/modules/auth/services/audit-log.service.ts` (lines 204-244)
- Cleanup Service: `src/modules/auth/services/audit-log-cleanup.service.ts`
- Module Registration: `src/modules/auth/auth.module.ts:46`
- Usage: Called by admin/monitoring endpoints to detect brute force attacks
- Scheduled Job: Runs daily at 2:00 AM UTC (@Cron decorator)
- Cache: Uses `ConfigCacheHelper` with 2-minute TTL for security configs

**Scheduled Cleanup Details:**
- **Schedule**: Daily at 2:00 AM UTC (CRON: `0 2 * * *`)
- **Logs its actions**: Creates audit log entries for successful/failed cleanups
- **Manual trigger**: Available via `AuditLogCleanupService.manualCleanup(days?)` method
- **Dynamic config**: Loads retention days from database on each run

### Identity Verification Configurations (3 configs)

| Config Key | Default Value | Mapped Location | Status |
|------------|---------------|-----------------|--------|
| `IDENTITY_VERIFICATION_MAX_ATTEMPTS` | 3 | `identity-verification.service.ts:90` | ✅ Mapped |
| `IDENTITY_VERIFICATION_EXPIRY_DAYS` | 365 | `identity-verification.service.ts:174` | ✅ Mapped |
| `IDENTITY_VERIFICATION_AUTO_REVIEW_ENABLED` | false | `identity-verification.service.ts:212-257` | ✅ Mapped |

**How it works:**
- `IdentityVerificationService.createVerification()` loads `MAX_ATTEMPTS` dynamically
- Service checks if user has exceeded max attempts before allowing new submission
- `EXPIRY_DAYS` is loaded dynamically when calculating verification expiration date
- `AUTO_REVIEW_ENABLED` is checked after verification is created - if enabled, automatically approves it
- When auto-review is enabled:
  - Verification status changed from PENDING to APPROVED
  - User status updated to ACTIVE
  - `isIdentityVerified` flag set to true
  - Status history records the auto-approval
- All configs use `ConfigCacheHelper` with fallback values

**Integration Points:**
- Service: `src/modules/identity-verification/identity-verification.service.ts` (lines 44-263)
- Cache: Uses `ConfigCacheHelper` with 10-minute TTL (general config)
- Usage: Called when users submit identity verification documents
- Auto-Review: Automatically triggered on verification creation if config enabled

**Auto-Review Details:**
- **Default**: Disabled (false) for security
- **When enabled**: All new verifications are immediately approved
- **Logging**: Auto-approvals are logged with metadata: `{ autoReview: true }`
- **Status history**: Includes comment "Automatically approved by system (auto-review enabled)"
- **Use case**: Development/testing environments or low-risk scenarios

## Configuration Cache Strategy

All dynamic configs use `ConfigCacheHelper` with the following TTL strategy:

| Config Type | TTL | Reasoning |
|-------------|-----|-----------|
| Security (IP Throttle, Audit) | 2 minutes | Quick response to attacks, can update limits rapidly |
| General (Identity Verification) | 10 minutes | Less critical, reduce database load |
| Default | 5 minutes | Balance between freshness and performance |

**Cache Features:**
- Automatic expiration based on TTL
- Type-safe getters (getString, getNumber, getBoolean, getArray)
- Manual cache invalidation support
- Fallback values if config missing or database unavailable
- Statistics tracking for monitoring

**Implementation:** `src/modules/config/config-cache.helper.ts`

## Module Dependencies

```
AppModule
├── CommonModule (provides IpThrottleConfigService, IpThrottlerGuard)
├── DynamicConfigModule (provides ConfigCacheHelper, DynamicConfigService)
└── AuthModule (provides AuditLogService)
    └── IdentityVerificationModule (provides IdentityVerificationService)
```

**Key Services:**
- `ConfigCacheHelper`: Global caching layer for all dynamic configs (@Global in DynamicConfigModule)
- `IpThrottleConfigService`: Specialized service for rate limit configs (exported from CommonModule)
- `DynamicConfigService`: Low-level service for reading/writing configs to database (@Global)

## Testing Dynamic Configs

### Via Database

```javascript
// Update a config in MongoDB
db.appconfigs.updateOne(
  { key: 'IP_THROTTLE_AUTH_LOGIN_LIMIT' },
  { $set: { value: '3' } }
)

// Wait for cache to expire (2 minutes for security configs)
// Or force cache invalidation via admin API

// New limit will be applied on next request
```

### Via Admin API

```bash
# Update config (requires admin authentication)
PATCH /api/v1/admin/config/:key
{
  "value": "3",
  "title": "Login IP Rate Limit - Max Attempts",
  "description": "Maximum login attempts per IP address in time window"
}

# Configs are cached, so changes take effect after TTL expires
```

## Future Enhancements (Phase 2 & 3)

### Phase 2: Device Trust Settings (4 configs)
- `DEVICE_TRUST_DURATION_DAYS`: Duration to trust a device before requiring re-verification
- `DEVICE_TRUST_ENABLED`: Enable/disable device trust feature
- `DEVICE_MAX_TRUSTED_PER_USER`: Maximum number of trusted devices per user
- `DEVICE_FINGERPRINT_REQUIRED`: Require device fingerprinting for trust

**Recommended Mapping:**
- Create `DeviceTrustConfigService` similar to `IpThrottleConfigService`
- Update `DeviceTrustService` to load configs dynamically
- Use 10-minute TTL (general config)

### Phase 3: Booking and Pagination Limits (11 configs)
- Booking advance days (min/max)
- Minimum nights (standard/peak season)
- Max nights per booking
- Pagination defaults

**Recommended Mapping:**
- Create `BookingConfigService` for booking limits
- Update booking validation logic to use dynamic configs
- Create `PaginationConfigService` for pagination defaults
- Use 10-minute TTL (general config)

## Summary

### ✅ Fully Implemented (16 configs - Phase 1 Complete)
- ✅ **IP Throttling**: 10 configs → `IpThrottlerGuard` → Active on all auth endpoints
- ✅ **Audit Log**: 3 configs → `AuditLogService` + `AuditLogCleanupService` → Active
  - Suspicious activity detection (2 configs)
  - Retention cleanup job (1 config, runs daily at 2 AM UTC)
- ✅ **Identity Verification**: 3 configs → `IdentityVerificationService` → Active
  - Max attempts validation (1 config)
  - Expiry date calculation (1 config)
  - Auto-review approval (1 config)

### 📝 Planned (Phases 2 & 3) (15 configs)
- 📝 Device trust settings (4 configs)
- 📝 Booking limits (9 configs)
- 📝 Pagination defaults (2 configs)

## Verification Checklist

To verify dynamic configs are working:

1. ✅ Build succeeds: `npm run build`
2. ✅ Seed populates configs: `npm run seed` (17 updates)
3. ✅ `IpThrottlerGuard` registered as global guard in AppModule
4. ✅ `ConfigCacheHelper` registered as global service
5. ✅ `IpThrottleConfigService` injected into guard
6. ✅ `AuditLogService` uses ConfigCacheHelper
7. ✅ `AuditLogCleanupService` registered and scheduled
8. ✅ `IdentityVerificationService` uses ConfigCacheHelper for all 3 configs
9. ✅ Auto-review logic implemented and tested
10. 🧪 Runtime testing: Change config in DB, wait for cache expiry, verify new value is used

### Testing Each Config

**IP Throttling:**
```bash
# Test by making multiple rapid requests to login endpoint
# Should be blocked after hitting the limit
curl -X POST http://localhost:3001/api/v1/auth/signin/password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  --repeat 10
```

**Audit Log Retention:**
```bash
# Manually trigger cleanup (requires admin auth)
POST /api/v1/admin/audit-logs/cleanup
{
  "retentionDays": 30  # Optional, uses dynamic config if not provided
}
```

**Identity Verification:**
```bash
# Set auto-review to true in database
db.appconfigs.updateOne(
  { key: 'IDENTITY_VERIFICATION_AUTO_REVIEW_ENABLED' },
  { $set: { value: 'true' } }
)

# Submit verification - should be auto-approved
POST /api/v1/identity-verification
```

## Code Quality

- ✅ Type safety: All configs strongly typed
- ✅ Fallback values: Every config has a default
- ✅ Error handling: Failures gracefully fall back to defaults
- ✅ Performance: Caching reduces database load
- ✅ Security: Short TTL for security-critical configs
- ✅ Maintainability: Centralized config management
- ✅ Documentation: Comprehensive inline comments

**Last Updated:** 2025-10-11
**Status:** Phase 1 Complete - All 16 configs fully implemented and mapped
