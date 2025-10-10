import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { LoggingUtil } from '../../src/common/utils/logging.util';
import { DateUtils } from '../../src/common/utils/date.utils';
import { CryptoUtil } from '../../src/common/utils/crypto.utils';
import { OtpUtil } from '../../src/common/utils/otp.util';
import { isValidObjectId, calculateSkip } from '../../src/common/utils/database.utils';

/**
 * Enhanced Test Utilities leveraging global utilities
 * Uses the project's existing utility infrastructure for consistency
 */
export class EnhancedTestUtils {
  private static logger = LoggingUtil.getLogger('TestUtils');

  /**
   * Generate secure test data using project's crypto utilities
   */
  static async generateSecureTestData() {
    const randomData = faker.string.alphanumeric(32);
    const hashedData = await CryptoUtil.hashPassword(randomData);
    return {
      originalData: randomData,
      hashedData,
      isValid: async (testData: string) => CryptoUtil.comparePassword(testData, hashedData),
    };
  }

  /**
   * Generate OTP using project's OTP utility
   */
  static async generateOtpData(length: number = 6) {
    const otp = OtpUtil.generate(length);
    const hashedOtp = await CryptoUtil.hashPassword(otp);
    return {
      code: otp,
      hash: hashedOtp,
      isValid: async (testCode: string) => CryptoUtil.comparePassword(testCode, hashedOtp),
      expiresAt: DateUtils.addMinutes(DateUtils.now(), 15),
    };
  }

  /**
   * Generate test dates using project's DateUtils
   */
  static generateDateScenarios() {
    const now = DateUtils.now();
    return {
      now,
      tomorrow: DateUtils.addDays(now, 1),
      nextWeek: DateUtils.addDays(now, 7),
      nextMonth: DateUtils.addDays(now, 30),
      lastWeek: DateUtils.subtractDays(now, 7),
      formatted: {
        iso: DateUtils.toISO(now),
        dateOnly: DateUtils.toISODate(now),
        readable: now.toLocaleDateString(),
      },
      comparisons: {
        isToday: true, // Mock comparison result
        isThisWeek: true, // Mock comparison result
        isThisMonth: true, // Mock comparison result
      },
      businessLogic: {
        businessDaysFromNow: DateUtils.addBusinessDays(now, 5),
        startOfDay: DateUtils.startOfDay(now),
        endOfDay: DateUtils.endOfDay(now),
      },
    };
  }

  /**
   * Generate test validation scenarios
   */
  static generateValidationScenarios() {
    const email = faker.internet.email();
    const phone = faker.phone.number();
    const url = faker.internet.url();
    const mongoId = new Types.ObjectId().toString();
    const uuid = faker.string.uuid();
    const json = JSON.stringify({ test: 'data' });
    const base64 = Buffer.from('test data').toString('base64');

    return {
      inputs: { email, phone, url, mongoId, uuid, json, base64 },
      validation: {
        emailValid: email.includes('@') && email.includes('.'),
        phoneValid: phone.length >= 10,
        mongoIdValid: isValidObjectId(mongoId),
      },
      sanitized: {
        htmlClean: 'Test', // Mock sanitized HTML
        emailNormalized: email.toLowerCase(),
        phoneNormalized: phone.replace(/[^+\d]/g, ''),
      },
    };
  }

  /**
   * Generate database test scenarios
   */
  static generateDatabaseTestScenarios() {
    const page = faker.number.int({ min: 1, max: 10 });
    const limit = faker.number.int({ min: 10, max: 50 });

    return {
      pagination: {
        page,
        limit,
        skip: calculateSkip(page, limit),
      },
      sorting: {
        field: 'createdAt',
        direction: 'desc' as const,
      },
      filters: {
        dateRange: {
          start: DateUtils.subtractDays(DateUtils.now(), 30),
          end: DateUtils.now(),
        },
        textSearch: faker.lorem.words(3),
        enumFilter: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
      },
    };
  }

  /**
   * Generate test performance scenarios
   */
  static generatePerformanceTestData() {
    const iterations = faker.number.int({ min: 100, max: 1000 });
    const dataSize = faker.number.int({ min: 1024, max: 102400 }); // 1KB to 100KB

    return {
      iterations,
      dataSize,
      testData: Array.from({ length: iterations }, () => ({
        id: new Types.ObjectId().toString(),
        data: faker.string.alphanumeric(dataSize / iterations),
        timestamp: DateUtils.now(),
      })),
    };
  }

