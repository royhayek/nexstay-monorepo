import { faker } from '@faker-js/faker';
import { Types } from 'mongoose';
import { CleanTestUtils } from '../utils/test.utils.clean.fixed';
import { DateUtils } from '../../src/common/utils/date.utils';

// Define proper interfaces for mocked services
interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

interface MockResponse {
  success: boolean;
  messageId: string;
}

interface MockUploadResult {
  url: string;
  key: string;
  bucket: string;
  size?: number;
  contentType?: string;
}

interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

interface MockAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue?: number;
  occupancyRate?: number;
  period?: string;
}

interface MockTaxCalculation {
  taxAmount: number;
  taxRate: number;
  jurisdiction: string;
  breakdown?: {
    stateTax: number;
    localTax: number;
  };
}

interface MockConversation {
  _id: string;
  participants: string[];
  lastMessage: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface MockPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * JWT Service Mock with proper types
 */
export const mockJwtService = {
  sign: jest
    .fn()
    .mockImplementation((_payload: Record<string, unknown>) => CleanTestUtils.generateJwtToken()),
  signAsync: jest
    .fn()
    .mockImplementation((_payload: Record<string, unknown>) =>
      Promise.resolve(CleanTestUtils.generateJwtToken()),
    ),
  verify: jest.fn().mockImplementation(
    (_token: string): JwtPayload => ({
      sub: CleanTestUtils.generateObjectId(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ),
  verifyAsync: jest.fn().mockImplementation(
    (_token: string): Promise<JwtPayload> =>
      Promise.resolve({
        sub: CleanTestUtils.generateObjectId(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
  ),
  decode: jest.fn().mockImplementation(
    (_token: string): JwtPayload => ({
      sub: CleanTestUtils.generateObjectId(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ),
};

/**
 * Config Service Mock with proper types
 */
export const mockConfigService = {
  get: jest.fn().mockImplementation((key: string): string => {
    const configs: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '7d',
      MONGO_URI: 'mongodb://localhost:27017/test',
      EMAIL_DISABLED: 'true',
      AWS_S3_BUCKET_NAME: 'test-bucket',
      TWILIO_ACCOUNT_SID: 'test-sid',
      TWILIO_AUTH_TOKEN: 'test-token',
      FIREBASE_PROJECT_ID: 'test-project',
    };
    return configs[key] || 'test-value';
  }),
  getOrThrow: jest.fn().mockImplementation((key: string): string => {
    const value = mockConfigService.get(key) as string;
    if (!value) throw new Error(`Configuration key ${key} not found`);
    return value;
  }),
};

/**
 * Dynamic Config Service Mock with proper types
 */
export const mockDynamicConfigService = {
  getConfig: jest.fn().mockImplementation((key: string): Promise<{ value: unknown }> => {
    const configs: Record<string, unknown> = {
      EMAIL_ENABLED: false,
      SMS_ENABLED: true,
      MAINTENANCE_MODE: false,
      MAX_FILE_SIZE: 10485760,
      SUPPORTED_LANGUAGES: ['en', 'es', 'fr'],
    };
    return Promise.resolve({ value: configs[key] || null });
  }),
  updateConfig: jest.fn().mockImplementation((key: string, value: unknown) =>
    Promise.resolve({
      key,
      value,
      updatedAt: DateUtils.now(),
    }),
  ),
  getAllConfigs: jest.fn().mockImplementation(() =>
    Promise.resolve([
      { key: 'EMAIL_ENABLED', value: false },
      { key: 'SMS_ENABLED', value: true },
    ]),
  ),
};

/**
 * Users Facade Service Mock with proper types
 */
export const mockUsersFacadeService = {
  findByEmail: jest
    .fn()
    .mockImplementation((email: string) =>
      Promise.resolve(CleanTestUtils.generateUserData({ email })),
    ),
  findById: jest
    .fn()
    .mockImplementation((id: string) =>
      Promise.resolve(CleanTestUtils.generateUserData({ _id: new Types.ObjectId(id) })),
    ),
  findForAuthByEmail: jest.fn().mockImplementation((email: string) =>
    Promise.resolve(
      CleanTestUtils.generateUserData({
        email,
        password: CleanTestUtils.hashPassword('password'),
      }),
    ),
  ),
  findByPhone: jest
    .fn()
    .mockImplementation((phone: string) =>
      Promise.resolve(CleanTestUtils.generateUserData({ phone })),
    ),
  findUserByIdentifier: jest
    .fn()
    .mockImplementation((identifier: string) =>
      Promise.resolve(CleanTestUtils.generateUserData({ email: identifier })),
    ),
  create: jest
    .fn()
    .mockImplementation((createUserDto: Record<string, unknown>) =>
      Promise.resolve(CleanTestUtils.generateUserData(createUserDto)),
    ),
  update: jest
    .fn()
    .mockImplementation((id: string, updateData: Record<string, unknown>) =>
      Promise.resolve(
        CleanTestUtils.generateUserData({ _id: new Types.ObjectId(id), ...updateData }),
      ),
    ),
  verifyUser: jest
    .fn()
    .mockImplementation((id: string) =>
      Promise.resolve(
        CleanTestUtils.generateUserData({ _id: new Types.ObjectId(id), isVerified: true }),
      ),
    ),
  deactivateUser: jest
    .fn()
    .mockImplementation((id: string) =>
      Promise.resolve(
        CleanTestUtils.generateUserData({ _id: new Types.ObjectId(id), status: 'inactive' }),
      ),
    ),
};

/**
 * Notification Service Mock with proper types
 */
export const mockNotificationService = {
  sendVerificationEmail: jest.fn().mockImplementation(
    (_email: string, _code: string): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
  sendVerificationSMS: jest.fn().mockImplementation(
    (_phone: string, _code: string): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
  sendWelcomeEmail: jest.fn().mockImplementation(
    (_user: Record<string, unknown>): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
  sendPasswordResetEmail: jest.fn().mockImplementation(
    (_email: string, _token: string): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
  sendBookingConfirmation: jest.fn().mockImplementation(
    (_booking: Record<string, unknown>): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
  sendPushNotification: jest.fn().mockImplementation(
    (_userId: string, _message: Record<string, unknown>): Promise<MockResponse> =>
      Promise.resolve({
        success: true,
        messageId: faker.string.alphanumeric(20),
      }),
  ),
};

/**
 * Properties Service Mock with proper types
 */
export const mockPropertiesService = {
  create: jest.fn().mockImplementation((createPropertyDto: Record<string, unknown>) => {
    const ownerId =
      typeof createPropertyDto.ownerId === 'string' ? createPropertyDto.ownerId : undefined;
    return Promise.resolve(CleanTestUtils.generatePropertyData(ownerId, createPropertyDto));
  }),
  findAll: jest
    .fn()
    .mockImplementation(
      (
        query: Record<string, unknown>,
      ): Promise<MockPaginatedResult<ReturnType<typeof CleanTestUtils.generatePropertyData>>> => {
        const properties = CleanTestUtils.generateArray(
          () => CleanTestUtils.generatePropertyData(),
          5,
        );
        return Promise.resolve({
          data: properties,
          total: properties.length,
          page: typeof query.page === 'number' ? query.page : 1,
          limit: typeof query.limit === 'number' ? query.limit : 10,
        });
      },
    ),
  findOne: jest
    .fn()
    .mockImplementation((id: string) =>
      Promise.resolve(
        CleanTestUtils.generatePropertyData(undefined, { _id: new Types.ObjectId(id) }),
      ),
    ),
  update: jest.fn().mockImplementation((id: string, updateDto: Record<string, unknown>) =>
    Promise.resolve(
      CleanTestUtils.generatePropertyData(undefined, {
        _id: new Types.ObjectId(id),
        ...updateDto,
      }),
    ),
  ),
  remove: jest.fn().mockImplementation((_id: string) => Promise.resolve({ deletedCount: 1 })),
  search: jest.fn().mockImplementation((searchDto: Record<string, unknown>) => {
    const properties = CleanTestUtils.generateArray(() => CleanTestUtils.generatePropertyData(), 3);
    return Promise.resolve({
      data: properties,
      total: properties.length,
      filters: searchDto,
    });
  }),
};

/**
 * Bookings Service Mock with proper types
 */
export const mockBookingsService = {
  create: jest.fn().mockImplementation((createBookingDto: Record<string, unknown>) => {
    const userId =
      typeof createBookingDto.userId === 'string' ? createBookingDto.userId : undefined;
    const propertyId =
      typeof createBookingDto.propertyId === 'string' ? createBookingDto.propertyId : undefined;
    return Promise.resolve(
      CleanTestUtils.generateBookingData(userId, propertyId, createBookingDto),
    );
  }),
  findAll: jest
    .fn()
    .mockImplementation(
      (
        query: Record<string, unknown>,
      ): Promise<MockPaginatedResult<ReturnType<typeof CleanTestUtils.generateBookingData>>> => {
        const bookings = CleanTestUtils.generateArray(
          () => CleanTestUtils.generateBookingData(),
          5,
        );
        return Promise.resolve({
          data: bookings,
          total: bookings.length,
          page: typeof query.page === 'number' ? query.page : 1,
          limit: typeof query.limit === 'number' ? query.limit : 10,
        });
      },
    ),
  findOne: jest.fn().mockImplementation((id: string) =>
    Promise.resolve(
      CleanTestUtils.generateBookingData(undefined, undefined, {
        _id: new Types.ObjectId(id),
      }),
    ),
  ),
  update: jest.fn().mockImplementation((id: string, updateDto: Record<string, unknown>) =>
    Promise.resolve(
      CleanTestUtils.generateBookingData(undefined, undefined, {
        _id: new Types.ObjectId(id),
        ...updateDto,
      }),
    ),
  ),
  cancel: jest.fn().mockImplementation((id: string, _reason: string) =>
    Promise.resolve(
      CleanTestUtils.generateBookingData(undefined, undefined, {
        _id: new Types.ObjectId(id),
        status: 'cancelled',
      }),
    ),
  ),
  confirm: jest.fn().mockImplementation((id: string) =>
    Promise.resolve(
      CleanTestUtils.generateBookingData(undefined, undefined, {
        _id: new Types.ObjectId(id),
        status: 'confirmed',
      }),
    ),
  ),
};

/**
 * Payments Service Mock with proper types
 */
export const mockPaymentsService = {
  createPaymentIntent: jest.fn().mockImplementation(
    (amount: number, currency: string): Promise<MockPaymentIntent> =>
      Promise.resolve({
        id: faker.string.alphanumeric(20),
        amount,
        currency,
        status: 'requires_confirmation',
        clientSecret: faker.string.alphanumeric(32),
      }),
  ),
  confirmPayment: jest.fn().mockImplementation(
    (paymentIntentId: string): Promise<MockPaymentIntent> =>
      Promise.resolve({
        id: paymentIntentId,
        amount: CleanTestUtils.generatePrice(50, 500),
        currency: 'USD',
        status: 'succeeded',
      }),
  ),
  refundPayment: jest.fn().mockImplementation((paymentIntentId: string, amount?: number) =>
    Promise.resolve({
      id: faker.string.alphanumeric(20),
      paymentIntentId,
      amount: amount || CleanTestUtils.generatePrice(50, 500),
      status: 'succeeded',
      refundedAt: DateUtils.now(),
    }),
  ),
  processPayment: jest
    .fn()
    .mockImplementation((paymentData: { amount: number; currency: string }) =>
      Promise.resolve({
        transactionId: faker.string.alphanumeric(20),
        status: 'completed',
        amount: paymentData.amount,
        currency: paymentData.currency,
      }),
    ),
};

/**
 * Messaging Service Mock with proper types
 */
export const mockMessagingService = {
  createConversation: jest.fn().mockImplementation(
    (participants: string[]): Promise<MockConversation> =>
      Promise.resolve({
        _id: CleanTestUtils.generateObjectId(),
        participants,
        lastMessage: null,
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      }),
  ),
  sendMessage: jest
    .fn()
    .mockImplementation((conversationId: string, senderId: string, content: string) =>
      Promise.resolve(CleanTestUtils.generateMessageData(conversationId, senderId, { content })),
    ),
  getConversations: jest.fn().mockImplementation((userId: string) =>
    Promise.resolve(
      CleanTestUtils.generateArray(
        () => ({
          _id: CleanTestUtils.generateObjectId(),
          participants: [userId, CleanTestUtils.generateObjectId()],
          lastMessage: CleanTestUtils.generateMessageData(),
          unreadCount: faker.number.int({ min: 0, max: 5 }),
          createdAt: faker.date.recent({ days: 30 }),
          updatedAt: DateUtils.now(),
        }),
        3,
      ),
    ),
  ),
  getMessages: jest
    .fn()
    .mockImplementation((conversationId: string) =>
      Promise.resolve(
        CleanTestUtils.generateArray(() => CleanTestUtils.generateMessageData(conversationId), 10),
      ),
    ),
  markAsRead: jest.fn().mockImplementation((_messageId: string, _userId: string) =>
    Promise.resolve({
      success: true,
      readAt: DateUtils.now(),
    }),
  ),
};

/**
 * Storage/S3 Service Mock with proper types
 */
export const mockS3Service = {
  uploadFile: jest.fn().mockImplementation(
    (file: { size?: number; mimetype?: string }, category: string): Promise<MockUploadResult> =>
      Promise.resolve({
        url: faker.image.url(),
        key: `${category}/${faker.string.alphanumeric(20)}`,
        bucket: 'test-bucket',
        size: file.size || faker.number.int({ min: 1024, max: 1048576 }),
        contentType: file.mimetype || 'image/jpeg',
      }),
  ),
  deleteFile: jest.fn().mockImplementation((key: string) =>
    Promise.resolve({
      success: true,
      deleted: key,
    }),
  ),
  getSignedUrl: jest.fn().mockImplementation(
    (_key: string, expiration = 3600): Promise<{ url: string; expiresIn: number }> =>
      Promise.resolve({
        url: faker.internet.url(),
        expiresIn: expiration as number,
      }),
  ),
  uploadMultipleFiles: jest.fn().mockImplementation(
    (files: unknown[], category: string): Promise<MockUploadResult[]> =>
      Promise.resolve(
        files.map(() => ({
          url: faker.image.url(),
          key: `${category}/${faker.string.alphanumeric(20)}`,
          bucket: 'test-bucket',
        })),
      ),
  ),
};

/**
 * Analytics Service Mock with proper types
 */
export const mockAnalyticsService = {
  getBookingAnalytics: jest.fn().mockImplementation(
    (period: string): Promise<MockAnalytics> =>
      Promise.resolve({
        totalBookings: faker.number.int({ min: 50, max: 500 }),
        totalRevenue: CleanTestUtils.generatePrice(5000, 50000),
        averageBookingValue: CleanTestUtils.generatePrice(200, 800),
        occupancyRate: faker.number.float({ min: 0.6, max: 0.95 }),
        period,
      }),
  ),
  getUserAnalytics: jest.fn().mockImplementation(
    (_userId: string): Promise<MockAnalytics> =>
      Promise.resolve({
        totalBookings: faker.number.int({ min: 0, max: 20 }),
        totalRevenue: CleanTestUtils.generatePrice(500, 5000),
        averageBookingValue: faker.number.float({ min: 3.5, max: 5.0 }),
      }),
  ),
  getPropertyAnalytics: jest.fn().mockImplementation(
    (_propertyId: string): Promise<MockAnalytics> =>
      Promise.resolve({
        totalBookings: faker.number.int({ min: 0, max: 100 }),
        totalRevenue: CleanTestUtils.generatePrice(1000, 10000),
        averageBookingValue: faker.number.float({ min: 3.0, max: 5.0 }),
        occupancyRate: faker.number.float({ min: 0.4, max: 0.9 }),
      }),
  ),
};

/**
 * Tax Service Mock with proper types
 */
export const mockTaxService = {
  calculateTax: jest.fn().mockImplementation(
    (amount: number, jurisdiction: string): Promise<MockTaxCalculation> =>
      Promise.resolve({
        taxAmount: amount * 0.12, // 12% tax rate
        taxRate: 0.12,
        jurisdiction,
        breakdown: {
          stateTax: amount * 0.08,
          localTax: amount * 0.04,
        },
      }),
  ),
  getTaxRates: jest.fn().mockImplementation((jurisdiction: string) =>
    Promise.resolve({
      jurisdiction,
      stateTaxRate: 0.08,
      localTaxRate: 0.04,
      totalTaxRate: 0.12,
    }),
  ),
};

/**
 * Mongoose Model Mock Factory with proper types
 */
export const createMockModel = <T>(data: T[] = []): Record<string, jest.Mock> => {
  // Define mock methods first
  const mockMethods: Record<string, jest.Mock> = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    populate: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    sort: jest.fn(),
    select: jest.fn(),
    lean: jest.fn(),
    aggregate: jest.fn(),
    exec: jest.fn().mockResolvedValue(data[0] || null),
    countDocuments: jest.fn().mockResolvedValue(data.length),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: data.length }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: data.length }),
    create: jest.fn().mockImplementation((doc: Record<string, unknown>) => ({
      ...doc,
      _id: CleanTestUtils.generateObjectId(),
    })),
    save: jest.fn().mockImplementation(function (this: unknown) {
      return this;
    }),
    insertMany: jest
      .fn()
      .mockImplementation((docs: Record<string, unknown>[]) =>
        Promise.resolve(docs.map((doc) => ({ ...doc, _id: CleanTestUtils.generateObjectId() }))),
      ),
  };

  // Set up method chaining by returning mockMethods for chainable methods
  const chainableMethods = [
    'find',
    'findOne',
    'findById',
    'findByIdAndUpdate',
    'findByIdAndDelete',
    'populate',
    'skip',
    'limit',
    'sort',
    'select',
    'lean',
    'aggregate',
  ];

  chainableMethods.forEach((method) => {
    mockMethods[method].mockReturnValue(mockMethods);
  });

  return mockMethods;
};

/**
 * Express Request Mock with proper types
 */
export const createMockRequest = (overrides: Record<string, unknown> = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: CleanTestUtils.generateUserData(),
  file: null,
  files: [],
  ip: faker.internet.ip(),
  method: 'GET',
  url: '/test',
  ...overrides,
});

/**
 * Express Response Mock with proper types
 */
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Socket.IO Mock with proper types
 */
export const createMockSocket = (overrides: Record<string, unknown> = {}) => ({
  id: faker.string.alphanumeric(20),
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  disconnect: jest.fn(),
  rooms: new Set(),
  handshake: {
    auth: {},
    headers: {},
    query: {},
  },
  ...overrides,
});

/**
 * Reset all mocks (useful in beforeEach hooks)
 */
export const resetAllMocks = (): void => {
  const allMocks = [
    ...Object.values(mockJwtService),
    ...Object.values(mockConfigService),
    ...Object.values(mockDynamicConfigService),
    ...Object.values(mockUsersFacadeService),
    ...Object.values(mockNotificationService),
    ...Object.values(mockPropertiesService),
    ...Object.values(mockBookingsService),
    ...Object.values(mockPaymentsService),
    ...Object.values(mockMessagingService),
    ...Object.values(mockS3Service),
    ...Object.values(mockAnalyticsService),
    ...Object.values(mockTaxService),
  ];

  allMocks.forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as jest.MockedFunction<typeof mock>).mockReset();
    }
  });
};
