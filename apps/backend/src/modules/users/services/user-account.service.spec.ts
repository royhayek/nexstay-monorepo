import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { UserAccountService } from './user-account.service';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { RefreshToken } from '../../../database/schemas/refresh-token.schema';
import { VerificationToken } from '../../../database/schemas/verification-token.schema';
import { AccountActionReason } from '../../../database/schemas/account-action-reason.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { DeactivateAccountDto } from '../dto/deactivate-account.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';

// Test data generators
const generateTestData = {
  mongoId: (): string => new Types.ObjectId().toString(),
  email: (): string => `test${Math.random().toString(36).substring(7)}@example.com`,
  firstName: (): string => 'John',
  lastName: (): string => 'Doe',
};

// Mock interfaces for models
interface MockModel {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  deleteOne: jest.Mock;
  deleteMany: jest.Mock;
}

describe('UserAccountService', () => {
  let service: UserAccountService;
  let userModel: MockModel;
  let refreshTokenModel: MockModel;
  let verificationTokenModel: MockModel;
  let reasonModel: MockModel;

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

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
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
        {
          provide: getModelToken(AccountActionReason.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserAccountService>(UserAccountService);
    userModel = module.get(getModelToken(User.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    verificationTokenModel = module.get(getModelToken(VerificationToken.name));
    reasonModel = module.get(getModelToken(AccountActionReason.name));

    // Set up reasonModel mocks
    reasonModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { id: '1', reason: 'No longer needed', title: 'No longer needed', type: 'deactivation' },
          { id: '2', reason: 'Privacy concerns', title: 'Privacy concerns', type: 'deactivation' },
        ]),
      }),
    });

    reasonModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        id: '1',
        reason: 'Test reason',
        title: 'Test reason title',
        type: 'deactivation',
      }),
    });

    // Set up default userModel mocks
    userModel.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    userModel.findByIdAndDelete = jest.fn().mockReturnValue({
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

  describe('deactivateAccount', () => {
    const userId = generateTestData.mongoId();
    const deactivateDto: DeactivateAccountDto = {
      reasonId: generateTestData.mongoId(),
      customReason: 'Personal reasons',
    };

    it('should deactivate account successfully', async (): Promise<void> => {
      const userWithCompleteData = {
        ...mockUser,
        status: UserStatus.ACTIVE,
        firstName: 'John',
        lastName: 'Doe',
      };
      const deactivatedUser = { ...userWithCompleteData, status: UserStatus.DEACTIVATED };

      // Mock findById(userId).exec() and findByIdAndUpdate(...).exec() patterns
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(userWithCompleteData),
      });

      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(deactivatedUser),
      });

      refreshTokenModel.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      verificationTokenModel.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      const result = await service.deactivateAccount(userId, deactivateDto);

      expect(result.message).toBeTruthy();
      expect(result.deactivatedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deactivateAccount(userId, deactivateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for invalid ObjectId', async (): Promise<void> => {
      // Mock findById to return null for invalid ObjectId
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deactivateAccount('invalid-id', deactivateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAccount', () => {
    const userId = generateTestData.mongoId();
    const deleteDto: DeleteAccountDto = {
      reasonId: generateTestData.mongoId(),
      customReason: 'No longer needed',
    };

    beforeEach(() => {
      userModel.findByIdAndDelete = jest.fn().mockReturnValue({
        exec: jest.fn(),
      });
      refreshTokenModel.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn(),
      });
      verificationTokenModel.deleteMany = jest.fn().mockReturnValue({
        exec: jest.fn(),
      });
    });

    it('should delete account successfully', async (): Promise<void> => {
      // The service might call findById first for validation
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      userModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.deleteAccount(userId, deleteDto);

      expect(result.message).toBeTruthy();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      userModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deleteAccount(userId, deleteDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid ObjectId', async (): Promise<void> => {
      await expect(service.deleteAccount('invalid-id', deleteDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getDeactivationReasons', () => {
    it('should return deactivation reasons', async (): Promise<void> => {
      const reasons = await service.getDeactivationReasons();

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });
  });

  describe('getDeletionReasons', () => {
    it('should return deletion reasons', async (): Promise<void> => {
      const reasons = await service.getDeletionReasons();

      expect(Array.isArray(reasons)).toBe(true);
      expect(reasons.length).toBeGreaterThan(0);
    });
  });
});
