import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { Model, SortOrder, FilterQuery } from 'mongoose';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';

import { UserStatus } from '../../../common/enums/user-status.enums';
import { UserTableFilter } from '../../../common/interfaces/table-filters.interface';
import { SortDirectionEnum, UserSortFieldsEnum } from '../../../common/enums/sort.enums';
import { FilterValueEnum, DatabaseFieldEnum } from '../../../common/enums/filter.enums';
import { USER_PAGINATION_CONSTANTS, USER_SECURITY_CONSTANTS } from '../constants/user.constants';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from '../../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenDocument,
} from '../../../database/schemas/verification-token.schema';

import {
  AdminUpdateData,
  UserStatusResponse,
  ToggleResponse,
  BulkDeleteResponse,
  PaginatedUsersResponse,
} from '../types/user.types';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * User administration service
 * Handles admin-only operations like bulk operations, user management, etc.
 */
@Injectable()
export class UserAdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(VerificationToken.name)
    private readonly vtModel: Model<VerificationTokenDocument>,
  ) {}

  /** Get all users with pagination, search, role filtering, and sorting (admin only) */
  async getAllUsers(
    page: number = USER_PAGINATION_CONSTANTS.MIN_PAGE,
    limit: number = USER_PAGINATION_CONSTANTS.DEFAULT_LIMIT,
    search?: string,
    role?: string,
    sortBy?: string,
    sortDirection?: string,
  ): Promise<PaginatedUsersResponse> {
    try {
      // Validate pagination parameters
      const {
        page: validatedPage,
        limit: validatedLimit,
        skip,
      } = validatePagination({
        page,
        limit,
        maxLimit: USER_PAGINATION_CONSTANTS.MAX_LIMIT,
      });

      // Build query using QueryBuilder
      const queryBuilder = QueryBuilder.create();

      // Add search filter
      if (search?.trim()) {
        queryBuilder.addCustomFilter('$or', [
          { firstName: { $regex: search.trim(), $options: 'i' } },
          { lastName: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
          { phone: { $regex: search.trim(), $options: 'i' } },
        ]);
      }

      // Add role filter (if not 'all' or empty)
      if (role && role.toLowerCase() !== FilterValueEnum.ALL.toLowerCase()) {
        queryBuilder.addCustomFilter('roles', { $in: [role] });
      }

      const query = queryBuilder.build();

      // Build sort object
      const allowedSortFields: string[] = [
        UserSortFieldsEnum.FIRST_NAME,
        UserSortFieldsEnum.LAST_NAME,
        UserSortFieldsEnum.EMAIL,
        UserSortFieldsEnum.ROLE,
        UserSortFieldsEnum.STATUS,
        UserSortFieldsEnum.CREATED_AT,
        UserSortFieldsEnum.UPDATED_AT,
      ];
      const validatedSortBy: string = allowedSortFields.includes(sortBy || '')
        ? sortBy!
        : UserSortFieldsEnum.CREATED_AT;
      const validatedSortDirection: SortOrder =
        sortDirection?.toLowerCase() === SortDirectionEnum.ASC
          ? SortDirectionEnum.ASC
          : SortDirectionEnum.DESC;
      const sortObject: Record<string, SortOrder> = { [validatedSortBy]: validatedSortDirection };

      // Execute queries in parallel for better performance
      const [users, total] = await Promise.all([
        this.userModel
          .find(query)
          .select('-passwordHash') // Exclude sensitive data
          .sort(sortObject)
          .skip(skip)
          .limit(validatedLimit)
          .exec(),
        this.userModel.countDocuments(query).exec(),
      ]);

      // Use database utility to build paginated result
      const result = buildPaginatedResult(users, total, validatedPage, validatedLimit);

      LoggingUtil.log(
        `Retrieved ${users.length} users for admin (page ${validatedPage}/${result.totalPages})`,
        'UserAdminService',
      );

      return {
        users: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      };
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'getAllUsers: error fetching users for admin',
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  /** Admin: Delete user by ID */
  async adminDeleteUser(userId: string): Promise<{ message: string; deletedAt: Date }> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Remove auth artifacts
      await Promise.all([
        this.refreshTokenModel.deleteMany({ user: user._id }).exec(),
        this.vtModel.deleteMany({ user: user._id }).exec(),
      ]);

      // Hard-delete user
      await this.userModel.deleteOne({ _id: user._id }).exec();

      LoggingUtil.log(`User ${userId} deleted by admin`, 'UserAdminService');

      return {
        message: 'User deleted successfully',
        deletedAt: DateUtils.now(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `adminDeleteUser: error deleting user ${userId}`,
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /** Admin: Update user by ID */
  async adminUpdateUser(
    userId: string,
    updateData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      bio: string;
      role: string[];
      avatarUrl: string;
    }>,
  ): Promise<{ message: string; user: UserDocument }> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // Build update object
      const updates: AdminUpdateData = {
        updatedAt: DateUtils.now(),
      };

      // Only include provided fields
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          // Map 'role' from DTO to 'roles' in database
          if (key === 'role') {
            updates['roles'] = value;
          } else {
            updates[key] = value;
          }
        }
      });

      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updates, { new: true })
        .select('-passwordHash')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      LoggingUtil.log(`User ${userId} updated by admin`, 'UserAdminService');

      return {
        message: 'User updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `adminUpdateUser: error updating user ${userId}`,
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  /** Admin: Toggle user active status */
  async adminToggleUserStatus(userId: string): Promise<UserStatusResponse> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

      await this.userModel
        .findByIdAndUpdate(userId, {
          status: newStatus,
          updatedAt: DateUtils.now(),
        })
        .exec();

      // If deactivating, revoke all refresh tokens
      if (newStatus !== UserStatus.ACTIVE) {
        await this.refreshTokenModel.deleteMany({ user: userId }).exec();
      }

      LoggingUtil.log(`User ${userId} status changed to ${newStatus} by admin`, 'UserAdminService');

      return {
        message: `User status changed to ${newStatus} successfully`,
        status: newStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `adminToggleUserStatus: error toggling status for user ${userId}`,
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to toggle user status');
    }
  }

  /** Admin: Toggle email verification status */
  async adminToggleEmailVerified(userId: string): Promise<ToggleResponse> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const newStatus = !user.isEmailVerified;

      await this.userModel
        .findByIdAndUpdate(userId, {
          isEmailVerified: newStatus,
          updatedAt: DateUtils.now(),
        })
        .exec();

      LoggingUtil.log(
        `User ${userId} email verification ${newStatus ? 'enabled' : 'disabled'} by admin`,
        'UserAdminService',
      );

      return {
        message: `Email verification ${newStatus ? 'enabled' : 'disabled'} successfully`,
        isEmailVerified: newStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `adminToggleEmailVerified: error toggling email verification for user ${userId}`,
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to toggle email verification');
    }
  }

  /** Admin: Toggle phone verification status */
  async adminTogglePhoneVerified(userId: string): Promise<ToggleResponse> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    try {
      const user = await this.userModel.findById(userId).exec();
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const newStatus = !user.isPhoneVerified;

      await this.userModel
        .findByIdAndUpdate(userId, {
          isPhoneVerified: newStatus,
          updatedAt: DateUtils.now(),
        })
        .exec();

      LoggingUtil.log(
        `User ${userId} phone verification ${newStatus ? 'enabled' : 'disabled'} by admin`,
        'UserAdminService',
      );

      return {
        message: `Phone verification ${newStatus ? 'enabled' : 'disabled'} successfully`,
        isPhoneVerified: newStatus,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const dbError = error as Error;
      LoggingUtil.error(
        `adminTogglePhoneVerified: error toggling phone verification for user ${userId}`,
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to toggle phone verification');
    }
  }

  /** Admin: Delete multiple users by IDs */
  async adminBulkDeleteUsers(userIds: string[]): Promise<BulkDeleteResponse> {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('User IDs array must not be empty');
    }

    try {
      const deletedUserIds: string[] = [];
      const failedUserIds: string[] = [];

      // Process each user ID
      for (const userId of userIds) {
        try {
          // Validate ObjectId format
          if (!userId.match(USER_SECURITY_CONSTANTS.MONGODB_OBJECTID_REGEX)) {
            failedUserIds.push(userId);
            continue;
          }

          // Check if user exists
          const user = await this.userModel.findById(userId).exec();
          if (!user) {
            failedUserIds.push(userId);
            continue;
          }

          // Remove auth artifacts for this user
          await Promise.all([
            this.refreshTokenModel.deleteMany({ user: user._id }).exec(),
            this.vtModel.deleteMany({ user: user._id }).exec(),
          ]);

          // Delete the user
          await this.userModel.deleteOne({ _id: user._id }).exec();
          deletedUserIds.push(userId);
        } catch (userError) {
          LoggingUtil.error(
            `Error deleting user ${userId}:`,
            userError instanceof Error ? userError.stack : String(userError),
            'UserAdminService',
          );
          failedUserIds.push(userId);
        }
      }

      const deletedCount = deletedUserIds.length;
      LoggingUtil.log(
        `Bulk delete completed by admin - Success: ${deletedCount}, Failed: ${failedUserIds.length}`,
        'UserAdminService',
      );

      if (failedUserIds.length > 0) {
        LoggingUtil.warn(`Failed to delete users: ${failedUserIds.join(', ')}`, 'UserAdminService');
      }

      return {
        message: `${deletedCount} users deleted successfully${failedUserIds.length > 0 ? `, ${failedUserIds.length} failed` : ''}`,
        deletedCount,
        deletedUserIds,
        failedUserIds,
        deletedAt: DateUtils.now(),
      };
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'adminBulkDeleteUsers: error during bulk deletion',
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to delete users');
    }
  }

  /** Find users for dropdown filters */
  async findUsersForDropdown(roles: UserRole[], search: string): Promise<UserDocument[]> {
    try {
      const query = {
        roles: { $in: roles },
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ],
      };

      const users = await this.userModel
        .find(query)
        .select('_id firstName lastName roles')
        .sort({ firstName: 1, lastName: 1 })
        .limit(50) // Limit results for dropdown
        .exec();

      return users;
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'findUsersForDropdown: error',
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to retrieve users for dropdown');
    }
  }

  /** Advanced admin user search with filters */
  async findAllAdmin(filters: UserTableFilter): Promise<PaginatedUsersResponse> {
    try {
      // Validate and sanitize pagination parameters
      const validatedLimit = Math.min(
        Math.max(
          USER_PAGINATION_CONSTANTS.MIN_LIMIT,
          filters.limit || USER_PAGINATION_CONSTANTS.DEFAULT_LIMIT,
        ),
        USER_PAGINATION_CONSTANTS.MAX_LIMIT,
      );
      const validatedPage = Math.max(
        USER_PAGINATION_CONSTANTS.MIN_PAGE,
        filters.page || USER_PAGINATION_CONSTANTS.MIN_PAGE,
      );
      const skip = (validatedPage - 1) * validatedLimit;

      // Build query object with proper typing
      interface UserQuery {
        $or?: Array<{
          firstName?: { $regex: string; $options: string };
          lastName?: { $regex: string; $options: string };
          email?: { $regex: string; $options: string };
          phone?: { $regex: string; $options: string };
        }>;
        $and?: Array<{
          $or?: Array<{
            isEmailVerified?: boolean;
            isPhoneVerified?: boolean;
          }>;
        }>;
        roles?: { $in: string[] };
        status?: string | { $in: string[] };
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
        createdAt?: {
          $gte?: Date;
          $lte?: Date;
        };
      }

      const query: UserQuery = {};

      // Add search filter
      if (filters.search && filters.search.trim().length > 0) {
        query.$or = [
          { firstName: { $regex: filters.search.trim(), $options: 'i' } },
          { lastName: { $regex: filters.search.trim(), $options: 'i' } },
          { email: { $regex: filters.search.trim(), $options: 'i' } },
          { phone: { $regex: filters.search.trim(), $options: 'i' } },
        ];
      }

      // Add role filter
      if (filters.role) {
        const roleArray = filters.role
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (roleArray.length > 0) {
          query.roles = { $in: roleArray };
        }
      }

      // Add status filter
      if (filters.status) {
        const statusArray = filters.status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (statusArray.length === 1) {
          query.status = statusArray[0];
        } else if (statusArray.length > 1) {
          query.status = { $in: statusArray };
        }
      }

      // Add verification filters
      if (filters.isEmailVerified !== undefined) {
        query.isEmailVerified = filters.isEmailVerified;
      }

      if (filters.isPhoneVerified !== undefined) {
        query.isPhoneVerified = filters.isPhoneVerified;
      }

      // Add date range filters
      if (filters.createdFrom || filters.createdTo) {
        query.createdAt = {};
        if (filters.createdFrom) {
          query.createdAt.$gte = DateUtils.create(filters.createdFrom);
        }
        if (filters.createdTo) {
          query.createdAt.$lte = DateUtils.create(filters.createdTo);
        }
      }

      // Build sort object
      type SortObject = Record<string, 1 | -1>;
      const sort: SortObject = {};
      const validSortFields: string[] = [
        UserSortFieldsEnum.CREATED_AT,
        UserSortFieldsEnum.UPDATED_AT,
        UserSortFieldsEnum.LAST_ACTIVE_AT,
        UserSortFieldsEnum.FIRST_NAME,
        UserSortFieldsEnum.LAST_NAME,
        UserSortFieldsEnum.EMAIL,
        UserSortFieldsEnum.ID,
      ];
      let sortField: string = filters.sortBy || UserSortFieldsEnum.CREATED_AT;

      // Map 'id' to '_id' for MongoDB
      if (sortField === String(UserSortFieldsEnum.ID)) {
        sortField = DatabaseFieldEnum.ID;
      }

      // Validate sort field
      if (!validSortFields.includes(sortField)) {
        sortField = UserSortFieldsEnum.CREATED_AT;
      }

      const sortDirection: 1 | -1 = filters.sortDirection === SortDirectionEnum.ASC ? 1 : -1;
      sort[sortField] = sortDirection;

      // Execute queries in parallel
      const [users, total] = await Promise.all([
        this.userModel
          .find(query as FilterQuery<UserDocument>)
          .sort(sort)
          .skip(skip)
          .limit(validatedLimit)
          .exec(),
        this.userModel.countDocuments(query as FilterQuery<UserDocument>).exec(),
      ]);

      const totalPages = Math.ceil(total / validatedLimit);

      return {
        users,
        total,
        page: validatedPage,
        limit: validatedLimit,
        pages: totalPages,
        hasNext: validatedPage < totalPages,
        hasPrev: validatedPage > 1,
      };
    } catch (error) {
      const dbError = error as Error;
      LoggingUtil.error(
        'findAllAdmin: error',
        dbError.stack || String(dbError),
        'UserAdminService',
      );
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }
}
