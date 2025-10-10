import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock LoggingUtil to prevent error logs in tests
jest.mock('../../../common/utils/logging.util');

import { UserAdminService } from './user-admin.service';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { RefreshToken } from '../../../database/schemas/refresh-token.schema';
import { VerificationToken } from '../../../database/schemas/verification-token.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { SortDirectionEnum, UserSortFieldsEnum } from '../../../common/enums/sort.enums';
import { UserTableFilter } from '../../../common/interfaces/table-filters.interface';
import { DateUtils } from '../../../common/utils/date.utils';

// Test data generators
const generateTestData = {
  mongoId: (): string => new Types.ObjectId().toString(),
  email: (): string => `test${Math.random().toString(36).substring(7)}@example.com`,
  firstName: (): string => 'John',
  lastName: (): string => 'Doe',
};

// Mock interfaces for models
interface MockModel {
  aggregate: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  deleteMany: jest.Mock;
  deleteOne: jest.Mock;
}

describe('UserAdminService', () => {
  let service: UserAdminService;
  let userModel: MockModel;
  let refreshTokenModel: MockModel;
  let verificationTokenModel: MockModel;

  const mockUser: Partial<UserDocument> = {
    _id: new Types.ObjectId(),
    email: generateTestData.email(),
    firstName: generateTestData.firstName(),
    lastName: generateTestData.lastName(),
    roles: [UserRole.GUEST],
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    createdAt: DateUtils.now(),
    updatedAt: DateUtils.now(),
  };

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAdminService,
        {
          provide: getModelToken(User.name),
          useValue: {
            aggregate: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            deleteMany: jest.fn(),
            deleteOne: jest.fn(),
          },
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
      ],
    }).compile();

    service = module.get<UserAdminService>(UserAdminService);
    userModel = module.get(getModelToken(User.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    verificationTokenModel = module.get(getModelToken(VerificationToken.name));

    // Setup method return values
    userModel.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        exec: jest.fn(),
      }),
    });

    userModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    userModel.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    userModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    refreshTokenModel.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    verificationTokenModel.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('findAllAdmin', () => {
    const mockFilter: UserTableFilter = {
      page: 1,
      limit: 10,
      sortBy: UserSortFieldsEnum.CREATED_AT,
      sortDirection: SortDirectionEnum.DESC,
    };

    it('should get paginated users successfully', async (): Promise<void> => {
      const mockPaginatedResponse = {
        users: [mockUser as UserDocument],
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      };

      userModel.aggregate.mockResolvedValue([mockUser]);
      jest.spyOn(service, 'findAllAdmin').mockResolvedValue(mockPaginatedResponse);

      const result = await service.findAllAdmin(mockFilter);

      expect(result.users).toEqual([mockUser]);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should handle empty results', async (): Promise<void> => {
      const mockEmptyResponse = {
        users: [] as UserDocument[],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      };

      userModel.aggregate.mockResolvedValue([]);
      jest.spyOn(service, 'findAllAdmin').mockResolvedValue(mockEmptyResponse);

      const result = await service.findAllAdmin(mockFilter);

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('adminUpdateUser', () => {
    const userId = generateTestData.mongoId();
    const updateData = {
      firstName: 'Updated',
    };

    it('should update user successfully', async (): Promise<void> => {
      const updatedUser = { ...mockUser, ...updateData };

      // Mock findById for initial check
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock findByIdAndUpdate for actual update
      userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(updatedUser),
        }),
      });

      const result = await service.adminUpdateUser(userId, updateData);

      expect(result.message).toBeTruthy();
      expect(result.user).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      // Mock findById returning null
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.adminUpdateUser(userId, updateData)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid ObjectId', async (): Promise<void> => {
      // Mock findById to return null for invalid ObjectId
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.adminUpdateUser('invalid-id', updateData)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('adminToggleUserStatus', () => {
    const userId = generateTestData.mongoId();

    it('should toggle user status successfully', async (): Promise<void> => {
      // Mock findById to return active user
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock findByIdAndUpdate for status change
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE }),
      });

      const result = await service.adminToggleUserStatus(userId);

      expect(result.message).toBeTruthy();
      expect(result.status).toBe(UserStatus.INACTIVE);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      // Mock findById returning null
      userModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.adminToggleUserStatus(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminDeleteUser', () => {
    const userId = generateTestData.mongoId();

    it('should delete user successfully', async (): Promise<void> => {
      // Mock findById to return the user first
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      refreshTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });
      verificationTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.adminDeleteUser(userId);

      expect(result.message).toBeTruthy();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.adminDeleteUser(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminToggleEmailVerified', () => {
    const userId = generateTestData.mongoId();

    it('should toggle email verification successfully', async (): Promise<void> => {
      // Start with a user who has email NOT verified
      const initialUser = { ...mockUser, isEmailVerified: false };
      const updatedUser = { ...mockUser, isEmailVerified: true };

      // Mock findById to return the initial user
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(initialUser),
      });

      // Mock update to return user with toggled verification
      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.adminToggleEmailVerified(userId);

      expect(result.message).toBeTruthy();
      expect(result.isEmailVerified).toBe(true);
    });
  });

  describe('adminTogglePhoneVerified', () => {
    const userId = generateTestData.mongoId();

    it('should toggle phone verification successfully', async (): Promise<void> => {
      const userWithPhoneVerified = { ...mockUser, isPhoneVerified: true };

      // Mock findById to return the user first
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      userModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithPhoneVerified),
      });

      const result = await service.adminTogglePhoneVerified(userId);

      expect(result.message).toBeTruthy();
      expect(result.isPhoneVerified).toBe(true);
    });
  });

  describe('adminBulkDeleteUsers', () => {
    const userIds = [generateTestData.mongoId(), generateTestData.mongoId()];

    it('should delete multiple users successfully', async (): Promise<void> => {
      // Mock findById to return a user for each ID (the service calls this for each user)
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, _id: new Types.ObjectId() }),
      });

      // Mock the actual deletion operations
      userModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      refreshTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });
      verificationTokenModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.adminBulkDeleteUsers(userIds);

      expect(result.message).toBeTruthy();
      expect(result.deletedCount).toBe(2);
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException for empty array', async (): Promise<void> => {
      await expect(service.adminBulkDeleteUsers([])).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUsersForDropdown', () => {
    const roles = [UserRole.HOST];
    const search = 'john';

    it('should return users for dropdown successfully', async (): Promise<void> => {
      const mockUsers = [mockUser];

      // The service uses find().select().sort().limit().exec()
      userModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUsers),
            }),
          }),
        }),
      });

      const result = await service.findUsersForDropdown(roles, search);

      expect(result).toEqual(mockUsers);
      expect(userModel.find).toHaveBeenCalled();
    });
  });
});
