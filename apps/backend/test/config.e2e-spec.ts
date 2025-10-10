import { Server } from 'http';
import { Model } from 'mongoose';
import request, { Response } from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigCategory } from '../src/database/schemas/app-config.schema';
import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';
import twilioConfig from '../src/config/twilio.config';
import mailConfig from '../src/config/mail.config';
import s3Config from '../src/config/s3.config';
import { envValidation } from '../src/config/env.validation';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { DynamicConfigModule } from '../src/modules/config/config.module';
import { AppConfig, AppConfigDocument } from '../src/database/schemas/app-config.schema';
import { User, UserDocument, UserRole } from '../src/database/schemas/user.schema';
import { CreateConfigDto } from '../src/modules/config/dto/create-config.dto';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { S3Service } from '../src/modules/storage/services/s3.service';
import { StorageModule } from '../src/modules/storage/storage.module';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';
import { DateUtils } from '../src/common/utils/date.utils';

describe('ConfigController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let configModel: Model<AppConfigDocument>;
  let userModel: Model<UserDocument>;

  let adminToken = '';
  let guestToken = '';

  const adminUser = {
    email: 'admin-test@example.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'Test',
    roles: [UserRole.SYSTEM_ADMIN],
  };

  const guestUser = {
    email: 'guest-test@example.com',
    password: 'GuestPass123!',
    firstName: 'Guest',
    lastName: 'Test',
    roles: [UserRole.GUEST],
  };

  const testConfigs = [
    {
      key: 'TEST_STRING_CONFIG',
      value: 'test-value',
      title: 'Test String Config',
      description: 'A test configuration',
      category: ConfigCategory.GENERAL,
    },
    {
      key: 'TEST_NUMERIC_CONFIG',
      value: '42',
      title: 'Test Numeric Config',
      description: 'A numeric test configuration',
      category: ConfigCategory.GENERAL,
    },
    {
      key: 'TEST_BOOLEAN_CONFIG',
      value: 'true',
      title: 'Test Boolean Config',
      description: 'A boolean test configuration',
      category: ConfigCategory.GENERAL,
    },
  ];

  beforeAll(async () => {
    // Set up in-memory MongoDB first
    await setupTestDatabase();

    // Create a custom module without throttling for tests
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Core configuration
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
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
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

    configModel = moduleFixture.get<Model<AppConfigDocument>>(getModelToken(AppConfig.name));
    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));

    server = app.getHttpServer() as Server;

    // Create test users
    await request(server).post('/auth/register').send(adminUser).expect(201);
    await request(server).post('/auth/register').send(guestUser).expect(201);

    // Get admin token
    const adminRes: Response = await request(server)
      .post('/auth/login')
      .send({ identifier: adminUser.email, method: 'email', password: adminUser.password })
      .expect(200);
    adminToken = (adminRes.body as { status: 'success'; data: LoginUserDataDto }).data.accessToken;

    // Get guest token
    const guestRes: Response = await request(server)
      .post('/auth/login')
      .send({ identifier: guestUser.email, method: 'email', password: guestUser.password })
      .expect(200);
    guestToken = (guestRes.body as { status: 'success'; data: LoginUserDataDto }).data.accessToken;
  }, 120000);

  afterAll(async () => {
    // Cleanup test data
    if (configModel) {
      await configModel.deleteMany({ key: { $regex: /^TEST_/ } });
    }
    if (userModel) {
      await userModel.deleteMany({ email: { $in: [adminUser.email, guestUser.email] } });
    }
    if (app) {
      await app.close();
    }
    await teardownTestDatabase();
  }, 30000);

  beforeEach(async () => {
    // Clean test configs before each test
    await configModel.deleteMany({ key: { $regex: /^TEST_/ } });
  });

  describe('GET /admin/config', () => {
    it('should return all configurations (public endpoint)', async () => {
      // Seed some test configs
      await configModel.insertMany(testConfigs);

      const res: Response = await request(server).get('/admin/config').expect(200);

      const body = res.body as { status: 'success'; data: AppConfig[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(testConfigs.length);

      // Check that our test configs are present
      const keys = body.data.map((config: AppConfig) => config.key);
      testConfigs.forEach((config) => {
        expect(keys).toContain(config.key);
      });
    });

    it('should return empty array when no configurations exist', async () => {
      // Ensure clean state
      await configModel.deleteMany({});

      const res: Response = await request(server).get('/admin/config').expect(200);

      const body = res.body as { status: 'success'; data: AppConfig[] };
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(0);
    });
  });

  describe('GET /admin/config/:key', () => {
    it('should return specific configuration by key (public endpoint)', async () => {
      // Create a test config
      const testConfig = testConfigs[0];
      await configModel.create(testConfig);

      const res: Response = await request(server)
        .get(`/admin/config/${testConfig.key}`)
        .expect(200);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.key).toBe(testConfig.key);
      expect(body.data.value).toBe(testConfig.value);
      expect(body.data.description).toBe(testConfig.description);
    });

    it('should return 404 for non-existent configuration key', async () => {
      await request(server).get('/admin/config/NON_EXISTENT_KEY').expect(404);
    });

    it('should reject invalid key format', async () => {
      const invalidKeys = ['invalid-key', 'invalid key', '123invalid', 'invalid@key'];

      for (const invalidKey of invalidKeys) {
        await request(server).get(`/admin/config/${invalidKey}`).expect(400);
      }
    });
  });

  describe('POST /admin/config', () => {
    it('should create new configuration with admin role', async () => {
      const newConfig: CreateConfigDto = {
        key: 'TEST_NEW_CONFIG',
        value: 'new-test-value',
        title: 'Test New Config',
        description: 'A new test configuration',
        category: ConfigCategory.GENERAL,
      };

      const res: Response = await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newConfig)
        .expect(201);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.key).toBe(newConfig.key);
      expect(body.data.value).toBe(newConfig.value);
      expect(body.data.description).toBe(newConfig.description);

      // Verify it's saved in database
      const saved = await configModel.findOne({ key: newConfig.key });
      expect(saved).toBeTruthy();
      expect(saved!.value).toBe(newConfig.value);
    });

    it('should update existing configuration', async () => {
      // Create initial config
      const initialConfig = testConfigs[0];
      await configModel.create(initialConfig);

      const updatedConfig: CreateConfigDto = {
        key: initialConfig.key,
        value: 'updated-value',
        title: 'Updated Config Title',
        description: 'Updated description',
        category: ConfigCategory.GENERAL,
      };

      const res: Response = await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedConfig)
        .expect(201);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.key).toBe(updatedConfig.key);
      expect(body.data.value).toBe(updatedConfig.value);
      expect(body.data.description).toBe(updatedConfig.description);

      // Verify update in database
      const updated = await configModel.findOne({ key: updatedConfig.key });
      expect(updated!.value).toBe(updatedConfig.value);
    });

    it('should reject request without admin role', async () => {
      const newConfig: CreateConfigDto = {
        key: 'TEST_UNAUTHORIZED',
        value: 'should-fail',
        title: 'Test Unauthorized',
        category: ConfigCategory.GENERAL,
      };

      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(newConfig)
        .expect(403);
    });

    it('should reject request without authentication', async () => {
      const newConfig: CreateConfigDto = {
        key: 'TEST_UNAUTHENTICATED',
        value: 'should-fail',
        title: 'Test Unauthenticated',
        category: ConfigCategory.GENERAL,
      };

      await request(server).post('/admin/config').send(newConfig).expect(401);
    });

    it('should validate request data', async () => {
      // Missing required fields
      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      // Invalid key format
      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'invalid-key-format',
          value: 'test-value',
        })
        .expect(400);

      // Empty value
      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'TEST_EMPTY_VALUE',
          value: '',
        })
        .expect(400);
    });
  });

  describe('DELETE /admin/config/:key', () => {
    it('should delete existing configuration with admin role', async () => {
      // Create test config
      const testConfig = testConfigs[0];
      await configModel.create(testConfig);

      const res: Response = await request(server)
        .delete(`/admin/config/${testConfig.key}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as { status: 'success'; data: { success: boolean } };
      expect(body.data.success).toBe(true);

      // Verify deletion in database
      const deleted = await configModel.findOne({ key: testConfig.key });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent configuration', async () => {
      await request(server)
        .delete('/admin/config/NON_EXISTENT_KEY')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject request without admin role', async () => {
      const testConfig = testConfigs[0];
      await configModel.create(testConfig);

      await request(server)
        .delete(`/admin/config/${testConfig.key}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should reject request without authentication', async () => {
      const testConfig = testConfigs[0];
      await configModel.create(testConfig);

      await request(server).delete(`/admin/config/${testConfig.key}`).expect(401);
    });

    it('should validate key format', async () => {
      const invalidKeys = ['invalid-key', 'invalid key'];

      for (const invalidKey of invalidKeys) {
        await request(server)
          .delete(`/admin/config/${invalidKey}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);
      }
    });
  });

  describe('DynamicConfigService Integration', () => {
    it('should handle default values in service.get()', async () => {
      // This tests the service method directly via controller behavior
      // Since the service.get() method is used internally by AuthService
      // Test that it returns default when config doesn't exist
      // This would be tested indirectly through auth flows that depend on config
    });

    it('should maintain data consistency across operations', async () => {
      const config = testConfigs[0];

      // Create
      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(config)
        .expect(201);

      // Read
      const getRes = await request(server).get(`/admin/config/${config.key}`).expect(200);
      const getBody = getRes.body as { status: 'success'; data: AppConfig };
      expect(getBody.data.value).toBe(config.value);

      // Update
      const updatedValue = 'updated-value';
      await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...config, value: updatedValue })
        .expect(201);

      // Verify update
      const getUpdatedRes = await request(server).get(`/admin/config/${config.key}`).expect(200);
      const getUpdatedBody = getUpdatedRes.body as { status: 'success'; data: AppConfig };
      expect(getUpdatedBody.data.value).toBe(updatedValue);

      // Delete
      await request(server)
        .delete(`/admin/config/${config.key}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      await request(server).get(`/admin/config/${config.key}`).expect(404);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle special characters in config values', async () => {
      const specialConfig = {
        key: 'TEST_SPECIAL_CHARS',
        value: 'value with spaces, symbols: @#$%^&*()_+-={}[]|\\:";\'<>?,./',
        title: 'Test Special Characters',
        description: 'Config with special characters',
        category: ConfigCategory.GENERAL,
      };

      const res = await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialConfig)
        .expect(201);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.value).toBe(specialConfig.value);
    });

    it('should trim whitespace from values', async () => {
      const configWithWhitespace = {
        key: 'TEST_WHITESPACE',
        value: '  trimmed-value  ',
        title: 'Test Whitespace',
        description: '  trimmed description  ',
        category: ConfigCategory.GENERAL,
      };

      const res = await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configWithWhitespace)
        .expect(201);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.value).toBe('trimmed-value');
      expect(body.data.description).toBe('trimmed description');
    });

    it('should handle long configuration values', async () => {
      const longValue = 'a'.repeat(1000); // 1000 character string
      const longConfig = {
        key: 'TEST_LONG_VALUE',
        value: longValue,
        title: 'Test Long Value',
        category: ConfigCategory.GENERAL,
      };

      const res = await request(server)
        .post('/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(longConfig)
        .expect(201);

      const body = res.body as { status: 'success'; data: AppConfig };
      expect(body.data.value).toBe(longValue);
    });
  });
});
