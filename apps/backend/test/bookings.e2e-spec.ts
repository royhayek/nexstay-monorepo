import { Server } from 'http';
import request from 'supertest';
import { Model, Types } from 'mongoose';
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
import { PropertiesModule } from '../src/modules/properties/properties.module';
import { BookingsModule } from '../src/modules/bookings/bookings.module';
import { DynamicConfigModule } from '../src/modules/config/config.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { SmsService } from '../src/common/services/sms.service';
import { S3Service } from '../src/modules/storage/services/s3.service';
import { StorageModule } from '../src/modules/storage/storage.module';
import { User, UserDocument } from '../src/database/schemas/user.schema';
import { Property, PropertyDocument } from '../src/database/schemas/property.schema';
import { Booking, BookingDocument } from '../src/database/schemas/booking.schema';
import { BookingResponseDto } from '../src/modules/bookings/dto/booking-response.dto';
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { CreateBookingDto } from '../src/modules/bookings/dto/create-booking.dto';
import { UpdateBookingDto } from '../src/modules/bookings/dto/update-booking.dto';
import {
  PropertyType,
  RoomType,
  BedType,
  CancellationPolicy,
} from '../src/common/enums/property.enums';
import { BookingStatus, PaymentStatus } from '../src/common/enums/booking.enums';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';
import { BookingListResponse } from '../src/modules/bookings/interfaces/booking-query.interfaces';
import { DateUtils } from '../src/common/utils/date.utils';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let hostToken: string;
  let guestToken: string;
  let hostUserId: string;
  let guestUserId: string;
  let userModel: Model<UserDocument>;
  let propertyModel: Model<PropertyDocument>;
  let bookingModel: Model<BookingDocument>;
  let testProperty: PropertyDocument;

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
        PropertiesModule,
        BookingsModule,
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

    await seedDynamicConfig(app);

    // Get models after app initialization
    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    propertyModel = moduleFixture.get<Model<PropertyDocument>>(getModelToken(Property.name));
    bookingModel = moduleFixture.get<Model<BookingDocument>>(getModelToken(Booking.name));

    // Ensure models are properly initialized
    if (!userModel || !propertyModel || !bookingModel) {
      throw new Error('Models not properly injected');
    }

    // Clean up existing test data
    await userModel.deleteMany({
      email: {
        $in: ['host.booking@test.com', 'guest.booking@test.com', 'other.host@test.com'],
      },
    });
    await propertyModel.deleteMany({});
    await bookingModel.deleteMany({});

    server = app.getHttpServer() as Server;
  }, 120000);

  beforeEach(async () => {
    // Create unique emails for each test
    const testId = Date.now() + Math.random();
    const hostEmail = `host.booking.${testId}@test.com`;
    const guestEmail = `guest.booking.${testId}@test.com`;

    // Register test users
    const hostRegRes = await request(server)
      .post('/v1/public/auth/register')
      .send({
        email: hostEmail,
        password: 'HostPassword123!',
        firstName: 'Host',
        lastName: 'User',
        roles: ['host'],
      });

    const guestRegRes = await request(server)
      .post('/v1/public/auth/register')
      .send({
        email: guestEmail,
        password: 'GuestPassword123!',
        firstName: 'Guest',
        lastName: 'User',
        roles: ['guest'],
      });

    if (hostRegRes.status !== 201) {
      console.error('Host registration failed with status:', hostRegRes.status);
      console.error('Host registration response:', JSON.stringify(hostRegRes.body, null, 2));
      throw new Error(`Host registration failed with status ${hostRegRes.status}`);
    }

    if (guestRegRes.status !== 201) {
      console.error('Guest registration failed with status:', guestRegRes.status);
      console.error('Guest registration response:', JSON.stringify(guestRegRes.body, null, 2));
      throw new Error(`Guest registration failed with status ${guestRegRes.status}`);
    }

    // Verify users to enable login
    const hostRegBody = hostRegRes.body as { status: 'success'; data: { testCode?: string } };
    const guestRegBody = guestRegRes.body as { status: 'success'; data: { testCode?: string } };

    if (!hostRegBody.data?.testCode || !guestRegBody.data?.testCode) {
      console.error('Host registration response:', JSON.stringify(hostRegRes.body, null, 2));
      console.error('Guest registration response:', JSON.stringify(guestRegRes.body, null, 2));
      throw new Error('Registration failed - testCode not provided in test environment');
    }

    const hostVerifyRes = await request(server).post('/v1/public/auth/verify').send({
      identifier: hostEmail,
      code: hostRegBody.data.testCode,
      method: 'email',
    });

    const guestVerifyRes = await request(server).post('/v1/public/auth/verify').send({
      identifier: guestEmail,
      code: guestRegBody.data.testCode,
      method: 'email',
    });

    // Get tokens from verification response
    const hostVerifyBody = hostVerifyRes.body as { status: 'success'; data: LoginUserDataDto };
    const guestVerifyBody = guestVerifyRes.body as { status: 'success'; data: LoginUserDataDto };

    hostToken = hostVerifyBody.data.accessToken;
    guestToken = guestVerifyBody.data.accessToken;

    // Extract user IDs from JWT tokens
    const hostDecoded = JSON.parse(Buffer.from(hostToken.split('.')[1], 'base64').toString()) as {
      sub: string;
    };
    const guestDecoded = JSON.parse(Buffer.from(guestToken.split('.')[1], 'base64').toString()) as {
      sub: string;
    };

    hostUserId = hostDecoded.sub;
    guestUserId = guestDecoded.sub;

    // Create a test property
    testProperty = await propertyModel.create({
      name: 'Test Booking Property',
      summary: 'A great place for testing bookings',
      description: 'Perfect for testing booking functionality',
      owner_id: hostUserId,
      property_type: PropertyType.APARTMENT,
      room_type: RoomType.ENTIRE_HOME,
      bed_type: BedType.REAL_BED,
      minimum_nights: 1,
      maximum_nights: 30,
      cancellation_policy: CancellationPolicy.FLEXIBLE,
      accommodates: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      price: {
        base_price: 100,
        currency: 'USD',
        currency_symbol: '$',
        price_per_night: 100,
        cleaning_fee: 20,
        security_deposit: 50,
      },
      address: {
        street: 'Test Street',
        suburb: 'Test Area',
        government_area: 'Test District',
        market: 'Test City',
        country: 'Lebanon',
        country_code: 'LB',
        location: {
          type: 'Point',
          coordinates: [35.5018, 33.8938],
          is_location_exact: false,
        },
      },
      coordinates: {
        latitude: 33.8938,
        longitude: 35.5018,
      },
      amenities: ['WiFi', 'Kitchen'],
      features: {
        smoke_detector: true,
        carbon_monoxide_detector: false,
        fire_extinguisher: true,
        first_aid_kit: true,
        kitchen: true,
        wifi: true,
      },
      images: [],
      host: {
        host_id: hostUserId,
        host_name: 'Host User',
        host_since: DateUtils.create('2021-01-01'),
        host_location: 'Test City, Lebanon',
        host_about: 'Test host for bookings',
        host_response_time: 'within an hour',
        host_response_rate: 100,
        host_acceptance_rate: 98,
        host_is_superhost: false,
        host_listings_count: 1,
        host_total_listings_count: 1,
        host_verifications: ['email'],
        host_has_profile_pic: false,
        host_identity_verified: true,
      },
      availability: {
        availability_30: 30,
        availability_60: 60,
        availability_90: 90,
        availability_365: 365,
        has_availability: true,
      },
      instant_bookable: true,
      is_business_travel_ready: false,
      require_guest_profile_picture: false,
      require_guest_phone_verification: false,
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await bookingModel.deleteMany({});
    await propertyModel.deleteMany({});
    await userModel.deleteMany({
      email: {
        $in: ['host.booking@test.com', 'guest.booking@test.com', 'other.host@test.com'],
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await teardownTestDatabase();
  }, 30000);

  describe('POST /v1/app/bookings', () => {
    it('should create a booking successfully', async () => {
      // Use future dates for booking
      const today = DateUtils.now();
      const checkIn = DateUtils.create(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const checkOut = DateUtils.create(today.getTime() + 9 * 24 * 60 * 60 * 1000); // 9 days from now

      const createBookingDto: CreateBookingDto = {
        propertyId: String(testProperty._id),
        checkIn: checkIn.toISOString().split('T')[0], // Format as YYYY-MM-DD
        checkOut: checkOut.toISOString().split('T')[0], // Format as YYYY-MM-DD
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        specialRequests: 'Early check-in if possible',
        estimatedArrivalTime: '15:00',
        guestPhone: '+96170123457',
        guestEmail: 'guest.booking@test.com',
      };

      const res = await request(server)
        .post('/v1/app/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(createBookingDto)
        .expect(201);

      const responseBody = res.body as { status: 'success'; data: BookingResponseDto };
      const body = responseBody.data;

      expect(body).toHaveProperty('_id');
      expect(body.property._id).toBe(String(testProperty._id));
      expect(body.guest._id).toBe(guestUserId);
      expect(body.host._id).toBe(hostUserId);
      expect(body.nights).toBe(2);
      expect(body.guests.adults).toBe(2);
      expect(body.guests.totalGuests).toBe(2);
      expect(body.status).toBe(BookingStatus.PENDING);
      expect(body.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(body.specialRequests).toBe('Early check-in if possible');
      expect(body.estimatedArrivalTime).toBe('15:00');
      expect(body).toHaveProperty('confirmationCode');
    });

    it('should fail to create booking without authentication', async () => {
      const createBookingDto: CreateBookingDto = {
        propertyId: String(testProperty._id),
        checkIn: '2024-12-01',
        checkOut: '2024-12-03',
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
      };

      await request(server).post('/v1/app/bookings').send(createBookingDto).expect(401);
    });

    it('should fail to create booking with invalid property ID', async () => {
      const createBookingDto: CreateBookingDto = {
        propertyId: 'invalid-property-id',
        checkIn: '2024-12-01',
        checkOut: '2024-12-03',
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
      };

      await request(server)
        .post('/v1/app/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(createBookingDto)
        .expect(400);
    });

    it('should fail to create booking with invalid guest count', async () => {
      const createBookingDto: CreateBookingDto = {
        propertyId: String(testProperty._id),
        checkIn: '2024-12-01',
        checkOut: '2024-12-03',
        nights: 2,
        guests: {
          adults: 0, // Invalid: must have at least 1 adult
          children: 0,
          infants: 0,
          totalGuests: 0,
        },
      };

      await request(server)
        .post('/v1/app/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send(createBookingDto)
        .expect(400);
    });

    it('should fail to create booking for own property (host)', async () => {
      const createBookingDto: CreateBookingDto = {
        propertyId: String(testProperty._id),
        checkIn: '2024-12-01',
        checkOut: '2024-12-03',
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
      };

      await request(server)
        .post('/v1/app/bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .send(createBookingDto)
        .expect(400);
    });
  });

  describe('GET /v1/app/bookings/my-bookings', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      // Create a test booking with future dates
      const futureCheckIn = DateUtils.now();
      futureCheckIn.setDate(futureCheckIn.getDate() + 7); // 7 days from now
      const futureCheckOut = DateUtils.now();
      futureCheckOut.setDate(futureCheckOut.getDate() + 9); // 9 days from now

      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: futureCheckIn,
        check_out: futureCheckOut,
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'TEST123456',
        confirmedAt: DateUtils.now(),
      });
    });

    it('should get user bookings (as guest)', async () => {
      const res = await request(server)
        .get('/v1/app/bookings/my-bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      const body = res.body as {
        status: 'success';
        data: BookingListResponse;
      };

      expect(body.status).toBe('success');
      expect(body.data).toHaveProperty('bookings');
      expect(body.data).toHaveProperty('total', 1);
      expect(body.data).toHaveProperty('page', 1);
      expect(body.data).toHaveProperty('limit', 10);
      expect(Array.isArray(body.data.bookings)).toBe(true);
      expect(body.data.bookings).toHaveLength(1);
      const firstBooking = body.data.bookings[0];
      expect(firstBooking._id).toBe(String(testBooking._id));
      expect(firstBooking.guestId).toBe(guestUserId);
    });

    it('should return empty array for user with no bookings', async () => {
      // Create another user with no bookings
      const otherEmail = `other.guest.${Date.now()}.${Math.random()}@test.com`;
      const otherRegRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: otherEmail,
          password: 'OtherPassword123!',
          firstName: 'Other',
          lastName: 'Guest',
          roles: ['guest'],
        });

      const otherRegBody = otherRegRes.body as { status: 'success'; data: { testCode?: string } };

      if (!otherRegBody.data?.testCode) {
        console.error('Other user registration failed:', JSON.stringify(otherRegRes.body, null, 2));
        throw new Error('Other user registration failed - testCode not provided');
      }

      const otherVerifyRes = await request(server).post('/v1/public/auth/verify').send({
        identifier: otherEmail,
        code: otherRegBody.data.testCode,
        method: 'email',
      });

      const otherVerifyBody = otherVerifyRes.body as { status: 'success'; data: LoginUserDataDto };
      const otherToken = otherVerifyBody.data.accessToken;

      const res = await request(server)
        .get('/v1/app/bookings/my-bookings')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      const body = res.body as {
        status: 'success';
        data: BookingListResponse;
      };
      expect(body.data.bookings).toHaveLength(0);
      expect(body.data.total).toBe(0);
    });

    it('should require authentication', async () => {
      await request(server).get('/v1/app/bookings/my-bookings').expect(401);
    });
  });

  describe('GET /v1/app/bookings/host-bookings', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      // Create a test booking for the host's property (use future dates)
      const today = DateUtils.now();
      const checkInDate = DateUtils.create(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const checkOutDate = DateUtils.create(today.getTime() + 32 * 24 * 60 * 60 * 1000); // 32 days from now

      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: checkInDate,
        check_out: checkOutDate,
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'HOST123456',
        confirmedAt: DateUtils.now(),
      });
    });

    it('should get host bookings for properties owned by current user', async () => {
      const res = await request(server)
        .get('/v1/app/bookings/host-bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      const body = res.body as {
        status: 'success';
        data: BookingListResponse;
      };

      expect(body.status).toBe('success');
      expect(body.data).toHaveProperty('bookings');
      expect(body.data).toHaveProperty('total', 1);
      expect(body.data).toHaveProperty('page', 1);
      expect(body.data).toHaveProperty('limit', 10);
      expect(Array.isArray(body.data.bookings)).toBe(true);
      expect(body.data.bookings).toHaveLength(1);
      const firstBooking = body.data.bookings[0];
      expect(firstBooking._id).toBe(String(testBooking._id));
      expect(firstBooking.hostId).toBe(hostUserId);
    });

    it('should return empty array for host with no bookings', async () => {
      // Remove the test booking
      await bookingModel.deleteMany({});

      const res = await request(server)
        .get('/v1/app/bookings/host-bookings')
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(200);

      const body = res.body as {
        status: 'success';
        data: BookingListResponse;
      };
      expect(body.data.bookings).toHaveLength(0);
      expect(body.data.total).toBe(0);
    });

    it('should require authentication', async () => {
      await request(server).get('/v1/app/bookings/host-bookings').expect(401);
    });
  });

  describe('GET /v1/app/bookings/:id', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        hostId: hostUserId,
        checkIn: DateUtils.now(),
        checkOut: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          baseAmount: 200,
          cleaningFee: 20,
          serviceFee: 15,
          occupancyTaxes: 5,
          totalAmount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'GET123456',
      });
    });

    it('should get booking by ID (as guest)', async () => {
      const res = await request(server)
        .get(`/v1/app/bookings/${String(testBooking._id)}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      const body = res.body as { status: 'success'; data: BookingResponseDto };
      expect(body.data._id).toBe(String(testBooking._id));
      expect(body.data.guest._id).toBe(guestUserId);
      expect(body.data.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new Types.ObjectId();
      await request(server)
        .get(`/v1/app/bookings/${String(nonExistentId)}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('should return 400 for invalid booking ID format', async () => {
      await request(server)
        .get('/v1/app/bookings/invalid-id')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(400);
    });

    it('should return 403 for unauthorized user', async () => {
      // Create another user who is not the guest or host
      const unauthorizedEmail = `unauthorized.${Date.now()}.${Math.random()}@test.com`;
      const otherRegRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: unauthorizedEmail,
          password: 'UnauthorizedPassword123!',
          firstName: 'Unauthorized',
          lastName: 'User',
          roles: ['guest'],
        });

      const otherRegBody = otherRegRes.body as { status: 'success'; data: { testCode?: string } };

      if (!otherRegBody.data?.testCode) {
        console.error(
          'Unauthorized user registration failed:',
          JSON.stringify(otherRegRes.body, null, 2),
        );
        throw new Error('Unauthorized user registration failed - testCode not provided');
      }

      const otherVerifyRes = await request(server).post('/v1/public/auth/verify').send({
        identifier: unauthorizedEmail,
        code: otherRegBody.data.testCode,
        method: 'email',
      });

      const otherVerifyBody = otherVerifyRes.body as { status: 'success'; data: LoginUserDataDto };
      const unauthorizedToken = otherVerifyBody.data.accessToken;

      await request(server)
        .get(`/v1/app/bookings/${String(testBooking._id)}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });

    it('should require authentication', async () => {
      await request(server)
        .get(`/v1/app/bookings/${String(testBooking._id)}`)
        .expect(401);
    });
  });

  describe('GET /v1/app/bookings/confirmation/:code', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: DateUtils.now(),
        check_out: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'CONF123456',
      });
    });

    it('should get booking by confirmation code', async () => {
      const res = await request(server)
        .get('/v1/app/bookings/confirmation/CONF123456')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);

      const body = res.body as { status: 'success'; data: BookingResponseDto };
      expect(body.data._id).toBe(String(testBooking._id));
      expect(body.data.confirmationCode).toBe('CONF123456');
      expect(body.data.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should return 404 for non-existent confirmation code', async () => {
      await request(server)
        .get('/v1/app/bookings/confirmation/NONEXISTENT')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(server).get('/v1/app/bookings/confirmation/CONF123456').expect(401);
    });
  });

  describe('PUT /v1/app/bookings/:id', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: DateUtils.now(),
        check_out: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          baseAmount: 200,
          cleaningFee: 20,
          serviceFee: 15,
          occupancyTaxes: 5,
          totalAmount: 240,
          currency: 'USD',
        },
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        confirmationCode: 'UPDATE123456',
      });
    });

    it('should update booking special requests (as guest)', async () => {
      const updateDto: UpdateBookingDto = {
        specialRequests: 'Updated special request',
        estimatedArrivalTime: '16:00',
      };

      const res = await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send(updateDto)
        .expect(200);

      const body = res.body as { status: 'success'; data: BookingResponseDto };
      expect(body.data.specialRequests).toBe('Updated special request');
      expect(body.data.estimatedArrivalTime).toBe('16:00');
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new Types.ObjectId();
      const updateDto: UpdateBookingDto = {
        specialRequests: 'This should fail',
      };

      await request(server)
        .put(`/v1/app/bookings/${String(nonExistentId)}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send(updateDto)
        .expect(404);
    });

    it('should require authentication', async () => {
      const updateDto: UpdateBookingDto = {
        specialRequests: 'This should fail',
      };

      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}`)
        .send(updateDto)
        .expect(401);
    });
  });

  describe('PUT /v1/app/bookings/:id/cancel', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      // Use future dates for cancellation test
      const futureCheckIn = DateUtils.now();
      futureCheckIn.setDate(futureCheckIn.getDate() + 7); // 7 days from now
      const futureCheckOut = DateUtils.now();
      futureCheckOut.setDate(futureCheckOut.getDate() + 9); // 9 days from now

      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: futureCheckIn,
        check_out: futureCheckOut,
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'CANCEL123456',
      });
    });

    it('should cancel booking (as guest)', async () => {
      const res = await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'Change of plans' });

      if (res.status !== 200) {
        console.error('Cancel booking failed with status:', res.status);
        console.error('Cancel booking error:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(200);

      const body = res.body as { status: 'success'; data: BookingResponseDto };
      expect(body.data.status).toBe(BookingStatus.CANCELLED);
      expect(body.data.cancellationReason).toBe('Change of plans');
      expect(body.data.cancelledAt).toBeDefined();
      expect(body.data.cancelledBy).toBe(guestUserId);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new Types.ObjectId();

      await request(server)
        .put(`/v1/app/bookings/${String(nonExistentId)}/cancel`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ reason: 'This should fail' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/cancel`)
        .send({ reason: 'This should fail' })
        .expect(401);
    });
  });

  describe('PUT /v1/app/bookings/:id/confirm', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: DateUtils.now(),
        check_out: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.PENDING,
        payment_status: PaymentStatus.PENDING,
        confirmationCode: 'CONFIRM123456',
      });
    });

    it('should fail for non-host user (guest trying to confirm)', async () => {
      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/confirm`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new Types.ObjectId();

      await request(server)
        .put(`/v1/app/bookings/${String(nonExistentId)}/confirm`)
        .set('Authorization', `Bearer ${hostToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/confirm`)
        .expect(401);
    });
  });

  describe('PUT /v1/app/bookings/:id/check-in', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: DateUtils.now(),
        check_out: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'CHECKIN123456',
      });
    });

    it('should require authentication', async () => {
      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/check-in`)
        .expect(401);
    });
  });

  describe('PUT /v1/app/bookings/:id/check-out', () => {
    let testBooking: BookingDocument;

    beforeEach(async () => {
      testBooking = await bookingModel.create({
        propertyId: testProperty._id,
        guestId: guestUserId,
        host_id: hostUserId,
        check_in: DateUtils.now(),
        check_out: DateUtils.create(Date.now() + 2 * 24 * 60 * 60 * 1000),
        nights: 2,
        guests: {
          adults: 2,
          children: 0,
          infants: 0,
          totalGuests: 2,
        },
        pricing: {
          base_amount: 200,
          cleaning_fee: 20,
          service_fee: 15,
          occupancy_taxes: 5,
          total_amount: 240,
          currency: 'USD',
        },
        status: BookingStatus.CHECKED_IN,
        paymentStatus: PaymentStatus.PAID,
        confirmationCode: 'CHECKOUT123456',
      });
    });

    it('should require authentication', async () => {
      await request(server)
        .put(`/v1/app/bookings/${String(testBooking._id)}/check-out`)
        .expect(401);
    });
  });
});