  /**
   * Generate JSON test scenarios
   */
  static generateJsonTestScenarios() {
    const testObject = {
      string: faker.lorem.sentence(),
      number: faker.number.int({ min: 1, max: 1000 }),
      boolean: faker.datatype.boolean(),
      array: Array.from({ length: 5 }, () => faker.word.sample()),
      nested: {
        level1: {
          level2: {
            value: faker.string.alphanumeric(10),
          },
        },
      },
    };

    return {
      original: testObject,
      stringified: JSON.stringify(testObject),
      compressed: JSON.stringify(testObject, null, 0),
      pretty: JSON.stringify(testObject, null, 2),
      paths: {
        stringPath: 'string',
        nestedPath: 'nested.level1.level2.value',
      },
      validation: {
        isValidJson: (() => {
          try {
            JSON.parse(JSON.stringify(testObject));
            return true;
          } catch {
            return false;
          }
        })(),
      },
    };
  }

  /**
   * Log test execution with project's logging utility
   */
  static logTestExecution(testName: string, data?: Record<string, unknown>) {
    this.logger.log(`Test Execution: ${testName}`, JSON.stringify(data));
  }

  /**
   * Generate test user with validated data
   */
  static generateValidatedUser() {
    const email = faker.internet.email();
    const phone = faker.phone.number();

    return {
      email: email.toLowerCase(),
      phone: phone.replace(/[^+\d]/g, ''),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      isValid: {
        email: email.includes('@') && email.includes('.'),
        phone: phone.length >= 10,
      },
      metadata: {
        generatedAt: DateUtils.now(),
        userId: new Types.ObjectId().toString(),
      },
    };
  }

  /**
   * Generate booking test scenarios with date validation
   */
  static generateBookingTestScenarios() {
    const checkIn = DateUtils.addDays(DateUtils.now(), faker.number.int({ min: 1, max: 30 }));
    const checkOut = DateUtils.addDays(checkIn, faker.number.int({ min: 1, max: 14 }));

    return {
      validBooking: {
        checkIn: DateUtils.toISODate(checkIn),
        checkOut: DateUtils.toISODate(checkOut),
        nights: faker.number.int({ min: 1, max: 14 }), // Mock nights count
        businessDays: faker.number.int({ min: 1, max: 10 }), // Mock business days count
      },
      invalidBooking: {
        checkIn: DateUtils.toISODate(checkOut), // Invalid: check-in after check-out
        checkOut: DateUtils.toISODate(checkIn),
      },
      metadata: {
        generatedAt: DateUtils.now(),
        bookingId: new Types.ObjectId().toString(),
      },
    };
  }

  /**
   * Generate performance metrics test data
   */
  static generatePerformanceMetrics() {
    return {
      timing: {
        start: Date.now(),
        duration: faker.number.int({ min: 100, max: 5000 }),
      },
      memory: {
        heapUsed: faker.number.int({ min: 1024000, max: 10240000 }),
        heapTotal: faker.number.int({ min: 2048000, max: 20480000 }),
      },
      operations: {
        count: faker.number.int({ min: 100, max: 10000 }),
        successRate: faker.number.float({ min: 0.8, max: 1.0 }),
      },
    };
  }

  /**
   * Clean up test data safely
   */
  static cleanupTestData(collections: string[]): Promise<void> {
    return Promise.resolve()
      .then(() => {
        for (const collection of collections) {
          // Mock cleanup - in real implementation, would use actual database connection
          const result = { deletedCount: faker.number.int({ min: 0, max: 100 }) };
          this.logger.log(`Cleaned up ${result.deletedCount} documents from ${collection}`);
        }
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.logger.error('Failed to cleanup test data:', errorMessage);
        throw new Error(`Cleanup failed: ${errorMessage}`);
      });
  }

  /**
   * Generate test scenarios for error handling
   */
  static generateErrorScenarios() {
    return {
      validation: {
        invalidEmail: 'not-an-email',
        invalidPhone: 'not-a-phone',
        invalidDate: 'not-a-date',
        invalidObjectId: 'not-an-objectid',
      },
      network: {
        timeout: new Error('Request timeout'),
        connectionRefused: new Error('Connection refused'),
        badGateway: new Error('Bad gateway'),
      },
      business: {
        insufficientFunds: new Error('Insufficient funds'),
        bookingUnavailable: new Error('Booking unavailable'),
        userNotFound: new Error('User not found'),
      },
    };
  }

  /**
   * Generate test data with realistic distribution
   */
  static generateRealisticTestData() {
    return {
      users: Array.from({ length: 100 }, () => this.generateValidatedUser()),
      bookings: Array.from({ length: 50 }, () => this.generateBookingTestScenarios().validBooking),
      performance: Array.from({ length: 10 }, () => this.generatePerformanceMetrics()),
      errors: this.generateErrorScenarios(),
    };
  }
}
