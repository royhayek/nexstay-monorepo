import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, ConnectionStates, disconnect, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { DateUtils } from '../../src/common/utils/date.utils';

/**
 * Test Database Factory for comprehensive database testing
 * Provides in-memory MongoDB instances and database utilities
 */
export class TestDatabaseFactory {
  private static mongod: MongoMemoryServer;
  private static connection: Connection;
  private static moduleRef: TestingModule;

  /**
   * Setup test database with MongoMemoryServer
   * Creates isolated in-memory database for testing
   */
  static async setupTestDatabase(): Promise<{
    uri: string;
    connection: Connection;
    module: TestingModule;
  }> {
    // Create MongoDB memory server
    TestDatabaseFactory.mongod = await MongoMemoryServer.create({
      binary: {
        version: '6.0.0',
        downloadDir: './mongodb-binaries',
      },
      instance: {
        dbName: `test_db_${faker.string.alphanumeric(8)}`,
        port: undefined, // Random port
      },
    });

    const uri = TestDatabaseFactory.mongod.getUri();

    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.EMAIL_DISABLED = 'true';

    // Create test module
    TestDatabaseFactory.moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(uri),
      ],
    }).compile();

    // Get database connection
    TestDatabaseFactory.connection =
      TestDatabaseFactory.moduleRef.get<Connection>(getConnectionToken());

    return {
      uri,
      connection: TestDatabaseFactory.connection,
      module: TestDatabaseFactory.moduleRef,
    };
  }

  /**
   * Teardown test database and clean up resources
   */
  static async teardownTestDatabase(): Promise<void> {
    if (TestDatabaseFactory.connection) {
      await TestDatabaseFactory.connection.dropDatabase();
      await TestDatabaseFactory.connection.close();
    }

    if (TestDatabaseFactory.moduleRef) {
      await TestDatabaseFactory.moduleRef.close();
    }

    if (TestDatabaseFactory.mongod) {
      await TestDatabaseFactory.mongod.stop();
    }

    // Clean up mongoose connections
    await disconnect();

    // Clear environment variables
    delete process.env.MONGO_URI;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  }

  /**
   * Clear all collections in the test database
   * Useful for cleaning up between tests
   */
  static async clearDatabase(): Promise<void> {
    if (!TestDatabaseFactory.connection) {
      throw new Error('Database connection not established');
    }

    const collections = TestDatabaseFactory.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  /**
   * Get current database connection
   */
  static getConnection(): Connection {
    if (!TestDatabaseFactory.connection) {
      throw new Error('Database connection not established');
    }
    return TestDatabaseFactory.connection;
  }

  /**
   * Get current testing module
   */
  static getModule(): TestingModule {
    if (!TestDatabaseFactory.moduleRef) {
      throw new Error('Testing module not established');
    }
    return TestDatabaseFactory.moduleRef;
  }

  /**
   * Get database statistics for debugging
   */
  static async getDatabaseStats(): Promise<{
    collections: Record<string, number>;
    totalCollections: number;
    databaseName: string;
  }> {
    if (!TestDatabaseFactory.connection) {
      throw new Error('Database connection not established');
    }

    const db = TestDatabaseFactory.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }
    const collections = await db.collections();
    const stats: Record<string, number> = {};

    for (const collection of collections) {
      const count = await collection.countDocuments();
      stats[collection.collectionName] = count;
    }

    return {
      collections: stats,
      totalCollections: collections.length,
      databaseName: db.databaseName,
    };
  }

  /**
   * Create indexes for better test performance
   */
  static async createTestIndexes(): Promise<void> {
    if (!TestDatabaseFactory.connection) {
      throw new Error('Database connection not established');
    }

    const db = TestDatabaseFactory.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }

    // Common indexes for faster queries in tests
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ phone: 1 });
      await db.collection('properties').createIndex({ owner: 1 });
      await db.collection('bookings').createIndex({ user: 1, property: 1 });
      await db.collection('messages').createIndex({ conversation: 1, createdAt: 1 });
      await db.collection('notifications').createIndex({ user: 1, createdAt: -1 });
    } catch (error: unknown) {
      // Indexes might already exist, ignore errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Some indexes might already exist:', errorMessage);
    }
  }

  /**
   * Seed database with basic test data
   */
  static async seedBasicData(): Promise<{
    testUser: {
      _id: Types.ObjectId;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
      status: string;
      isVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    testProperty: {
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
    };
    testAdmin: {
      _id: Types.ObjectId;
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
      status: string;
      isVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  }> {
    const db = TestDatabaseFactory.connection.db;
    if (!db) {
      throw new Error('Database not available');
    }

    // Create test user
    const testUser = {
      _id: new Types.ObjectId(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: '$2b$10$hash', // Pre-hashed test password
      role: 'guest',
      status: 'active',
      isVerified: true,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    };

    // Create test admin
    const testAdmin = {
      _id: new Types.ObjectId(),
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      password: '$2b$10$hash',
      role: 'admin',
      status: 'active',
      isVerified: true,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    };

    // Create test property
    const testProperty = {
      _id: new Types.ObjectId(),
      title: 'Test Property',
      description: 'A test property for testing',
      owner: testUser._id,
      propertyType: 'apartment',
      roomType: 'entire_place',
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
      },
      pricing: {
        basePrice: 100,
        currency: 'USD',
      },
      status: 'active',
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    };

    // Insert test data
    await db.collection('users').insertMany([testUser, testAdmin]);
    await db.collection('properties').insertOne(testProperty);

    return {
      testUser,
      testProperty,
      testAdmin,
    };
  }

  /**
   * Wait for database operations to complete
   */
  static async waitForDatabase(timeoutMs = 5000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const connection = TestDatabaseFactory.connection;
        if (connection && connection.readyState === ConnectionStates.connected) {
          return;
        }
      } catch {
        // Continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Database not ready after ${timeoutMs}ms`);
  }
}

/**
 * Global test database setup and teardown helpers
 */
export const setupGlobalTestDatabase = async () => {
  return TestDatabaseFactory.setupTestDatabase();
};

export const teardownGlobalTestDatabase = async () => {
  return TestDatabaseFactory.teardownTestDatabase();
};

export const clearTestDatabase = async () => {
  return TestDatabaseFactory.clearDatabase();
};
