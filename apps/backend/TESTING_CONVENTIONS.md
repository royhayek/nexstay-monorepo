# 🧪 Testing Conventions & Guidelines

**Last Updated**: September 12, 2025  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Testing Philosophy](#-testing-philosophy)
2. [Test Infrastructure](#-test-infrastructure) 
3. [Testing Patterns](#-testing-patterns)
4. [File Organization](#-file-organization)
5. [Naming Conventions](#-naming-conventions)
6. [Test Data Management](#-test-data-management)
7. [Mocking Strategy](#-mocking-strategy)
8. [Performance Testing](#-performance-testing)
9. [CI/CD Integration](#-cicd-integration)
10. [Best Practices](#-best-practices)

---

## 🎯 Testing Philosophy

### Core Principles
- **Test Pyramid**: 70% unit tests, 20% integration tests, 10% e2e tests
- **Fast Feedback**: Tests should run quickly and provide immediate feedback
- **Reliable**: Tests should be deterministic and not flaky
- **Maintainable**: Tests should be easy to understand and modify
- **Realistic**: Test data should mirror production scenarios

### Coverage Goals
- **Critical Modules**: 95%+ coverage (Auth, Payments, User Management)
- **Business Logic**: 85%+ coverage (Properties, Bookings, Analytics)  
- **Utility Functions**: 90%+ coverage (Common utilities, helpers)
- **Integration Points**: 80%+ coverage (APIs, Database operations)

---

## 🏗️ Test Infrastructure

### Core Components

#### 1. Test Database Factory (`test/factories/test-database.factory.ts`)
```typescript
// Setup isolated test database
const { connection, module } = await TestDatabaseFactory.setupTestDatabase();

// Clean up after tests
await TestDatabaseFactory.teardownTestDatabase();

// Clear data between tests
await TestDatabaseFactory.clearDatabase();
```

#### 2. Test Utilities (`test/utils/test.utils.ts`)
```typescript
// Generate realistic test data
const user = TestUtils.generateUserData({ role: 'host' });
const property = TestUtils.generatePropertyData(user._id);
const booking = TestUtils.generateBookingData(user._id, property._id);

// Create test scenarios
const { host, guest, property, booking } = TestUtils.createTestScenario('booking_flow');
```

#### 3. Service Mocks (`test/mocks/service.mocks.ts`)
```typescript
// Use comprehensive mocks
const userService = mockUsersFacadeService;
const jwtService = mockJwtService;
const configService = mockConfigService;

// Reset mocks between tests
resetAllMocks();
```

### Environment Configuration

#### Test Environment Variables
```bash
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/test
JWT_SECRET=test-jwt-secret
EMAIL_DISABLED=true
AWS_S3_ENDPOINT=http://localhost:4566  # LocalStack
```

---

## 🔄 Testing Patterns

### 1. Unit Testing Pattern

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersFacadeService, useValue: mockUsersFacadeService },
        { provide: getModelToken('User'), useValue: createMockModel() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await module.close();
    resetAllMocks();
  });

  describe('registerUser', () => {
    it('should create new user successfully', async () => {
      // Arrange
      const createUserDto = TestUtils.generateUserData();
      const expectedUser = { ...createUserDto, _id: TestUtils.generateObjectId() };
      
      mockUsersFacadeService.findByEmail.mockResolvedValue(null);
      mockUsersFacadeService.create.mockResolvedValue(expectedUser);

      // Act
      const result = await service.registerUser(createUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(mockUsersFacadeService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          password: expect.any(String), // Hashed password
        })
      );
    });

    it('should throw ConflictException when email exists', async () => {
      // Arrange
      const createUserDto = TestUtils.generateUserData();
      mockUsersFacadeService.findByEmail.mockResolvedValue(createUserDto);

      // Act & Assert
      await expect(service.registerUser(createUserDto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### 2. Integration Testing Pattern

```typescript
describe('Properties Integration', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const { module, connection: testConnection } = await TestDatabaseFactory.setupTestDatabase();
    connection = testConnection;
    
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await TestDatabaseFactory.teardownTestDatabase();
  });

  beforeEach(async () => {
    await TestDatabaseFactory.clearDatabase();
  });

  describe('POST /properties', () => {
    it('should create property successfully', async () => {
      // Arrange
      const { host, property } = TestUtils.createTestScenario('property_listing');
      const authToken = TestUtils.generateJwtToken();

      // Act
      const response = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send(property)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        title: property.title,
        owner: host._id.toString(),
        status: 'pending',
      });

      // Verify database state
      const savedProperty = await connection.db.collection('properties').findOne({
        _id: response.body._id,
      });
      expect(savedProperty).toBeDefined();
    });
  });
});
```

### 3. E2E Testing Pattern

```typescript
describe('Booking Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full booking flow', async () => {
    const { host, guest, property } = TestUtils.createTestScenario('booking_flow');
    
    // 1. Create property
    const propertyResponse = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${host.token}`)
      .send(property);

    // 2. Search properties
    const searchResponse = await request(app.getHttpServer())
      .get('/properties/search')
      .query({ city: property.address.city });

    expect(searchResponse.body.data).toHaveLength(1);

    // 3. Create booking
    const bookingData = {
      propertyId: propertyResponse.body._id,
      checkIn: '2024-12-01',
      checkOut: '2024-12-03',
      guests: 2,
    };

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${guest.token}`)
      .send(bookingData);

    expect(bookingResponse.body.status).toBe('pending');

    // 4. Confirm payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/bookings/${bookingResponse.body._id}/confirm-payment`)
      .set('Authorization', `Bearer ${guest.token}`)
      .send({ paymentIntentId: 'pi_test_123' });

    expect(paymentResponse.body.status).toBe('confirmed');
  });
});
```

---

## 📁 File Organization

### Directory Structure
```
test/
├── factories/
│   └── test-database.factory.ts      # Database setup
├── utils/
│   ├── test.utils.ts                 # Test data generators
│   └── test-utilities.enhanced.ts    # Advanced utilities
├── mocks/
│   └── service.mocks.ts              # Service mocks
├── fixtures/                         # Static test data
│   ├── users.json
│   ├── properties.json
│   └── bookings.json
└── support/                          # Test helpers
    ├── matchers.ts                   # Custom Jest matchers
    └── setup.ts                      # Global test setup

src/
└── modules/
    └── auth/
        ├── auth.service.ts
        └── auth.service.spec.ts      # Unit tests
```

### Test File Naming
- Unit tests: `*.service.spec.ts`, `*.controller.spec.ts`
- Integration tests: `*.integration.spec.ts`
- E2E tests: `*.e2e-spec.ts` (in `/test` directory)

---

## 🏷️ Naming Conventions

### Test Suites
```typescript
describe('ServiceName', () => {           // Service/Class under test
describe('MethodName', () => {            // Method under test
describe('Integration: FeatureName', () => {  // Integration tests
describe('E2E: User Journey', () => {         // End-to-end tests
```

### Test Cases
```typescript
it('should return success when valid input provided', () => {})
it('should throw ValidationError when email is invalid', () => {})
it('should handle concurrent requests correctly', () => {})
```

### Test Data
```typescript
const validUserData = TestUtils.generateUserData();
const invalidEmailData = { ...validUserData, email: 'invalid-email' };
const existingUser = TestUtils.generateUserData({ email: 'existing@test.com' });
```

---

## 📊 Test Data Management

### Test Data Principles
1. **Isolation**: Each test should have its own data
2. **Realistic**: Use faker.js for realistic data generation
3. **Consistent**: Use TestUtils for standardized data
4. **Clean**: Clean up data after each test

### Data Generation Examples

#### User Data
```typescript
// Basic user
const user = TestUtils.generateUserData();

// Specific role
const admin = TestUtils.generateUserData({ role: 'admin' });

// With validation
const { userData, validation } = await EnhancedTestUtils.generateValidatedUser({
  isVerified: true
});
```

#### Property Data
```typescript
// Basic property
const property = TestUtils.generatePropertyData();

// With owner
const property = TestUtils.generatePropertyData(ownerId);

// With geo validation
const { propertyData, geoValidation } = EnhancedTestUtils.generateGeoValidatedProperty();
```

#### Booking Data
```typescript
// Complete booking scenario
const booking = TestUtils.generateBookingData(userId, propertyId);

// With date validation
const { bookingData, dateValidation } = EnhancedTestUtils.generateDateValidatedBooking();
```

### Test Scenarios
```typescript
// Pre-built scenarios for common flows
const bookingFlow = TestUtils.createTestScenario('booking_flow');
const userRegistration = TestUtils.createTestScenario('user_registration');
const propertyListing = TestUtils.createTestScenario('property_listing');
```

---

## 🎭 Mocking Strategy

### Service Mocking Hierarchy
1. **External Services**: Always mock (Twilio, Firebase, S3)
2. **Database**: Use in-memory for integration, mock for unit tests
3. **Internal Services**: Mock dependencies, test the service in isolation
4. **Utilities**: Generally don't mock, test directly

### Mock Categories

#### 1. External Service Mocks
```typescript
// Payment services
const mockPaymentService = {
  createIntent: jest.fn().mockResolvedValue({ id: 'pi_123', status: 'succeeded' }),
  confirmPayment: jest.fn().mockResolvedValue({ status: 'confirmed' })
};

// Notification services  
const mockNotificationService = {
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg_123' }),
  sendSMS: jest.fn().mockResolvedValue({ success: true, messageId: 'sms_123' })
};
```

#### 2. Database Model Mocks
```typescript
const mockUserModel = createMockModel([
  TestUtils.generateUserData({ email: 'test@example.com' })
]);
```

#### 3. Partial Mocks
```typescript
// Mock only specific methods
jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
```

### Mock Management
```typescript
beforeEach(() => {
  resetAllMocks(); // Reset all service mocks
});

afterEach(() => {
  jest.clearAllMocks(); // Clear call history
});
```

---

## ⚡ Performance Testing

### Performance Test Utilities
```typescript
describe('Performance Tests', () => {
  it('should handle user creation within 100ms', async () => {
    const { result, duration, performanceInfo } = await EnhancedTestUtils.measureTestPerformance(
      'user creation',
      async () => authService.createUser(userData),
      100 // Max duration in ms
    );

    expect(duration).toBeLessThan(100);
    expect(performanceInfo.memoryUsage.heapUsedDelta).toBeLessThan(10000000); // 10MB
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() => 
      propertiesService.search({ city: 'New York' })
    );

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });
});
```

### Load Testing Guidelines
- Test with realistic data volumes
- Simulate concurrent users
- Monitor memory usage
- Test database query performance

---

## 🔄 CI/CD Integration

### Test Execution Order
1. **Lint & Format**: ESLint, Prettier
2. **Type Check**: TypeScript compilation
3. **Unit Tests**: Individual service tests
4. **Integration Tests**: Multi-service tests
5. **E2E Tests**: Full application flows
6. **Coverage Report**: Generate coverage reports

### GitHub Actions Configuration
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npx tsc --noEmit
        
      - name: Run unit tests
        run: npm run test -- --coverage
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Coverage Requirements
- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage
- **New Code**: 90% coverage required
- **PR Checks**: Coverage cannot decrease

---

## ✅ Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
it('should create user with valid data', async () => {
  // Arrange
  const userData = TestUtils.generateUserData();
  mockUserRepository.findByEmail.mockResolvedValue(null);
  
  // Act
  const result = await userService.createUser(userData);
  
  // Assert
  expect(result).toMatchObject({
    id: expect.any(String),
    email: userData.email,
    isVerified: false,
  });
});
```

### 2. Test Isolation
```typescript
beforeEach(async () => {
  await TestDatabaseFactory.clearDatabase(); // Clean state
  resetAllMocks(); // Reset mocks
});
```

### 3. Descriptive Test Names
```typescript
// Good ✅
it('should throw ValidationError when email format is invalid', async () => {});
it('should return cached result on second identical request', async () => {});

// Bad ❌
it('should work', async () => {});
it('test user creation', async () => {});
```

### 4. Custom Matchers
```typescript
// test/support/matchers.ts
expect.extend({
  toBeValidUser(received) {
    const pass = received && 
                received._id && 
                received.email && 
                typeof received.isVerified === 'boolean';
    
    return {
      message: () => `expected ${received} to be a valid user object`,
      pass,
    };
  },
});

// Usage
expect(user).toBeValidUser();
```

### 5. Error Testing
```typescript
it('should handle database connection errors gracefully', async () => {
  // Simulate database error
  mockUserModel.create.mockRejectedValue(new Error('Database connection failed'));
  
  await expect(userService.createUser(userData)).rejects.toThrow('Database connection failed');
  
  // Verify error logging
  expect(logger.error).toHaveBeenCalledWith(
    expect.stringContaining('Database connection failed'),
    expect.any(Object)
  );
});
```

### 6. Async Testing
```typescript
it('should handle async operations correctly', async () => {
  const promise = userService.processUserData(userData);
  
  // Don't forget await!
  const result = await promise;
  
  expect(result).toBeDefined();
});

// Testing promises that should reject
it('should reject invalid data', async () => {
  await expect(userService.validateUser(invalidData)).rejects.toThrow();
});
```

### 7. Timeout Management
```typescript
describe('Heavy operations', () => {
  // Increase timeout for heavy operations
  jest.setTimeout(30000);
  
  it('should process large dataset', async () => {
    const largeDataset = Array(10000).fill(null).map(() => TestUtils.generateUserData());
    const result = await dataService.processBulkUsers(largeDataset);
    
    expect(result.processed).toBe(10000);
  });
});
```

### 8. Environment-Specific Tests
```typescript
describe('Production behavior', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });
  
  afterAll(() => {
    process.env.NODE_ENV = 'test';
  });
  
  it('should not send emails in production test mode', async () => {
    await emailService.sendWelcomeEmail(user);
    expect(mockMailer.send).not.toHaveBeenCalled();
  });
});
```

---

## 🚀 Quick Start Checklist

### For New Tests
- [ ] Choose appropriate test type (unit/integration/e2e)
- [ ] Use TestDatabaseFactory for database setup
- [ ] Generate test data with TestUtils
- [ ] Mock external dependencies with service mocks
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Include error scenarios
- [ ] Clean up resources in teardown

### For Test Reviews
- [ ] Tests are focused and test one thing
- [ ] Test names are descriptive
- [ ] Proper mock usage (not over-mocking)
- [ ] Edge cases are covered
- [ ] Performance considerations
- [ ] Cleanup is proper
- [ ] Coverage meets requirements

---

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Faker.js Documentation](https://fakerjs.dev/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

### Internal Resources
- Test Database Factory: `test/factories/test-database.factory.ts`
- Test Utilities: `test/utils/test.utils.ts`
- Service Mocks: `test/mocks/service.mocks.ts`
- Existing Tests: Browse `src/**/*.spec.ts` for examples

---

*This document is maintained by the development team. Please update when adding new testing patterns or utilities.*