# Backend Requirements for Token Validation

## Overview

The frontend has been refactored to follow a **backend-driven** authentication approach. This means **the backend is responsible for ALL token validation**.

## Critical Backend Requirements

### 1. Protected Endpoints Must Validate Tokens

Every protected endpoint MUST have authentication guards that validate:
- JWT signature
- Token expiration time
- Token not revoked (if using revocation)
- User still exists and is active

#### NestJS Example:
```typescript
@Controller('api')
@UseGuards(JwtAuthGuard) // Apply to all routes in controller
export class ProtectedController {

  @Get('user/profile')
  async getProfile(@CurrentUser() user: User) {
    // JwtAuthGuard already validated token
    return user;
  }
}
```

#### JWT Auth Guard (NestJS):
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      // Token is invalid, expired, or missing
      throw new UnauthorizedException(
        info?.message || 'Invalid or expired token'
      );
    }
    return user;
  }
}
```

---

### 2. Return 401 for Invalid Tokens

When a token is invalid or expired, backend MUST return:

**Status Code:** `401 Unauthorized`

**Response Body:**
```json
{
  "statusCode": 401,
  "message": "Token expired" | "Token invalid" | "Unauthorized",
  "error": "Unauthorized"
}
```

**DO NOT return 403 Forbidden** - that's for authorization (permissions), not authentication.

---

### 3. Refresh Token Endpoint Validation

The refresh endpoint MUST thoroughly validate refresh tokens.

#### Endpoint: `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Validation Steps:**
```typescript
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  const { refreshToken } = dto;

  // 1. Verify JWT signature
  let payload;
  try {
    payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token signature');
  }

  // 2. Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) {
    throw new UnauthorizedException('Refresh token expired');
  }

  // 3. Check if token is revoked (if using revocation list)
  const isRevoked = await this.tokenService.isRevoked(refreshToken);
  if (isRevoked) {
    throw new UnauthorizedException('Refresh token revoked');
  }

  // 4. Verify user still exists and is active
  const user = await this.userService.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedException('User not found or inactive');
  }

  // 5. Generate new tokens
  const newAccessToken = await this.generateAccessToken(user);
  const newRefreshToken = await this.generateRefreshToken(user);

  // 6. Optionally revoke old refresh token (for rotation)
  await this.tokenService.revokeToken(refreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token expired",
  "error": "Unauthorized"
}
```

---

### 4. Token Generation Standards

#### Access Token
- **Expiration:** 15 minutes (recommended)
- **Payload:**
  ```json
  {
    "sub": "userId",
    "email": "user@example.com",
    "role": "user",
    "iat": 1234567890,
    "exp": 1234568790
  }
  ```

#### Refresh Token
- **Expiration:** 7 days (recommended)
- **Payload:**
  ```json
  {
    "sub": "userId",
    "type": "refresh",
    "iat": 1234567890,
    "exp": 1235172690
  }
  ```

**Different secrets:** Use different secrets for access and refresh tokens.

```typescript
// .env
JWT_ACCESS_SECRET=your-access-token-secret-key
JWT_REFRESH_SECRET=your-refresh-token-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

---

### 5. Token Revocation (Recommended)

Implement token revocation for:
- Logout
- Password change
- Security incidents
- Admin-initiated logout

#### Option A: Revocation List (Simple)
```typescript
// Store revoked tokens in database or Redis
interface RevokedToken {
  token: string;
  revokedAt: Date;
  expiresAt: Date; // Clean up after expiration
}

async isRevoked(token: string): Promise<boolean> {
  const revoked = await this.revokedTokenModel.findOne({ token });
  return !!revoked;
}

async revokeToken(token: string): Promise<void> {
  const payload = this.jwtService.decode(token);
  await this.revokedTokenModel.create({
    token,
    revokedAt: new Date(),
    expiresAt: new Date(payload.exp * 1000),
  });
}
```

#### Option B: Token Versioning (Better)
```typescript
// Add version field to user model
interface User {
  tokenVersion: number; // Increment on logout/password change
}

// Include in JWT payload
const payload = {
  sub: user.id,
  tokenVersion: user.tokenVersion,
  // ...
};

