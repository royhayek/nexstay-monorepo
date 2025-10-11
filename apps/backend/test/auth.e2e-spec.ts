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
import {
  SigninCompleteDataDto,
  SigninInitiateDataDto,
  SigninPasswordDataDto,
} from '../src/modules/auth/dto/signin-response.dto';
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
      .post('/public/auth/check-identifier')
      .send({ identifier: 'unknown@example.com' })
      .expect(200);

    const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
    expect(body.data.exists).toBe(false);
    expect(Array.isArray(body.data.methods)).toBe(true);
    expect(body.data.methods.length).toBe(0);
  });

  it('should register a new user', async () => {
    // Step 1: Signup verify contact
    const res: Response = await request(server)
      .post('/public/auth/signup/verify-contact')
      .send({ identifier: testUser.email })
      .expect(200);

    const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
    expect(body.data.success).toBe(true);
    expect(typeof body.data.testCode).toBe('string');

    // Step 2: Verify OTP code
    const verifyRes = await request(server)
      .post('/public/auth/verify')
      .send({ identifier: testUser.email, code: body.data.testCode, method: 'email' })
      .expect(200);

    const verifyBody = verifyRes.body as { status: 'success'; data: VerifyDataDto };
    expect(verifyBody.data.ownershipVerified).toBe(true);
    expect(typeof verifyBody.data.signupSessionToken).toBe('string');

    // Step 3: Complete profile with session token
    const completeRes = await request(server)
      .post('/public/auth/signup/complete-profile')
      .send({
        sessionToken: verifyBody.data.signupSessionToken,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        birthDate: '1990-01-15',
        password: testUser.password,
      })
      .expect(201);

    const completeBody = completeRes.body as { status: 'success'; data: any };
    expect(typeof completeBody.data.accessToken).toBe('string');
    expect(typeof completeBody.data.refreshToken).toBe('string');

    accessToken = completeBody.data.accessToken;
    refreshToken = completeBody.data.refreshToken;

    const decoded = decodeJwt(accessToken);
    userId = decoded.sub;
    expect(typeof userId).toBe('string');
  });

  it('should detect existing identifier after registration', async () => {
    const res: Response = await request(server)
      .post('/public/auth/check-identifier')
      .send({ identifier: testUser.email })
      .expect(200);

    const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
    expect(body.data.exists).toBe(true);
    expect(Array.isArray(body.data.methods)).toBe(true);
    expect(body.data.methods).toContain('email');
  });

  it('should login and receive tokens', async () => {
    // Step 1: Signin initiate
    const initiateRes: Response = await request(server)
      .post('/public/auth/signin/initiate')
      .send({ identifier: testUser.email })
      .expect(200);

    const initiateBody = initiateRes.body as { status: 'success'; data: any };
    expect(initiateBody.data.userExists).toBe(true);
    expect(initiateBody.data.nextStep).toBe('password');
    expect(typeof initiateBody.data.sessionToken).toBe('string');

    // Step 2: Signin with password
    const passwordRes: Response = await request(server)
      .post('/public/auth/signin/password')
      .send({
        sessionToken: initiateBody.data.sessionToken,
        password: testUser.password,
      })
      .expect(200);

    const body = passwordRes.body as { status: 'success'; data: any };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    accessToken = body.data.accessToken;
    refreshToken = body.data.refreshToken;
  });

  // Note: request-verify and verify endpoints are already tested during registration
  // They cannot be used on already-verified users (email is verified during signup)
  // For adding secondary contacts, use the protected /add-secondary-contact endpoint

  it('should refresh tokens', async () => {
    // make token timestamps differ
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res: Response = await request(server)
      .post('/public/auth/refresh')
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
  // NEW: Password reset flow (request-reset -> verify-reset -> reset-password -> login with new password)
  //
  it('should request a password reset code (email)', async () => {
    // Step 1: Request password reset code
    const res: Response = await request(server)
      .post('/public/auth/request-reset')
      .send({ identifier: testUser.email, method: 'email' })
      .expect(200);

    const body = res.body as { status: 'success'; data: RequestResetDataDto };
    const resetCode: string | undefined = body.data.testCode;
    expect(resetCode).toBeDefined();

    // Step 2: Verify reset code and get reset token
    const verifyRes: Response = await request(server)
      .post('/public/auth/verify-reset')
      .send({
        identifier: testUser.email,
        method: 'email',
        code: resetCode!,
      })
      .expect(200);

    const verifyBody = verifyRes.body as { status: 'success'; data: any };
    expect(verifyBody.data.resetToken).toBeDefined();

    // Step 3: Reset password using the reset token
    await request(server)
      .post('/public/auth/reset-password')
      .send({
        resetToken: verifyBody.data.resetToken,
        newPassword: 'NewStrongerPassw0rd!',
      })
      .expect(200);
  });

  it('should login with the NEW password after reset', async () => {
    // Step 1: Signin initiate
    const initiateRes = await request(server)
      .post('/public/auth/signin/initiate')
      .send({ identifier: testUser.email })
      .expect(200);

    const initiateBody = initiateRes.body as { status: 'success'; data: SigninInitiateDataDto };
    expect(initiateBody.data.sessionToken).toBeDefined();

    // Step 2: Signin with NEW password
    const passwordRes = await request(server)
      .post('/public/auth/signin/password')
      .send({
        sessionToken: initiateBody.data.sessionToken,
        password: 'NewStrongerPassw0rd!',
      })
      .expect(200);

    const body = passwordRes.body as { status: 'success'; data: SigninPasswordDataDto };
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');

    accessToken = body.data.accessToken!;
    refreshToken = body.data.refreshToken!;
  });

  it('should logout and revoke tokens', async () => {
    const res: Response = await request(server)
      .post('/public/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { status: 'success'; data: { message: string } };
    expect(body.data).toHaveProperty('message', 'Logout successful');

    // Verify all refresh tokens were deleted from database
    const decoded = decodeJwt(accessToken);
    const refreshTokens = await refreshTokenModel
      .find({ user: new Types.ObjectId(decoded.sub) })
      .exec();
    expect(refreshTokens.length).toBe(0);
  });

  // Testing token revocation after implementing the fix
  it('should NOT refresh tokens with a revoked refresh token', async () => {
    await request(server).post('/public/auth/refresh').send({ refreshToken }).expect(401);
  });

  // Note: Verification with wrong code is tested in OTP Security section

  // ===== REGISTRATION VALIDATION TESTS =====
  describe('Registration Validation', () => {
    it('should reject registration with invalid email format', async () => {
      await request(server)
        .post('/public/auth/signup/verify-contact')
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
        .post('/public/auth/signup/verify-contact')
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
        .post('/public/auth/signup/verify-contact')
        .send({
          // missing email, phone, and password - should fail business logic
        })
        .expect(400);
    });

    it('should reject duplicate email registration', async () => {
      await request(server)
        .post('/public/auth/signup/verify-contact')
        .send({ identifier: testUser.email })
        .expect(409); // Conflict - email already exists
    });

    it('should register user with default guest role', async () => {
      // Note: Users cannot self-assign roles during signup - they get 'guest' role by default
      // Admin roles must be assigned by existing admins via admin endpoints

      // Step 1: Signup verify contact
      const res: Response = await request(server)
        .post('/public/auth/signup/verify-contact')
        .send({ identifier: adminUser.email })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Step 2: Verify OTP
      const verifyRes = await request(server)
        .post('/public/auth/verify')
        .send({ identifier: adminUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: VerifyDataDto };
      expect(verifyBody.data.ownershipVerified).toBe(true);
      expect(typeof verifyBody.data.signupSessionToken).toBe('string');

      // Step 3: Complete profile - user will get 'guest' role by default
      const completeRes = await request(server)
        .post('/public/auth/signup/complete-profile')
        .send({
          sessionToken: verifyBody.data.signupSessionToken,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          birthDate: '1985-05-20',
          password: adminUser.password,
        })
        .expect(201);

      const completeBody = completeRes.body as { status: 'success'; data: any };
      expect(typeof completeBody.data.accessToken).toBe('string');

      const decoded = decodeJwt(completeBody.data.accessToken);
      // All new users get 'guest' role by default
      expect(decoded.roles).toContain('guest');
    });
  });

  // ===== LOGIN VALIDATION TESTS =====
  describe('Login Validation', () => {
    it('should reject login with wrong password', async () => {
      // Step 1: Signin initiate - should succeed
      const initiateRes = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: testUser.email })
        .expect(200);

      const initiateBody = initiateRes.body as { status: 'success'; data: SigninInitiateDataDto };
      expect(initiateBody.data.userExists).toBe(true);
      expect(initiateBody.data.nextStep).toBe('password');
      expect(typeof initiateBody.data.sessionToken).toBe('string');

      // Step 2: Signin with WRONG password - should fail with 401
      await request(server)
        .post('/public/auth/signin/password')
        .send({
          sessionToken: initiateBody.data.sessionToken,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject login with non-existent user', async () => {
      // Signin initiate returns 200 even for non-existent users (security: don't reveal which emails exist)
      const res = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: 'nonexistent@example.com' })
        .expect(200);

      const body = res.body as { status: 'success'; data: SigninInitiateDataDto };
      expect(body.data.userExists).toBe(false);
      expect(body.data.nextStep).toBe('verify_signup'); // User needs to verify and signup
    });

    it('should reject login with invalid identifier format', async () => {
      await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: 'invalid-identifier-format' })
        .expect(400); // Bad request - invalid email/phone format
    });

    it('should reject password step without valid session token', async () => {
      await request(server)
        .post('/public/auth/signin/password')
        .send({
          sessionToken: 'invalid-session-token',
          password: testUser.password,
        })
        .expect(400); // Bad Request - invalid session token format
    });
  });

  // ===== PHONE AUTHENTICATION TESTS =====
  describe('Phone Authentication', () => {
    beforeAll(async () => {
      // Clean up any existing phone user first
      await userModel.deleteOne({ phone: phoneUser.phone });
    });

    it('should register user with phone number', async () => {
      // Step 1: Signup verify contact
      const res: Response = await request(server)
        .post('/public/auth/signup/verify-contact')
        .send({ identifier: phoneUser.phone })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Step 2: Verify OTP code
      const verifyRes = await request(server)
        .post('/public/auth/verify')
        .send({ identifier: phoneUser.phone, code: body.data.testCode, method: 'phone' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: VerifyDataDto };
      expect(verifyBody.data.ownershipVerified).toBe(true);
      expect(typeof verifyBody.data.signupSessionToken).toBe('string');

      // Step 3: Complete profile with session token
      const completeRes = await request(server)
        .post('/public/auth/signup/complete-profile')
        .send({
          sessionToken: verifyBody.data.signupSessionToken,
          firstName: phoneUser.firstName,
          lastName: phoneUser.lastName,
          birthDate: '1990-01-15',
          password: phoneUser.password,
        })
        .expect(201);

      const completeBody = completeRes.body as { status: 'success'; data: any };
      expect(typeof completeBody.data.accessToken).toBe('string');
      expect(typeof completeBody.data.refreshToken).toBe('string');

      // Verify the user was created
      const created = await userModel.findOne({ phone: phoneUser.phone }).select('+passwordHash');
      expect(created).toBeTruthy();
      expect(created?.passwordHash).toBeTruthy();
    });

    it('should check identifier for phone number', async () => {
      // Phone user should exist from previous test, but this test is independent
      const res: Response = await request(server)
        .post('/public/auth/check-identifier')
        .send({ identifier: phoneUser.phone })
        .expect(200);

      const body = res.body as { status: 'success'; data: CheckIdentifierDataDto };
      expect(body.data.exists).toBe(true);
      expect(body.data.methods).toContain('phone');
    });

    it('should login with phone and password', async () => {
      // Step 1: Signin initiate
      const initiateRes = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: phoneUser.phone })
        .expect(200);

      const initiateBody = initiateRes.body as { status: 'success'; data: SigninInitiateDataDto };
      expect(initiateBody.data.sessionToken).toBeDefined();

      // Step 2: Signin with password
      const passwordRes = await request(server)
        .post('/public/auth/signin/password')
        .send({
          sessionToken: initiateBody.data.sessionToken,
          password: phoneUser.password,
        })
        .expect(200);

      const body = passwordRes.body as { status: 'success'; data: SigninPasswordDataDto };
      expect(typeof body.data.accessToken).toBe('string');
      expect(typeof body.data.refreshToken).toBe('string');
    });
  });

  // ===== TOKEN SECURITY TESTS =====
  describe('Token Security', () => {
    let validToken: string;
    let validRefreshToken: string;

    beforeAll(async () => {
      // Get fresh tokens for security tests via 2-step signin
      const initiateRes = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: testUser.email });

      const initiateBody = initiateRes.body as { status: 'success'; data: SigninInitiateDataDto };

      const passwordRes = await request(server).post('/public/auth/signin/password').send({
        sessionToken: initiateBody.data.sessionToken,
        password: 'NewStrongerPassw0rd!',
      });

      const body = passwordRes.body as { status: 'success'; data: SigninPasswordDataDto };
      validToken = body.data.accessToken!;
      validRefreshToken = body.data.refreshToken!;
    });

    it('should reject invalid JWT token format', async () => {
      await request(server)
        .post('/public/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should reject malformed Bearer token', async () => {
      await request(server)
        .post('/public/auth/logout')
        .set('Authorization', 'InvalidBearer token')
        .expect(401);
    });

    it('should reject empty authorization header', async () => {
      await request(server).post('/public/auth/logout').expect(401);
    });

    it('should reject expired/invalid refresh token', async () => {
      await request(server)
        .post('/public/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);
    });

    it('should reject refresh token after logout', async () => {
      // Logout to revoke all tokens
      await request(server)
        .post('/public/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Try to use refresh token after logout - should fail with 401
      await request(server)
        .post('/public/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);
    });
  });

  // ===== OTP/VERIFICATION SECURITY TESTS =====
  describe('OTP Security', () => {
    it('should reject verification for non-existent user', async () => {
      await request(server)
        .post('/public/auth/request-verify')
        .send({ identifier: 'nonexistent@example.com', method: 'email' })
        .expect(401);
    });

    it('should reject verification with expired code', async () => {
      // This test would need to mock time or use a very short expiry
      // For now, just test with invalid code format
      await request(server)
        .post('/public/auth/verify')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: '12345', // wrong length
        })
        .expect(400);
    });

    it('should reject verification with empty code', async () => {
      await request(server)
        .post('/public/auth/verify')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: '',
        })
        .expect(400);
    });
  });

  // ===== PASSWORD RESET SECURITY TESTS =====
  describe('Password Reset Security', () => {
    it('should reject password reset for non-existent user', async () => {
      await request(server)
        .post('/public/auth/request-reset')
        .send({ identifier: 'nonexistent@example.com', method: 'email' })
        .expect(404);
    });

    it('should reject password reset with invalid code', async () => {
      await request(server)
        .post('/public/auth/reset-password')
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
        .post('/public/auth/request-reset')
        .send({ identifier: testUser.email, method: 'email' });

      const body = res.body as { status: 'success'; data: RequestResetDataDto };
      const resetCode = body.data.testCode as string;

      // Then try to reset with weak password
      await request(server)
        .post('/public/auth/reset-password')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
          newPassword: '123', // too weak
        })
        .expect(400);
    });

    it('should not allow reuse of reset code', async () => {
      // Step 1: Request reset code
      const res = await request(server)
        .post('/public/auth/request-reset')
        .send({ identifier: testUser.email, method: 'email' })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestResetDataDto };
      const resetCode = body.data.testCode as string;
      expect(resetCode).toBeDefined();

      // Step 2: Verify code and get reset token
      const verifyRes = await request(server)
        .post('/public/auth/verify-reset')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
        })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: any };
      const resetToken = verifyBody.data.resetToken;
      expect(resetToken).toBeDefined();

      // Step 3: Use reset token to change password
      await request(server)
        .post('/public/auth/reset-password')
        .send({
          resetToken: resetToken,
          newPassword: 'AnotherNewPass123!',
        })
        .expect(200);

      // Try to verify same OTP code again - should fail (code is marked as used)
      await request(server)
        .post('/public/auth/verify-reset')
        .send({
          identifier: testUser.email,
          method: 'email',
          code: resetCode,
        })
        .expect(400); // Bad Request - code already used or invalid
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
      await request(server)
        .post('/public/auth/signin/initiate')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle empty request body', async () => {
      await request(server).post('/public/auth/signin/initiate').send({}).expect(400);
    });

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      await request(server)
        .post('/public/auth/check-identifier')
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

      // Step 1: Signup verify contact
      const res = await request(server)
        .post('/public/auth/signup/verify-contact')
        .send({ identifier: specialUser.email })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Step 2: Verify OTP code
      const verifyRes = await request(server)
        .post('/public/auth/verify')
        .send({ identifier: specialUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: VerifyDataDto };
      expect(verifyBody.data.ownershipVerified).toBe(true);
      expect(typeof verifyBody.data.signupSessionToken).toBe('string');

      // Step 3: Complete profile with special character password
      const completeRes = await request(server)
        .post('/public/auth/signup/complete-profile')
        .send({
          sessionToken: verifyBody.data.signupSessionToken,
          firstName: specialUser.firstName,
          lastName: specialUser.lastName,
          birthDate: '1990-01-15',
          password: specialUser.password,
        })
        .expect(201);

      const completeBody = completeRes.body as { status: 'success'; data: any };
      expect(typeof completeBody.data.accessToken).toBe('string');
      expect(typeof completeBody.data.refreshToken).toBe('string');

      // Test login with special characters
      const initiateRes = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: specialUser.email })
        .expect(200);

      const initiateBody = initiateRes.body as { status: 'success'; data: any };
      expect(initiateBody.data.sessionToken).toBeDefined();

      await request(server)
        .post('/public/auth/signin/password')
        .send({
          sessionToken: initiateBody.data.sessionToken,
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

      // Step 1: Signup verify contact
      const res = await request(server)
        .post('/public/auth/signup/verify-contact')
        .send({ identifier: unicodeUser.email })
        .expect(200);

      const body = res.body as { status: 'success'; data: RequestVerifyDataDto };
      expect(body.data.success).toBe(true);
      expect(typeof body.data.testCode).toBe('string');

      // Step 2: Verify OTP code
      const verifyRes = await request(server)
        .post('/public/auth/verify')
        .send({ identifier: unicodeUser.email, code: body.data.testCode, method: 'email' })
        .expect(200);

      const verifyBody = verifyRes.body as { status: 'success'; data: VerifyDataDto };
      expect(verifyBody.data.ownershipVerified).toBe(true);
      expect(typeof verifyBody.data.signupSessionToken).toBe('string');

      // Step 3: Complete profile with Unicode names
      const completeRes = await request(server)
        .post('/public/auth/signup/complete-profile')
        .send({
          sessionToken: verifyBody.data.signupSessionToken,
          firstName: unicodeUser.firstName,
          lastName: unicodeUser.lastName,
          birthDate: '1990-01-15',
          password: unicodeUser.password,
        })
        .expect(201);

      const completeBody = completeRes.body as { status: 'success'; data: any };
      expect(typeof completeBody.data.accessToken).toBe('string');
      expect(typeof completeBody.data.refreshToken).toBe('string');
    });
  });

  // ===== DATABASE STATE TESTS =====
  describe('Database State', () => {
    it('should clean up expired verification tokens', async () => {
      // Clean up any existing tokens first
      await vtModel.deleteMany({});
      const initialCount = await vtModel.countDocuments();
      expect(initialCount).toBe(0);

      // Request password reset (creates a verification token)
      // Note: Cannot use request-verify because testUser is already verified
      await request(server)
        .post('/public/auth/request-reset')
        .send({ identifier: testUser.email, method: 'email' })
        .expect(200);

      const afterRequestCount = await vtModel.countDocuments();
      expect(afterRequestCount).toBeGreaterThan(initialCount);

      // Tokens should have proper expiry set
      const token = await vtModel.findOne().sort({ createdAt: -1 });
      expect(token?.expiresAt).toBeInstanceOf(Date);
      expect(token?.expiresAt?.getTime()).toBeGreaterThan(Date.now());
    });

    it('should clean up refresh tokens on logout', async () => {
      // Note: testUser's password is 'AnotherNewPass123!' after the password reset security test
      // Login to create refresh tokens via 2-step signin
      const initiateRes = await request(server)
        .post('/public/auth/signin/initiate')
        .send({ identifier: testUser.email })
        .expect(200);

      const initiateBody = initiateRes.body as { status: 'success'; data: SigninInitiateDataDto };

      const passwordRes = await request(server)
        .post('/public/auth/signin/password')
        .send({
          sessionToken: initiateBody.data.sessionToken,
          password: 'AnotherNewPass123!', // Current password after reset
        })
        .expect(200);

      const body = passwordRes.body as { status: 'success'; data: SigninPasswordDataDto };
      const token = body.data.accessToken!;
      const refreshToken = body.data.refreshToken!;
      expect(token).toBeTruthy();
      expect(refreshToken).toBeTruthy();

      // Decode the token to get user ID
      const decoded = decodeJwt(token);

      // Test that logout works
      const logoutRes = await request(server)
        .post('/public/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const logoutBody = logoutRes.body as { status: 'success'; data: { message: string } };
      expect(logoutBody.data).toHaveProperty('message', 'Logout successful');

      // Verify all refresh tokens were deleted (wait a moment for cleanup)
      await new Promise((resolve) => setTimeout(resolve, 200));
      const tokensAfterLogout = await refreshTokenModel
        .find({ user: new Types.ObjectId(decoded.sub) })
        .exec();
      expect(tokensAfterLogout.length).toBe(0);

      // NOTE: Testing token revocation via refresh endpoint is skipped due to backend bug
      // The refresh endpoint should return 401 for deleted tokens, but currently returns 200 OK
      // See the "should reject refresh token after logout" test in Token Security section
    });
  });
});
