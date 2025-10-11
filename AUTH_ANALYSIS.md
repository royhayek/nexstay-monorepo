# Authentication System Analysis
## Nexstay Monorepo - Comprehensive Study

**Date:** 2025-10-11
**Analyst:** Claude Code
**Scope:** Backend (NestJS), Dashboard (Next.js), Mobile (React Native Expo)

---

## Executive Summary

This document provides a comprehensive analysis of the authentication system across the Nexstay monorepo. The analysis covers three main applications: Backend API, Dashboard web application, and Mobile application. The goal is to identify inconsistencies, missing features, unused code, and optimization opportunities to achieve a clean, high-performance authentication system.

### Key Findings Overview

✅ **Strengths:**
- Modern, multi-step authentication flows (signup, signin, password reset)
- JWT-based authentication with refresh token rotation
- OTP verification system with configurable parameters
- Social login preparation (Google, Facebook, Apple)
- Multi-channel communication (Email/SMS)

⚠️ **Critical Issues:**
- **Inconsistent token refresh implementations** across platforms
- **Dashboard has commented-out auth interceptor** leaving tokens unmanaged
- **Mobile refresh endpoint mismatch** (uses wrong endpoint path)
- **Unused legacy login method** in backend still present
- **Incomplete social login implementation** (stubs only)
- **Device verification flow** not implemented (code exists but disabled)

---

## Table of Contents

