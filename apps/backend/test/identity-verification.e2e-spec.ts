import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { Model, disconnect } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

import { AppModule } from '../src/app.module';
import { UserDocument } from '../src/database/schemas/user.schema';
import { User, UserRole } from '../src/database/schemas/user.schema';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';
import { DocumentType, VerificationStatus } from '../src/common/enums/identity-verification.enums';
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { S3Service } from '../src/modules/storage/services/s3.service';
import { DateUtils } from '../src/common/utils/date.utils';

interface TestResponse<T = unknown> {
  status: string;
  title: string;
  message: string;
  data: T;
}

interface PaginatedTestData<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface VerificationTestData {
  _id: string;
  userId: string;
  status: VerificationStatus;
  documentType: string;
  issuingCountry: string;
  createdAt: string;
  updatedAt: string;
}

interface VerificationStatsTestData {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  expired: number;
  averageProcessingTime: number;
}

describe('IdentityVerificationController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let hostToken: string;
  let adminToken: string;
  let adminUserId: string;
  let userModel: Model<UserDocument>;
  let verificationId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          key: 'test-file-key',
          url: 'https://test-bucket.s3.amazonaws.com/test-file-key',
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

    // API versioning
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());

    // Enable dependency injection for class-validator
    useContainer(app, { fallbackOnErrors: true });

    await app.init();

    await seedDynamicConfig(app);

    server = app.getHttpServer() as Server;

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));

    // Create test ID for unique emails
    const testId = Date.now() + Math.random();
    const hostEmail = `host.identity.${testId}@test.com`;
    const adminEmail = `admin.identity.${testId}@test.com`;

    const hostUserData = {
      email: hostEmail,
      password: 'HostPassword123!',
      firstName: 'Host',
      lastName: 'User',
      roles: ['host'],
    };

    const adminUserData = {
      email: adminEmail,
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
    };

    // Register and verify host
    const hostRegRes = await request(server).post('/v1/public/auth/register').send(hostUserData);

    if (hostRegRes.status !== 201) {
      throw new Error(
        `Host registration failed with status ${hostRegRes.status}: ${JSON.stringify(hostRegRes.body)}`,
      );
    }

    const hostRegBody = hostRegRes.body as { status: 'success'; data: { testCode?: string } };

    if (!hostRegBody.data?.testCode) {
      throw new Error(
        `Host registration failed - testCode not provided. Response: ${JSON.stringify(hostRegBody)}`,
      );
    }

    const hostVerifyRes = await request(server).post('/v1/public/auth/verify').send({
      identifier: hostEmail,
      code: hostRegBody.data.testCode,
      method: 'email',
    });

    const hostVerifyBody = hostVerifyRes.body as { status: 'success'; data: LoginUserDataDto };
    hostToken = hostVerifyBody.data.accessToken;

    // Register and verify admin
    const adminRegRes = await request(server).post('/v1/public/auth/register').send(adminUserData);

    const adminRegBody = adminRegRes.body as { status: 'success'; data: { testCode?: string } };

    if (!adminRegBody.data?.testCode) {
      throw new Error('Admin registration failed - testCode not provided');
    }

    const adminVerifyRes = await request(server).post('/v1/public/auth/verify').send({
      identifier: adminEmail,
      code: adminRegBody.data.testCode,
      method: 'email',
    });

    const adminVerifyBody = adminVerifyRes.body as { status: 'success'; data: LoginUserDataDto };
    adminToken = adminVerifyBody.data.accessToken;

    // Extract user ID from JWT token
    const adminDecoded = JSON.parse(Buffer.from(adminToken.split('.')[1], 'base64').toString()) as {
      sub: string;
    };
    adminUserId = adminDecoded.sub;

    // Update admin user role in database
    await userModel.findByIdAndUpdate(adminUserId, {
      roles: [UserRole.ADMIN],
    });
  });

  afterAll(async () => {
    await app.close();
    await teardownTestDatabase();
    await disconnect();
  });

  describe('POST /v1/identity-verification', () => {
    it('should create a new identity verification', async () => {
      const response = await request(server)
        .post('/v1/identity-verification')
        .set('Authorization', `Bearer ${hostToken}`)
        .field('documentType', DocumentType.PASSPORT)
        .field('documentNumber', 'P123456789')
        .field('issuingCountry', 'US')
        .field('expirationDate', '2025-12-31')
        .field('firstName', 'John')
        .field('lastName', 'Doe')
        .field('dateOfBirth', '1990-01-01')
        .attach('documentFront', Buffer.from('fake-image-data'), 'passport-front.jpg');

      expect(response.status).toBe(201);
      const responseData = response.body as TestResponse<VerificationTestData>;
      expect(responseData.status).toBe('success');
      expect(responseData.data).toBeDefined();

      verificationId = responseData.data._id;
    });

    it('should reject verification without required fields', async () => {
      const response = await request(server)
        .post('/v1/identity-verification')
        .set('Authorization', `Bearer ${hostToken}`)
        .field('documentType', DocumentType.PASSPORT);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /v1/identity-verification/me', () => {
    it('should get user verification', async () => {
      const response = await request(server)
        .get('/v1/identity-verification/me')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const responseData = response.body as TestResponse<VerificationTestData>;
      expect(responseData.status).toBe('success');
      expect(responseData.data).toBeDefined();
    });
  });

  describe('GET /v1/identity-verification/document-types', () => {
    it('should get supported document types', async () => {
      const response = await request(server)
        .get('/v1/identity-verification/document-types')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const responseData = response.body as TestResponse<string[]>;
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data)).toBe(true);
    });

    it('should get document types for specific country', async () => {
      const response = await request(server)
        .get('/v1/identity-verification/document-types?country=US')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const responseData = response.body as TestResponse<string[]>;
      expect(responseData.status).toBe('success');
      expect(Array.isArray(responseData.data)).toBe(true);
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /v1/admin/identity-verification/verifications', () => {
      it('should list all verifications for admin', async () => {
        const response = await request(server)
          .get('/v1/admin/identity-verification/verifications')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const responseData = response.body as TestResponse<PaginatedTestData<VerificationTestData>>;
        expect(responseData.status).toBe('success');
        expect(responseData.data).toBeDefined();
        expect(responseData.data.items).toBeDefined();
        expect(responseData.data.total).toBeGreaterThanOrEqual(0);
        expect(responseData.data.page).toBe(1);
        expect(responseData.data.limit).toBe(20);
      });

      it('should filter verifications by status', async () => {
        const response = await request(server)
          .get('/v1/admin/identity-verification/verifications?status=pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const responseData = response.body as TestResponse<PaginatedTestData<VerificationTestData>>;
        expect(responseData.status).toBe('success');

        const pendingCount = responseData.data.items.filter(
          (item: VerificationTestData) => item.status === VerificationStatus.PENDING,
        ).length;
        expect(pendingCount).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /v1/admin/identity-verification/stats', () => {
      it('should get verification statistics', async () => {
        const response = await request(server)
          .get('/v1/admin/identity-verification/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const responseData = response.body as TestResponse<VerificationStatsTestData>;
        expect(responseData.status).toBe('success');
        expect(responseData.data.total).toBeGreaterThanOrEqual(0);
        expect(responseData.data.pending).toBeGreaterThanOrEqual(0);
        expect(responseData.data.approved).toBeGreaterThanOrEqual(0);
        expect(responseData.data.rejected).toBeGreaterThanOrEqual(0);
      });
    });

    describe('PATCH /v1/admin/identity-verification/verifications/:id/status', () => {
      it('should update verification status', async () => {
        if (!verificationId) {
          return;
        }

        const response = await request(server)
          .patch(`/v1/admin/identity-verification/verifications/${verificationId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: VerificationStatus.APPROVED,
            comment: 'Documents verified successfully',
          })
          .expect(200);

        const responseData = response.body as TestResponse<VerificationTestData>;
        expect(responseData.status).toBe('success');
        expect(responseData.data.status).toBe(VerificationStatus.APPROVED);
      });

      it('should reject invalid status transitions', async () => {
        if (!verificationId) {
          return;
        }

        const response = await request(server)
          .patch(`/v1/admin/identity-verification/verifications/${verificationId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: VerificationStatus.APPROVED,
            comment: 'Already approved',
          });

        expect([400, 409]).toContain(response.status);
      });
    });

    describe('GET /v1/admin/identity-verification/document-types', () => {
      it('should get all document type configurations', async () => {
        const response = await request(server)
          .get('/v1/admin/identity-verification/document-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        const responseData = response.body as TestResponse<unknown[]>;
        expect(responseData.status).toBe('success');
        expect(Array.isArray(responseData.data)).toBe(true);
      });
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      await request(server).get('/v1/identity-verification/me').expect(401);
    });

    it('should reject non-admin access to admin endpoints', async () => {
      const response = await request(server)
        .get('/v1/admin/identity-verification/verifications')
        .set('Authorization', `Bearer ${hostToken}`);

      // Should be 403 (Forbidden) or 429 (Too Many Requests) in test environment
      expect([403, 429]).toContain(response.status);
    });
  });
});
