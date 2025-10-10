import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoggingUtil } from '../../src/common/utils/logging.util';
import { DateUtils } from '../../src/common/utils/date.utils';
import { CryptoUtil } from '../../src/common/utils/crypto.utils';
import { OtpUtil } from '../../src/common/utils/otp.util';
import { ValidationUtils } from '../../src/common/utils/validation.utils';

// Define proper interfaces for test data
interface TestUserData {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  role: 'guest' | 'host' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TestPropertyData {
  _id: Types.ObjectId;
  title: string;
  description: string;
  owner: Types.ObjectId;
  propertyType: string;
  roomType: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  pricing: {
    basePrice: number;
    currency: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TestBookingData {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  property: Types.ObjectId;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  status: string;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TestMessageData {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TestValidationScenarios {
  validData: {
    email: string;
    phone: string;
    url: string;
    mongoId: string;
    uuid: string;
    json: string;
    base64: string;
  };
  validationResults: {
    isValidEmail: boolean;
    isValidPhone: boolean;
    isValidUrl: boolean;
    isValidMongoId: boolean;
    isValidUUID: boolean;
    isValidJSON: boolean;
    isValidBase64: boolean;
  };
}

interface TestOtpData {
  code: string;
  hash: string;
  isValid: (testCode: string) => boolean;
  expiresAt: Date;
}

interface TestScenarioResult {
  host?: TestUserData;
  guest?: TestUserData;
  property?: TestPropertyData;
  booking?: TestBookingData;
  user?: TestUserData;
  verificationCode?: string;
}

interface PerformanceResult<T> {
  result: T;
  duration: number;
  performanceInfo: {
    duration: number;
    memoryUsage: {
      heapUsedDelta: number;
      heapTotalDelta: number;
      externalDelta: number;
    };
    withinExpectedTime: boolean;
  };
}

/**
 * Clean Test Utilities with proper TypeScript types
 * Provides consistent and type-safe test data generation
 */
export class CleanTestUtils {
  private static logger = LoggingUtil.getLogger('CleanTestUtils');

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
    return faker.internet.password({ length: 12 });
  }

  /**
   * Hash a password for testing (synchronous for test performance)
   */
  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Generate phone numbers in E164 format
   */
  static generatePhoneNumber(): string {
    return `+1${faker.string.numeric(10)}`;
  }

  /**
   * Generate JWT tokens for testing
   */
  static generateJwtToken(): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: CleanTestUtils.generateObjectId(),
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
  static generateOtp(length = 6): string {
    return faker.string.numeric(length);
  }

  /**
   * Generate OTP using project's OTP utility
   */
  static async generateOtpData(length = 6): Promise<TestOtpData> {
    const otp = OtpUtil.generate(length);
    const hash = await CryptoUtil.hashPassword(otp);
    return {
      code: otp,
      hash,
      isValid: (testCode: string) => bcrypt.compareSync(testCode, hash),
      expiresAt: DateUtils.addMinutes(DateUtils.now(), 15),
    };
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
  static generatePrice(min = 10, max = 1000): number {
    return parseFloat(faker.commerce.price({ min, max, dec: 2 }));
  }

  /**
   * Generate test user data with proper types
   */
  static generateUserData(overrides: Partial<TestUserData> = {}): TestUserData {
    const defaultData: TestUserData = {
      _id: CleanTestUtils.generateMongoId(),
      email: CleanTestUtils.generateEmail(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: CleanTestUtils.hashPassword('TestPass123!'),
      phone: CleanTestUtils.generatePhoneNumber(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      role: faker.helpers.arrayElement(['guest', 'host', 'admin']),
      status: faker.helpers.arrayElement(['active', 'inactive', 'suspended']),
      isVerified: faker.datatype.boolean({ probability: 0.8 }),
      createdAt: faker.date.recent({ days: 365 }),
      updatedAt: DateUtils.now(),
    };

    return { ...defaultData, ...overrides };
  }

  /**
   * Generate test property data with proper types
   */
  static generatePropertyData(
    ownerId?: string,
    overrides: Partial<TestPropertyData> = {},
  ): TestPropertyData {
    const defaultData: TestPropertyData = {
      _id: CleanTestUtils.generateMongoId(),
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      description: faker.lorem.paragraphs(2),
      owner: ownerId ? new Types.ObjectId(ownerId) : CleanTestUtils.generateMongoId(),
      propertyType: faker.helpers.arrayElement(['apartment', 'house', 'condo', 'villa']),
      roomType: faker.helpers.arrayElement(['entire_place', 'private_room', 'shared_room']),
      maxGuests: faker.number.int({ min: 1, max: 12 }),
      bedrooms: faker.number.int({ min: 1, max: 6 }),
      bathrooms: faker.number.int({ min: 1, max: 4 }),
      address: CleanTestUtils.generateAddress(),
      pricing: {
        basePrice: CleanTestUtils.generatePrice(50, 500),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
      },
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended']),
      createdAt: faker.date.recent({ days: 180 }),
      updatedAt: DateUtils.now(),
    };

    return { ...defaultData, ...overrides };
  }

  /**
   * Generate test booking data with proper types
   */
  static generateBookingData(
    userId?: string,
    propertyId?: string,
    overrides: Partial<TestBookingData> = {},
  ): TestBookingData {
    const checkIn = faker.date.future();
    const checkOut = DateUtils.addDays(checkIn, faker.number.int({ min: 1, max: 14 }));

    const defaultData: TestBookingData = {
      _id: CleanTestUtils.generateMongoId(),
      user: userId ? new Types.ObjectId(userId) : CleanTestUtils.generateMongoId(),
      property: propertyId ? new Types.ObjectId(propertyId) : CleanTestUtils.generateMongoId(),
      checkIn,
      checkOut,
      guests: faker.number.int({ min: 1, max: 6 }),
      status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
      totalAmount: CleanTestUtils.generatePrice(100, 2000),
      createdAt: faker.date.recent({ days: 90 }),
      updatedAt: DateUtils.now(),
    };

    return { ...defaultData, ...overrides };
  }

  /**
   * Generate test message data with proper types
   */
  static generateMessageData(
    conversationId?: string,
    senderId?: string,
    overrides: Partial<TestMessageData> = {},
  ): TestMessageData {
    const defaultData: TestMessageData = {
      _id: CleanTestUtils.generateMongoId(),
      conversation: conversationId
        ? new Types.ObjectId(conversationId)
        : CleanTestUtils.generateMongoId(),
      sender: senderId ? new Types.ObjectId(senderId) : CleanTestUtils.generateMongoId(),
      content: faker.lorem.sentences({ min: 1, max: 5 }),
      type: faker.helpers.arrayElement(['text', 'image', 'file', 'system']),
      isRead: faker.datatype.boolean({ probability: 0.7 }),
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: DateUtils.now(),
    };

    return { ...defaultData, ...overrides };
  }

  /**
   * Create test validation scenarios
   */
  static createValidationScenarios(): TestValidationScenarios {
    const testEmail = faker.internet.email();
    const testPhone = faker.phone.number();
    const testUrl = faker.internet.url();
    const testMongoId = CleanTestUtils.generateObjectId();
    const testUuid = faker.string.uuid();
    const testJson = JSON.stringify({ test: 'data' });
    const testBase64 = Buffer.from('test data').toString('base64');

    return {
      validData: {
        email: testEmail,
        phone: testPhone,
        url: testUrl,
        mongoId: testMongoId,
        uuid: testUuid,
        json: testJson,
        base64: testBase64,
      },
      validationResults: {
        isValidEmail: ValidationUtils.validateObjectId(testEmail, 'email').isValid,
        isValidPhone: ValidationUtils.validateObjectId(testPhone, 'phone').isValid,
        isValidUrl: ValidationUtils.validateObjectId(testUrl, 'url').isValid,
        isValidMongoId: ValidationUtils.validateObjectId(testMongoId, 'mongoId').isValid,
        isValidUUID: ValidationUtils.validateObjectId(testUuid, 'uuid').isValid,
        isValidJSON: !!testJson,
        isValidBase64: !!testBase64,
      },
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
  static createTestScenario(
    type: 'booking_flow' | 'user_registration' | 'property_listing',
  ): TestScenarioResult {
    switch (type) {
      case 'booking_flow': {
        const host = CleanTestUtils.generateUserData({ role: 'host' });
        const guest = CleanTestUtils.generateUserData({ role: 'guest' });
        const property = CleanTestUtils.generatePropertyData(host._id.toString(), {
          status: 'active',
        });
        const booking = CleanTestUtils.generateBookingData(
          guest._id.toString(),
          property._id.toString(),
          { status: 'confirmed' },
        );
        return { host, guest, property, booking };
      }

      case 'user_registration': {
        const user = CleanTestUtils.generateUserData({
          isVerified: false,
          status: 'inactive',
          createdAt: DateUtils.now(),
        });
        const verificationCode = CleanTestUtils.generateOtp();
        return { user, verificationCode };
      }

      case 'property_listing': {
        const host = CleanTestUtils.generateUserData({ role: 'host', isVerified: true });
        const property = CleanTestUtils.generatePropertyData(host._id.toString(), {
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
   * Enhanced test logging with consistent format
   */
  static logTestStep(testName: string, step: string, data?: Record<string, unknown>): void {
    CleanTestUtils.logger.log(`[${testName}] ${step}`, 'TestUtils', data);
  }

  static logTestError(testName: string, error: Error, context?: Record<string, unknown>): void {
    CleanTestUtils.logger.error(
      `[${testName}] Test failed: ${error.message}`,
      error.stack,
      'TestUtils',
      {
        context,
      },
    );
  }

  static logTestSuccess(testName: string, duration?: number, assertions?: number): void {
    CleanTestUtils.logger.log(`[${testName}] Test passed`, 'TestUtils', {
      duration: duration ? `${duration}ms` : undefined,
      assertions,
    });
  }

  /**
   * Performance testing utilities with logging
   */
  static async measureTestPerformance<T>(
    testName: string,
    operation: () => Promise<T>,
    expectedMaxDuration?: number,
  ): Promise<PerformanceResult<T>> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    CleanTestUtils.logTestStep(testName, 'Starting performance measurement');

    try {
      const result = await operation();
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      const performanceInfo = {
        duration,
        memoryUsage: {
          heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
          heapTotalDelta: endMemory.heapTotal - startMemory.heapTotal,
          externalDelta: endMemory.external - startMemory.external,
        },
        withinExpectedTime: expectedMaxDuration ? duration <= expectedMaxDuration : true,
      };

      CleanTestUtils.logTestSuccess(testName, duration);

      if (expectedMaxDuration && duration > expectedMaxDuration) {
        CleanTestUtils.logger.warn(`[${testName}] Performance warning`, 'TestUtils', {
          actualDuration: duration,
          expectedMaxDuration,
          difference: duration - expectedMaxDuration,
        });
      }

      return { result, duration, performanceInfo };
    } catch (error) {
      const duration = Date.now() - startTime;
      CleanTestUtils.logTestError(testName, error as Error, { duration });
      throw error;
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
   * Clean up test data with logging
   */
  static async cleanupTestData(
    collections: string[],
    connection: {
      db: {
        collection: (name: string) => {
          deleteMany: (filter: Record<string, unknown>) => Promise<{ deletedCount: number }>;
        };
      };
    },
  ): Promise<Record<string, number>> {
    CleanTestUtils.logTestStep('cleanup', 'Starting test data cleanup', { collections });

    const cleanupResults: Record<string, number> = {};
    for (const collectionName of collections) {
      try {
        const result = await connection.db.collection(collectionName).deleteMany({});
        cleanupResults[collectionName] = result.deletedCount;
        CleanTestUtils.logger.log(
          `Cleaned up ${result.deletedCount} documents from ${collectionName}`,
          'TestUtils',
        );
      } catch (error) {
        CleanTestUtils.logTestError('cleanup', error as Error, { collection: collectionName });
      }
    }

    CleanTestUtils.logTestSuccess('cleanup', undefined, Object.keys(cleanupResults).length);
    return cleanupResults;
  }

  /**
   * Generate test environment variables
   */
  static generateTestEnv(): Record<string, string> {
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
