import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { QueryBuilder } from '../../../common/utils/query-builder.util';

import { AuthMethod } from '../../auth/dto/login.dto';
import { CryptoUtil } from '../../../common/utils/crypto.utils';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { DatabaseError } from '../../../common/interfaces/error.interfaces';
import { USER_SECURITY_CONSTANTS } from '../constants/user.constants';

import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenDocument,
} from '../../../database/schemas/verification-token.schema';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateData } from '../types/user.types';
import { UserAccountIntegrationService } from './user-account-integration.service';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Core user operations service
 * Handles basic CRUD operations, authentication, and user lifecycle
 */
@Injectable()
export class UserCoreService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(VerificationToken.name)
    private readonly vtModel: Model<VerificationTokenDocument>,
    private readonly userAccountIntegrationService: UserAccountIntegrationService,
  ) {}

  /** Create a new user (email or phone required) */
  async create(dto: CreateUserDto): Promise<UserDocument> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Validate email format if provided
    if (dto.email) {
      ValidationUtils.validateEmailFormat(dto.email, {
        context: 'UserCoreService',
      });
    }

    // Validate phone format if provided
    if (dto.phone) {
      ValidationUtils.validatePhoneFormat(dto.phone, {
        context: 'UserCoreService',
      });
    }

    const passwordHash = dto.password ? await CryptoUtil.hashPassword(dto.password) : undefined;

    const user = new this.userModel({
      ...dto,
      passwordHash,
      firstLogin: true,
    });

    try {
      const savedUser = await user.save();

      // Create financial accounts for the user based on their roles
      try {
        const accountResult =
          await this.userAccountIntegrationService.createUserAccounts(savedUser);
        if (!accountResult.success) {
          LoggingUtil.warn(
            `Failed to create some accounts for user ${String(savedUser._id)}: ${accountResult.errors.join('; ')}. User created successfully but accounts may need manual creation.`,
            'UserCoreService',
          );
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to create accounts for user ${String(savedUser._id)}. User created successfully but accounts may need manual creation.`,
          error,
          'UserCoreService',
        );
        // Don't fail user creation if account creation fails - accounts can be created later
      }

      return savedUser;
    } catch (error) {
      const dbError = error as DatabaseError;
      if (dbError.code === USER_SECURITY_CONSTANTS.MONGODB_DUPLICATE_KEY_ERROR) {
        throw new ConflictException('User with this identifier already exists');
      }
      LoggingUtil.error('Error creating user', dbError.stack || dbError.message, 'UserCoreService');
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  /** Find user by ID or throw 404 */
  async findById(id: string): Promise<UserDocument> {
    let user: UserDocument | null;
    try {
      user = await this.userModel.findById(id).exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findById: error loading user ${id}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to load user');
    }

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  /** Find by email (or null) */
  async findByEmail(email: string): Promise<UserDocument | null> {
    if (!email) {
      throw new BadRequestException('Email must be provided');
    }
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findByEmail: error for ${email}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to query by email');
    }
  }

  /** Find user by email (for authentication) */
  async findForAuthByEmail(email: string): Promise<UserDocument | null> {
    if (!email) {
      throw new BadRequestException('Email must be provided');
    }
    try {
      return this.userModel.findOne({ email }).select('+passwordHash').exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findForAuthByEmail: error for ${email}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to query by email');
    }
  }

  /** Find by ID with password hash for authentication */
  async findForAuthById(id: string): Promise<UserDocument | null> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }
    try {
      return this.userModel.findById(id).select('+passwordHash').exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findForAuthById: error for ${id}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to query by ID');
    }
  }

  /** Find by phone (or null) */
  async findByPhone(phone: string): Promise<UserDocument | null> {
    if (!phone) {
      throw new BadRequestException('Phone must be provided');
    }
    try {
      return await this.userModel.findOne({ phone }).select('+passwordHash').exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findByPhone: error for ${phone}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to query by phone');
    }
  }

  /** Find user by identifier (email or phone) */
  async findUserByIdentifier(identifier: string, method: AuthMethod): Promise<UserDocument | null> {
    if (!identifier) {
      throw new BadRequestException('Identifier must be provided');
    }

    const isEmail = method === AuthMethod.EMAIL;
    try {
      return isEmail
        ? await this.findForAuthByEmail(identifier)
        : await this.findByPhone(identifier);
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `findUserByIdentifier: error for ${identifier}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to query by identifier');
    }
  }

  /** Check password validity */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    if (!password) {
      throw new BadRequestException('Password must be provided');
    }

    let user: UserDocument | null;
    try {
      user = await this.userModel.findById(userId).select('+passwordHash').exec();
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        `validatePassword: error loading user ${userId}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to validate password');
    }

    if (!user?.passwordHash) {
      return false;
    }
    return CryptoUtil.comparePassword(password, user.passwordHash);
  }

  /** Get current user's data for the "me" endpoint (safe fields only) */
  async getMe(userId: string): Promise<UserDocument> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }
    try {
      const user = await this.userModel.findById(userId).select('-passwordHash -__v').exec();

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const dbError = error as Error;
      LoggingUtil.error(
        `getMe: error loading user ${userId}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to load current user');
    }
  }

  /** Mark firstLogin flag false */
  async markFirstLoginDone(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }
    try {
      const updated = await this.userModel.findByIdAndUpdate(id, { firstLogin: false }).exec();
      if (!updated) {
        throw new NotFoundException(`User ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `markFirstLoginDone: error for ${id}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /** Mark email as verified */
  async markEmailVerified(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User ${id} not found`);
      }

      const updateData: UpdateData = { isEmailVerified: true };

      // If user is pending verification and email is being verified, activate the account
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        updateData.status = UserStatus.ACTIVE;
      }

      await this.userModel.findByIdAndUpdate(id, updateData).exec();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `markEmailVerified: error updating user ${id}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  /** Mark phone as verified */
  async markPhoneVerified(id: string): Promise<void> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User ${id} not found`);
      }

      const updateData: UpdateData = { isPhoneVerified: true };

      // If user is pending verification and phone is being verified, activate the account
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        updateData.status = UserStatus.ACTIVE;
      }

      await this.userModel.findByIdAndUpdate(id, updateData).exec();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `markPhoneVerified: error updating user ${id}`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to verify phone');
    }
  }

  /** Find users by roles */
  async findUsersByRoles(roles: string[]): Promise<UserDocument[]> {
    try {
      const query = QueryBuilder.create()
        .addCustomFilter('roles', { $in: roles })
        .addEnumFilter('status', UserStatus.ACTIVE)
        .build();

      return await this.userModel.find(query).exec();
    } catch (error) {
      LoggingUtil.error(
        'Error finding users by roles',
        error instanceof Error ? error.stack : undefined,
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to find users by roles');
    }
  }

  /** Find active users */
  async findActiveUsers(): Promise<UserDocument[]> {
    try {
      return await this.userModel.find({ status: UserStatus.ACTIVE }).exec();
    } catch (error) {
      LoggingUtil.error(
        'Error finding active users',
        error instanceof Error ? error.stack : undefined,
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to find active users');
    }
  }

  /** Check if user exists */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.userModel.countDocuments({ _id: id }).exec();
      return count > 0;
    } catch (error) {
      LoggingUtil.error(
        `Error checking user existence for ${id}`,
        error instanceof Error ? error.stack : undefined,
        'UserCoreService',
      );
      return false;
    }
  }

  /** Admin: Create a new user */
  async createUserByAdmin(
    createUserDto: CreateUserDto,
    adminUserId: string,
  ): Promise<UserDocument> {
    try {
      // Check if user already exists
      if (createUserDto.email) {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (createUserDto.password) {
        const saltRounds = USER_SECURITY_CONSTANTS.PASSWORD_SALT_ROUNDS;
        passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);
      }

      // Create user data (remove password and use passwordHash)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userDataWithoutPassword } = createUserDto;
      const userData = {
        ...userDataWithoutPassword,
        passwordHash,
        roles: createUserDto.roles || [UserRole.GUEST],
        status: UserStatus.ACTIVE, // Admin-created users are immediately active
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      };

      const user = new this.userModel(userData);
      const savedUser = await user.save();

      // Create financial accounts for admin-created users
      try {
        const accountResult =
          await this.userAccountIntegrationService.createUserAccounts(savedUser);
        if (!accountResult.success) {
          LoggingUtil.warn(
            `Failed to create some accounts for admin-created user ${String(savedUser._id)}: ${accountResult.errors.join('; ')}`,
            'UserCoreService',
          );
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to create accounts for admin-created user ${String(savedUser._id)}`,
          error,
          'UserCoreService',
        );
      }

      LoggingUtil.log(`User ${savedUser.email} created by admin ${adminUserId}`, 'UserCoreService');

      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `createUserByAdmin: error creating user`,
        dbError.stack || String(dbError),
        'UserCoreService',
      );
      throw new InternalServerErrorException('Failed to create user');
    }
  }
}
