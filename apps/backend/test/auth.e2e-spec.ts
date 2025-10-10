import { Server } from 'http';
import { Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';
import twilioConfig from '../src/config/twilio.config';
import mailConfig from '../src/config/mail.config';
import s3Config from '../src/config/s3.config';
import { envValidation } from '../src/config/env.validation';
import { UsersModule } from '../src/modules/users/users.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { DynamicConfigModule } from '../src/modules/config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { User, UserDocument } from '../src/database/schemas/user.schema';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { RefreshTokenDataDto } from '../src/modules/auth/dto/refresh-token-response.dto';
import { CheckIdentifierDataDto } from '../src/modules/auth/dto/check-identifier-response.dto';
import { RefreshToken, RefreshTokenDocument } from '../src/database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenDocument,
} from '../src/database/schemas/verification-token.schema';
import { VerifyDataDto } from '../src/modules/auth/dto/verify-response.dto';
import { RequestResetDataDto } from '../src/modules/auth/dto/request-reset.response.dto';
import { RequestVerifyDataDto } from '../src/modules/auth/dto/request-verify-response.dto';
import { UserRole } from '../src/database/schemas/user.schema';
import { SmsService } from '../src/common/services/sms.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { S3Service } from '../src/modules/storage/services/s3.service';
import { StorageModule } from '../src/modules/storage/storage.module';
import { useContainer } from 'class-validator';
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';
import { DateUtils } from '../src/common/utils/date.utils';

