import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersFacadeService } from '../users/services/users-facade.service';
import { DynamicConfigService } from '../config/config.service';
import { NotificationService } from '../../common/services/notificaton.service';
import { RefreshToken } from '../../database/schemas/refresh-token.schema';
import { VerificationToken } from '../../database/schemas/verification-token.schema';
import { AuthMethod, CodeDeliveryMethod } from './dto/login.dto';
import { CheckIdentifierDto } from './dto/check-identifier.dto';
import { SignupCompleteProfileDto } from './dto/signup-complete-profile.dto';
import { SigninInitiateDto } from './dto/signin-initiate.dto';
import { AddSecondaryContactDto } from './dto/add-secondary-contact.dto';
import { SignupInitiateDataDto, SignupCompleteDataDto } from './dto/signup-response.dto';
import { CheckIdentifierDataDto } from './dto/check-identifier-response.dto';
import { SigninInitiateDataDto } from './dto/signin-response.dto';
import { AddSecondaryContactDataDto } from './dto/add-secondary-contact-response.dto';
import { UserRole, UserDocument, RegistrationState } from '../../database/schemas/user.schema';
import { UserStatus } from '../../common/enums/user-status.enums';

// Mock interfaces for type safety
interface MockQuery {
  exec: jest.MockedFunction<() => Promise<VerificationToken | null>>;
}

interface MockUserDocumentWithSave extends Partial<UserDocument> {
  save: jest.MockedFunction<() => Promise<UserDocument>>;
}

interface MockRefreshTokenModel {
  create: jest.MockedFunction<(data: Partial<RefreshToken>) => Promise<RefreshToken>>;
}

