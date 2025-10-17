import { Injectable } from '@nestjs/common';
import { UserDocument } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import { AuthMethod } from '../../auth/dto/login.dto';
import { UserRole } from '../../../database/schemas/user.schema';
import { UserTableFilter } from '../../../common/interfaces/table-filters.interface';
import { AccountActionTypeEnum } from '../../../common/enums/account-action.enums';
import { UserCoreService } from './user-core.service';
import { UserProfileService } from './user-profile.service';
import { UserAccountService } from './user-account.service';
import { UserAdminService } from './user-admin.service';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { DeactivateAccountDto } from '../dto/deactivate-account.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { UpdatePreferencesDto, UpdateEmailPreferencesDto } from '../dto/user-preferences.dto';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';

/**
 * Users facade service - coordinates all user-related operations
 * This service provides a single entry point for all user operations
 * while delegating to specialized services internally
 */
@Injectable()
export class UsersFacadeService {
  constructor(
    private readonly coreService: UserCoreService,
    private readonly profileService: UserProfileService,
    private readonly accountService: UserAccountService,
    private readonly adminService: UserAdminService,
  ) {}

  // ===== CORE USER OPERATIONS =====

  async create(dto: CreateUserDto) {
    return this.coreService.create(dto);
  }

  async findById(id: string) {
    return this.coreService.findById(id);
  }

  async findByEmail(email: string) {
    return this.coreService.findByEmail(email);
  }

  async findForAuthByEmail(email: string) {
    return this.coreService.findForAuthByEmail(email);
  }

  async findForAuthById(id: string) {
    return this.coreService.findForAuthById(id);
  }

  async findByPhone(phone: string) {
    return this.coreService.findByPhone(phone);
  }

  async findUserByIdentifier(identifier: string, method: AuthMethod) {
    return this.coreService.findUserByIdentifier(identifier, method);
  }

  async validatePassword(userId: string, password: string) {
    return this.coreService.validatePassword(userId, password);
  }

  async getMe(userId: string) {
    return this.coreService.getMe(userId);
  }

  async markFirstLoginDone(id: string) {
    return this.coreService.markFirstLoginDone(id);
  }

  async markEmailVerified(id: string) {
    return this.coreService.markEmailVerified(id);
  }

  async markPhoneVerified(id: string) {
    return this.coreService.markPhoneVerified(id);
  }

  async findUsersByRoles(roles: string[]) {
    return this.coreService.findUsersByRoles(roles);
  }

  async findActiveUsers() {
    return this.coreService.findActiveUsers();
  }

  async exists(id: string) {
    return this.coreService.exists(id);
  }

  async createUserByAdmin(createUserDto: CreateUserDto, adminUserId: string) {
    return this.coreService.createUserByAdmin(createUserDto, adminUserId);
  }

  // ===== PROFILE OPERATIONS =====

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.profileService.updateProfile(userId, dto);
  }

  async updateAvatar(userId: string, avatarUrl: string | null) {
    return this.profileService.updateAvatar(userId, avatarUrl);
  }

  async getUserPreferences(userId: string) {
    return this.profileService.getUserPreferences(userId);
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.profileService.updateUserPreferences(userId, dto);
  }

  async getEmailPreferences(userId: string) {
    return this.profileService.getEmailPreferences(userId);
  }

  async updateEmailPreferences(userId: string, dto: UpdateEmailPreferencesDto) {
    return this.profileService.updateEmailPreferences(userId, dto);
  }

  // ===== ACCOUNT LIFECYCLE =====

  async deleteAccount(userId: string, dto: DeleteAccountDto) {
    return this.accountService.deleteAccount(userId, dto);
  }

  async deactivateAccount(userId: string, dto: DeactivateAccountDto) {
    return this.accountService.deactivateAccount(userId, dto);
  }

  async getDeactivationReasons() {
    return this.accountService.getDeactivationReasons();
  }

  async getDeletionReasons() {
    return this.accountService.getDeletionReasons();
  }

  async getAccountActionReasons(actionType: AccountActionTypeEnum) {
    return this.accountService.getAccountActionReasons(actionType);
  }

  // ===== ADMIN OPERATIONS =====

  async getAllUsers(
    page?: number,
    limit?: number,
    search?: string,
    role?: string,
    sortBy?: string,
    sortDirection?: string,
  ) {
    return this.adminService.getAllUsers(page, limit, search, role, sortBy, sortDirection);
  }

  async adminDeleteUser(userId: string) {
    return this.adminService.adminDeleteUser(userId);
  }

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
  ) {
    return this.adminService.adminUpdateUser(userId, updateData);
  }

  async adminToggleUserStatus(userId: string) {
    return this.adminService.adminToggleUserStatus(userId);
  }

  async adminToggleEmailVerified(userId: string) {
    return this.adminService.adminToggleEmailVerified(userId);
  }

  async adminTogglePhoneVerified(userId: string) {
    return this.adminService.adminTogglePhoneVerified(userId);
  }

  async adminBulkDeleteUsers(userIds: string[]) {
    return this.adminService.adminBulkDeleteUsers(userIds);
  }

  async findUsersForDropdown(roles: UserRole[], search: string) {
    return this.adminService.findUsersForDropdown(roles, search);
  }

  async findAllAdmin(filters: UserTableFilter) {
    return this.adminService.findAllAdmin(filters);
  }

  // ===== LEGACY COMPATIBILITY METHODS =====
  // These methods maintain compatibility with existing code

  async bulkDelete(userIds: string[]) {
    return this.adminService.adminBulkDeleteUsers(userIds);
  }

  async toggleUserStatus(userId: string) {
    const result = await this.adminService.adminToggleUserStatus(userId);
    return {
      newValue: result.status === UserStatus.ACTIVE,
      message: result.message,
    };
  }

  async toggleEmailVerification(userId: string) {
    const result = await this.adminService.adminToggleEmailVerified(userId);
    return {
      newValue: result.isEmailVerified,
      message: result.message,
    };
  }

  async togglePhoneVerification(userId: string) {
    const result = await this.adminService.adminTogglePhoneVerified(userId);
    return {
      newValue: result.isPhoneVerified,
      message: result.message,
    };
  }

  async deleteByAdmin(userId: string) {
    const result = await this.adminService.adminDeleteUser(userId);
    return {
      deleted: true,
      ...result,
    };
  }

  async updateByAdmin(userId: string, updateData: AdminUpdateUserDto): Promise<UserDocument> {
    const result = await this.adminService.adminUpdateUser(userId, updateData);
    return result.user;
  }

  // ===== WISHLIST OPERATIONS =====

  async getWishlist(userId: string) {
    return this.profileService.getWishlist(userId);
  }

  async addToWishlist(userId: string, propertyId: string) {
    return this.profileService.addToWishlist(userId, propertyId);
  }

  async removeFromWishlist(userId: string, propertyId: string) {
    return this.profileService.removeFromWishlist(userId, propertyId);
  }

  async checkWishlistStatus(userId: string, propertyId: string) {
    return this.profileService.checkWishlistStatus(userId, propertyId);
  }
}