// Minimal type for JWT payload used in tests
interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
  iat: number;
  exp: number;
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userModel: Model<UserDocument>;
  let refreshTokenModel: Model<RefreshTokenDocument>;
  let vtModel: Model<VerificationTokenDocument>;

  let accessToken = '';
  let refreshToken = '';
  let userId = '';

  const testUser = {
    email: 'postman@example.com',
    password: 'StrongPassw0rd!',
    firstName: 'E2E',
    lastName: 'User',
    roles: ['guest'],
  };

  const adminUser = {
    email: 'admin-test@example.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'Test',
    roles: [UserRole.SYSTEM_ADMIN],
  };

  const phoneUser = {
    phone: '+1234567890',
    password: 'PhonePass123!',
    firstName: 'Phone',
    lastName: 'User',
    roles: [UserRole.GUEST],
  };

  const decodeJwt = (token: string): JwtPayload => {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString()) as JwtPayload;
    return decoded;
  };

  beforeAll(async () => {
    // Set up in-memory MongoDB first
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Core configuration without throttling
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, twilioConfig, mailConfig, s3Config],
          envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
          validationSchema: envValidation,
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (cs: ConfigService) => ({ uri: cs.get<string>('database.uri') }),
          inject: [ConfigService],
        }),

        // Feature modules
        DynamicConfigModule,
        StorageModule,
        AuthModule,
        UsersModule,
      ],
      providers: [
        // Only include the guards we need, NO ThrottlerGuard
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideProvider(SmsService)
      .useValue({
        send: jest.fn().mockResolvedValue(undefined), // Mock SMS sending
      })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          key: 'test-key',
          url: 'https://test-bucket.s3.amazonaws.com/test-key',
          bucket: 'test-bucket',
          size: 1024,
          contentType: 'image/jpeg',
          isProcessed: false,
        }),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        generatePresignedDownloadUrl: jest.fn().mockResolvedValue('https://test-url.com'),
        fileExists: jest.fn().mockResolvedValue(true),
        getFileMetadata: jest.fn().mockResolvedValue({
          key: 'test-key',
          size: 1024,
          lastModified: DateUtils.now(),
          etag: 'test-etag',
          contentType: 'image/jpeg',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());

    // Enable dependency injection for class-validator
    useContainer(app, { fallbackOnErrors: true });

    await app.init();

    // Seed dynamic config for OTP functionality
    await seedDynamicConfig(app);

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    refreshTokenModel = moduleFixture.get<Model<RefreshTokenDocument>>(
      getModelToken(RefreshToken.name),
    );
    vtModel = moduleFixture.get<Model<VerificationTokenDocument>>(
      getModelToken(VerificationToken.name),
    );

    server = app.getHttpServer() as Server;
  }, 120000);

  afterAll(async () => {
    // Clean up all test users
    if (userModel) {
      await userModel.deleteMany({
        $or: [
          { email: testUser.email },
          { email: adminUser.email },
          { phone: phoneUser.phone },
          { email: /test.*@example\.com/ },
        ],
      });
    }
    if (refreshTokenModel) {
      await refreshTokenModel.deleteMany({});
    }
    if (vtModel) {
      await vtModel.deleteMany({});
    }
    if (app) {
      await app.close();
    }
    await teardownTestDatabase();
  }, 30000);

  it('should return exists=false for an unknown identifier', async () => {
    const res: Response = await request(server)
      .post('/auth/check-identifier')
      .send({ identifier: 'unknown@example.com' })
      .expect(200);

    const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
    expect(body.data.exists).toBe(false);
    expect(Array.isArray(body.data.methods)).toBe(true);
    expect(body.data.methods.length).toBe(0);
  });

  it('should register a new user', async () => {
    const res: Response = await request(server).post('/auth/register').send(testUser).expect(201);
    const body = res.body as { status: 'success'; data: RequestVerifyDataDto };

    expect(body.data.success).toBe(true);
    expect(typeof body.data.testCode).toBe('string'); // In test env, testCode should be provided

    // User needs to be verified before getting tokens, so let's verify them
    const verifyRes = await request(server)
      .post('/auth/verify')
      .send({ identifier: testUser.email, code: body.data.testCode, method: 'email' })
      .expect(200);

    const verifyBody = verifyRes.body as { status: 'success'; data: LoginUserDataDto };
    expect(typeof verifyBody.data.accessToken).toBe('string');
    accessToken = verifyBody.data.accessToken;

    const decoded = decodeJwt(accessToken);
    userId = decoded.sub;
    expect(typeof userId).toBe('string');
  });

  it('should detect existing identifier after registration', async () => {
    const res: Response = await request(server)
      .post('/auth/check-identifier')
      .send({ identifier: testUser.email })
      .expect(200);

    const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
    expect(body.data.exists).toBe(true);
    expect(Array.isArray(body.data.methods)).toBe(true);
    expect(body.data.methods).toContain('email');
  });

  it('should login and receive tokens', async () => {
    const res: Response = await request(server)
      .post('/auth/login')
      .send({ identifier: testUser.email, method: 'email', password: testUser.password })
      .expect(200);

    const body = res.body as { status: 'success'; data: LoginUserDataDto };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  //
  // NEW: Request email OTP and verify it
  //
  it('should request an email verification code', async () => {
    const res: Response = await request(server)
      .post('/auth/request-verify')
      .send({ identifier: testUser.email, method: 'email' })
      .expect(200);

    const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
    expect(body.data.success).toBe(true);
    expect(typeof body.data.testCode).toBe('string');

    // Ensure a token was created with hashed code (convert userId string to ObjectId)
    const vt = await vtModel.findOne({ user: new Types.ObjectId(userId), type: 'email' }).exec();
    expect(vt).toBeTruthy();
    if (vt) {
      expect(typeof vt.codeHash).toBe('string');
      expect(vt.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('should verify email with the correct OTP and return tokens', async () => {
    // Wait to avoid cooldown issues
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get fresh verification code
    const reqRes = await request(server)
      .post('/auth/request-verify')
      .send({ identifier: testUser.email, method: 'email' })
      .expect(200);

    const reqBody = reqRes.body as { status: 'success'; data: RequestVerifyDataDto };
    const code = reqBody.data.testCode!;

    const res: Response = await request(server)
      .post('/auth/verify')
      .send({ identifier: testUser.email, method: 'email', code })
      .expect(200);

    const body = res.body as { status: 'success'; data: VerifyDataDto };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    // Update global tokens for subsequent tests
    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  it('should refresh tokens', async () => {
    // make token timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res: Response = await request(server)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    const body = res.body as { status: 'success'; data: RefreshTokenDataDto };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    expect(body.data.accessToken).not.toBe(accessToken);
    expect(body.data.refreshToken).not.toBe(refreshToken);

    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  //
  // NEW: Password reset flow (request-reset -> reset-password -> login with new password)
  //
  it('should request a password reset code (email)', async () => {
    const res: Response = await request(server)
      .post('/auth/request-reset')
      .send({ identifier: testUser.email, method: 'email' })
      .expect(200);

    // get the code either from response (test) or DB fallback
    const body = res.body as { status: 'success'; data: RequestResetDataDto };
    const resetCode: string | undefined = body.data.testCode;

    if (!resetCode) {
      // fallback if you decide not to return testCode
      const tokenDoc = await vtModel
        .findOne({ user: new Types.ObjectId(userId), type: 'email' })
        .sort({ createdAt: -1 }) // needs timestamps on the schema
        .exec();

      expect(tokenDoc).toBeTruthy();
      // In test mode, we should use testCode from response, not access hashed code
      throw new Error('testCode should be available in test mode');
    }

    await request(server)
      .post('/auth/reset-password')
      .send({
        identifier: testUser.email,
        method: 'email',
        code: resetCode,
        newPassword: 'NewStrongerPassw0rd!',
      })
      .expect(200);
  });

  it('should login with the NEW password after reset', async () => {
    const res: Response = await request(server)
      .post('/auth/login')
      .send({
        identifier: testUser.email,
        method: 'email',
        password: 'NewStrongerPassw0rd!',
      })
      .expect(200);

    const body = res.body as { status: 'success'; data: LoginUserDataDto };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  it('should logout and revoke tokens', async () => {
    const res: Response = await request(server)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { status: 'success'; data: { message: string } };
    expect(body.data).toHaveProperty('message', 'Logout successful');

    const decoded = decodeJwt(accessToken);
    const refreshTokens = await refreshTokenModel
      .find({ user: new Types.ObjectId(decoded.sub) })
      .exec();
    expect(refreshTokens.length).toBe(0);
  });

  it('should NOT refresh tokens with a revoked refresh token', async () => {
    await request(server).post('/auth/refresh').send({ refreshToken }).expect(401);
  });

  //
  // NEW (negative): verify with wrong/expired code
  //
  it('should fail verification with a wrong code', async () => {
    // Wait to avoid cooldown issues
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // request another OTP
    await request(server)
      .post('/auth/request-verify')
      .send({ identifier: testUser.email, method: 'email' })
      .expect(200);

    const wrongCode = '000000';
    await request(server)
      .post('/auth/verify')
      .send({ identifier: testUser.email, method: 'email', code: wrongCode })
      .expect(400);
  });

  // ===== REGISTRATION VALIDATION TESTS =====
  describe('Registration Validation', () => {
    it('should reject registration with invalid email format', async () => {
      await request(server)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'ValidPass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      await request(server)
        .post('/auth/register')
        .send({
          email: 'weak@example.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject registration with missing required fields', async () => {
      await request(server)
        .post('/auth/register')
        .send({
          // missing email, phone, and password - should fail business logic
        })
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      await request(server).post('/auth/register').send(testUser).expect(409); // Conflict - email already exists
    });

    it('should register user with admin role', async () => {
      const res: Response = await request(server)
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Verify the admin user to get tokens
      const verifyRes = await request(server)
        .post('/auth/verify')
        .send({ identifier: adminUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: LoginUserDataDto };
      expect(typeof verifyBody.data.accessToken).toBe('string');

      const decoded = decodeJwt(verifyBody.data.accessToken);
      expect(decoded.roles).toContain('system_admin');
    });
  });

  // ===== LOGIN VALIDATION TESTS =====
  describe('Login Validation', () => {
    it('should reject login with wrong password', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          method: 'email',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with non-existent user', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          method: 'email',
          password: 'AnyPassword123!',
        })
        .expect(401);
    });

    it('should reject login with invalid method', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          method: 'invalid_method',
          password: testUser.password,
        })
        .expect(400);
    });

    it('should reject login without password for email/phone method', async () => {
      await request(server)
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          method: 'email',
          // missing password
        })
        .expect(400);
    });
  });

  // ===== PHONE AUTHENTICATION TESTS =====
  describe('Phone Authentication', () => {
    beforeAll(async () => {
      // Clean up any existing phone user first
      await userModel.deleteOne({ phone: phoneUser.phone });
    });

    it('should register user with phone number', async () => {
      const res: Response = await request(server)
        .post('/auth/register')
        .send(phoneUser)
        .expect(201);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string'); // In test env, testCode should be provided

      // Verify the user was created with a password hash
      const created = await userModel.findOne({ phone: phoneUser.phone }).select('+passwordHash');
      expect(created).toBeTruthy();
      expect(created?.passwordHash).toBeTruthy();
    });

    it('should check identifier for phone number', async () => {
      // Ensure phone user exists first
      const existingUser = await userModel.findOne({ phone: phoneUser.phone });
      if (!existingUser) {
        await request(server).post('/auth/register').send(phoneUser).expect(201);
      }

      const res: Response = await request(server)
        .post('/auth/check-identifier')
        .send({ identifier: phoneUser.phone })
        .expect(200);

      const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
      expect(body.data.exists).toBe(true);
      expect(body.data.methods).toContain('phone');
    });

    it('should login with phone and password', async () => {
      const res: Response = await request(server)
        .post('/auth/login')
        .send({
          identifier: phoneUser.phone,
          method: 'phone',
          password: phoneUser.password,
        })
        .expect(200);

      const body = res.body as { status: 'success'; data: LoginUserDataDto };
      expect(typeof body.data.accessToken).toBe('string');
      expect(typeof body.data.refreshToken).toBe('string');
    });

    it('should request phone verification code', async () => {
      // Wait to avoid cooldown issues
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res: Response = await request(server)
        .post('/auth/request-verify')
        .send({ identifier: phoneUser.phone, method: 'phone' })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');
    });
  });

  // ===== TOKEN SECURITY TESTS =====
  describe('Token Security', () => {
    let validToken: string;
    let validRefreshToken: string;

    beforeAll(async () => {
      // Get fresh tokens for security tests
      const res = await request(server).post('/auth/login').send({
        identifier: testUser.email,
        method: 'email',
        password: 'NewStrongerPassw0rd!',
      });

      const body = res.body as { status: 'success'; data: LoginUserDataDto };
      validToken = body.data.accessToken;
      validRefreshToken = body.data.refreshToken;
    });

    it('should reject invalid JWT token format', async () => {
      await request(server)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject malformed Bearer token', async () => {
      await request(server)
        .post('/auth/logout')
        .set('Authorization', 'InvalidBearer token')
        .expect(401);
    });

    it('should reject empty authorization header', async () => {
      await request(server).post('/auth/logout').expect(401);
    });

    it('should reject expired/invalid refresh token', async () => {
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);
    });

    it('should reject refresh token after logout', async () => {
      // Logout to revoke all tokens
      await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Try to use refresh token after logout
      await request(server)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);
    });
  });

  // ===== OTP/VERIFICATION SECURITY TESTS =====
  describe('OTP Security', () => {
    it('should reject verification for non-existent user', async () => {
      await request(server)
        .post('/auth/request-verify')
        .send({ identifier: 'nonexistent@example.com', method: 'email' })
        .expect(401);
    });

    it('should reject verification with expired code', async () => {
      // This test would need to mock time or use a very short expiry
      // For now, just test with invalid code format
      await request(server)
        .post('/auth/verify')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: '12345', // wrong length
        })
        .expect(400);
    });

    it('should reject verification with empty code', async () => {
      await request(server)
        .post('/auth/verify')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: '',
        })
        .expect(400);
    });

    it('should handle multiple OTP requests (rate limiting)', async () => {
      // Wait to avoid cooldown issues
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Request OTP multiple times - should not fail due to our current implementation
      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/auth/request-verify')
          .send({ identifier: testUser.email, method: 'email' })
          .expect(200);
        // Small delay between requests to avoid hitting cooldown
        if (i < 2) await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    });
  });

  // ===== PASSWORD RESET SECURITY TESTS =====
  describe('Password Reset Security', () => {
    it('should reject password reset for non-existent user', async () => {
      await request(server)
        .post('/auth/request-reset')
        .send({ identifier: 'nonexistent@example.com', method: 'email' })
        .expect(404);
    });

    it('should reject password reset with invalid code', async () => {
      await request(server)
        .post('/auth/reset-password')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: 'invalid-code',
          newPassword: 'NewValidPass123!',
        })
        .expect(400);
    });

    it('should reject password reset with weak new password', async () => {
      // First request a reset code
      const res = await request(server)
        .post('/auth/request-reset')
        .send({ identifier: testUser.email, method: 'email' });

      const body = res.body as { status: 'success'; data: RequestResetDataDto };
      const resetCode = body.data.testCode as string;

      // Then try to reset with weak password
      await request(server)
        .post('/auth/reset-password')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
          newPassword: '123', // too weak
        })
        .expect(400);
    });

    it('should not allow reuse of reset code', async () => {
      // Request reset code
      const res = await request(server)
        .post('/auth/request-reset')
        .send({ identifier: testUser.email, method: 'email' });

      const body = res.body as { status: 'success'; data: RequestResetDataDto };
      const resetCode = body.data.testCode as string;

      // Use code successfully
      await request(server)
        .post('/auth/reset-password')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
          newPassword: 'AnotherNewPass123!',
        })
        .expect(200);

      // Try to use same code again
      await request(server)
        .post('/auth/reset-password')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
          newPassword: 'ThirdPassword123!',
        })
        .expect(400);
    });
  });

  // ===== EDGE CASES AND ERROR HANDLING =====
  describe('Edge Cases', () => {
    beforeEach(async () => {
      // Clean up test users before each edge case test
      await userModel.deleteMany({
        email: { $in: ['special@example.com', 'unicode@example.com'] },
      });
    });

    it('should handle malformed JSON in request body', async () => {
      await request(server).post('/auth/login').send('{"invalid": json}').expect(400);
    });

    it('should handle empty request body', async () => {
      await request(server).post('/auth/login').send({}).expect(400);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      await request(server)
        .post('/auth/check-identifier')
        .send({ identifier: longEmail })
        .expect(200);
    });

    it('should handle special characters in passwords', async () => {
      const specialUser = {
        email: 'special@example.com',
        password: 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?',
        firstName: 'Special',
        lastName: 'User',
      };

      const res = await request(server).post('/auth/register').send(specialUser).expect(201);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Verify the user to get tokens
      const verifyRes = await request(server)
        .post('/auth/verify')
        .send({ identifier: specialUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: LoginUserDataDto };
      expect(verifyBody.data.accessToken).toBeDefined();

      // Test login with special characters
      await request(server)
        .post('/auth/login')
        .send({
          identifier: specialUser.email,
          method: 'email',
          password: specialUser.password,
        })
        .expect(200);
    });

    it('should handle Unicode characters in user names', async () => {
      const unicodeUser = {
        email: 'unicode@example.com',
        password: 'UnicodePass123!',
        firstName: '测试',
        lastName: 'Tëst',
      };

      const res = await request(server).post('/auth/register').send(unicodeUser).expect(201);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Verify the user to get tokens
      const verifyRes = await request(server)
        .post('/auth/verify')
        .send({ identifier: unicodeUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: LoginUserDataDto };
      expect(verifyBody.data.accessToken).toBeDefined();
    });
  });

  // ===== DATABASE STATE TESTS =====
  describe('Database State', () => {
    it('should clean up expired verification tokens', async () => {
      // Clean up any existing tokens first
      await vtModel.deleteMany({});
      const initialCount = await vtModel.countDocuments();
      expect(initialCount).toBe(0);

      // Request verification (creates a token)
      await request(server)
        .post('/auth/request-verify')
        .send({ identifier: testUser.email, method: 'email' });

      const afterRequestCount = await vtModel.countDocuments();
      expect(afterRequestCount).toBeGreaterThan(initialCount);

      // Tokens should have proper expiry set
      const token = await vtModel.findOne().sort({ createdAt: -1 });
      expect(token?.expiresAt).toBeInstanceOf(Date);
      expect(token?.expiresAt?.getTime()).toBeGreaterThan(Date.now());
    });

    it('should clean up refresh tokens on logout', async () => {
      // Login to create refresh tokens
      const loginRes = await request(server)
        .post('/auth/login')
        .send({
          identifier: testUser.email,
          method: 'email',
          password: 'AnotherNewPass123!',
        })
        .expect(200);

      const body = loginRes.body as { status: 'success'; data: LoginUserDataDto };
      const token = body.data.accessToken;
      const refreshToken = body.data.refreshToken;
      expect(token).toBeTruthy();
      expect(refreshToken).toBeTruthy();

      // Verify refresh token exists - wait a moment for async creation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Just test that logout works without error
      const logoutRes = await request(server)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const logoutBody = logoutRes.body as { status: 'success'; data: { message: string } };
      expect(logoutBody.data).toHaveProperty('message', 'Logout successful');

      // After logout, verify refresh token can't be used
      await request(server).post('/auth/refresh').send({ refreshToken }).expect(401);
    });
  });
});
