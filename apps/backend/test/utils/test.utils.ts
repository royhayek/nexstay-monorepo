import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { DateUtils } from '../../src/common/utils/date.utils';

/**
 * Comprehensive test utilities for generating test data
 * Provides consistent and realistic test data across all test suites
 */
export class TestUtils {
  /**
   * Generate a valid MongoDB ObjectId as string
   */
  static generateObjectId(): string {
    return new Types.ObjectId().toString();
  }

  /**
   * Generate a valid MongoDB ObjectId
   */
  static generateMongoId(): Types.ObjectId {
    return new Types.ObjectId();
  }

  /**
   * Generate test email addresses
   */
  static generateEmail(prefix?: string): string {
    const baseEmail = faker.internet.email();
    return prefix ? `${prefix}.${baseEmail}` : baseEmail;
  }

  /**
   * Generate secure test passwords
   */
  static generatePassword(): string {
    return faker.internet.password({ length: 12, memorable: false, pattern: /[A-Za-z0-9!@#$%]/ });
  }

  /**
   * Hash a password for testing (synchronous for test performance)
   */
  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Generate phone numbers in various formats
   */
  static generatePhoneNumber(format: 'US' | 'E164' | 'INTL' = 'E164'): string {
    switch (format) {
      case 'US':
        return faker.phone.number({ style: 'human' });
      case 'E164':
        return `+1${faker.string.numeric(10)}`;
      case 'INTL':
        return faker.phone.number({ style: 'international' });
      default:
        return faker.phone.number();
    }
  }

  /**
   * Generate JWT tokens for testing
   */
  static generateJwtToken(): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: TestUtils.generateObjectId(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64');
    const signature = faker.string.alphanumeric(43);
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate OTP codes
   */
  static generateOtp(length: number = 6): string {
    return faker.string.numeric(length);
  }

  /**
   * Generate addresses with coordinates
   */
  static generateAddress() {
    return {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      zipCode: faker.location.zipCode(),
      coordinates: {
        latitude: parseFloat(faker.location.latitude().toString()),
        longitude: parseFloat(faker.location.longitude().toString()),
      },
    };
  }

  /**
   * Generate currency amounts
   */
  static generatePrice(min: number = 10, max: number = 1000): number {
    return parseFloat(faker.commerce.price({ min, max, dec: 2 }));
  }

  /**
   * Generate dates within ranges
   */
  static generateDateRange(_pastDays: number = 30, _futureDays: number = 30) {
    const start = faker.date.recent();
    const end = faker.date.future();
    return { start, end };
  }

  /**
   * Generate file upload data
   */
  static generateFileUpload(type: 'image' | 'document' = 'image') {
    const baseData = {
      filename: faker.system.fileName(),
      size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
      encoding: '7bit',
      mimetype: type === 'image' ? 'image/jpeg' : 'application/pdf',
    };

    if (type === 'image') {
      return {
        ...baseData,
        mimetype: faker.helpers.arrayElement(['image/jpeg', 'image/png', 'image/gif']),
        filename: faker.system.fileName({ extensionCount: 1 }) + '.jpg',
      };
    }

    return baseData;
  }

  /**
   * Generate test user data
   */
  static generateUserData(overrides: Partial<any> = {}) {
    return {
      _id: TestUtils.generateMongoId(),
      email: TestUtils.generateEmail(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: TestUtils.hashPassword('TestPass123!'),
      phone: TestUtils.generatePhoneNumber(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      role: faker.helpers.arrayElement(['guest', 'host', 'admin']),
      status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
      isVerified: faker.datatype.boolean({ probability: 0.8 }),
      profilePicture: faker.image.avatar(),
      address: TestUtils.generateAddress(),
      preferences: {
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        timezone: faker.location.timeZone(),
      },
      createdAt: faker.date.recent({ days: 365 }),
      updatedAt: DateUtils.now(),
      ...overrides,
    };
  }

  /**
   * Generate test property data
   */
  static generatePropertyData(ownerId?: string, overrides: Partial<any> = {}) {
    return {
      _id: TestUtils.generateMongoId(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      description: faker.lorem.paragraphs(3),
      owner: ownerId || TestUtils.generateObjectId(),
      propertyType: faker.helpers.arrayElement(['apartment', 'house', 'condo', 'villa']),
      roomType: faker.helpers.arrayElement(['entire_place', 'private_room', 'shared_room']),
      maxGuests: faker.number.int({ min: 1, max: 12 }),
      bedrooms: faker.number.int({ min: 1, max: 6 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      address: TestUtils.generateAddress(),
      amenities: faker.helpers.arrayElements(
        ['wifi', 'kitchen', 'parking', 'pool', 'gym', 'pets_allowed', 'smoking_allowed'],
        { min: 2, max: 5 },
      ),
      pricing: {
        basePrice: TestUtils.generatePrice(50, 500),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        cleaningFee: TestUtils.generatePrice(10, 100),
        serviceFee: TestUtils.generatePrice(5, 50),
      },
      availability: {
        calendar: 'available',
        minNights: faker.number.int({ min: 1, max: 7 }),
        maxNights: faker.number.int({ min: 7, max: 365 }),
      },
      images: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
        url: faker.image.urlLoremFlickr({ category: 'house' }),
        alt: faker.lorem.sentence(),
        order: faker.number.int({ min: 1, max: 10 }),
      })),
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended']),
      createdAt: faker.date.recent({ days: 180 }),
      updatedAt: DateUtils.now(),
      ...overrides,
    };
  }

  /**
   * Generate test booking data
   */
  static generateBookingData(userId?: string, propertyId?: string, overrides: Partial<any> = {}) {
    const checkIn = faker.date.future();
    const checkOut = faker.date.future();

    return {
      _id: TestUtils.generateMongoId(),
      user: userId || TestUtils.generateObjectId(),
      property: propertyId || TestUtils.generateObjectId(),
      host: TestUtils.generateObjectId(),
      checkIn,
      checkOut,
      guests: faker.number.int({ min: 1, max: 6 }),
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
      pricing: {
        baseAmount: TestUtils.generatePrice(100, 1000),
        cleaningFee: TestUtils.generatePrice(20, 100),
        serviceFee: TestUtils.generatePrice(10, 50),
        taxes: TestUtils.generatePrice(15, 75),
        totalAmount: TestUtils.generatePrice(150, 1225),
        currency: 'USD',
      },
      payment: {
        method: faker.helpers.arrayElement(['credit_card', 'debit_card', 'paypal']),
        status: faker.helpers.arrayElement(['pending', 'paid', 'refunded', 'failed']),
        transactionId: faker.string.alphanumeric(20),
      },
      cancellation: faker.datatype.boolean({ probability: 0.1 })
        ? {
            reason: faker.helpers.arrayElement(['guest_cancelled', 'host_cancelled', 'other']),
            cancelledAt: faker.date.recent({ days: 7 }),
            refundAmount: TestUtils.generatePrice(0, 500),
          }
        : undefined,
      specialRequests: faker.lorem.sentence(),
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: DateUtils.now(),
      ...overrides,
    };
  }

  /**
   * Generate test message data
   */
  static generateMessageData(
    conversationId?: string,
    senderId?: string,
    overrides: Partial<any> = {},
  ) {
    return {
      _id: TestUtils.generateMongoId(),
      conversation: conversationId || TestUtils.generateObjectId(),
      sender: senderId || TestUtils.generateObjectId(),
      content: faker.lorem.sentences({ min: 1, max: 5 }),
      type: faker.helpers.arrayElement(['text', 'image', 'file', 'system']),
      isRead: faker.datatype.boolean({ probability: 0.7 }),
      readAt: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.recent({ days: 7 }) : null,
      attachments: faker.datatype.boolean({ probability: 0.2 })
        ? [
            {
              type: 'image',
              url: faker.image.url(),
              filename: faker.system.fileName(),
            },
          ]
        : [],
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: DateUtils.now(),
      ...overrides,
    };
  }

  /**
   * Generate test review data
   */
  static generateReviewData(bookingId?: string, reviewerId?: string, overrides: Partial<any> = {}) {
    return {
      _id: TestUtils.generateMongoId(),
      booking: bookingId || TestUtils.generateObjectId(),
      reviewer: reviewerId || TestUtils.generateObjectId(),
      reviewee: TestUtils.generateObjectId(),
      type: faker.helpers.arrayElement(['guest_to_host', 'host_to_guest']),
      ratings: {
        overall: faker.number.int({ min: 1, max: 5 }),
        cleanliness: faker.number.int({ min: 1, max: 5 }),
        accuracy: faker.number.int({ min: 1, max: 5 }),
        communication: faker.number.int({ min: 1, max: 5 }),
        location: faker.number.int({ min: 1, max: 5 }),
        value: faker.number.int({ min: 1, max: 5 }),
      },
      comment: faker.lorem.paragraphs(2),
      response: faker.datatype.boolean({ probability: 0.6 })
        ? {
            content: faker.lorem.paragraph(),
            createdAt: faker.date.recent({ days: 7 }),
          }
        : null,
      isPublic: faker.datatype.boolean({ probability: 0.9 }),
      flagged: faker.datatype.boolean({ probability: 0.05 }),
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: DateUtils.now(),
      ...overrides,
    };
  }

  /**
   * Generate arrays of test data
   */
  static generateArray<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }

  /**
   * Create realistic test scenarios
   */
  static createTestScenario(type: 'booking_flow' | 'user_registration' | 'property_listing') {
    switch (type) {
      case 'booking_flow': {
        const host = TestUtils.generateUserData({ role: 'host' });
        const guest = TestUtils.generateUserData({ role: 'guest' });
        const property = TestUtils.generatePropertyData(host._id.toString(), {
          status: 'active',
        });
        const booking = TestUtils.generateBookingData(
          guest._id.toString(),
          property._id.toString(),
          { status: 'confirmed' },
        );
        return { host, guest, property, booking };
      }

      case 'user_registration': {
        const user = TestUtils.generateUserData({
          isVerified: false,
          status: 'inactive',
          createdAt: DateUtils.now(),
        });
        const verificationCode = TestUtils.generateOtp();
        return { user, verificationCode };
      }

      case 'property_listing': {
        const host = TestUtils.generateUserData({ role: 'host', isVerified: true });
        const property = TestUtils.generatePropertyData(host._id.toString(), {
          status: 'pending',
          createdAt: DateUtils.now(),
        });
        return { host, property };
      }

      default:
        throw new Error(`Unknown test scenario: ${String(type)}`);
    }
  }

  /**
   * Wait for async operations with timeout
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Deep clone objects for test isolation
   */
  static clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  /**
   * Generate test environment variables
   */
  static generateTestEnv() {
    return {
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: faker.string.alphanumeric(32),
      JWT_REFRESH_SECRET: faker.string.alphanumeric(32),
      EMAIL_DISABLED: 'true',
      AWS_S3_BUCKET_NAME: 'test-bucket',
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
    };
  }
}
