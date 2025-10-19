# Authentication Architecture - Backend-Driven Approach

## Philosophy

**Backend is the source of truth for all token validation.**

The frontend's role is to:
1. Store tokens securely
2. Attach tokens to API requests
3. React to backend validation responses
4. Provide good UX during auth flows

The frontend does NOT:
- ❌ Validate JWT expiration times (clock skew issues)
- ❌ Perform complex token validation logic
- ❌ Guess if tokens are valid before calling backend
- ❌ Run periodic validation timers

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌──────────────┐                                           │
│  │ User Action  │ (Navigate, Refresh, etc.)                 │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────┐              │
│  │  Axios Request Interceptor               │              │
│  │  • Get access token from storage         │              │
│  │  • Add to Authorization header            │              │
│  │  • Send request to backend                │              │
│  └──────────────┬───────────────────────────┘              │
│                 │                                            │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ HTTP Request with Bearer Token
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │  Authentication Middleware              │                │
│  │  • Validate JWT signature               │                │
│  │  • Check expiration time                │                │
│  │  • Verify token not revoked             │                │
│  │  • Check user still exists              │                │
│  └────────┬───────────────────────────────┘                │
│           │                                                  │
│           ├─ Valid ──────► Process Request                  │
│           │                                                  │
│           └─ Invalid ────► 401 Unauthorized                 │
│                            { error: "Token expired" }        │
│                                                              │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  │ HTTP 401 Response
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │  Axios Response Interceptor             │                │
│  │  • Detect 401 error                     │                │
│  │  • Attempt token refresh                │                │
│  └────────┬───────────────────────────────┘                │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────┐                │
│  │  Call Refresh Token Endpoint            │                │
│  │  POST /auth/refresh                     │                │
│  │  { refreshToken: "..." }                │                │
│  └────────┬───────────────────────────────┘                │
│           │                                                  │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │  Validate Refresh Token                 │                │
│  │  • Check signature                      │                │
│  │  • Check expiration                     │                │
│  │  • Check not revoked                    │                │
│  └────────┬───────────────────────────────┘                │
│           │                                                  │
│           ├─ Valid ────► Return new tokens                  │
│           │               { accessToken, refreshToken }     │
│           │                                                  │
│           └─ Invalid ──► 401 Unauthorized                   │
│                          { error: "Refresh token expired" } │
│                                                              │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  Success:                        Failure:                   │
│  • Save new tokens               • Clear all tokens         │
│  • Retry original request        • Emit logout event        │
│                                   • Show "Session Expired"  │
│                                   • Navigate to login       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Token Storage (`utils/auth/token-manager.ts`)

**Responsibilities:**
- Store/retrieve access and refresh tokens from AsyncStorage
- Check if tokens exist (NOT validate expiration)
- Clear tokens on logout

```typescript
// ✅ Simple existence checks
isAuthenticated(): boolean {
  return !!(accessToken || refreshToken);
}

// ❌ No longer doing this
isTokenExpired(token): boolean {
  // Removed - backend validates
}
```

### 2. Axios Interceptor (`api/axios.ts`)

#### Request Interceptor
```typescript
// Simple: just attach token to requests
async (config) => {
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}
```

#### Response Interceptor
```typescript
// Handle 401 errors from backend
async (error) => {
  if (error.response?.status === 401) {
    // Try to refresh token
    const newToken = await refreshToken();

    if (newToken) {
      // Retry request with new token
      return retryRequest(error.config, newToken);
    } else {
      // Refresh failed - logout
      authEvents.emit("LOGOUT_REQUIRED");
    }
  }
}
```

### 3. Auth Context (`hooks/use-auth.tsx`)

**Responsibilities:**
- Listen for logout events
- Force logout when backend rejects tokens
- Show login modal and navigate to login screen

```typescript
// Listen for refresh failures
authEvents.on("REFRESH_FAILED", () => {
  logout();
  showAlert("Session Expired");
  router.replace("/(auth)/login");
});
```

### 4. Auth Event System (`utils/auth/events.ts`)

**Purpose:** Decouple axios interceptor from auth context

```typescript
// Axios emits events
authEvents.emit("REFRESH_FAILED");

// Auth context listens
authEvents.on("REFRESH_FAILED", handleLogout);
```

## UX Optimizations (Minimal)

### App Resume Check (`hooks/use-app-state-auth.ts`)

**Purpose:** Better UX when app returns from background

```typescript
// Only check if tokens still exist
// Don't validate expiration - backend will do that
if (!accessToken && !refreshToken) {
  showLoginModal(); // User was logged out while away
}
```

**Why keep this?**
- Provides immediate feedback if user logged out on another device
- Doesn't require network call
- Still relies on backend for validation

### Startup Check (`hooks/use-auth.tsx`)

**Purpose:** Check token existence on app launch

```typescript
// Simple: do tokens exist in storage?
const hasTokens = !!(accessToken || refreshToken);
setIsAuthenticated(hasTokens);

// Backend will validate on first API call
```

**Why keep this?**
- Fast startup (no network call)
- First API call will validate tokens with backend

## Backend Requirements

For this architecture to work, the backend MUST:

### 1. Validate All Tokens
```typescript
// Every protected endpoint should:
@UseGuards(JwtAuthGuard)
@Get('protected-resource')
async getResource() {
  // Guard validates token
}
```

### 2. Return Clear 401 Errors
```typescript
// When token is invalid/expired:
{
  statusCode: 401,
  message: "Token expired" | "Token invalid" | "Token revoked",
  error: "Unauthorized"
}
```

### 3. Validate Refresh Tokens
```typescript
// Refresh endpoint must validate:
@Post('auth/refresh')
async refresh(@Body() dto: RefreshDto) {
  const refreshToken = dto.refreshToken;

  // Validate signature
  const payload = this.jwtService.verify(refreshToken);

  // Check expiration
  if (Date.now() >= payload.exp * 1000) {
    throw new UnauthorizedException('Refresh token expired');
  }

  // Check not revoked (if using revocation list)
  const isRevoked = await this.tokenService.isRevoked(refreshToken);
  if (isRevoked) {
    throw new UnauthorizedException('Refresh token revoked');
  }

  // Return new tokens
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

### 4. Handle Token Revocation
```typescript
// Support for logout/revocation
@Post('auth/logout')
async logout(@CurrentUser() user) {
  // Add refresh token to revocation list
  await this.tokenService.revokeToken(user.refreshToken);
}
```

## Security Benefits

### Before (Client-Side Validation)
- ❌ Clock skew can cause false positives/negatives
- ❌ Client can manipulate time
- ❌ Can't detect server-side revocation
- ❌ Duplicate logic (frontend + backend)
- ❌ More attack surface

### After (Backend-Driven)
- ✅ Server time is source of truth
- ✅ Client can't manipulate validation
- ✅ Server-side revocation works immediately
- ✅ Single source of truth (DRY principle)
- ✅ Simpler frontend, less attack surface

## Error Handling Flow

```
User Action
    │
    ▼
API Call with Access Token
    │
    ├─► Backend validates ─► Success
    │
    └─► Backend rejects (401)
         │
         ▼
    Try Refresh Token
         │
         ├─► Backend accepts ─► New Tokens ─► Retry Request ─► Success
         │
         └─► Backend rejects (401)
              │
              ▼
         Clear Tokens
              │
              ▼
         Emit LOGOUT_REQUIRED
              │
              ▼
         Show "Session Expired"
              │
              ▼
         Navigate to Login
```

## Network Offline Handling

```typescript
// Check network before refresh attempt
const isOffline = await NetInfo.fetch().isConnected === false;

if (isOffline) {
  // Don't attempt refresh
  // Show offline message
  return;
}

// Proceed with refresh
```

## Testing Strategy

### Backend Tests (Critical)
```typescript
describe('Token Validation', () => {
  it('should reject expired access token', () => {
    // Test with expired JWT
  });

  it('should reject expired refresh token', () => {
    // Test refresh endpoint
  });

  it('should reject revoked tokens', () => {
    // Test revocation
  });
});
```

### Frontend Tests (Minimal)
```typescript
describe('Token Handling', () => {
  it('should attach token to requests', () => {
    // Test request interceptor
  });

  it('should logout on 401 with failed refresh', () => {
    // Mock 401 response
    // Verify logout called
  });
});
```

## Files Structure

```
utils/auth/
├── events.ts           # Event emitter for auth events
├── storage.ts          # AsyncStorage wrapper
├── token-manager.ts    # Token storage/retrieval (simplified)
└── index.ts            # Exports

hooks/
├── use-auth.tsx        # Auth context with logout handling
└── use-app-state-auth.ts  # UX: check tokens on app resume

api/
└── axios.ts            # Request/response interceptors
```

## Migration from Over-Engineered Approach

### Removed ❌
- ❌ `isTokenExpired()` - JWT expiration validation
- ❌ `isRefreshTokenExpired()` - Client-side expiration check
- ❌ `use-periodic-token-validation.ts` - Periodic validation
- ❌ `utils/auth/debug.ts` - Debug utilities
- ❌ Client-side expiration checks in interceptors
- ❌ Startup token expiration validation

### Kept ✅
- ✅ Token storage/retrieval
- ✅ 401 error handling
- ✅ Token refresh logic
- ✅ Logout event system
- ✅ App state monitoring (existence check only)
- ✅ Duplicate prevention for alerts

### Simplified ✅
- Token existence checks (no expiration validation)
- Startup auth check (storage check, not validation)
- App resume check (existence, not expiration)

## Best Practices Summary

1. **Trust the Backend** - Backend validates, frontend reacts
2. **Keep It Simple** - Minimal frontend logic
3. **Fast Feedback** - Use local checks for UX, not security
4. **Clear Communication** - Events decouple components
5. **Graceful Degradation** - Handle offline scenarios
6. **Single Alert** - Prevent duplicate logout messages
7. **Immediate Navigation** - Show login screen on session expiry

## Conclusion

This architecture follows industry best practices:
- Backend-first validation (OAuth 2.0 pattern)
- Separation of concerns (storage vs validation)
- Event-driven architecture (loose coupling)
- User experience optimization without compromising security
- Maintainable and testable code

The frontend is now simpler, more reliable, and properly delegates security validation to the backend where it belongs.
