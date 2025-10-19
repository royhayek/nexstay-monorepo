import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { UserHostService } from './user-host.service';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import {
  AdminActionApproval,
  AdminActionApprovalDocument,
  ApprovalStatus,
  ApprovalActionType,
} from '../../../database/schemas/admin-action-approval.schema';
import { NotificationsService } from '../../notifications/notifications.service';
import { UserAccountIntegrationService } from './user-account-integration.service';
import { BecomeHostApplicationDto } from '../dto/become-host.dto';
import { NotificationType } from '../../../common/enums/notification.enums';

describe('UserHostService', () => {
  let service: UserHostService;
  let userModel: Model<UserDocument>;
  let adminActionApprovalModel: Model<AdminActionApprovalDocument>;
  let notificationsService: NotificationsService;
  let accountIntegrationService: UserAccountIntegrationService;

  // Mock user data
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockAdminId = '507f1f77bcf86cd799439012';
  const mockApplicationId = '507f1f77bcf86cd799439013';

  // Factory functions to create fresh mock data for each test
  const createMockGuestUser = () => ({
    _id: mockUserId,
    email: 'guest@example.com',
    phone: '+1234567890',
    firstName: 'John',
    lastName: 'Doe',
    roles: [UserRole.GUEST],
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    isPhoneVerified: true,
    isIdentityVerified: true,
    bio: 'Test bio',
    avatarUrl: 'https://example.com/avatar.jpg',
    birthDate: new Date('1990-01-01'),
    wishlist: [],
    reviewCount: 0,
    averageRating: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    save: jest.fn().mockResolvedThis(),
  });

  const createMockHostUser = () => ({
    ...createMockGuestUser(),
    roles: [UserRole.GUEST, UserRole.HOST],
    save: jest.fn().mockResolvedThis(),
  });

  const createMockPendingApplication = () => ({
    _id: mockApplicationId,
    actionType: ApprovalActionType.HOST_APPLICATION,
    requestedBy: mockUserId,
    status: ApprovalStatus.PENDING,
    metadata: {},
    statusHistory: [],
    createdAt: new Date('2024-01-15'),
    save: jest.fn().mockResolvedThis(),
  });

  const createMockApprovedApplication = () => ({
    ...createMockPendingApplication(),
    status: ApprovalStatus.APPROVED,
    approvedBy: mockAdminId,
    reviewedAt: new Date('2024-01-16'),
    approvalComment: 'Application approved',
    save: jest.fn().mockResolvedThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserHostService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(AdminActionApproval.name),
          useValue: {
            findById: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: UserAccountIntegrationService,
          useValue: {
            createAdditionalAccountsForRoleChange: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<UserHostService>(UserHostService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    adminActionApprovalModel = module.get<Model<AdminActionApprovalDocument>>(
      getModelToken(AdminActionApproval.name),
    );
    notificationsService = module.get<NotificationsService>(NotificationsService);
    accountIntegrationService = module.get<UserAccountIntegrationService>(
      UserAccountIntegrationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('applyToBeHost', () => {
    const applicationData: BecomeHostApplicationDto = {
      motivation: 'I want to share my property',
      hasExperience: true,
      experienceDescription: 'I have hosted before',
      agreedToTerms: true,
      agreedToHostPolicy: true,
    };

    it('should grant host role directly to eligible guest user', async () => {
      const user = createMockGuestUser();
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      const result = await service.applyToBeHost(mockUserId, applicationData);

      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(user.roles).toContain(UserRole.HOST);
      expect(user.save).toHaveBeenCalled();
      expect(accountIntegrationService.createAdditionalAccountsForRoleChange).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([UserRole.GUEST, UserRole.HOST]),
        expect.any(String),
      );
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient_id: String(user._id),
          type: NotificationType.SYSTEM,
          title: 'Welcome to Hosting!',
        }),
      );
      expect(result.status).toBe('success');
      expect(result.data.status).toBe('approved');
      expect(result.data.requiresVerification).toBe(false);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw BadRequestException if user is already a host', async () => {
      const user = createMockHostUser();
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        'You are already a host',
      );
    });

    it('should create host earnings account after granting role', async () => {
      const user = createMockGuestUser();
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await service.applyToBeHost(mockUserId, applicationData);

      expect(accountIntegrationService.createAdditionalAccountsForRoleChange).toHaveBeenCalledTimes(
        1,
      );
      expect(accountIntegrationService.createAdditionalAccountsForRoleChange).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([UserRole.HOST]),
        expect.any(String),
      );
    });

    it('should send welcome notification after becoming host', async () => {
      const user = createMockGuestUser();
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await service.applyToBeHost(mockUserId, applicationData);

      expect(notificationsService.create).toHaveBeenCalledWith({
        recipient_id: String(user._id),
        type: NotificationType.SYSTEM,
        title: 'Welcome to Hosting!',
        body: 'You are now a host. You can start listing properties and earning income.',
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.applyToBeHost(mockUserId, applicationData)).rejects.toThrow(
        'Failed to grant host role',
      );
    });
  });

  describe('getHostApplicationStatus', () => {
    it('should return application status for user with pending application', async () => {
      const user = createMockGuestUser();
      const application = createMockPendingApplication();
      const userExecMock = jest.fn().mockResolvedValue(user);
      const applicationExecMock = jest.fn().mockResolvedValue(application);

      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);
      jest.spyOn(adminActionApprovalModel, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: applicationExecMock }),
      } as any);

      const result = await service.getHostApplicationStatus(mockUserId);

      expect(result.status).toBe('success');
      expect(result.data.hasApplication).toBe(true);
      expect(result.data.status).toBe('pending');
      expect(result.data.isHost).toBe(false);
      expect(result.data.verificationStatus.identityVerified).toBe(true);
    });

    it('should return isHost=true for user with HOST role', async () => {
      const user = createMockHostUser();
      const application = createMockApprovedApplication();
      const userExecMock = jest.fn().mockResolvedValue(user);
      const applicationExecMock = jest.fn().mockResolvedValue(application);

      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);
      jest.spyOn(adminActionApprovalModel, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: applicationExecMock }),
      } as any);

      const result = await service.getHostApplicationStatus(mockUserId);

      expect(result.data.isHost).toBe(true);
      expect(result.data.status).toBe('approved');
    });

    it('should return hasApplication=false if no application exists', async () => {
      const user = createMockGuestUser();
      const userExecMock = jest.fn().mockResolvedValue(user);
      const applicationExecMock = jest.fn().mockResolvedValue(null);

      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);
      jest.spyOn(adminActionApprovalModel, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: applicationExecMock }),
      } as any);

      const result = await service.getHostApplicationStatus(mockUserId);

      expect(result.data.hasApplication).toBe(false);
      expect(result.data.status).toBeUndefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userExecMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await expect(service.getHostApplicationStatus(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getHostApplicationStatus(mockUserId)).rejects.toThrow(
        'User not found',
      );
    });

    it('should include verification status in response', async () => {
      const user = {
        ...mockGuestUser,
        isEmailVerified: true,
        isPhoneVerified: false,
        isIdentityVerified: true,
      };
      const userExecMock = jest.fn().mockResolvedValue(user);
      const applicationExecMock = jest.fn().mockResolvedValue(null);

      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);
      jest.spyOn(adminActionApprovalModel, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: applicationExecMock }),
      } as any);

      const result = await service.getHostApplicationStatus(mockUserId);

      expect(result.data.verificationStatus).toEqual({
        identityVerified: true,
        emailVerified: true,
        phoneVerified: false,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const userExecMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await expect(service.getHostApplicationStatus(mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.getHostApplicationStatus(mockUserId)).rejects.toThrow(
        'Failed to fetch application status',
      );
    });
  });

  describe('checkHostEligibility', () => {
    it('should return eligible=true for non-host user', async () => {
      const user = { ...mockGuestUser };
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      const result = await service.checkHostEligibility(mockUserId);

      expect(result.status).toBe('success');
      expect(result.data.eligible).toBe(true);
      expect(result.data.reasons).toEqual([]);
      expect(result.data.requirements.verified).toBe(true);
      expect(result.data.requirements.accountAge).toBe(true);
      expect(result.data.requirements.completedProfile).toBe(true);
    });

    it('should return eligible=false with reason if user is already a host', async () => {
      const user = { ...mockHostUser };
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      const result = await service.checkHostEligibility(mockUserId);

      expect(result.status).toBe('success');
      expect(result.data.eligible).toBe(false);
      expect(result.data.reasons).toContain('You are already a host');
      expect(result.title).toBe('Already a Host');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await expect(service.checkHostEligibility(mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.checkHostEligibility(mockUserId)).rejects.toThrow('User not found');
    });

    it('should return all requirements as true for eligible user', async () => {
      const user = { ...mockGuestUser };
      const execMock = jest.fn().mockResolvedValue(user);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      const result = await service.checkHostEligibility(mockUserId);

      expect(result.data.requirements).toEqual({
        verified: true,
        accountAge: true,
        completedProfile: true,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: execMock } as any);

      await expect(service.checkHostEligibility(mockUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.checkHostEligibility(mockUserId)).rejects.toThrow(
        'Failed to check eligibility',
      );
    });
  });

  describe('approveHostApplication', () => {
    it('should approve pending application and grant HOST role', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };
      const user = { ...mockGuestUser, save: jest.fn().mockResolvedValue(mockGuestUser) };

      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(user);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      const result = await service.approveHostApplication(mockApplicationId, mockAdminId, 'Approved');

      expect(application.status).toBe(ApprovalStatus.APPROVED);
      expect(application.approvedBy).toBe(mockAdminId);
      expect(application.save).toHaveBeenCalled();
      expect(user.roles).toContain(UserRole.HOST);
      expect(user.save).toHaveBeenCalled();
      expect(accountIntegrationService.createAdditionalAccountsForRoleChange).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.HOST_APPLICATION_APPROVED,
          title: "Congratulations! You're now a host",
        }),
      );
    });

    it('should throw NotFoundException if application does not exist', async () => {
      const appExecMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('Application not found');
    });

    it('should throw BadRequestException if application already processed', async () => {
      const application = { ...mockApprovedApplication };
      const appExecMock = jest.fn().mockResolvedValue(application);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('Application has already been approved');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const application = {
        ...mockPendingApplication,
        requestedBy: { toString: () => mockUserId },
      };
      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(null);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('User not found');
    });

    it('should throw BadRequestException if user is already a host', async () => {
      const application = {
        ...mockPendingApplication,
        requestedBy: { toString: () => mockUserId },
      };
      const user = { ...mockHostUser };

      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(user);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('User is already a host');
    });

    it('should throw BadRequestException if user identity not verified', async () => {
      const application = {
        ...mockPendingApplication,
        requestedBy: { toString: () => mockUserId },
      };
      const user = { ...mockGuestUser, isIdentityVerified: false };

      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(user);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('User identity must be verified before approval');
    });

    it('should update application statusHistory with approval', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };
      const user = { ...mockGuestUser, save: jest.fn().mockResolvedValue(mockGuestUser) };

      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(user);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await service.approveHostApplication(mockApplicationId, mockAdminId, 'Great application');

      expect(application.statusHistory).toHaveLength(1);
      expect(application.statusHistory[0]).toMatchObject({
        status: ApprovalStatus.APPROVED,
        comment: 'Great application',
      });
    });

    it('should create earnings account for new host', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };
      const user = { ...mockGuestUser, save: jest.fn().mockResolvedValue(mockGuestUser) };

      const appExecMock = jest.fn().mockResolvedValue(application);
      const userExecMock = jest.fn().mockResolvedValue(user);

      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);
      jest.spyOn(userModel, 'findById').mockReturnValue({ exec: userExecMock } as any);

      await service.approveHostApplication(mockApplicationId, mockAdminId);

      expect(accountIntegrationService.createAdditionalAccountsForRoleChange).toHaveBeenCalledWith(
        mockUserId,
        expect.arrayContaining([UserRole.HOST]),
        expect.any(String),
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const appExecMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.approveHostApplication(mockApplicationId, mockAdminId),
      ).rejects.toThrow('Failed to approve host application');
    });
  });

  describe('rejectHostApplication', () => {
    const rejectionReason = 'Insufficient experience';

    it('should reject pending application', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };

      const appExecMock = jest.fn().mockResolvedValue(application);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason);

      expect(application.status).toBe(ApprovalStatus.REJECTED);
      expect(application.approvedBy).toBe(mockAdminId);
      expect(application.approvalComment).toBe(rejectionReason);
      expect(application.save).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.HOST_APPLICATION_REJECTED,
          title: 'Host Application Update',
          body: expect.stringContaining(rejectionReason),
        }),
      );
    });

    it('should throw NotFoundException if application does not exist', async () => {
      const appExecMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow('Application not found');
    });

    it('should throw BadRequestException if application already processed', async () => {
      const application = { ...mockApprovedApplication };
      const appExecMock = jest.fn().mockResolvedValue(application);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow('Application has already been approved');
    });

    it('should update application statusHistory with rejection', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };

      const appExecMock = jest.fn().mockResolvedValue(application);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason);

      expect(application.statusHistory).toHaveLength(1);
      expect(application.statusHistory[0]).toMatchObject({
        status: ApprovalStatus.REJECTED,
        comment: rejectionReason,
      });
    });

    it('should send rejection notification with reason', async () => {
      const application = {
        ...mockPendingApplication,
        save: jest.fn().mockResolvedValue(mockPendingApplication),
        requestedBy: { toString: () => mockUserId },
        statusHistory: [],
      };

      const appExecMock = jest.fn().mockResolvedValue(application);
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason);

      expect(notificationsService.create).toHaveBeenCalledWith({
        recipient_id: mockUserId,
        type: NotificationType.HOST_APPLICATION_REJECTED,
        title: 'Host Application Update',
        body: `We're unable to approve your host application at this time. Reason: ${rejectionReason}`,
      });
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const appExecMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
      jest.spyOn(adminActionApprovalModel, 'findById').mockReturnValue({ exec: appExecMock } as any);

      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.rejectHostApplication(mockApplicationId, mockAdminId, rejectionReason),
      ).rejects.toThrow('Failed to reject host application');
    });
  });
});