1. [Backend Authentication Analysis](#1-backend-authentication-analysis)
2. [Dashboard Authentication Analysis](#2-dashboard-authentication-analysis)
3. [Mobile Authentication Analysis](#3-mobile-authentication-analysis)
4. [Cross-Platform Comparison](#4-cross-platform-comparison)
5. [Security Analysis](#5-security-analysis)
6. [Inconsistencies Identified](#6-inconsistencies-identified)
7. [Missing Features](#7-missing-features)
8. [Unused Code](#8-unused-code)
9. [Optimization Opportunities](#9-optimization-opportunities)
10. [Recommendations](#10-recommendations)

---

## 1. Backend Authentication Analysis

### 1.1 Architecture Overview

**Location:** `apps/backend/src/modules/auth/`

**Components:**
- `auth.service.ts` (1478 lines) - Core authentication logic
- `auth.module.ts` - Module configuration
- `jwt.strategy.ts` - Passport JWT strategy
- `controllers/auth-public.controller.ts` - Public authentication endpoints
- Multiple DTOs for request/response validation

**Authentication Flows Supported:**

#### A. Signup Flow (Multi-Step)
```
1. POST /public/auth/signup/verify-contact
   - Input: { identifier: email|phone }
   - Sends OTP
   - Returns: { success, testCode?, registrationState }

2. POST /public/auth/verify
   - Input: { method, identifier, code }
   - Verifies OTP
   - Returns: { ownershipVerified, verifiedIdentifier, signupSessionToken? }

3. POST /public/auth/signup/complete-profile
   - Input: { sessionToken, firstName, lastName, birthDate, password, email?, phone? }
   - Creates user account
   - Returns: { accessToken, refreshToken, user, registrationState }
```

#### B. Signin Flow (Unified Multi-Step)
```
1. POST /public/auth/signin/initiate
   - Input: { identifier: email|phone }
   - Checks if user exists
   - Returns: { userExists, sessionToken, nextStep, hasPassword?, testCode? }

2. POST /public/auth/signin/password
   - Input: { sessionToken, password, requestSmsCode? }
   - Validates password
   - Returns: { requiresDeviceVerification, accessToken?, refreshToken?, user?, sessionToken? }

3. POST /public/auth/signin/verify-device (if required)
   - Input: { sessionToken, code }
   - Verifies device OTP
   - Returns: { accessToken, refreshToken, user }
```

#### C. Password Reset Flow
```
1. POST /public/auth/request-reset
   - Input: { method, identifier }
   - Sends reset OTP
   - Returns: { success, testCode? }

2. POST /public/auth/verify-reset
   - Input: { method, identifier, code }
   - Verifies reset OTP
   - Returns: { resetToken, expiresAt }

3. POST /public/auth/reset-password
   - Input: { resetToken, newPassword }
   - Resets password and invalidates all refresh tokens
   - Returns: { success }
```

#### D. Token Management
```
1. POST /public/auth/refresh
   - Input: { refreshToken }
   - Generates new token pair (rotation)
   - Returns: { accessToken, refreshToken }

2. POST /public/auth/logout
   - Protected endpoint
   - Invalidates all user refresh tokens
   - Returns: { message }
```

#### E. Additional Features
```
1. POST /public/auth/check-identifier
   - Input: { identifier }
   - Checks existence and available auth methods
   - Returns: { exists, methods: [] }

2. POST /public/auth/add-secondary-contact
   - Protected endpoint
   - Adds email or phone to existing account
   - Sends OTP for verification
   - Returns: { success, verificationRequired, codeDeliveryMethod, testCode? }

3. POST /public/auth/request-verify
   - General purpose OTP request
   - Returns: { success, testCode? }
```

### 1.2 Security Features

✅ **Implemented:**
- JWT with configurable expiration (default 15m access, 7d refresh)
- Refresh token rotation (old token deleted on refresh)
- Password hashing with bcrypt
- OTP code hashing
- Rate limiting preparation (checks in place but not enforced)
- Password strength validation (configurable)
- Token expiration validation
- User status checking (can login, deactivated, etc.)
- Session tokens for multi-step flows (15m expiration)

⚠️ **Security Concerns:**
1. **Refresh tokens stored hashed** ✅ but require iteration through all tokens for validation (O(n) lookup)
2. **OTP rate limiting** partially implemented (sliding window) but not aggressive enough
3. **Device verification** disabled (line 1087: `requiresDeviceVerification = false`)
4. **Test codes exposed** in non-production (good for dev, needs env check)
5. **Password reset** doesn't invalidate session tokens, only refresh tokens

### 1.3 Code Quality Issues

#### A. Duplicate/Legacy Code
```typescript
// Line 273-316: Legacy login() method
async login(loginDto: LoginUserDto): Promise<TokenPair> {
  // This appears to be OLD implementation
  // Replaced by signinInitiate -> signinPassword -> signinVerifyDevice flow
  // Still referenced but NOT used by frontend
}

// Line 215-253: Legacy register() method
async register(createDto: CreateUserDto): Promise<VerificationCodeResponse> {
  // Replaced by signup flow (signupVerifyContact -> verify -> completeProfile)
  // Still present but NOT exposed via controller
}
```

**Impact:** ~150 lines of unused code, confusing maintenance

#### B. Method Aliases
```typescript
// Lines 773-780: Unnecessary aliases
async refreshTokens(refreshDto: RefreshDto): Promise<TokenPair> {
  return this.refresh(refreshDto);
}

async requestVerificationCode(dto: RequestVerifyDto): Promise<VerificationCodeResponse> {
  return this.requestVerify(dto);
}
```

**Impact:** 2 methods are just aliases, adds unnecessary surface area

#### C. Inconsistent OTP Handling

The service has **THREE different OTP verification implementations**:

1. `verify()` - Lines 432-496 (For general email/phone verification)
2. `verifyCode()` - Lines 782-915 (For ownership verification during signup)
3. `verifyReset()` - Lines 602-672 (For password reset)

**Analysis:** While they serve different purposes, there's significant code duplication. Could be refactored into a single private method with different behaviors.

### 1.4 Token Management

**Refresh Token Storage:**
```typescript
// Line 149-153: Creates new refresh token record
await this.refreshTokenModel.create({
  user: userId,
  tokenHash: hashed,  // bcrypt hashed
  expiresAt: DateUtils.create(expiresAtUnix),
});
```

**Refresh Token Validation:**
```typescript
// Lines 736-745: O(n) lookup - iterates ALL valid tokens
const tokens = await this.refreshTokenModel
  .find({ expiresAt: { $gt: DateUtils.now() } })
  .exec();
let match: RefreshTokenDocument | null = null;
for (const t of tokens) {
  if (await CryptoUtil.comparePassword(refreshToken, t.tokenHash)) {
    match = t;
    break;
  }
}
```

**Critical Performance Issue:** This scales poorly as users accumulate tokens. With 10,000 active sessions, every refresh request must check all 10,000 hashed tokens.

**Suggested Solution:** Add an index on `userId` or use a different token identification strategy (e.g., token ID in JWT).

### 1.5 OTP System

**Configuration (Dynamic):**
```typescript
OTP_LENGTH: 6
OTP_TTL_SECONDS: 300 (5 minutes)
OTP_RESEND_COOLDOWN_SECONDS: 60
OTP_MAX_ATTEMPTS: 5
OTP_REQUESTS_PER_WINDOW: 5
OTP_REQUEST_WINDOW_SECONDS: 900 (15 minutes)
RESET_TTL_SECONDS: 600 (10 minutes)
RESET_MAX_ATTEMPTS: 5
NOTIFY_EMAIL_ENABLED: false
NOTIFY_SMS_ENABLED: false
```

**Rate Limiting Implementation:**
```typescript
// Lines 354-367: Simple sliding window per user/type
const windowStart = DateUtils.create(now.getTime() - cfg.windowMs);
const requestLog = (existing?.requestLog ?? []).filter((ts) => ts >= windowStart);
if (requestLog.length >= cfg.windowRequests) {
  throw new BadRequestException('Too many requests. Try again later.');
}
```

**Issues:**
1. Per-user rate limiting only (no global IP-based limiting)
2. Request log stored in same document (could grow large)
3. No exponential backoff
4. No IP-based throttling for anonymous requests

### 1.6 Verification Token Schema

**Storage Pattern:**
```typescript
{
  user?: ObjectId,           // User reference (if user exists)
  identifier?: string,       // For pre-registration verification
  type: AuthMethod,          // EMAIL | PHONE | device_verification
  codeHash: string,          // Hashed OTP
  expiresAt: Date,
  used: boolean,
  attempts: number,
  lastSentAt?: Date,
  requestLog?: Date[],       // For rate limiting
}
```

**Observations:**
- ✅ One code per user+type (upsert pattern prevents multiple codes)
- ✅ Codes are hashed before storage
- ⚠️ No automatic cleanup of expired tokens (should add TTL index in MongoDB)
- ⚠️ `identifier` field used for pre-registration (clever but not indexed)

---

## 2. Dashboard Authentication Analysis

### 2.1 Architecture Overview

**Location:** `apps/dashboard/src/auth/`

**Tech Stack:**
- Next.js 15 App Router
- JWT authentication
- Material-UI components
- React Query for API calls
- Orval-generated API client

**Components:**
```
src/auth/
├── context/
│   ├── auth-context.tsx           # Auth context definition
│   └── jwt/
│       ├── auth-provider.tsx      # JWT provider implementation
│       ├── action.ts              # Auth actions (signin, reset, etc.)
│       ├── utils.ts               # Token utilities
│       └── constant.ts            # Storage keys
├── view/
│   └── jwt/
│       ├── jwt-sign-in-view.tsx   # Sign-in UI
│       └── jwt-reset-password-view.tsx  # Password reset UI
├── guard/
│   ├── auth-guard.tsx             # Protected route wrapper
│   ├── guest-guard.tsx            # Public route wrapper
│   └── role-based-guard.tsx       # Role checking
└── components/                    # Shared auth UI components
```

### 2.2 Authentication Implementation

#### Token Storage
```typescript
// Uses sessionStorage (not localStorage)
const JWT_STORAGE_KEY = 'accessToken';
const JWT_REFRESH_STORAGE_KEY = 'refreshToken';

// Storage in: src/auth/context/jwt/utils.ts
sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
sessionStorage.setItem(JWT_REFRESH_STORAGE_KEY, refreshToken);
```

**Issue:** sessionStorage means users must re-authenticate on every browser tab/window.

#### Token Validation
```typescript
// src/auth/context/jwt/utils.ts:32-51
export function isValidToken(accessToken: string) {
  if (!accessToken) return false;

  try {
    const decoded = jwtDecode(accessToken);
    if (!decoded || !('exp' in decoded)) return false;

    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
}
```

✅ **Good:** Proper JWT decoding and expiration check

#### Token Refresh Implementation
```typescript
// src/auth/context/jwt/utils.ts:58-116
export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  tokenRefreshTimer = setTimeout(async () => {
    // Prevent concurrent refresh
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const storedRefreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);
      const res = await authPublicControllerRefresh(
        { refreshToken: storedRefreshToken },
        requestOptions
      );
      await setSession(accessToken, refreshToken);
    } finally {
      isRefreshing = false;
    }
  }, timeLeft);
}
```

✅ **Good:**
- Proactive token refresh before expiration
- Concurrent refresh prevention
- Automatic retry on 401

⚠️ **Issues:**
1. No retry limit (could loop infinitely on persistent refresh failures)
2. Refresh timer not cleared on logout
3. Multiple timers can be set if setSession called multiple times

### 2.3 Axios Configuration

**Critical Issue Found:**

```typescript
// src/lib/axios.ts:16-27
/**
 * Optional: Add token (if using auth)
 *
 axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*
*/
```

**🚨 THE AUTHORIZATION HEADER IS COMMENTED OUT! 🚨**

This means:
- Access tokens are stored but **never sent** with requests
- All API calls are **unauthorized**
- Only the refresh endpoint manually sets the token
- Protected routes won't work

**This is a critical bug that breaks authentication.**

### 2.4 Authentication Flow

#### Sign-in Flow (Multi-Step)
```typescript
// src/auth/view/jwt/jwt-sign-in-view.tsx:93-128
const onSubmit = async (data) => {
  // Step 1: Initiate
  const initiateRes = await signinInitiate(data.email);

  if (initiateRes.data.nextStep === 'password') {
    // Step 2: Enter password
    const passwordRes = await signinPassword(
      initiateRes.data.sessionToken,
      data.password
    );

    // Check if device verification needed
    if (passwordRes.data.requiresDeviceVerification) {
      setAuthStep('verify-device');
      return;
    }

    // Success - tokens stored automatically
    await checkUserSession?.();
    router.refresh();
  }
};
```

✅ **Implementation matches backend flow perfectly**

#### Password Reset Flow
```typescript
// src/auth/view/jwt/jwt-reset-password-view.tsx:56-70
const onSubmit = async (data) => {
  await requestResetPassword({
    method: 'email',
    identifier: data.email
  });

  const redirectPath = createRedirectPath(data.email);
  router.push(redirectPath);
};
```

✅ **Proper implementation**

### 2.5 Auth Provider Issues

```typescript
// src/auth/context/jwt/auth-provider.tsx:29-49
const checkUserSession = useCallback(async () => {
  try {
    const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);
    const refreshToken = sessionStorage.getItem(JWT_REFRESH_STORAGE_KEY);

    if (accessToken && isValidToken(accessToken)) {
      setSession(accessToken, refreshToken);

      const res = await usersAdminControllerGetProfile();  // ⚠️ Uses admin endpoint
      const user = res.data;

      setState({ user, loading: false });
    } else {
      setState({ user: null, loading: false });
    }
  } catch (error) {
    setState({ user: null, loading: false });
  }
}, [setState]);
```

**Issues:**
1. Calls admin-specific endpoint (`usersAdminControllerGetProfile`) - should use generic profile endpoint
2. No automatic token refresh on expired token (just fails silently)
3. Refresh token not validated before calling setSession

---

## 3. Mobile Authentication Analysis

### 3.1 Architecture Overview

**Location:** `apps/mobile/`

**Tech Stack:**
- React Native with Expo
- TanStack React Query
- AsyncStorage for persistence
- Orval-generated API client

**Components:**
```
apps/mobile/
├── hooks/
│   └── use-auth.tsx              # Auth context & hooks (493 lines)
├── utils/auth/
│   ├── storage.ts                # AsyncStorage wrapper (123 lines)
│   ├── token-manager.ts          # Token utilities (114 lines)
│   └── index.ts                  # Exports
└── api/
    └── axios.ts                  # Axios config with interceptors (138 lines)
```

### 3.2 Storage Implementation

```typescript
// utils/auth/storage.ts
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_DATA: "user_data",
  BIOMETRIC_ENABLED: "biometric_enabled",
};

class AsyncStorageAuth implements AuthStorage {
  async getAccessToken(): Promise<string | null>
  async getRefreshToken(): Promise<string | null>
  async setTokens(accessToken: string, refreshToken?: string): Promise<void>
  async clearTokens(): Promise<void>
  async getUserData(): Promise<any>
  async setUserData(userData: any): Promise<void>
  async clearUserData(): Promise<void>
  async getBiometricEnabled(): Promise<boolean>
  async setBiometricEnabled(enabled: boolean): Promise<void>
}
```

✅ **Excellent design:**
- Interface abstraction (easily testable)
- AsyncStorage properly wrapped
- Error handling
- Biometric setting support (prepared for future)

### 3.3 Token Management

```typescript
// utils/auth/token-manager.ts
export const tokenManager = {
  getAccessToken: async (): Promise<string | null>
  getRefreshToken: async (): Promise<string | null>
  setTokens: async (accessToken: string, refreshToken?: string): Promise<void>
  clearTokens: async (): Promise<void>
  isAuthenticated: async (): Promise<boolean>  // ⚠️ Just checks token exists
  hasRefreshToken: async (): Promise<boolean>
  getAuthHeader: async (): Promise<string | null>
}
```

**Issue:** `isAuthenticated()` doesn't validate token expiration - just checks if token exists

### 3.4 Axios Interceptor

```typescript
// api/axios.ts:23-51
axiosInstance.interceptors.request.use(async (config) => {
  // ✅ Adds auth token
  const token = await tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Performance tracking
  config.metadata = { startTime: new Date() };

  // ✅ Dev logging
  if (__DEV__) {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
  }

  return config;
});
```

✅ **Good:** Authorization header properly added

#### Token Refresh on 401

```typescript
// api/axios.ts:68-99
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // ⚠️ CRITICAL BUG: Wrong refresh endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();
        if (refreshToken) {
          // 🚨 BUG: Wrong endpoint path
          const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,  // 🚨 Wrong field name
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;  // 🚨 Wrong response shape
          await tokenManager.setTokens(access_token, newRefreshToken);

          originalRequest.headers!.Authorization = `Bearer ${access_token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        await tokenManager.clearTokens();
      }
    }

    return Promise.reject(handleApiError(error));
  }
);
```

**🚨 CRITICAL BUGS:**

1. **Wrong endpoint:** `/auth/refresh` should be `/public/auth/refresh`
2. **Wrong request shape:** Sends `{ refresh_token }` but backend expects `{ refreshToken }` (camelCase)
3. **Wrong response shape:** Expects `{ access_token, refresh_token }` but backend returns `{ data: { accessToken, refreshToken } }`
4. **No concurrent refresh prevention** (unlike dashboard)
5. **Token refresh will always fail** due to these issues

### 3.5 Auth Hook Implementation

```typescript
// hooks/use-auth.tsx (493 lines)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDataDto | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ✅ All auth flow methods implemented
  checkIdentifier
  signupVerifyContact
  verify
  completeProfile
  signinInitiate
  signinPassword
  signinVerifyDevice
  requestReset
  verifyReset
  resetPassword
  addSecondaryContact
  requestVerify
}
```

✅ **Strengths:**
- Complete implementation of all backend flows
- Good separation of concerns
- Dev-only test code alerts (helpful for testing)
- Auto-login after successful registration/signin
- Proper error handling

⚠️ **Issues:**
1. Test code alerts in production build (should check `__DEV__` not `isDevelopment()`)
2. User profile fetch after login makes extra API call
3. No token validation on app resume
4. No biometric authentication (prepared but not implemented)

---

## 4. Cross-Platform Comparison

### 4.1 Authentication Flow Support

| Flow | Backend | Dashboard | Mobile | Notes |
|------|---------|-----------|--------|-------|
| Check Identifier | ✅ | ❌ | ✅ | Dashboard doesn't use this endpoint |
| Signup (Multi-Step) | ✅ | ❌ | ✅ | Dashboard lacks signup UI |
| Signin (Unified) | ✅ | ✅ | ✅ | All platforms consistent |
| Password Reset | ✅ | ✅ | ✅ | All platforms consistent |
| Device Verification | ✅ (disabled) | ✅ (prepared) | ✅ (prepared) | Backend disabled, frontends ready |
| Token Refresh | ✅ | ✅ (broken) | 🚨 (broken) | Dashboard: no auth header, Mobile: wrong endpoint |
| Logout | ✅ | ✅ | ✅ | All consistent |
| Add Secondary Contact | ✅ | ❌ | ✅ | Dashboard missing |
| Social Login | 🟡 (stub) | 🟡 (prepared) | ❌ | None fully implemented |

### 4.2 Token Storage Comparison

| Aspect | Backend | Dashboard | Mobile |
|--------|---------|-----------|--------|
| Access Token | JWT (15m) | sessionStorage | AsyncStorage |
| Refresh Token | Hashed in DB (7d) | sessionStorage | AsyncStorage |
| Persistence | Server-side | ❌ Session only | ✅ Persistent |
| Rotation | ✅ On refresh | ✅ On refresh | 🚨 Broken |
| Expiration Check | ✅ Server + Client | ✅ Client | ⚠️ None |

**Impact:**
- Dashboard users must login on every new tab/window (poor UX)
- Mobile can't refresh tokens (will logout after 15 minutes)
- Mobile doesn't validate token expiration (sends expired tokens)

### 4.3 Security Feature Comparison

| Feature | Backend | Dashboard | Mobile |
|---------|---------|-----------|--------|
| JWT Validation | ✅ | ✅ | ✅ |
| Token Expiration | ✅ | ✅ | ❌ (not checked) |
| Refresh on 401 | N/A | ✅ | 🚨 (broken) |
| Proactive Refresh | N/A | ✅ | ❌ |
| Concurrent Refresh Prevention | N/A | ✅ | ❌ |
| OTP Rate Limiting | ✅ | N/A | N/A |
| Password Strength | ✅ | ❌ (client-side only) | ❌ (client-side only) |
| RBAC | ✅ | ✅ | ❌ (prepared) |
| Biometric Auth | N/A | N/A | 🟡 (prepared) |

---

## 5. Security Analysis

### 5.1 Critical Security Issues

#### 1. Dashboard Authorization Header Commented Out
**Severity:** 🔴 **CRITICAL**
**File:** `apps/dashboard/src/lib/axios.ts:16-27`

```typescript
/**
 * Optional: Add token (if using auth)
 *
 axiosInstance.interceptors.request.use((config) => { ... });
*
*/
```

**Impact:** All requests are unauthenticated. Protected endpoints won't work.

**Fix:** Uncomment and implement properly

---

#### 2. Mobile Token Refresh Broken
**Severity:** 🔴 **CRITICAL**
**File:** `apps/mobile/api/axios.ts:79-88`

Multiple issues prevent token refresh from working:
- Wrong endpoint path
- Wrong request/response shape
- No concurrent refresh prevention

**Impact:** Users logged out after 15 minutes (access token expiration)

**Fix:**
```typescript
const response = await axios.post(`${API_CONFIG.BASE_URL}/public/auth/refresh`, {
  refreshToken: refreshToken,  // camelCase
});

const { data } = response;
const { accessToken, refreshToken: newRefreshToken } = data;
```

---

#### 3. Refresh Token O(n) Lookup
**Severity:** 🟡 **MEDIUM**
**File:** `apps/backend/src/modules/auth/auth.service.ts:736-745`

**Issue:** Iterates through ALL active refresh tokens to find match

**Impact:** Performance degrades as active sessions grow

**Fix:** Add token ID to JWT payload or index by userId

---

#### 4. Device Verification Disabled
**Severity:** 🟡 **MEDIUM**
**File:** `apps/backend/src/modules/auth/auth.service.ts:1087`

```typescript
const requiresDeviceVerification = false; // For now, skip device verification
```

**Impact:** Less secure, no 2FA for suspicious logins

**Fix:** Implement device fingerprinting and enable conditionally

---

#### 5. No IP-Based Rate Limiting
**Severity:** 🟡 **MEDIUM**
**Location:** Backend OTP system

**Impact:** Attackers can spam OTP requests from different accounts on same IP

**Fix:** Add IP-based throttling using @nestjs/throttler

---

### 5.2 Security Best Practices Checklist

| Practice | Backend | Dashboard | Mobile |
|----------|---------|-----------|--------|
| Tokens not in URL | ✅ | ✅ | ✅ |
| HTTPS Only | ⚠️ Config | ⚠️ Config | ⚠️ Config |
| HttpOnly Cookies | ❌ (JWT) | ❌ (sessionStorage) | N/A |
| CSRF Protection | ❌ (not needed for JWT) | ❌ | N/A |
| XSS Protection | ✅ (NestJS) | ✅ (Next.js) | ✅ (React Native) |
| SQL Injection | ✅ (Mongoose) | N/A | N/A |
| Rate Limiting | 🟡 (partial) | ❌ | ❌ |
| Password Hashing | ✅ (bcrypt) | N/A | N/A |
| OTP Hashing | ✅ (bcrypt) | N/A | N/A |
| Token Rotation | ✅ | 🚨 (broken) | 🚨 (broken) |
| Session Timeout | ✅ (15m) | ✅ (15m) | ⚠️ (not enforced) |

---

## 6. Inconsistencies Identified

### 6.1 API Endpoint Naming

**Backend provides:**
```
/public/auth/signin/initiate
/public/auth/signin/password
/public/auth/signin/verify-device
```

**Mobile axios calls:**
```
/auth/refresh  ❌ Should be /public/auth/refresh
```

### 6.2 Request/Response Shapes

**Backend refresh expects:**
```typescript
{ refreshToken: string }  // camelCase
```

**Mobile sends:**
```typescript
{ refresh_token: string }  // snake_case
```

**Backend returns:**
```typescript
{
  status: 'success',
  message: 'Token refreshed successfully',
  data: {
    accessToken: string,
    refreshToken: string
  }
}
```

**Mobile expects:**
```typescript
{
  access_token: string,  // Wrong casing
  refresh_token: string  // Wrong casing
}
```

### 6.3 Token Storage

| Platform | Access Token | Refresh Token | Persistence |
|----------|--------------|---------------|-------------|
| Backend | N/A (client) | MongoDB (hashed) | ✅ Permanent |
| Dashboard | sessionStorage | sessionStorage | ❌ Session only |
| Mobile | AsyncStorage | AsyncStorage | ✅ Permanent |

**Issue:** Dashboard users must re-login on every new tab. Mobile doesn't.

**Recommendation:** Use localStorage on Dashboard for consistency with Mobile

### 6.4 Profile Endpoint Usage

**Dashboard:** Uses admin endpoint
```typescript
await usersAdminControllerGetProfile()  // Admin-specific
```

**Mobile:** Uses app endpoint
```typescript
await usersAppControllerGetProfile()  // Generic profile
```

**Issue:** Dashboard unnecessarily couples to admin module

---

## 7. Missing Features

### 7.1 Backend Missing Features

1. **Social Login Implementation** (Google, Facebook, Apple)
   - Schema fields exist (`googleId`, `facebookId`, `appleId`)
   - AuthMethod enum includes them
   - No actual OAuth flow implemented

2. **Device Fingerprinting**
   - Code structure exists for device verification
   - No actual device tracking/fingerprinting

3. **Biometric Authentication Support**
   - No backend endpoints for biometric registration
   - Mobile has storage key but no API integration

4. **Remember Me / Stay Logged In**
   - No long-lived session option
   - Refresh tokens always expire after 7 days

5. **Multi-Device Session Management**
   - Users can't view active sessions
   - Can't remotely logout other devices
   - Logout invalidates ALL sessions

6. **Account Recovery Options**
   - Only email/phone reset supported
   - No security questions
   - No backup codes

7. **Audit Logging**
   - No login attempt logging
   - No IP tracking
   - No suspicious activity detection

### 7.2 Dashboard Missing Features

1. **Signup Flow**
   - No registration UI
   - Only signin implemented
   - Uses `usersAdminControllerGetProfile` suggesting admin-only dashboard

2. **Secondary Contact Management**
   - No UI to add email/phone
   - Backend endpoint exists but unused

3. **Token Validation**
   - No token expiration check on app resume
   - Relies entirely on backend 401 responses

4. **Role-Based UI**
   - RoleBasedGuard exists but not used in routes
   - No role-specific navigation hiding

### 7.3 Mobile Missing Features

1. **Biometric Authentication**
   - Storage prepared (`BIOMETRIC_ENABLED`)
   - No UI implementation
   - No backend integration

2. **Token Validation on App Resume**
   - App doesn't check token validity when resuming from background
   - Sends potentially expired tokens

3. **Offline Auth State**
   - No offline indicator
   - No queue for auth operations when offline

4. **Social Login**
   - Backend supports it
   - No mobile UI for Google/Facebook/Apple login

---

## 8. Unused Code

### 8.1 Backend Unused Code (Can Be Removed)

#### A. Legacy Authentication Methods

**File:** `apps/backend/src/modules/auth/auth.service.ts`

**Lines 273-316:** `async login()`
```typescript
async login(loginDto: LoginUserDto): Promise<TokenPair> {
  // OLD single-step login
  // Replaced by: signinInitiate -> signinPassword -> signinVerifyDevice
  // NOT referenced in controller
}
```
**Savings:** ~43 lines

**Lines 215-253:** `async register()`
```typescript
async register(createDto: CreateUserDto): Promise<VerificationCodeResponse> {
  // OLD single-step registration
  // Replaced by: signupVerifyContact -> verify -> completeProfile
  // NOT referenced in controller
}
```
**Savings:** ~38 lines

**Lines 773-780:** Alias methods
```typescript
async refreshTokens(refreshDto: RefreshDto): Promise<TokenPair> {
  return this.refresh(refreshDto);  // Just calls refresh()
}

async requestVerificationCode(dto: RequestVerifyDto): Promise<VerificationCodeResponse> {
  return this.requestVerify(dto);  // Just calls requestVerify()
}
```
**Savings:** ~7 lines

**Total Backend Savings:** ~88 lines

---

#### B. Unused DTOs

If `login()` and `register()` are removed, these DTOs become unused:

**File:** `apps/backend/src/modules/auth/dto/login.dto.ts`
```typescript
export class LoginUserDto {
  // Only used by legacy login() method
}
```

This DTO is actually referenced by `check-identifier.dto.ts` for the `AuthMethod` enum, so it's partially used. Need careful analysis before removal.

---

#### C. Unused Imports

**File:** `apps/backend/src/modules/auth/auth.service.ts`

```typescript
import { LoginUserDto, AuthMethod } from './dto/login.dto';
// LoginUserDto only used in legacy login(), but AuthMethod widely used
```

After removing legacy methods, `LoginUserDto` import can be removed (but keep `AuthMethod`).

---

### 8.2 Dashboard Unused Code

#### A. Firebase, Supabase, Auth0, Amplify Providers

**File:** `apps/dashboard/src/global-config.ts`

The dashboard is configured for multiple auth providers but only JWT is actually used:

```typescript
export const AUTH_PROVIDER = 'jwt';  // Only JWT active

// Unused provider configurations:
// - Firebase
// - Supabase
// - Auth0
// - AWS Amplify
```

**Recommendation:**
- If other providers will never be used, remove their configurations
- If future plans exist, keep as-is but document

---

#### B. Commented Auth Interceptor

**File:** `apps/dashboard/src/lib/axios.ts:16-27`

```typescript
/**
 * Optional: Add token (if using auth)
 *
 axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*
*/
```

This isn't "unused" - it's a critical bug that it's commented out. Should be FIXED, not removed.

---

### 8.3 Mobile Unused Code

#### A. Biometric Settings

**File:** `apps/mobile/utils/auth/storage.ts`

```typescript
async getBiometricEnabled(): Promise<boolean>
async setBiometricEnabled(enabled: boolean): Promise<void>
```

**File:** `apps/mobile/utils/auth/token-manager.ts`

```typescript
export const settingsManager = {
  getBiometricEnabled,
  setBiometricEnabled,
}
```

**Status:** Prepared but not used anywhere

**Recommendation:** Keep for future implementation OR remove if not planned

---

#### B. Error Handler (api/error-handler.ts)

**Referenced in:** `apps/mobile/api/axios.ts`

```typescript
import { handleApiError } from "./error-handler";
```

**File not shown in glob results** - need to verify if it exists or is a broken import.

---

## 9. Optimization Opportunities

### 9.1 Backend Optimizations

#### A. Refresh Token Lookup Performance

**Current:** O(n) iteration through all tokens

**Optimization 1:** Add userId index and compare only user's tokens
```typescript
const tokens = await this.refreshTokenModel
  .find({
    user: userId,  // From decoded JWT (not yet decoded though...)
    expiresAt: { $gt: DateUtils.now() }
  })
  .exec();
```

**Problem:** Can't get userId without first validating the token

**Optimization 2:** Add token identifier to JWT payload
```typescript
// When creating refresh token
const tokenId = new mongoose.Types.ObjectId();
const refreshToken = this.jwtService.sign(
  { sub: userId, email, roles, tokenId: tokenId.toString() },
  { secret: refreshTokenSecret, expiresIn: refreshExpiresIn }
);

// Store with ID
await this.refreshTokenModel.create({
  _id: tokenId,
  user: userId,
  tokenHash: hashed,
  expiresAt: DateUtils.create(expiresAtUnix),
});

// Lookup by ID (O(1) with index)
const decoded = this.jwtService.verify(refreshToken, { secret: refreshTokenSecret });
const tokenDoc = await this.refreshTokenModel.findById(decoded.tokenId).exec();
if (tokenDoc && await CryptoUtil.comparePassword(refreshToken, tokenDoc.tokenHash)) {
  // Valid
}
```

**Impact:** O(n) → O(1) lookup, massive performance improvement at scale

---

#### B. OTP Code Generation

**Current:** Calls `OtpUtil.generate(cfg.length)` 13 times throughout the codebase

**Optimization:** Cache OTP config in memory

```typescript
private otpConfig: OtpConfigOptions | null = null;
private otpConfigExpiry: number = 0;

private async loadOtpConfig(): Promise<OtpConfigOptions> {
  const now = Date.now();
  if (this.otpConfig && now < this.otpConfigExpiry) {
    return this.otpConfig;
  }

  // Load from DB
  this.otpConfig = await this.loadOtpConfigFromDB();
  this.otpConfigExpiry = now + 60000; // Cache for 1 minute

  return this.otpConfig;
}
```

**Impact:** Reduces DB queries from ~13 per auth flow to ~1 per minute

---

#### C. Verification Token Cleanup

**Current:** No automatic cleanup of expired tokens

**Optimization:** Add TTL index in MongoDB

```typescript
@Schema({ timestamps: true })
export class VerificationToken {
  @Prop({ type: Date, required: true, index: true })
  expiresAt: Date;
}

// In migration or seed
db.verificationtokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Impact:** Automatic removal of expired documents, keeps collection small

---

#### D. Combine Duplicate OTP Verification Logic

**Current:** Three separate implementations:
- `verify()` - 64 lines
- `verifyCode()` - 133 lines
- `verifyReset()` - 70 lines

**Optimization:** Extract common logic

```typescript
private async verifyOtpCode(
  user: UserDocument | null,
  code: string,
  type: AuthMethod | 'device_verification',
  identifier?: string,
): Promise<{ user: UserDocument; isNewUser: boolean }> {
  const cfg = await this.loadOtpConfig();

  // Validate code format
  const re = new RegExp(`^\\d{${cfg.length}}$`);
  if (!re.test(code)) {
    throw new BadRequestException(`Code must be a ${cfg.length}-digit number`);
  }

  // Build query
  const query: any = { type, used: false, expiresAt: { $gt: DateUtils.now() } };
  if (user) query.user = user._id;
  else query.identifier = identifier;

  // Find and verify
  const record = await this.vtModel.findOne(query).exec();
  if (!record) throw new BadRequestException('Invalid or expired code');
  if (record.attempts >= cfg.maxAttempts) {
    throw new BadRequestException('Too many attempts. Request a new code.');
  }

  const codeValid = await CryptoUtil.comparePassword(code, record.codeHash);
  if (!codeValid) {
    await this.vtModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } }).exec();
    throw new BadRequestException('Invalid verification code');
  }

  // Clean up
  await this.vtModel.deleteOne({ _id: record._id }).exec();

  return { user, isNewUser: !user };
}
```

**Savings:** ~100 lines of duplicate code

---

### 9.2 Dashboard Optimizations

#### A. Switch to localStorage

**Current:** sessionStorage (session-only persistence)

**Change:**
```typescript
// src/auth/context/jwt/constant.ts
export const JWT_STORAGE_KEY = 'accessToken';
export const JWT_REFRESH_STORAGE_KEY = 'refreshToken';

// Update all sessionStorage calls to localStorage
localStorage.setItem(JWT_STORAGE_KEY, accessToken);
localStorage.setItem(JWT_REFRESH_STORAGE_KEY, refreshToken);
```

**Impact:** Users stay logged in across tabs/windows, better UX

---

#### B. Implement Concurrent Refresh Prevention

**Current:** Has prevention but can be improved

**Optimization:**
```typescript
let refreshPromise: Promise<any> | null = null;

export async function refreshAccessToken() {
  // Return existing refresh if in progress
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const storedRefreshToken = localStorage.getItem(JWT_REFRESH_STORAGE_KEY);
      // ... refresh logic
      return { accessToken, refreshToken };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

**Impact:** Multiple simultaneous requests won't trigger multiple refreshes

---

#### C. Clear Timer on Logout

**Current:** Timer persists after logout

**Fix:**
```typescript
let tokenRefreshTimer: NodeJS.Timeout | null = null;

export function clearTokenTimer() {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
}

export async function setSession(accessToken: string | null, refreshToken: string | null) {
  clearTokenTimer();  // Always clear first

  if (accessToken && refreshToken) {
    // ... set tokens
    tokenExpired(decodedToken.exp);
  }
}
```

**Impact:** Prevents unnecessary refresh attempts after logout

---

### 9.3 Mobile Optimizations

#### A. Fix Token Refresh (Critical)

Already covered in Section 5.2

---

#### B. Implement Token Expiration Check

**Current:** `isAuthenticated()` only checks if token exists

**Optimization:**
```typescript
// utils/auth/token-manager.ts
import { jwtDecode } from 'jwt-decode';

isAuthenticated: async (): Promise<boolean> => {
  const token = await authStorage.getAccessToken();
  if (!token) return false;

  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return false;

    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}
```

**Impact:** Prevents sending expired tokens to backend

---

#### C. Validate Token on App Resume

**Current:** No check when app resumes from background

**Optimization:**
```typescript
// hooks/use-auth.tsx
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (nextAppState === 'active' && isAuthenticated) {
      // Check if token is still valid
      const stillValid = await tokenManager.isAuthenticated();
      if (!stillValid) {
        // Try to refresh
        try {
          await refreshAccessToken();
        } catch {
          // Logout if refresh fails
          await logoutUser();
        }
      }
    }
  });

  return () => subscription.remove();
}, [isAuthenticated]);
```

**Impact:** Seamless auth experience when user returns to app

---

#### D. Add Concurrent Refresh Prevention

**Current:** None

**Optimization:**
```typescript
// api/axios.ts
let refreshPromise: Promise<any> | null = null;

if (error.response?.status === 401 && !originalRequest._retry) {
  originalRequest._retry = true;

  if (refreshPromise) {
    await refreshPromise;
    const token = await tokenManager.getAccessToken();
    originalRequest.headers!.Authorization = `Bearer ${token}`;
    return axiosInstance(originalRequest);
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        const response = await axios.post(`${API_CONFIG.BASE_URL}/public/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { data } = response;
        await tokenManager.setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      }
    } catch (refreshError) {
      await tokenManager.clearTokens();
      throw refreshError;
    } finally {
      refreshPromise = null;
    }
  })();

  const token = await refreshPromise;
  originalRequest.headers!.Authorization = `Bearer ${token}`;
  return axiosInstance(originalRequest);
}
```

**Impact:** Multiple 401s during refresh won't trigger multiple refresh calls

---

## 10. Recommendations

### 10.1 Critical Priority (Must Fix Immediately)

1. **Dashboard: Uncomment Authorization Header** ⏱️ 5 minutes
   - File: `apps/dashboard/src/lib/axios.ts`
   - Impact: Makes authentication actually work
   - Change sessionStorage to localStorage

2. **Mobile: Fix Token Refresh** ⏱️ 30 minutes
   - File: `apps/mobile/api/axios.ts`
   - Fix endpoint path, request shape, response shape
   - Add concurrent refresh prevention

3. **Backend: Remove Legacy Methods** ⏱️ 1 hour
   - Remove `login()`, `register()`, alias methods
   - Clean up unused imports
   - Reduces confusion and maintenance burden

### 10.2 High Priority (Fix Within 1 Week)

4. **Backend: Optimize Refresh Token Lookup** ⏱️ 3 hours
   - Add token ID to JWT payload
   - Change lookup from O(n) to O(1)
   - Add MongoDB TTL index for verification tokens

5. **Mobile: Add Token Validation** ⏱️ 2 hours
   - Check expiration in `isAuthenticated()`
   - Validate on app resume
   - Prevents sending expired tokens

6. **Dashboard: Fix Profile Endpoint** ⏱️ 30 minutes
   - Change from `usersAdminControllerGetProfile` to generic endpoint
   - Reduces coupling to admin module

7. **Backend: Add IP-Based Rate Limiting** ⏱️ 4 hours
   - Install @nestjs/throttler
   - Configure IP-based limits for OTP endpoints
   - Prevents OTP spam attacks

### 10.3 Medium Priority (Fix Within 1 Month)

8. **Backend: Implement Device Verification** ⏱️ 1 week
   - Enable device fingerprinting
   - Trigger on suspicious login patterns
   - Improve security significantly

9. **Backend: Refactor OTP Verification Logic** ⏱️ 4 hours
   - Extract common code from 3 implementations
   - Reduce ~100 lines of duplication
   - Easier to maintain

10. **Mobile: Implement Biometric Auth** ⏱️ 1 week
    - Use react-native-biometrics
    - Store encrypted tokens
    - Better UX and security

11. **Dashboard: Add Signup Flow** ⏱️ 3 days
    - Create signup UI
    - Implement multi-step flow
    - Allow non-admin registration

### 10.4 Low Priority (Nice to Have)

12. **Backend: Implement Social Login** ⏱️ 2 weeks
    - OAuth integration for Google, Facebook, Apple
    - Link social accounts to existing users
    - Improve onboarding conversion

13. **Backend: Add Session Management** ⏱️ 1 week
    - View active sessions
    - Remote logout
    - Security feature

14. **All: Implement Audit Logging** ⏱️ 1 week
    - Track login attempts
    - Log IP addresses
    - Detect suspicious activity

15. **Mobile: Add Offline Auth State** ⏱️ 3 days
    - Show offline indicator
    - Queue auth operations
    - Better offline UX

---

## 11. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)

**Goal:** Make authentication actually work correctly

- [ ] Dashboard: Uncomment auth header & switch to localStorage
- [ ] Mobile: Fix token refresh (endpoint, shape, prevention)
- [ ] Backend: Remove legacy login/register methods
- [ ] Add documentation for auth flows

**Outcome:** All three platforms have working authentication

---

### Phase 2: Performance & Security (Weeks 2-3)

**Goal:** Optimize performance and strengthen security

- [ ] Backend: Optimize refresh token lookup (O(1))
- [ ] Backend: Add MongoDB TTL indexes
- [ ] Backend: Implement IP-based rate limiting
- [ ] Mobile: Add token expiration validation
- [ ] Mobile: Validate tokens on app resume
- [ ] Dashboard: Fix profile endpoint usage

**Outcome:** Better performance, harder to attack

---

### Phase 3: Feature Completion (Weeks 4-6)

**Goal:** Complete partially-implemented features

- [ ] Backend: Enable device verification conditionally
- [ ] Backend: Refactor OTP verification logic
- [ ] Mobile: Implement biometric authentication
- [ ] Dashboard: Add signup flow UI
- [ ] All: Add concurrent refresh prevention improvements

**Outcome:** Feature-complete authentication system

---

### Phase 4: Advanced Features (Weeks 7-10)

**Goal:** Add advanced security and UX features

- [ ] Backend: Implement social login (Google, Facebook, Apple)
- [ ] Backend: Add session management (view/logout devices)
- [ ] Backend: Implement audit logging
- [ ] Mobile: Add offline auth state handling
- [ ] Dashboard: Add role-based UI hiding
- [ ] All: Comprehensive integration testing

**Outcome:** Production-ready, enterprise-grade auth system

---

## 12. Testing Strategy

### 12.1 Unit Tests Needed

**Backend:**
- [ ] Test all auth service methods
- [ ] Test token generation and validation
- [ ] Test OTP generation and verification
- [ ] Test rate limiting logic
- [ ] Test password strength validation

**Dashboard:**
- [ ] Test token utilities (decode, validate, refresh)
- [ ] Test auth context state management
- [ ] Test sign-in flow with mocked API
- [ ] Test password reset flow

**Mobile:**
- [ ] Test token manager utilities
- [ ] Test storage layer (with mock AsyncStorage)
- [ ] Test auth hook flows
- [ ] Test axios interceptors

### 12.2 Integration Tests Needed

- [ ] Complete signup flow (backend → frontend)
- [ ] Complete signin flow (all variations)
- [ ] Password reset flow (email & phone)
- [ ] Token refresh on 401
- [ ] Concurrent refresh prevention
- [ ] OTP rate limiting
- [ ] Session expiration handling

### 12.3 E2E Tests Needed

- [ ] User can sign up with email
- [ ] User can sign up with phone
- [ ] User can sign in with email
- [ ] User can sign in with phone
- [ ] User can reset password via email
- [ ] User can reset password via phone
- [ ] User stays logged in after app restart (mobile)
- [ ] User stays logged in after browser restart (dashboard with localStorage)
- [ ] User automatically logged out after token expiration
- [ ] User can add secondary contact
- [ ] OTP codes work correctly
- [ ] Invalid OTP codes rejected
- [ ] Expired OTP codes rejected

---

## 13. Documentation Needs

### 13.1 Developer Documentation

- [ ] Authentication architecture overview
- [ ] API authentication endpoints reference
- [ ] Token management guide
- [ ] OTP system configuration guide
- [ ] Adding new auth providers
- [ ] Testing authentication locally
- [ ] Debugging auth issues

### 13.2 User Documentation

- [ ] Sign up guide
- [ ] Sign in guide
- [ ] Password reset guide
- [ ] Adding secondary contact
- [ ] Security best practices
- [ ] Managing sessions (once implemented)

---

## 14. Conclusion

### Summary of Findings

The Nexstay authentication system is **architecturally sound** with modern multi-step flows and good separation of concerns. However, it suffers from **critical implementation bugs** that prevent it from working correctly, particularly in token refresh mechanisms.

**Strengths:**
- Well-designed multi-step authentication flows
- Proper JWT implementation with refresh token rotation
- Good OTP system with rate limiting
- Clean separation between backend, dashboard, and mobile

**Critical Issues:**
- Dashboard authorization header commented out (breaks auth)
- Mobile token refresh completely broken (wrong endpoint/shape)
- Backend has O(n) refresh token lookup (performance issue)
- Legacy unused code still present (confusion)

**Overall Assessment:**

```
Backend:    7/10 (Good architecture, needs cleanup and optimization)
Dashboard:  3/10 (Critical bug makes auth non-functional)
Mobile:     4/10 (Token refresh broken, no expiration checks)
```

### Next Steps

1. **Immediate:** Fix dashboard auth header and mobile token refresh
2. **Short-term:** Remove unused code and optimize performance
3. **Medium-term:** Complete device verification and biometric auth
4. **Long-term:** Add social login and session management

With these fixes, the authentication system will be **production-ready** and **secure** for the Nexstay platform.

---

**End of Analysis Report**
