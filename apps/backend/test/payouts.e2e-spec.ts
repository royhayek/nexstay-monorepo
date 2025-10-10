import { Server } from 'http';
import request, { Response } from 'supertest';
import { disconnect, Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';
import twilioConfig from '../src/config/twilio.config';
import mailConfig from '../src/config/mail.config';
import s3Config from '../src/config/s3.config';
import { envValidation } from '../src/config/env.validation';
import { UsersModule } from '../src/modules/users/users.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PayoutsModule } from '../src/modules/payouts/payouts.module';
import { DynamicConfigModule } from '../src/modules/config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { SmsService } from '../src/common/services/sms.service';
import { S3Service } from '../src/modules/storage/services/s3.service';
import { StorageModule } from '../src/modules/storage/storage.module';
import { User, UserDocument } from '../src/database/schemas/user.schema';
import { Payout, PayoutDocument } from '../src/database/schemas/payout.schema';
import { PayoutMethod, PayoutMethodDocument } from '../src/database/schemas/payout-method.schema';
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { CreatePayoutMethodDto } from '../src/modules/payouts/dto/create-payout-method.dto';
import { CreatePayoutDto } from '../src/modules/payouts/dto/create-payout.dto';
import { PayoutMethodType, PayoutStatus, PayoutType } from '../src/common/enums/payout.enums';
import { UserRole } from '../src/database/schemas/user.schema';
import { CurrencyCode } from '../src/common/enums/payment.enums';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';

// Type definitions for API responses
interface BaseResponse<T> {
  status: 'success' | 'error';
  title: string;
  message?: string;
  data: T;
}

interface PayoutMethodResponse {
  _id: string;
  type: string;
  nickname?: string;
  isVerified: boolean;
  currency: string;
}

interface PayoutResponse {
  _id: string;
  hostId: string;
  amount: number;
  status: string;
  currency?: string;
}

interface EarningsResponse {
  totalEarnings: number;
  currency: string;
  bookingsCount: number;
  bookings: Array<Record<string, unknown>>;
}

interface PayoutHistoryResponse {
  payouts: PayoutResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface StatisticsResponse {
  totalPayouts: number;
  totalAmount: number;
  byStatus: Record<string, unknown>;
  byProvider: Record<string, unknown>;
}

describe('PayoutsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let hostToken: string;
  let adminToken: string;
  let guestToken: string;
  let hostUser: UserDocument;
  let userModel: Model<UserDocument>;
  let payoutModel: Model<PayoutDocument>;
  let payoutMethodModel: Model<PayoutMethodDocument>;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig, databaseConfig, twilioConfig, mailConfig, s3Config],
          envFilePath: ['.env.test', '.env'],
          validationSchema: envValidation,
        }),
        MongooseModule.forRootAsync({
          useFactory: () => ({ uri: process.env.DATABASE_URI_TEST }),
        }),
        DynamicConfigModule,
        StorageModule,
        AuthModule,
        UsersModule,
        PayoutsModule,
      ],
      providers: [
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        {
          provide: SmsService,
          useValue: {
            sendSms: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            generatePresignedUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    useContainer(app, { fallbackOnErrors: true });

    await app.init();
    server = app.getHttpServer() as Server;

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    payoutModel = moduleFixture.get<Model<PayoutDocument>>(getModelToken(Payout.name));
    payoutMethodModel = moduleFixture.get<Model<PayoutMethodDocument>>(
      getModelToken(PayoutMethod.name),
    );

    // Seed dynamic configuration
    await seedDynamicConfig(app);

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await payoutModel.deleteMany({});
    await payoutMethodModel.deleteMany({});
    await app.close();
    await disconnect();
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await payoutModel.deleteMany({});
    await payoutMethodModel.deleteMany({});
  });

  async function createTestUsers() {
    // Create host user
    hostUser = await userModel.create({
      email: 'host@example.com',
      password: 'hashedPassword123',
      firstName: 'Host',
      lastName: 'User',
      role: UserRole.HOST,
      isEmailVerified: true,
    });

    // Create admin user
    await userModel.create({
      email: 'admin@example.com',
      password: 'hashedPassword123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });

    // Create guest user
    await userModel.create({
      email: 'guest@example.com',
      password: 'hashedPassword123',
      firstName: 'Guest',
      lastName: 'User',
      role: UserRole.GUEST,
      isEmailVerified: true,
    });

    // Get login tokens
    const hostLogin: Response = await request(server)
      .post('/v1/public/auth/login')
      .send({ email: 'host@example.com', password: 'password123' })
      .expect(200);

    const adminLogin: Response = await request(server)
      .post('/v1/public/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' })
      .expect(200);

    const guestLogin: Response = await request(server)
      .post('/v1/public/auth/login')
      .send({ email: 'guest@example.com', password: 'password123' })
      .expect(200);

    hostToken = (hostLogin.body as { status: 'success'; data: LoginUserDataDto }).data.accessToken;
    adminToken = (adminLogin.body as { status: 'success'; data: LoginUserDataDto }).data
      .accessToken;
    guestToken = (guestLogin.body as { status: 'success'; data: LoginUserDataDto }).data
      .accessToken;
  }

  describe('Host Payout Methods', () => {
    describe('POST /host/payouts/methods', () => {
      it('should create a payout method for host', async () => {
        const createDto: CreatePayoutMethodDto = {
          type: PayoutMethodType.BANK_ACCOUNT,
          bankAccount: {
            accountNumber: '123456789',
            routingNumber: '987654321',
            accountHolderName: 'Host User',
          },
          currency: CurrencyCode.USD,
          nickname: 'Primary Bank',
        };

        const response: Response = await request(server)
          .post('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(201);

        const body = response.body as BaseResponse<PayoutMethodResponse>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Payout Method Created');
        expect(body.data).toMatchObject({
          type: PayoutMethodType.BANK_ACCOUNT,
          nickname: 'Primary Bank',
          isVerified: false,
        });
      });

      it('should reject invalid payout method data', async () => {
        const createDto: CreatePayoutMethodDto = {
          type: PayoutMethodType.BANK_ACCOUNT,
          // Missing bankAccount details
          currency: CurrencyCode.USD,
          nickname: 'Invalid Bank',
        };

        await request(server)
          .post('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(400);
      });
    });

    describe('GET /host/payouts/methods', () => {
      beforeEach(async () => {
        const createDto: CreatePayoutMethodDto = {
          type: PayoutMethodType.BANK_ACCOUNT,
          bankAccount: {
            accountNumber: '123456789',
            routingNumber: '987654321',
            accountHolderName: 'Host User',
          },
          currency: CurrencyCode.USD,
          nickname: 'Primary Bank',
        };

        await request(server)
          .post('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(201);
      });

      it('should get payout methods for host', async () => {
        const response: Response = await request(server)
          .get('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .expect(200);

        const body = response.body as BaseResponse<PayoutMethodResponse[]>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Payout Methods Retrieved');
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
          type: PayoutMethodType.BANK_ACCOUNT,
          nickname: 'Primary Bank',
        });
      });
    });

    describe('GET /host/payouts/eligible-earnings', () => {
      it('should return eligible earnings for host', async () => {
        const response: Response = await request(server)
          .get('/v1/host/payouts/eligible-earnings')
          .set('Authorization', `Bearer ${hostToken}`)
          .expect(200);

        const body = response.body as BaseResponse<EarningsResponse>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Eligible Earnings Retrieved');
        expect(body.data).toMatchObject({
          totalEarnings: expect.any(Number) as number,
          currency: expect.any(String) as string,
          bookingsCount: expect.any(Number) as number,
          bookings: expect.any(Array) as unknown[],
        });
      });
    });

    describe('POST /host/payouts', () => {
      let payoutMethodId: string;

      beforeEach(async () => {
        const createDto: CreatePayoutMethodDto = {
          type: PayoutMethodType.BANK_ACCOUNT,
          bankAccount: {
            accountNumber: '123456789',
            routingNumber: '987654321',
            accountHolderName: 'Host User',
          },
          currency: CurrencyCode.USD,
          nickname: 'Primary Bank',
        };

        const response: Response = await request(server)
          .post('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(201);

        payoutMethodId = (response.body as BaseResponse<PayoutMethodResponse>).data._id;
      });

      it('should request a payout successfully', async () => {
        const createDto: CreatePayoutDto = {
          payoutMethodId,
          type: PayoutType.STANDARD,
          amount: 75.0,
        };

        const response: Response = await request(server)
          .post('/v1/host/payouts')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(201);

        const body = response.body as BaseResponse<PayoutResponse>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Payout Requested');
        expect(body.data).toMatchObject({
          hostId: (hostUser._id as Types.ObjectId).toString(),
          amount: 75.0,
          status: PayoutStatus.PENDING,
        });
      });

      it('should reject payout with amount below minimum', async () => {
        const createDto: CreatePayoutDto = {
          payoutMethodId,
          type: PayoutType.STANDARD,
          amount: 10.0, // Below minimum (50)
        };

        await request(server)
          .post('/v1/host/payouts')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createDto)
          .expect(400);
      });
    });

    describe('GET /host/payouts', () => {
      let payoutId: string;

      beforeEach(async () => {
        const createMethodDto: CreatePayoutMethodDto = {
          type: PayoutMethodType.BANK_ACCOUNT,
          bankAccount: {
            accountNumber: '123456789',
            routingNumber: '987654321',
            accountHolderName: 'Host User',
          },
          currency: CurrencyCode.USD,
          nickname: 'Primary Bank',
        };

        const methodResponse: Response = await request(server)
          .post('/v1/host/payouts/methods')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createMethodDto)
          .expect(201);

        const payoutMethodId = (methodResponse.body as BaseResponse<PayoutMethodResponse>).data._id;

        const createPayoutDto: CreatePayoutDto = {
          payoutMethodId,
          type: PayoutType.STANDARD,
          amount: 100.0,
        };

        const payoutResponse: Response = await request(server)
          .post('/v1/host/payouts')
          .set('Authorization', `Bearer ${hostToken}`)
          .send(createPayoutDto)
          .expect(201);

        payoutId = (payoutResponse.body as BaseResponse<PayoutResponse>).data._id;
      });

      it('should get payout history for host', async () => {
        const response: Response = await request(server)
          .get('/v1/host/payouts')
          .set('Authorization', `Bearer ${hostToken}`)
          .expect(200);

        const body = response.body as BaseResponse<PayoutHistoryResponse>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Payout History Retrieved');
        expect(body.data).toMatchObject({
          payouts: expect.any(Array) as unknown[],
          total: expect.any(Number) as number,
          page: expect.any(Number) as number,
          limit: expect.any(Number) as number,
        });
      });

      it('should get specific payout details', async () => {
        const response: Response = await request(server)
          .get(`/v1/host/payouts/${payoutId}`)
          .set('Authorization', `Bearer ${hostToken}`)
          .expect(200);

        const body = response.body as BaseResponse<PayoutResponse>;
        expect(body.status).toBe('success');
        expect(body.title).toBe('Payout Details Retrieved');
        expect(body.data).toMatchObject({
          _id: payoutId,
          hostId: (hostUser._id as Types.ObjectId).toString(),
          amount: 100.0,
        });
      });
    });
  });

  describe('Admin Payout Management', () => {
    it('should get all payouts for admin', async () => {
      const response: Response = await request(server)
        .get('/v1/admin/payouts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as BaseResponse<PayoutHistoryResponse>;
      expect(body.status).toBe('success');
      expect(body.title).toBe('All Payouts Retrieved');
      expect(body.data).toMatchObject({
        payouts: expect.any(Array) as unknown[],
        total: expect.any(Number) as number,
        page: expect.any(Number) as number,
        limit: expect.any(Number) as number,
      });
    });

    it('should get payout statistics for admin', async () => {
      const response: Response = await request(server)
        .get('/v1/admin/payouts/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as BaseResponse<StatisticsResponse>;
      expect(body.status).toBe('success');
      expect(body.title).toBe('Payout Statistics Retrieved');
      expect(body.data).toMatchObject({
        totalPayouts: expect.any(Number) as number,
        totalAmount: expect.any(Number) as number,
        byStatus: expect.any(Object) as Record<string, unknown>,
        byProvider: expect.any(Object) as Record<string, unknown>,
      });
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      await request(server).get('/v1/host/payouts/methods').expect(401);
    });

    it('should reject guest access to host endpoints', async () => {
      await request(server)
        .get('/v1/host/payouts/methods')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should reject non-admin access to admin endpoints', async () => {
      await request(server)
        .get('/v1/admin/payouts')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(403);
    });
  });
});
