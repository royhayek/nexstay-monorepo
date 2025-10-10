import { Server } from 'http';
import request from 'supertest';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { AppModule } from '../src/app.module';
import { User, UserDocument } from '../src/database/schemas/user.schema';
import { UserResponseDto } from '../src/modules/users/dto/user-response.dto';
import { seedDynamicConfig } from '../src/database/seeds/dynamic-config.seeder';
import { seedAccountActionReasons } from '../src/database/seeds/account-action-reasons.seeder';
import { LoginUserDataDto } from '../src/modules/auth/dto/login-user-response.dto';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { useContainer } from 'class-validator';
import { DeactivateAccountDataDto } from '../src/modules/users/dto/deactivate-account-response.dto';
import { RequestVerifyDataDto } from '../src/modules/auth/dto/request-verify-response.dto';
import {
  AccountActionReason,
  AccountActionReasonDocument,
  AccountActionType,
} from '../src/database/schemas/account-action-reason.schema';
import { AccountActionReasonDataDto } from '../src/modules/users/dto/account-action-reason-response.dto';
import { DeleteAccountResponseDto } from '../src/modules/users/dto/delete-account.response';
import { UpdateProfileDto } from '../src/modules/users/dto/update-profile.dto';
import { UpdateProfileDataDto } from '../src/modules/users/dto/update-profile-response.dto';
import { setupTestDatabase, teardownTestDatabase } from './test-db-setup';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let token: string;
  let userModel: Model<UserDocument>;
  let reasonModel: Model<AccountActionReasonDocument>;
  let defaultDeactivationReason: AccountActionReasonDocument;
  let defaultDeletionReason: AccountActionReasonDocument;

  beforeAll(async () => {
    // Set up in-memory MongoDB first
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());

    // Enable dependency injection for class-validator
    useContainer(app, { fallbackOnErrors: true });

    await app.init();

    await seedDynamicConfig(app);
    await seedAccountActionReasons(app);

    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    reasonModel = moduleFixture.get<Model<AccountActionReasonDocument>>(
      getModelToken(AccountActionReason.name),
    );

    await userModel.deleteMany({
      email: {
        $in: [
          'john.doe@example.com',
          'deactivation.test@example.com',
          'another.deactivation.test@example.com',
          'other.reason.test@example.com',
          'no.custom.test@example.com',
          'deletion.test@example.com',
          'other.deletion.test@example.com',
          'no.custom.deletion.test@example.com',
        ],
      },
    });

    // Get the default deactivation reason for tests
    defaultDeactivationReason = (await reasonModel
      .findOne({
        actionType: AccountActionType.DEACTIVATION,
        isDefault: true,
      })
      .exec())!;

    // Get the default deletion reason for tests
    defaultDeletionReason = (await reasonModel
      .findOne({
        actionType: AccountActionType.DELETION,
        isDefault: true,
      })
      .exec())!;

    server = app.getHttpServer() as Server;
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await teardownTestDatabase();
  }, 30000);

  it('should create a new user', async () => {
    const res = await request(server)
      .post('/v1/public/auth/register')
      .send({
        email: 'john.doe@example.com',
        password: 'StrongPassword123!',
        firstName: 'John',
        lastName: 'Doe',
      })
      .expect(201);

    const body = res.body as { status: 'success'; data: { testCode: string } };

    expect(body.data).toHaveProperty('testCode');

    // Verify the user to enable login
    await request(server)
      .post('/v1/public/auth/verify')
      .send({
        identifier: 'john.doe@example.com',
        code: body.data.testCode,
        method: 'email',
      })
      .expect(200);
  });

  it('should login and get JWT token', async () => {
    const res = await request(server)
      .post('/v1/public/auth/login')
      .send({
        identifier: 'john.doe@example.com',
        method: 'email',
        password: 'StrongPassword123!',
      })
      .expect(200);

    const body = res.body as { status: 'success'; data: LoginUserDataDto };

    expect(body.data).toHaveProperty('accessToken');
    token = body.data.accessToken;
  });

  it('should retrieve the user profile (protected)', async () => {
    const res = await request(server)
      .get('/v1/app/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as UserResponseDto;

    expect(body.data).toHaveProperty('id');
    expect(body.data.email).toBe('john.doe@example.com');
  });

  it('should return 401 if no token is provided', async () => {
    await request(server).get('/v1/app/users/profile').expect(401);
  });

  it('should get deactivation reasons', async () => {
    const res = await request(server)
      .get('/v1/app/users/account/deactivation-reasons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as { status: 'success'; data: AccountActionReasonDataDto[] };
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('title');
    expect(body.data[0]).toHaveProperty('actionType', 'deactivation');
  });

  it('should get deletion reasons', async () => {
    const res = await request(server)
      .get('/v1/app/users/account/deletion-reasons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = res.body as { status: 'success'; data: AccountActionReasonDataDto[] };
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('title');
    expect(body.data[0]).toHaveProperty('actionType', 'deletion');
  });

  // Profile update tests
  describe('Profile Update', () => {
    it('should update user profile with valid data', async () => {
      const updateData: UpdateProfileDto = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio for testing',
        locale: 'fr-FR',
        timezone: 'Europe/Paris',
      };

      const res = await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      const body = res.body as { status: 'success'; data: UpdateProfileDataDto };
      expect(body.data.message).toBe('Profile updated successfully');
      expect(body.data.user.firstName).toBe('Updated');
      expect(body.data.user.lastName).toBe('Name');
      expect(body.data.user.bio).toBe('Updated bio for testing');
      expect(body.data.user.locale).toBe('fr-FR');
      expect(body.data.user.timezone).toBe('Europe/Paris');
    });

    it('should update partial profile data', async () => {
      const updateData: UpdateProfileDto = {
        bio: 'Only updating bio',
      };

      const res = await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      const body = res.body as { status: 'success'; data: UpdateProfileDataDto };
      expect(body.data.message).toBe('Profile updated successfully');
      expect(body.data.user.bio).toBe('Only updating bio');
      // Other fields should remain unchanged
      expect(body.data.user.firstName).toBe('Updated'); // From previous test
    });

    it('should update avatar URL with valid URL', async () => {
      const updateData: UpdateProfileDto = {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      const res = await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      const body = res.body as { status: 'success'; data: UpdateProfileDataDto };
      expect(body.data.user.avatarUrl).toBe('https://example.com/new-avatar.jpg');
    });

    it('should update birth date with valid date', async () => {
      const updateData: UpdateProfileDto = {
        birthDate: '1985-03-15',
      };

      const res = await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      const body = res.body as { status: 'success'; data: UpdateProfileDataDto };
      expect(body.data.user.birthDate).toBeDefined();
    });

    it('should reject update with invalid avatar URL', async () => {
      const updateData: UpdateProfileDto = {
        avatarUrl: 'not-a-valid-url',
      };

      await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject update with invalid date format', async () => {
      const updateData: UpdateProfileDto = {
        birthDate: 'invalid-date',
      };

      await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject update with too long bio', async () => {
      const updateData: UpdateProfileDto = {
        bio: 'a'.repeat(501), // Exceeds 500 character limit
      };

      await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });

    it('should reject update with too long first name', async () => {
      const updateData: UpdateProfileDto = {
        firstName: 'a'.repeat(51), // Exceeds 50 character limit
      };

      await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);
    });

    it('should require authentication for profile update', async () => {
      const updateData: UpdateProfileDto = {
        firstName: 'Should fail',
      };

      await request(server).put('/v1/app/users/profile').send(updateData).expect(401);
    });

    it('should trim whitespace from string fields', async () => {
      const updateData: UpdateProfileDto = {
        firstName: '  Trimmed  ',
        lastName: '  Name  ',
        bio: '  This bio should be trimmed  ',
      };

      const res = await request(server)
        .put('/v1/app/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      const body = res.body as { status: 'success'; data: UpdateProfileDataDto };
      expect(body.data.user.firstName).toBe('Trimmed');
      expect(body.data.user.lastName).toBe('Name');
      expect(body.data.user.bio).toBe('This bio should be trimmed');
    });
  });

  // Account deactivation tests
  describe('Account Deactivation', () => {
    let deactivationToken: string;

    beforeAll(async () => {
      // Create a separate user for deactivation tests
      const createRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'deactivation.test@example.com',
          password: 'DeactivationTest123!',
          firstName: 'Deactivation',
          lastName: 'Test',
        })
        .expect(201);

      const createBody = createRes.body as { status: 'success'; data: RequestVerifyDataDto };

      // Verify the user
      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'deactivation.test@example.com',
          code: createBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      // Login to get tokens
      const loginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'deactivation.test@example.com',
          method: 'email',
          password: 'DeactivationTest123!',
        })
        .expect(200);

      const loginBody = loginRes.body as { status: 'success'; data: LoginUserDataDto };
      deactivationToken = loginBody.data.accessToken;
    });

    it('should deactivate user account successfully', async () => {
      const res = await request(server)
        .put('/v1/app/users/account/deactivate')
        .set('Authorization', `Bearer ${deactivationToken}`)
        .send({ reasonId: defaultDeactivationReason._id })
        .expect(200);

      const body = res.body as { status: 'success'; data: DeactivateAccountDataDto };
      expect(body.data.message).toBe('Account deactivated successfully');
      expect(body.data.deactivatedAt).toBeDefined();
      expect(body.data.reason).toBe(defaultDeactivationReason.title);
    });

    it('should return 401 when using token from deactivated account', async () => {
      // Try to access a protected endpoint with the deactivated account's token
      await request(server)
        .get('/v1/app/users/profile')
        .set('Authorization', `Bearer ${deactivationToken}`)
        .expect(401);
    });

    it('should prevent login for deactivated account', async () => {
      await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'deactivation.test@example.com',
          method: 'email',
          password: 'DeactivationTest123!',
        })
        .expect(401);
    });

    it('should return 400 when trying to deactivate already deactivated account', async () => {
      // First create and login with another user
      const newUserRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'another.deactivation.test@example.com',
          password: 'AnotherTest123!',
          firstName: 'Another',
          lastName: 'Test',
        })
        .expect(201);

      const newCreateBody = newUserRes.body as { status: 'success'; data: RequestVerifyDataDto };

      // Verify the new user
      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'another.deactivation.test@example.com',
          code: newCreateBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      // Login with new user
      const newLoginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'another.deactivation.test@example.com',
          method: 'email',
          password: 'AnotherTest123!',
        })
        .expect(200);

      const newLoginBody = newLoginRes.body as { status: 'success'; data: LoginUserDataDto };
      const newToken = newLoginBody.data.accessToken;

      // Deactivate the account
      await request(server)
        .put('/v1/app/users/account/deactivate')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ reasonId: defaultDeactivationReason._id })
        .expect(200);

      // Try to deactivate again - should fail with 401 since token is no longer valid
      await request(server)
        .put('/v1/app/users/account/deactivate')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ reasonId: defaultDeactivationReason._id })
        .expect(401);
    });

    it('should require authentication for deactivation endpoint', async () => {
      await request(server)
        .put('/v1/app/users/account/deactivate')
        .send({ reasonId: defaultDeactivationReason._id })
        .expect(401);
    });

    it('should deactivate with "Other reason" and custom text', async () => {
      // First create and login with another user for this test
      const newUserRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'other.reason.test@example.com',
          password: 'OtherTest123!',
          firstName: 'Other',
          lastName: 'Test',
        })
        .expect(201);

      const newCreateBody = newUserRes.body as { status: 'success'; data: RequestVerifyDataDto };

      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'other.reason.test@example.com',
          code: newCreateBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      const newLoginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'other.reason.test@example.com',
          method: 'email',
          password: 'OtherTest123!',
        })
        .expect(200);

      const newLoginBody = newLoginRes.body as { status: 'success'; data: LoginUserDataDto };
      const newToken = newLoginBody.data.accessToken;

      // Find "Other reason"
      const otherReason = await reasonModel
        .findOne({
          actionType: AccountActionType.DEACTIVATION,
          title: /other/i,
        })
        .exec();

      expect(otherReason).toBeTruthy();

      // Test deactivation with "Other reason" and custom text
      const res = await request(server)
        .put('/v1/app/users/account/deactivate')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          reasonId: otherReason!._id,
          customReason: 'I need to focus on my studies',
        })
        .expect(200);

      const body = res.body as { status: 'success'; data: DeactivateAccountDataDto };
      expect(body.data.message).toBe('Account deactivated successfully');
      expect(body.data.reason).toBe(otherReason!.title);
      expect(body.data.customReason).toBe('I need to focus on my studies');
    });

    it('should fail when "Other reason" is selected without custom text', async () => {
      // First create and login with another user for this test
      const newUserRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'no.custom.test@example.com',
          password: 'NoCustom123!',
          firstName: 'NoCustom',
          lastName: 'Test',
        })
        .expect(201);

      const newCreateBody = newUserRes.body as { status: 'success'; data: RequestVerifyDataDto };

      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'no.custom.test@example.com',
          code: newCreateBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      const newLoginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'no.custom.test@example.com',
          method: 'email',
          password: 'NoCustom123!',
        })
        .expect(200);

      const newLoginBody = newLoginRes.body as { status: 'success'; data: LoginUserDataDto };
      const newToken = newLoginBody.data.accessToken;

      // Find "Other reason"
      const otherReason = await reasonModel
        .findOne({
          actionType: AccountActionType.DEACTIVATION,
          title: /other/i,
        })
        .exec();

      expect(otherReason).toBeTruthy();

      // Test deactivation with "Other reason" but no custom text - should fail
      await request(server)
        .put('/v1/app/users/account/deactivate')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          reasonId: otherReason!._id,
        })
        .expect(400);
    });
  });

  // Account deletion tests
  describe('Account Deletion', () => {
    it('should delete account with default reason', async () => {
      // Create a user specifically for deletion test
      const createRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'deletion.test@example.com',
          password: 'DeletionTest123!',
          firstName: 'Deletion',
          lastName: 'Test',
        })
        .expect(201);

      const createBody = createRes.body as { status: 'success'; data: RequestVerifyDataDto };

      // Verify the user
      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'deletion.test@example.com',
          code: createBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      // Login to get tokens
      const loginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'deletion.test@example.com',
          method: 'email',
          password: 'DeletionTest123!',
        })
        .expect(200);

      const loginBody = loginRes.body as { status: 'success'; data: LoginUserDataDto };
      const deletionToken = loginBody.data.accessToken;

      // Delete the account
      const res = await request(server)
        .delete('/v1/app/users/account')
        .set('Authorization', `Bearer ${deletionToken}`)
        .send({ reasonId: defaultDeletionReason._id })
        .expect(200);

      const body = res.body as DeleteAccountResponseDto;

      expect(body.data.message).toBe('Account deleted successfully');
      expect(body.data.deletedAt).toBeDefined();
      expect(body.data.reason).toBe(defaultDeletionReason.title);

      // Try to login with deleted account - should fail
      await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'deletion.test@example.com',
          method: 'email',
          password: 'DeletionTest123!',
        })
        .expect(401);
    });

    it('should delete account with "Other reason" and custom text', async () => {
      // Create a user specifically for deletion test
      const createRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'other.deletion.test@example.com',
          password: 'OtherDeletionTest123!',
          firstName: 'OtherDeletion',
          lastName: 'Test',
        })
        .expect(201);

      const createBody = createRes.body as { status: 'success'; data: RequestVerifyDataDto };

      // Verify the user
      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'other.deletion.test@example.com',
          code: createBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      // Login to get tokens
      const loginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'other.deletion.test@example.com',
          method: 'email',
          password: 'OtherDeletionTest123!',
        })
        .expect(200);

      const loginBody = loginRes.body as { status: 'success'; data: LoginUserDataDto };
      const deletionToken = loginBody.data.accessToken;

      // Find "Other reason" for deletion
      const otherReason = await reasonModel
        .findOne({
          actionType: AccountActionType.DELETION,
          title: /other/i,
        })
        .exec();

      expect(otherReason).toBeTruthy();

      // Delete the account with custom reason
      const res = await request(server)
        .delete('/v1/app/users/account')
        .set('Authorization', `Bearer ${deletionToken}`)
        .send({
          reasonId: otherReason!._id,
          customReason: 'I no longer need this service',
        })
        .expect(200);

      const body = res.body as DeleteAccountResponseDto;
      expect(body.data.message).toBe('Account deleted successfully');
      expect(body.data.reason).toBe(otherReason!.title);
      expect(body.data.customReason).toBe('I no longer need this service');
    });

    it('should fail when "Other reason" is selected for deletion without custom text', async () => {
      // Create a user specifically for deletion test
      const createRes = await request(server)
        .post('/v1/public/auth/register')
        .send({
          email: 'no.custom.deletion.test@example.com',
          password: 'NoCustomDeletion123!',
          firstName: 'NoCustomDeletion',
          lastName: 'Test',
        })
        .expect(201);

      const createBody = createRes.body as { status: 'success'; data: RequestVerifyDataDto };

      // Verify the user
      await request(server)
        .post('/v1/public/auth/verify')
        .send({
          identifier: 'no.custom.deletion.test@example.com',
          code: createBody.data.testCode,
          method: 'email',
        })
        .expect(200);

      // Login to get tokens
      const loginRes = await request(server)
        .post('/v1/public/auth/login')
        .send({
          identifier: 'no.custom.deletion.test@example.com',
          method: 'email',
          password: 'NoCustomDeletion123!',
        })
        .expect(200);

      const loginBody = loginRes.body as { status: 'success'; data: LoginUserDataDto };
      const deletionToken = loginBody.data.accessToken;

      // Find "Other reason" for deletion
      const otherReason = await reasonModel
        .findOne({
          actionType: AccountActionType.DELETION,
          title: /other/i,
        })
        .exec();

      expect(otherReason).toBeTruthy();

      // Try to delete without custom reason - should fail
      await request(server)
        .delete('/v1/app/users/account')
        .set('Authorization', `Bearer ${deletionToken}`)
        .send({
          reasonId: otherReason!._id,
        })
        .expect(400);
    });

    it('should require authentication for deletion endpoint', async () => {
      await request(server)
        .delete('/v1/app/users/account')
        .send({ reasonId: defaultDeletionReason._id })
        .expect(401);
    });
  });
});
