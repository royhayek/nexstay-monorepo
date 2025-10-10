import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

import { UserCoreService } from './user-core.service';
import { UserAccountIntegrationService } from './user-account-integration.service';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { RefreshToken } from '../../../database/schemas/refresh-token.schema';
import { VerificationToken } from '../../../database/schemas/verification-token.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { AuthMethod } from '../../auth/dto/login.dto';
import { CryptoUtil } from '../../../common/utils/crypto.utils';

// Mock LoggingUtil to prevent error logs in tests
jest.mock('../../../common/utils/logging.util');

// Test data generators
const generateTestData = {
  mongoId: (): string => new Types.ObjectId().toString(),
  email: (): string => `test${Math.random().toString(36).substring(7)}@example.com`,
  firstName: (): string => 'John',
  lastName: (): string => 'Doe',
};

// Mock interfaces for models and services
interface MockModel {
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  countDocuments: jest.Mock;
  new: jest.Mock;
  constructor: jest.Mock;
  prototype: {
    save: jest.Mock;
  };
}

interface MockUserInstance {
  save: jest.Mock;
  _id?: unknown;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: UserRole[];
  status?: UserStatus;
  isEmailVerified?: boolean;
  [key: string]: unknown;
}

interface MockUserAccountIntegrationService {
  createUserAccounts: jest.MockedFunction<UserAccountIntegrationService['createUserAccounts']>;
}

describe('UserCoreService', () => {
  let service: UserCoreService;
  let userModel: MockModel;
  let userAccountIntegrationService: MockUserAccountIntegrationService;

  const mockUser: Partial<UserDocument> = {
    _id: new Types.ObjectId(),
    email: generateTestData.email(),
    firstName: generateTestData.firstName(),
    lastName: generateTestData.lastName(),
    roles: [UserRole.GUEST],
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    save: jest.fn(),
  };

  const mockCreateUserDto: CreateUserDto = {
    email: generateTestData.email(),
    firstName: generateTestData.firstName(),
    lastName: generateTestData.lastName(),
    roles: [UserRole.GUEST],
  };

  beforeEach(async (): Promise<void> => {
    const mockUserModel = jest.fn().mockImplementation(function (
      this: MockUserInstance,
      data?: Record<string, unknown>,
    ) {
      Object.assign(this, { ...mockUser, ...(data || {}) });
      this.save = jest.fn().mockResolvedValue(this);
      return this;
    }) as unknown as MockModel;

    mockUserModel.findOne = jest.fn();
    mockUserModel.findById = jest.fn();
    mockUserModel.findByIdAndUpdate = jest.fn();
    mockUserModel.countDocuments = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCoreService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: {
            deleteMany: jest.fn(),
          },
        },
        {
          provide: getModelToken(VerificationToken.name),
          useValue: {
            deleteMany: jest.fn(),
          },
        },
        {
          provide: UserAccountIntegrationService,
          useValue: {
            createUserAccounts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserCoreService>(UserCoreService);
    userModel = module.get(getModelToken(User.name));
    userAccountIntegrationService = module.get(UserAccountIntegrationService);
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async (): Promise<void> => {
      // Mock findOne to return null (user doesn't exist)
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Mock password hashing
      jest.spyOn(CryptoUtil, 'hashPassword').mockResolvedValue('hashedPassword');

      // Mock account integration service
      userAccountIntegrationService.createUserAccounts.mockResolvedValue({
        success: true,
        errors: [],
      });

      const result = await service.create(mockCreateUserDto);

      expect(result).toBeDefined();
      expect(userAccountIntegrationService.createUserAccounts).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async (): Promise<void> => {
      // Mock findOne to return null (no existing user check in regular create)
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      // Mock password hashing
      jest.spyOn(CryptoUtil, 'hashPassword').mockResolvedValue('hashedPassword');

      // Create a user instance that throws MongoDB duplicate key error on save
      const mockUserInstance = {
        ...mockUser,
        save: jest.fn().mockRejectedValue({ code: 11000 }), // MongoDB duplicate key error
      };

      // Mock the constructor to return the instance that will fail on save
      (userModel as unknown as jest.Mock).mockImplementation(() => mockUserInstance);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock findById().exec() pattern
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById(userId);

      expect(result).toEqual(mockUser);
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock findById().exec() pattern
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for invalid ObjectId', async (): Promise<void> => {
      // Mock findById() to throw an error for invalid ObjectId
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Cast to ObjectId failed')),
      });

      await expect(service.findById('invalid-id')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async (): Promise<void> => {
      const email = generateTestData.email();

      // Mock findOne({ email }).exec() pattern
      userModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('findUserByIdentifier', () => {
    it('should find user by email identifier', async (): Promise<void> => {
      const email = generateTestData.email();

      // Mock findOne({ email }).select('+passwordHash').exec() pattern
      userModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.findUserByIdentifier(email, AuthMethod.EMAIL);

      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async (): Promise<void> => {
      const userId = generateTestData.mongoId();
      const password = 'testPassword';
      const mockUserWithPassword = {
        ...mockUser,
        passwordHash: 'hashedPassword',
      };

      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUserWithPassword),
        }),
      });

      jest.spyOn(CryptoUtil, 'comparePassword').mockResolvedValue(true);

      const result = await service.validatePassword(userId, password);

      expect(result).toBe(true);
    });
  });

  describe('getMe', () => {
    it('should get current user successfully', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock findById(userId).select('-passwordHash -__v').exec() pattern
      userModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockUser),
        }),
      });

      const result = await service.getMe(userId);

      expect(result).toEqual(mockUser);
    });
  });

  describe('markEmailVerified', () => {
    it('should mark email as verified successfully', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock findById for initial check
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock findByIdAndUpdate for the actual update
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.markEmailVerified(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { isEmailVerified: true });
    });
  });

  describe('markPhoneVerified', () => {
    it('should mark phone as verified successfully', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock findById for initial check
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock findByIdAndUpdate for the actual update
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.markPhoneVerified(userId);

      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, { isPhoneVerified: true });
    });
  });

  describe('exists', () => {
    it('should return true if user exists', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock countDocuments({ _id: id }).exec() pattern
      userModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.exists(userId);

      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async (): Promise<void> => {
      const userId = generateTestData.mongoId();

      // Mock countDocuments({ _id: id }).exec() pattern
      userModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.exists(userId);

      expect(result).toBe(false);
    });
  });
});
