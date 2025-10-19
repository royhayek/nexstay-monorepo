import { Server } from 'http';
import { Model, Types } from 'mongoose';
import request, { Response } from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

// Module imports
import { AppModule } from '../src/app.module';

// Schema imports
import { Property, PropertyDocument } from '../src/database/schemas/property.schema';
import { User, UserDocument } from '../src/database/schemas/user.schema';

// Service imports
import { SmsService } from '../src/common/services/sms.service';
import { S3Service } from '../src/modules/storage/services/s3.service';

// Seeder imports
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';

// Note: Catalog types are now strings, not enums
import { DateUtils } from '../src/common/utils/date.utils';

describe('PropertiesController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userModel: Model<UserDocument>;
  let propertyModel: Model<PropertyDocument>;

  // Test data
  let hostUser: UserDocument;
  let guestUser: UserDocument;
  let hostToken: string;
  let guestToken: string;
  let testProperty: PropertyDocument;

  const mockPropertyData = {
    name: 'Test Guesthouse with Pool',
    summary: 'Beautiful guesthouse with private pool and garden',
    space: 'Entire guesthouse with bedroom, living area, and outdoor spaces',
    description:
      'Perfect for couples or small families. Peaceful location with quick access to beaches.',
    neighborhood_overview: 'Quiet coastal village with cafés and beaches nearby',
    notes: 'Quiet hours after 10pm. No loud parties.',
    transit: 'Parking on premises. 5 min drive to town center.',
    access: 'Exclusive access to guesthouse, pool, and garden.',
    interaction: 'Host available via chat for recommendations.',
    house_rules: 'No parties. No smoking indoors. Respect quiet hours.',
    propertyType: 'GUESTHOUSE',
    roomType: 'ENTIRE_HOME',
    bedType: 'QUEEN',
    minimumNights: 2,
    maximumNights: 28,
    cancellationPolicy: 'MODERATE',
    accommodates: 4,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    price: {
      basePrice: 230,
      currency: 'USD',
      currency_symbol: '$',
      pricePerNight: 230,
      weekly_discount: 8,
      monthly_discount: 15,
      cleaning_fee: 35,
      security_deposit: 150,
      extra_people_fee: 0,
    },
    address: {
      street: 'Near Coastal Road',
      suburb: 'Test Village',
      government_area: 'Test District',
      market: 'Test Governorate',
      country: 'Lebanon',
      country_code: 'LB',
      location: {
        type: 'Point',
        coordinates: [35.6574, 34.2132],
        is_location_exact: false,
      },
    },
    coordinates: {
      latitude: 34.2132,
      longitude: 35.6574,
    },
    amenities: [
      'WiFi',
      'Kitchenette',
      'Air conditioning',
      'Pool',
      'Free parking on premises',
      'Outdoor dining area',
    ],
    features: {
      smoke_detector: true,
      carbon_monoxide_detector: false,
      fire_extinguisher: true,
      first_aid_kit: true,
      kitchen: true,
      wifi: true,
      air_conditioning: true,
      pool: true,
      free_parking: true,
      family_kid_friendly: true,
      pets_allowed: false,
      smoking_allowed: false,
    },
    images: [
      {
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/image1_thumb.jpg',
        caption: 'Private pool and garden',
        isPrimary: true,
        sortOrder: 0,
        roomType: 'outdoor',
      },
      {
        url: 'https://example.com/image2.jpg',
        thumbnailUrl: 'https://example.com/image2_thumb.jpg',
        caption: 'Living area',
        isPrimary: false,
        sortOrder: 1,
        roomType: 'living_room',
      },
    ],
    host: {
      host_id: '', // Will be set dynamically
      host_name: 'Test Host',
      host_since: DateUtils.create('2021-05-10'),
      host_location: 'Test City, Lebanon',
      host_about: 'Local host who loves sharing the best spots.',
      host_response_time: 'within an hour',
      host_response_rate: 100,
      host_acceptance_rate: 98,
      host_is_superhost: true,
      hostThumbnailUrl: 'https://example.com/host_thumb.jpg',
      host_picture_url: 'https://example.com/host.jpg',
      host_listings_count: 1,
      host_total_listings_count: 1,
      host_verifications: ['email', 'phone', 'government_id'],
      host_has_profile_pic: true,
      host_identity_verified: true,
    },
    availability: {
      availability_30: 18,
      availability_60: 36,
      availability_90: 52,
      availability_365: 230,
      has_availability: true,
    },
    instant_bookable: false,
    is_business_travel_ready: false,
    require_guest_profile_picture: false,
    require_guest_phone_verification: true,
  };

  beforeAll(async () => {
    // Set up in-memory MongoDB first
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SmsService)
      .useValue({
        send: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          url: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
          key: 'test-file.jpg',
        }),
        deleteFile: jest.fn().mockResolvedValue(undefined),
        getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.com'),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Set up validation pipe
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // Enable dependency injection in class-validator
    useContainer(app, { fallbackOnErrors: true });

    await app.init();
    server = app.getHttpServer() as Server;

    // Seed dynamic config
    await seedDynamicConfig(app);

    // Get models
    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    propertyModel = moduleFixture.get<Model<PropertyDocument>>(getModelToken(Property.name));

    // Clean up existing test data
    await userModel.deleteMany({ email: { $regex: /@test\.com$/ } });
    await propertyModel.deleteMany({});

    // Create test users once for all tests
    const hostRes = await request(server)
      .post('/api/users')
      .send({
        email: 'host@test.com',
        password: 'HostPassword123!',
        phone: '+1234567890',
        firstName: 'Test',
        lastName: 'Host',
        roles: ['host'],
      });

    interface UserResponse {
      id: string;
      email: string;
    }
    const hostResponseBody = hostRes.body as UserResponse;
    const hostUserId = hostResponseBody.id;
    const foundHostUser = await userModel.findById(hostUserId);
    if (!foundHostUser) {
      throw new Error('Host user not found');
    }
    hostUser = foundHostUser;

    const guestRes = await request(server)
      .post('/api/users')
      .send({
        email: 'guest@test.com',
        password: 'GuestPassword123!',
        phone: '+1234567891',
        firstName: 'Test',
        lastName: 'Guest',
        roles: ['guest'],
      });

    const guestResponseBody = guestRes.body as UserResponse;
    const guestUserId = guestResponseBody.id;
    const foundGuestUser = await userModel.findById(guestUserId);
    if (!foundGuestUser) {
      throw new Error('Guest user not found');
    }
    guestUser = foundGuestUser;

    // Login to get real JWT tokens
    const hostLoginRes = await request(server).post('/auth/login').send({
      identifier: 'host@test.com',
      method: 'email',
      password: 'HostPassword123!',
    });

    const guestLoginRes = await request(server).post('/auth/login').send({
      identifier: 'guest@test.com',
      method: 'email',
      password: 'GuestPassword123!',
    });

    const hostLoginBody = hostLoginRes.body as { status: 'success'; data: { accessToken: string } };
    const guestLoginBody = guestLoginRes.body as {
      status: 'success';
      data: { accessToken: string };
    };

    hostToken = `Bearer ${hostLoginBody.data.accessToken}`;
    guestToken = `Bearer ${guestLoginBody.data.accessToken}`;

    // Set up mock property data with host ID
    mockPropertyData.host.host_id = String(hostUser._id);
  }, 120000);

  beforeEach(async () => {
    // Clean up properties before each test
    await propertyModel.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test properties
    await propertyModel.deleteMany({});
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await teardownTestDatabase();
  }, 30000);

  describe('POST /api/properties', () => {
    it('should create a property successfully when authenticated as host', async () => {
      const response: Response = await request(server)
        .post('/api/properties')
        .set('Authorization', hostToken)
        .send(mockPropertyData)
        .expect(201);

      const body = response.body as {
        status: 'success';
        data: PropertyDocument & { host?: { _id: string } };
      };
      expect(body.data).toHaveProperty('name', mockPropertyData.name);
      expect(body.data).toHaveProperty('host');
      expect(body.data.host).toHaveProperty('_id', String(hostUser._id));

      testProperty = body.data;
    });

    it('should fail to create property without authentication', async () => {
      await request(server).post('/api/properties').send(mockPropertyData).expect(401);
    });

    it('should fail to create property with invalid data', async () => {
      const invalidData: Record<string, unknown> = { ...mockPropertyData };
      delete invalidData.name; // Required field

      await request(server)
        .post('/api/properties')
        .set('Authorization', hostToken)
        .send(invalidData)
        .expect(400);
    });

    it('should fail to create property with invalid price data', async () => {
      const invalidData = {
        ...mockPropertyData,
        price: {
          ...mockPropertyData.price,
          basePrice: -100, // Invalid negative price
        },
      };

      await request(server)
        .post('/api/properties')
        .set('Authorization', hostToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      // Create test properties
      testProperty = await propertyModel.create({
        ...mockPropertyData,
        owner_id: String(hostUser._id),
      });
    });

    it('should get all properties with pagination', async () => {
      const response: Response = await request(server)
        .get('/api/properties')
        .query({ page: 1, limit: 10 })
        .expect(200);

      interface PaginationResponse {
        status: string;
        data: {
          properties: unknown[];
          total: number;
          page: number;
          limit: number;
        };
      }
      const body = response.body as PaginationResponse;
      expect(body.data).toHaveProperty('properties');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('page', 1);
      expect(body.data).toHaveProperty('limit', 10);
      expect(Array.isArray(body.data.properties)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const response: Response = await request(server)
        .get('/api/properties')
        .query({ page: 1, limit: 5 })
        .expect(200);

      interface PaginationCheckResponse {
        data: {
          limit: number;
          page: number;
        };
      }
      const paginationBody = response.body as PaginationCheckResponse;
      expect(paginationBody.data.limit).toBe(5);
      expect(paginationBody.data.page).toBe(1);
    });

    it('should validate pagination parameters', async () => {
      const response: Response = await request(server)
        .get('/api/properties')
        .query({ page: -1, limit: 200 }) // Invalid page, limit too high
        .expect(200);

      interface ValidationResponse {
        data: {
          page: number;
          limit: number;
        };
      }
      const validationBody = response.body as ValidationResponse;
      // Should clamp values to valid range
      expect(validationBody.data.page).toBe(1);
      expect(validationBody.data.limit).toBe(100); // Max limit
    });
  });

  describe('GET /api/properties/:id', () => {
    beforeEach(async () => {
      testProperty = await propertyModel.create({
        ...mockPropertyData,
        owner_id: String(hostUser._id),
      });
    });

    it('should get property by ID', async () => {
      const response: Response = await request(server)
        .get(`/api/properties/${String(testProperty._id)}`)
        .expect(200);

      const body = response.body as { status: string; data: PropertyDocument };
      expect(body.data).toHaveProperty('_id', String(testProperty._id));
      expect(body.data).toHaveProperty('name', mockPropertyData.name);
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = new Types.ObjectId();
      await request(server)
        .get(`/api/properties/${String(nonExistentId)}`)
        .expect(404);
    });

    it('should return 400 for invalid property ID format', async () => {
      await request(server).get('/api/properties/invalid-id').expect(400);
    });
  });

  describe('PUT /api/properties/:id', () => {
    beforeEach(async () => {
      testProperty = await propertyModel.create({
        ...mockPropertyData,
        owner_id: String(hostUser._id),
      });
    });

    it('should update property successfully when owner', async () => {
      const updateData = {
        name: 'Updated Property Name',
        summary: 'Updated summary',
      };

      const response: Response = await request(server)
        .put(`/api/properties/${String(testProperty._id)}`)
        .set('Authorization', hostToken)
        .send(updateData)
        .expect(200);

      const body = response.body as { status: string; data: PropertyDocument };
      expect(body.data).toHaveProperty('name', 'Updated Property Name');
      expect(body.data).toHaveProperty('summary', 'Updated summary');
    });

    it('should fail to update property when not owner', async () => {
      const updateData = {
        name: 'Updated Property Name',
      };

      await request(server)
        .put(`/api/properties/${String(testProperty._id)}`)
        .set('Authorization', guestToken)
        .send(updateData)
        .expect(403);
    });

    it('should fail to update property without authentication', async () => {
      const updateData = {
        name: 'Updated Property Name',
      };

      await request(server)
        .put(`/api/properties/${String(testProperty._id)}`)
        .send(updateData)
        .expect(401);
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = new Types.ObjectId();
      const updateData = {
        name: 'Updated Property Name',
      };

      await request(server)
        .put(`/api/properties/${String(nonExistentId)}`)
        .set('Authorization', hostToken)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/properties/:id', () => {
    beforeEach(async () => {
      testProperty = await propertyModel.create({
        ...mockPropertyData,
        owner_id: String(hostUser._id),
      });
    });

    it('should delete property successfully when owner', async () => {
      const response: Response = await request(server)
        .delete(`/api/properties/${String(testProperty._id)}`)
        .set('Authorization', hostToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify property is deleted
      const deletedProperty = await propertyModel.findById(testProperty._id);
      expect(deletedProperty).toBeNull();
    });

    it('should fail to delete property when not owner', async () => {
      await request(server)
        .delete(`/api/properties/${String(testProperty._id)}`)
        .set('Authorization', guestToken)
        .expect(403);
    });

    it('should fail to delete property without authentication', async () => {
      await request(server)
        .delete(`/api/properties/${String(testProperty._id)}`)
        .expect(401);
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = new Types.ObjectId();

      await request(server)
        .delete(`/api/properties/${String(nonExistentId)}`)
        .set('Authorization', hostToken)
        .expect(404);
    });
  });

  describe('POST /api/properties/search-properties', () => {
    beforeEach(async () => {
      // Create multiple test properties for search testing
      await propertyModel.create([
        {
          ...mockPropertyData,
          name: 'Beach House',
          owner_id: String(hostUser._id),
          price: { ...mockPropertyData.price, basePrice: 150, pricePerNight: 150 },
          accommodates: 2,
        },
        {
          ...mockPropertyData,
          name: 'Mountain Cabin',
          owner_id: String(hostUser._id),
          price: { ...mockPropertyData.price, basePrice: 200, pricePerNight: 200 },
          accommodates: 6,
        },
        {
          ...mockPropertyData,
          name: 'City Apartment',
          owner_id: String(hostUser._id),
          price: { ...mockPropertyData.price, basePrice: 300, pricePerNight: 300 },
          accommodates: 4,
        },
      ]);
    });

    it('should search properties with basic filters', async () => {
      const searchData = {
        name: 'Beach',
        page: 1,
        limit: 10,
      };

      const response: Response = await request(server)
        .post('/api/properties/search-properties')
        .send(searchData)
        .expect(200);

      interface SearchResponse {
        data: {
          properties: Array<{ name: string }>;
        };
      }
      const responseBody = response.body as SearchResponse;
      expect(responseBody.data).toHaveProperty('properties');
      expect(responseBody.data.properties.length).toBeGreaterThan(0);
      expect(responseBody.data.properties[0].name).toContain('Beach');
    });

    it('should search properties with price range', async () => {
      const searchData = {
        price_min: 100,
        price_max: 250,
        page: 1,
        limit: 10,
      };

      const response: Response = await request(server)
        .post('/api/properties/search-properties')
        .send(searchData)
        .expect(200);

      interface PriceSearchResponse {
        data: {
          properties: Array<{
            price: {
              basePrice: number;
            };
          }>;
        };
      }
      const priceResponseBody = response.body as PriceSearchResponse;
      expect(priceResponseBody.data).toHaveProperty('properties');

      // Check that returned properties are within price range
      priceResponseBody.data.properties.forEach((property) => {
        expect(property.price.basePrice).toBeGreaterThanOrEqual(100);
        expect(property.price.basePrice).toBeLessThanOrEqual(250);
      });
    });

    it('should search properties with guest count', async () => {
      const searchData = {
        guests: 6,
        page: 1,
        limit: 10,
      };

      const response: Response = await request(server)
        .post('/api/properties/search-properties')
        .send(searchData)
        .expect(200);

      interface GuestSearchResponse {
        data: {
          properties: Array<{
            accommodates: number;
          }>;
        };
      }
      const guestResponseBody = response.body as GuestSearchResponse;
      expect(guestResponseBody.data).toHaveProperty('properties');

      // Check that returned properties can accommodate the guest count
      guestResponseBody.data.properties.forEach((property) => {
        expect(property.accommodates).toBeGreaterThanOrEqual(6);
      });
    });

    it('should search properties with amenities filter', async () => {
      const searchData = {
        amenities: ['WiFi', 'Pool'],
        page: 1,
        limit: 10,
      };

      const response: Response = await request(server)
        .post('/api/properties/search-properties')
        .send(searchData)
        .expect(200);

      interface AmenitiesSearchResponse {
        data: {
          properties: unknown[];
        };
      }
      const amenitiesResponseBody = response.body as AmenitiesSearchResponse;
      expect(amenitiesResponseBody.data).toHaveProperty('properties');
    });

    it('should handle empty search results', async () => {
      const searchData = {
        name: 'NonExistentProperty',
        page: 1,
        limit: 10,
      };

      const response: Response = await request(server)
        .post('/api/properties/search-properties')
        .send(searchData)
        .expect(200);

      interface EmptySearchResponse {
        data: {
          properties: unknown[];
          total: number;
        };
      }
      const emptyResponseBody = response.body as EmptySearchResponse;
      expect(emptyResponseBody.data).toHaveProperty('properties');
      expect(emptyResponseBody.data.properties).toHaveLength(0);
      expect(emptyResponseBody.data.total).toBe(0);
    });
  });

  describe('GET /api/properties/host/my-properties', () => {
    beforeEach(async () => {
      // Create properties for the host
      await propertyModel.create([
        {
          ...mockPropertyData,
          name: 'Host Property 1',
          owner_id: String(hostUser._id),
        },
        {
          ...mockPropertyData,
          name: 'Host Property 2',
          owner_id: String(hostUser._id),
        },
      ]);

      // Create property for another user
      await propertyModel.create({
        ...mockPropertyData,
        name: 'Other User Property',
        owner_id: String(guestUser._id),
        host: {
          ...mockPropertyData.host,
          host_id: String(guestUser._id),
          host_name: 'Test Guest',
        },
      });
    });

    it('should get only current user properties', async () => {
      const response: Response = await request(server)
        .get('/api/properties/host/my-properties')
        .set('Authorization', hostToken)
        .expect(200);

      interface HostPropertiesResponse {
        data: {
          properties: Array<{
            host: {
              host_id: string;
            };
          }>;
        };
      }
      const hostPropertiesBody = response.body as HostPropertiesResponse;
      expect(hostPropertiesBody.data).toHaveProperty('properties');
      expect(hostPropertiesBody.data.properties).toHaveLength(2);

      // Verify all properties belong to the host
      hostPropertiesBody.data.properties.forEach((property) => {
        expect(property.host).toHaveProperty('host_id', String(hostUser._id));
      });
    });

    it('should require authentication', async () => {
      await request(server).get('/api/properties/host/my-properties').expect(401);
    });
  });

  describe('GET /api/properties/host/:hostId', () => {
    beforeEach(async () => {
      await propertyModel.create([
        {
          ...mockPropertyData,
          name: 'Host Property 1',
          owner_id: String(hostUser._id),
        },
        {
          ...mockPropertyData,
          name: 'Host Property 2',
          owner_id: String(hostUser._id),
        },
      ]);
    });

    it('should get properties by host ID', async () => {
      const response: Response = await request(server)
        .get(`/api/properties/host/${String(hostUser._id)}`)
        .expect(200);

      interface HostByIdResponse {
        data: {
          properties: Array<{
            host: {
              host_id: string;
            };
          }>;
        };
      }
      const hostByIdBody = response.body as HostByIdResponse;
      expect(hostByIdBody.data).toHaveProperty('properties');
      expect(hostByIdBody.data.properties).toHaveLength(2);

      // Verify all properties belong to the specified host
      hostByIdBody.data.properties.forEach((property) => {
        expect(property.host).toHaveProperty('host_id', String(hostUser._id));
      });
    });

    it('should return empty array for host with no properties', async () => {
      const response: Response = await request(server)
        .get(`/api/properties/host/${String(guestUser._id)}`)
        .expect(200);

      interface EmptyHostPropertiesResponse {
        data: {
          properties: unknown[];
        };
      }
      const emptyHostPropertiesBody = response.body as EmptyHostPropertiesResponse;
      expect(emptyHostPropertiesBody.data).toHaveProperty('properties');
      expect(emptyHostPropertiesBody.data.properties).toHaveLength(0);
    });

    it('should return 400 for invalid host ID', async () => {
      await request(server).get('/api/properties/host/invalid-id').expect(400);
    });
  });

  describe('GET /api/properties/:id/availability', () => {
    beforeEach(async () => {
      testProperty = await propertyModel.create({
        ...mockPropertyData,
        owner_id: String(hostUser._id),
      });
    });

    it('should check availability for valid dates', async () => {
      const checkIn = '2024-12-01';
      const checkOut = '2024-12-05';

      const response: Response = await request(server)
        .get(`/api/properties/${String(testProperty._id)}/availability`)
        .query({
          check_in: checkIn,
          check_out: checkOut,
        })
        .expect(200);

      interface AvailabilityResponse {
        data: {
          available: boolean;
        };
      }
      const availabilityBody = response.body as AvailabilityResponse;
      expect(availabilityBody.data).toHaveProperty('available');
      expect(typeof availabilityBody.data.available).toBe('boolean');
    });

    it('should return 400 for invalid date format', async () => {
      const checkIn = 'invalid-date';
      const checkOut = '2024-12-05';

      await request(server)
        .get(`/api/properties/${String(testProperty._id)}/availability`)
        .query({
          check_in: checkIn,
          check_out: checkOut,
        })
        .expect(400);
    });

    it('should return 400 for missing dates', async () => {
      await request(server)
        .get(`/api/properties/${String(testProperty._id)}/availability`)
        .query({
          check_in: '2024-12-01',
          // Missing check_out
        })
        .expect(400);
    });

    it('should return 404 for non-existent property', async () => {
      const nonExistentId = new Types.ObjectId();

      await request(server)
        .get(`/api/properties/${String(nonExistentId)}/availability`)
        .query({
          check_in: '2024-12-01',
          check_out: '2024-12-05',
        })
        .expect(404);
    });
  });
});