// Validate version on each request
if (payload.tokenVersion !== user.tokenVersion) {
  throw new UnauthorizedException('Token revoked');
}
```

---

### 6. Logout Endpoint

Implement proper logout that revokes refresh tokens.

```typescript
@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(
  @CurrentUser() user: User,
  @Body() dto: LogoutDto
) {
  const { refreshToken } = dto;

  // Revoke the refresh token
  await this.tokenService.revokeToken(refreshToken);

  // Optionally: Increment token version to invalidate all tokens
  await this.userService.incrementTokenVersion(user.id);

  return { message: 'Logged out successfully' };
}
```

---

### 7. Error Response Format

**Consistent error format across all auth endpoints:**

```typescript
// Unauthorized (401)
{
  "statusCode": 401,
  "message": "Token expired" | "Invalid token" | "Refresh token expired",
  "error": "Unauthorized"
}

// Forbidden (403) - for authorization, NOT authentication
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**DO NOT mix 401 and 403 for authentication errors.**

---

## Security Best Practices

### 1. Use HTTPS Only
- Never transmit tokens over HTTP
- Enforce HTTPS in production

### 2. Secure Token Storage
- Access tokens: Short-lived (15 min)
- Refresh tokens: Longer-lived but revocable (7 days)

### 3. Token Rotation
```typescript
// On each refresh, issue new refresh token
const newRefreshToken = await generateRefreshToken(user);

// Revoke old refresh token
await revokeToken(oldRefreshToken);

return { accessToken, refreshToken: newRefreshToken };
```

### 4. Rate Limiting
```typescript
// Limit refresh attempts
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  // ...
}
```

### 5. Audit Logging
```typescript
// Log all authentication events
await this.auditLog.create({
  userId: user.id,
  action: 'token_refresh',
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  success: true,
  timestamp: new Date(),
});
```

---

## Testing Checklist

### Backend Tests Required

- [ ] Access token expires after configured time
- [ ] Expired access token returns 401
- [ ] Refresh endpoint validates signature
- [ ] Refresh endpoint checks expiration
- [ ] Expired refresh token returns 401
- [ ] Revoked refresh token returns 401
- [ ] Invalid refresh token signature returns 401
- [ ] Refresh token for non-existent user returns 401
- [ ] Refresh token for inactive user returns 401
- [ ] New tokens are returned on successful refresh
- [ ] Logout revokes refresh token
- [ ] Revoked token cannot be used
- [ ] Token rotation works correctly
- [ ] Rate limiting prevents abuse

---

## Example: Complete NestJS Implementation

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Additional validation beyond JWT signature/expiration
    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check token version (if using versioning)
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Token revoked');
    }

    return user;
  }
}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async refresh(refreshToken: string) {
    // Validate refresh token
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check revocation
    if (await this.tokenService.isRevoked(refreshToken)) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // Get user
    const user = await this.userService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Revoke old refresh token (rotation)
    await this.tokenService.revokeToken(refreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
      }
    );
  }

  private generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
        tokenVersion: user.tokenVersion,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      }
    );
  }
}
```

---

## Frontend Expectations

The frontend now expects:

1. **401 on expired/invalid access token** - Will attempt refresh
2. **401 on expired/invalid refresh token** - Will logout user
3. **Consistent error format** - For proper error handling
4. **New tokens on successful refresh** - Both access and refresh

The frontend will:
- ✅ Send access token in Authorization header
- ✅ Automatically attempt refresh on 401
- ✅ Logout user if refresh fails
- ✅ Show "Session Expired" alert
- ✅ Navigate to login screen

The frontend will NOT:
- ❌ Validate token expiration times
- ❌ Check token signatures
- ❌ Guess if tokens are valid

---

## Summary

**Backend Responsibilities:**
1. Validate all tokens on every request
2. Return 401 for invalid/expired tokens
3. Thoroughly validate refresh tokens
4. Support token revocation
5. Use secure token generation practices

**Frontend Responsibilities:**
1. Store tokens securely
2. Attach tokens to requests
3. React to 401 errors
4. Show appropriate UI feedback

This separation of concerns follows OAuth 2.0 best practices and industry standards.
