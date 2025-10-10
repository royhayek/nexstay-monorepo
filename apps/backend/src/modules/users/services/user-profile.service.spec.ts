import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

// Mock LoggingUtil to prevent error logs in tests
jest.mock('../../../common/utils/logging.util');

import { UserProfileService } from './user-profile.service';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { UpdateProfileDto } from '../dto/update-profile.dto';

// Test data generators
const generateTestData = {
  mongoId: (): string => new Types.ObjectId().toString(),
  email: (): string => `test${Math.random().toString(36).substring(7)}@example.com`,
  firstName: (): string => 'John',
  lastName: (): string => 'Doe',
};

// Mock interface for model
interface MockModel {
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

describe('UserProfileService', () => {
  let service: UserProfileService;
  let userModel: MockModel;

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
        UserProfileService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    userModel = module.get(getModelToken(User.name));
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const userId = generateTestData.mongoId();
    const updateDto: UpdateProfileDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update profile successfully', async (): Promise<void> => {
      const updatedUser = {
        ...mockUser,
        ...updateDto,
        toObject: jest.fn().mockReturnValue({ ...mockUser, ...updateDto }),
      };

      // Mock findById(...).exec() pattern for initial user check
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      // Mock findByIdAndUpdate(...).exec() pattern
      userModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.updateProfile(userId, updateDto);

      expect(result.message).toBeTruthy();
      expect(result.user).toEqual(updatedUser.toObject());
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          firstName: updateDto.firstName,
          lastName: updateDto.lastName,
          updatedAt: expect.any(Date) as Date,
        }),
        { new: true },
      );
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      // Mock findById(...).exec() pattern returning null
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.updateProfile(userId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid ObjectId', async (): Promise<void> => {
      await expect(service.updateProfile('invalid-id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserPreferences', () => {
    const userId = generateTestData.mongoId();

    it('should get user preferences successfully', async (): Promise<void> => {
      const mockUserWithPreferences = {
        ...mockUser,
        preferences: {
          otpNotificationMethod: 'email',
          language: 'en',
          timezone: 'UTC',
        },
        email: generateTestData.email(),
        phone: '+1234567890',
      };

      // Mock findById(userId).exec() pattern (service doesn't use select)
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUserWithPreferences),
      });

      const result = await service.getUserPreferences(userId);

      expect(result).toHaveProperty('otpNotificationMethod');
      expect(result).toHaveProperty('availableMethods');
      expect(result).toHaveProperty('language', 'en');
      expect(result).toHaveProperty('timezone', 'UTC');
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user not found', async (): Promise<void> => {
      // Mock findById(userId).exec() pattern returning null
      userModel.findById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getUserPreferences(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException for invalid ObjectId', async (): Promise<void> => {
      await expect(service.getUserPreferences('invalid-id')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