interface MockVerificationTokenModel {
  findOneAndUpdate: jest.MockedFunction<
    (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => MockQuery
  >;
  deleteOne: jest.MockedFunction<(filter: Record<string, unknown>) => MockQuery>;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersFacadeService: jest.Mocked<UsersFacadeService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let dynamicConfigService: jest.Mocked<DynamicConfigService>;
  let notificationService: jest.Mocked<NotificationService>;
  let refreshTokenModel: MockRefreshTokenModel;
  let verificationTokenModel: MockVerificationTokenModel;

  const mockUser: Partial<UserDocument> = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    phone: '+1234567890',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashedPassword',
    roles: [UserRole.GUEST],
    status: UserStatus.ACTIVE,
    registrationState: RegistrationState.PROFILE_COMPLETE,
    isEmailVerified: true,
    isPhoneVerified: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersFacadeService,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findForAuthByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            validatePassword: jest.fn(),
            markEmailVerified: jest.fn(),
            markPhoneVerified: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: DynamicConfigService,
          useValue: {
            getNumber: jest.fn(),
            getBoolean: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendOtp: jest.fn(),
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteMany: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(VerificationToken.name),
          useValue: {
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersFacadeService = module.get(UsersFacadeService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    dynamicConfigService = module.get(DynamicConfigService);
    notificationService = module.get(NotificationService);
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    verificationTokenModel = module.get(getModelToken(VerificationToken.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIdentifier', () => {
    it('should return exists: false for new email', async () => {
      const dto: CheckIdentifierDto = { identifier: 'new@example.com' };
      usersFacadeService.findForAuthByEmail.mockResolvedValue(null);

      const result: CheckIdentifierDataDto = await service.checkIdentifier(dto);

      expect(result).toEqual({
        exists: false,
        methods: [],
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersFacadeService.findForAuthByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should return exists: true with methods for existing email user', async () => {
      const dto: CheckIdentifierDto = { identifier: 'test@example.com' };
      usersFacadeService.findForAuthByEmail.mockResolvedValue(mockUser as UserDocument);

      const result: CheckIdentifierDataDto = await service.checkIdentifier(dto);

      expect(result).toEqual({
        exists: true,
        methods: [AuthMethod.EMAIL],
      });
    });

    it('should return exists: false for new phone', async () => {
      const dto: CheckIdentifierDto = { identifier: '+1987654321' };
      usersFacadeService.findByPhone.mockResolvedValue(null);

      const result: CheckIdentifierDataDto = await service.checkIdentifier(dto);

      expect(result).toEqual({
        exists: false,
        methods: [],
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersFacadeService.findByPhone).toHaveBeenCalledWith('+1987654321');
    });

    it('should throw BadRequestException for invalid identifier', async () => {
      const dto: CheckIdentifierDto = { identifier: 'invalid-identifier' };

      await expect(service.checkIdentifier(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signupVerifyContact', () => {
    beforeEach(() => {
      // Mock OTP config
      dynamicConfigService.getNumber
        .mockResolvedValueOnce(6) // OTP_LENGTH
        .mockResolvedValueOnce(300) // OTP_TTL_SECONDS
        .mockResolvedValueOnce(60) // OTP_RESEND_COOLDOWN_SECONDS
        .mockResolvedValueOnce(5) // OTP_MAX_ATTEMPTS
        .mockResolvedValueOnce(600) // RESET_TTL_SECONDS
        .mockResolvedValueOnce(5) // RESET_MAX_ATTEMPTS
        .mockResolvedValueOnce(5) // OTP_REQUESTS_PER_WINDOW
        .mockResolvedValueOnce(900); // OTP_REQUEST_WINDOW_SECONDS

      dynamicConfigService.getBoolean
        .mockResolvedValueOnce(true) // NOTIFY_EMAIL_ENABLED
        .mockResolvedValueOnce(true); // NOTIFY_SMS_ENABLED

      const mockQuery: MockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      verificationTokenModel.findOneAndUpdate.mockReturnValue(mockQuery);

      notificationService.sendOtp.mockResolvedValue(undefined);
    });

    it('should send verification code for email signup', async () => {
      const dto = { identifier: 'new@example.com' };
      usersFacadeService.findByEmail.mockResolvedValue(null);

      const result: SignupInitiateDataDto = await service.signupVerifyContact(dto);

      expect(result).toEqual({
        success: true,
        testCode: expect.any(String) as string,
        registrationState: RegistrationState.CONTACT_PENDING,
        codeDeliveryMethod: CodeDeliveryMethod.EMAIL,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersFacadeService.findByEmail).toHaveBeenCalledWith('new@example.com');
    });

    it('should send verification code for phone signup', async () => {
      const dto = { identifier: '+1987654321' };
      usersFacadeService.findByPhone.mockResolvedValue(null);

      const result: SignupInitiateDataDto = await service.signupVerifyContact(dto);

      expect(result).toEqual({
        success: true,
        testCode: expect.any(String) as string,
        registrationState: RegistrationState.CONTACT_PENDING,
        codeDeliveryMethod: CodeDeliveryMethod.SMS,
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersFacadeService.findByPhone).toHaveBeenCalledWith('+1987654321');
    });

    it('should throw ConflictException if user already exists', async () => {
      const dto = { identifier: 'test@example.com' };
      usersFacadeService.findByEmail.mockResolvedValue(mockUser as UserDocument);

      await expect(service.signupVerifyContact(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('signupCompleteProfile', () => {
    const mockSessionPayload = {
      type: 'signup_session',
      step: 'verified_contact',
      identifier: 'test@example.com',
      method: 'email',
    };

    beforeEach(() => {
      jwtService.verify.mockReturnValue(mockSessionPayload);
      usersFacadeService.findByEmail.mockResolvedValue(null);
      usersFacadeService.create.mockResolvedValue(mockUser as UserDocument);
      usersFacadeService.markEmailVerified.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('mock-token');
      jwtService.decode.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }); // 1 hour from now
      refreshTokenModel.create.mockResolvedValue({} as RefreshToken);
    });

    it('should complete profile with primary contact only', async () => {
      const dto: SignupCompleteProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-15',
        password: 'SecurePassword123!',
        sessionToken: 'mock-session-token',
      };

      configService.get
        .mockReturnValueOnce('8') // PASSWORD_MIN_LENGTH
        .mockReturnValueOnce('true'); // PASSWORD_REQUIRE_SPECIAL_CHARS

      // Mock generateTokens dependencies
      dynamicConfigService.get
        .mockResolvedValueOnce('15m') // SESSION_EXPIRES_IN
        .mockResolvedValueOnce('7d'); // REFRESH_EXPIRES_IN

      const result: SignupCompleteDataDto = await service.signupCompleteProfile(dto);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        registrationState: RegistrationState.PROFILE_COMPLETE,
        hasSecondaryContact: false,
        missingContactType: 'phone',
        secondaryContactNeedsVerification: false,
      });
    });

    it('should complete profile with secondary contact provided', async () => {
      const dto: SignupCompleteProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-15',
        password: 'SecurePassword123!',
        phone: '+1987654321',
        sessionToken: 'mock-session-token',
      };

      configService.get
        .mockReturnValueOnce('8') // PASSWORD_MIN_LENGTH
        .mockReturnValueOnce('true'); // PASSWORD_REQUIRE_SPECIAL_CHARS

      // Mock generateTokens dependencies
      dynamicConfigService.get
        .mockResolvedValueOnce('15m') // SESSION_EXPIRES_IN
        .mockResolvedValueOnce('7d'); // REFRESH_EXPIRES_IN

      const result: SignupCompleteDataDto = await service.signupCompleteProfile(dto);

      expect(result).toEqual({
        accessToken: 'mock-token',
        refreshToken: 'mock-token',
        registrationState: RegistrationState.PROFILE_COMPLETE,
        hasSecondaryContact: true,
        missingContactType: undefined,
        secondaryContactNeedsVerification: true,
      });
    });

    it('should throw BadRequestException for invalid session token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const dto: SignupCompleteProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-15',
        password: 'SecurePassword123!',
        sessionToken: 'invalid-token',
      };

      await expect(service.signupCompleteProfile(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signinInitiate', () => {
    it('should initiate signin for existing user', async () => {
      const dto: SigninInitiateDto = { identifier: 'test@example.com' };
      usersFacadeService.findForAuthByEmail.mockResolvedValue(mockUser as UserDocument);
      jwtService.sign.mockReturnValue('mock-session-token');

      const result: SigninInitiateDataDto = await service.signinInitiate(dto);

      expect(result).toEqual({
        userExists: true,
        sessionToken: 'mock-session-token',
        nextStep: 'password',
        hasPassword: true,
      });
    });

    it('should return userExists: false for non-existing user', async () => {
      const dto: SigninInitiateDto = { identifier: 'nonexistent@example.com' };
      usersFacadeService.findForAuthByEmail.mockResolvedValue(null);

      // Mock OTP config for verification flow
      dynamicConfigService.getNumber
        .mockResolvedValueOnce(6) // OTP_LENGTH
        .mockResolvedValueOnce(300) // OTP_TTL_SECONDS
        .mockResolvedValueOnce(60) // OTP_RESEND_COOLDOWN_SECONDS
        .mockResolvedValueOnce(5) // OTP_MAX_ATTEMPTS
        .mockResolvedValueOnce(600) // RESET_TTL_SECONDS
        .mockResolvedValueOnce(5) // RESET_MAX_ATTEMPTS
        .mockResolvedValueOnce(5) // OTP_REQUESTS_PER_WINDOW
        .mockResolvedValueOnce(900); // OTP_REQUEST_WINDOW_SECONDS

      dynamicConfigService.getBoolean
        .mockResolvedValueOnce(true) // NOTIFY_EMAIL_ENABLED
        .mockResolvedValueOnce(true); // NOTIFY_SMS_ENABLED

      const mockQuery: MockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      verificationTokenModel.findOneAndUpdate.mockReturnValue(mockQuery);

      notificationService.sendOtp.mockResolvedValue(undefined);
      jwtService.sign.mockReturnValue('mock-session-token');

      const result: SigninInitiateDataDto = await service.signinInitiate(dto);

      expect(result).toEqual({
        userExists: false,
        sessionToken: 'mock-session-token',
        nextStep: 'verify_signup',
        testCode: expect.any(String) as string,
      });
    });
  });

  describe('addSecondaryContact', () => {
    beforeEach(() => {
      const mockUserWithSave: MockUserDocumentWithSave = {
        ...mockUser,
        phone: undefined,
        save: jest.fn().mockResolvedValue({} as UserDocument),
      };
      usersFacadeService.findById.mockResolvedValue(mockUserWithSave as UserDocument);

      // Mock OTP config
      dynamicConfigService.getNumber
        .mockResolvedValueOnce(6) // OTP_LENGTH
        .mockResolvedValueOnce(300) // OTP_TTL_SECONDS
        .mockResolvedValueOnce(60) // OTP_RESEND_COOLDOWN_SECONDS
        .mockResolvedValueOnce(5) // OTP_MAX_ATTEMPTS
        .mockResolvedValueOnce(600) // RESET_TTL_SECONDS
        .mockResolvedValueOnce(5) // RESET_MAX_ATTEMPTS
        .mockResolvedValueOnce(5) // OTP_REQUESTS_PER_WINDOW
        .mockResolvedValueOnce(900); // OTP_REQUEST_WINDOW_SECONDS

      dynamicConfigService.getBoolean
        .mockResolvedValueOnce(true) // NOTIFY_EMAIL_ENABLED
        .mockResolvedValueOnce(true); // NOTIFY_SMS_ENABLED

      const mockQuery: MockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      verificationTokenModel.findOneAndUpdate.mockReturnValue(mockQuery);

      notificationService.sendOtp.mockResolvedValue(undefined);
    });

    it('should add phone as secondary contact', async () => {
      const dto: AddSecondaryContactDto = {
        contactType: AuthMethod.PHONE,
        phone: '+1987654321',
      };

      usersFacadeService.findByPhone.mockResolvedValue(null); // for uniqueness check

      const result: AddSecondaryContactDataDto = await service.addSecondaryContact(
        '507f1f77bcf86cd799439011',
        dto,
      );

      expect(result).toEqual({
        success: true,
        verificationRequired: true,
        codeDeliveryMethod: CodeDeliveryMethod.SMS,
        testCode: expect.any(String) as string,
      });
    });

    it('should add email as secondary contact', async () => {
      const mockUserWithSave: MockUserDocumentWithSave = {
        ...mockUser,
        email: undefined,
        phone: '+1234567890',
        save: jest.fn().mockResolvedValue({} as UserDocument),
      };
      usersFacadeService.findById.mockResolvedValue(mockUserWithSave as UserDocument);

      const dto: AddSecondaryContactDto = {
        contactType: AuthMethod.EMAIL,
        email: 'new@example.com',
      };

      usersFacadeService.findByEmail.mockResolvedValue(null);

      const result: AddSecondaryContactDataDto = await service.addSecondaryContact(
        '507f1f77bcf86cd799439011',
        dto,
      );

      expect(result).toEqual({
        success: true,
        verificationRequired: true,
        codeDeliveryMethod: CodeDeliveryMethod.EMAIL,
        testCode: expect.any(String) as string,
      });
    });

    it('should throw ConflictException if contact already exists', async () => {
      const dto: AddSecondaryContactDto = {
        contactType: AuthMethod.PHONE,
        phone: '+1987654321',
      };

      usersFacadeService.findByPhone.mockResolvedValue(mockUser as UserDocument);

      await expect(service.addSecondaryContact('507f1f77bcf86cd799439011', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      usersFacadeService.findById.mockResolvedValue(null as unknown as UserDocument);

      const dto: AddSecondaryContactDto = {
        contactType: AuthMethod.PHONE,
        phone: '+1987654321',
      };

      await expect(service.addSecondaryContact('507f1f77bcf86cd799439011', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
