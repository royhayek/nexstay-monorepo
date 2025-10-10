import { Injectable } from '@nestjs/common';
import { AccountsFacadeService } from '../../accounts/services/accounts-facade.service';
import {
  AccountDocument,
  AccountType,
  AccountOwnerType,
} from '../../../database/schemas/account.schema';
import { UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface UserAccountCreationResult {
  guestWallet?: AccountDocument;
  hostEarnings?: AccountDocument;
  success: boolean;
  errors: string[];
}

export interface RoleBasedAccountCreationResult {
  newAccounts: AccountDocument[];
  success: boolean;
  errors: string[];
}

export interface UserAccountSummary {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  escrowedBalance: number;
  accounts: AccountDocument[];
}

/**
 * Service handling user account integration with accounts module
 * Automatically creates financial accounts when users are created
 */
@Injectable()
export class UserAccountIntegrationService {
  constructor(private readonly accountsFacade: AccountsFacadeService) {}

  /**
   * Create financial accounts for a new user based on their roles
   * This method is called automatically when a user is created
   */
  async createUserAccounts(user: UserDocument): Promise<UserAccountCreationResult> {
    const errors: string[] = [];
    let guestWallet: AccountDocument | undefined;
    let hostEarnings: AccountDocument | undefined;

    try {
      LoggingUtil.log(
        `Creating financial accounts for user ${String(user._id)} with roles: ${user.roles?.join(', ')}`,
        'UserAccountIntegrationService',
      );

      // Create accounts based on user roles
      if (this.shouldCreateGuestWallet(user)) {
        try {
          guestWallet = await this.createGuestWallet(user);
          LoggingUtil.log(
            `Guest wallet created for user ${String(user._id)}: ${String(guestWallet._id)}`,
            'UserAccountIntegrationService',
          );
        } catch (error) {
          const errorMessage = `Failed to create guest wallet: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');
        }
      }

      if (this.shouldCreateHostEarnings(user)) {
        try {
          hostEarnings = await this.createHostEarnings(user);
          LoggingUtil.log(
            `Host earnings account created for user ${String(user._id)}: ${String(hostEarnings._id)}`,
            'UserAccountIntegrationService',
          );
        } catch (error) {
          const errorMessage = `Failed to create host earnings account: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');
        }
      }

      const success = errors.length === 0;

      if (success) {
        LoggingUtil.log(
          `All financial accounts created successfully for user ${String(user._id)}`,
          'UserAccountIntegrationService',
        );
      } else {
        LoggingUtil.warn(
          `Partial success creating accounts for user ${String(user._id)}: ${errors.join('; ')}`,
          'UserAccountIntegrationService',
        );
      }

      return {
        guestWallet,
        hostEarnings,
        success,
        errors,
      };
    } catch (error) {
      const errorMessage = `Critical error in account creation for user ${String(user._id)}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');

      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Create additional accounts when user role changes
   * Called when user upgrades from guest to host, etc.
   */
  async createAdditionalAccountsForRoleChange(
    userId: string,
    newRoles: UserRole[],
    userEmail: string,
  ): Promise<RoleBasedAccountCreationResult> {
    const errors: string[] = [];
    const newAccounts: AccountDocument[] = [];

    try {
      // Get existing accounts to avoid duplicates
      const existingAccounts = await this.accountsFacade.getUserAccounts(userId);

      // Check if we need to create a host earnings account
      if (newRoles.includes(UserRole.HOST) && !existingAccounts.hostEarnings) {
        try {
          const hostEarnings = await this.accountsFacade.createAccount({
            accountType: AccountType.HOST_EARNINGS,
            ownerType: AccountOwnerType.USER,
            ownerId: userId,
            currency: 'USD',
            accountName: `Host Earnings - ${userEmail}`,
          });
          newAccounts.push(hostEarnings);
          LoggingUtil.log(
            `Host earnings account created for role upgrade: ${userId}`,
            'UserAccountIntegrationService',
          );
        } catch (error) {
          const errorMessage = `Failed to create host earnings account for role upgrade: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');
        }
      }

      // Check if we need to create a guest wallet
      if (newRoles.includes(UserRole.GUEST) && !existingAccounts.guestWallet) {
        try {
          const guestWallet = await this.accountsFacade.createAccount({
            accountType: AccountType.GUEST_WALLET,
            ownerType: AccountOwnerType.USER,
            ownerId: userId,
            currency: 'USD',
            accountName: `Guest Wallet - ${userEmail}`,
          });
          newAccounts.push(guestWallet);
          LoggingUtil.log(
            `Guest wallet created for role upgrade: ${userId}`,
            'UserAccountIntegrationService',
          );
        } catch (error) {
          const errorMessage = `Failed to create guest wallet for role upgrade: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMessage);
          LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');
        }
      }

      return {
        newAccounts,
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      const errorMessage = `Critical error in role-based account creation for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      LoggingUtil.error(errorMessage, undefined, 'UserAccountIntegrationService');

      return {
        newAccounts: [],
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Get user's financial account summary
   * Convenience method to get account information through the facade
   */
  async getUserAccountSummary(userId: string): Promise<UserAccountSummary> {
    try {
      return await this.accountsFacade.getUserAccountsSummary(userId);
    } catch (error) {
      LoggingUtil.error(
        `Error getting account summary for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'UserAccountIntegrationService',
      );
      throw error;
    }
  }

  /**
   * Check if user needs a guest wallet based on roles
   */
  private shouldCreateGuestWallet(user: UserDocument): boolean {
    return user.roles?.includes(UserRole.GUEST) || user.roles?.includes(UserRole.ADMIN) || false;
  }

  /**
   * Check if user needs a host earnings account based on roles
   */
  private shouldCreateHostEarnings(user: UserDocument): boolean {
    return user.roles?.includes(UserRole.HOST) || user.roles?.includes(UserRole.ADMIN) || false;
  }

  /**
   * Create guest wallet account
   */
  private async createGuestWallet(user: UserDocument): Promise<AccountDocument> {
    return await this.accountsFacade.createAccount({
      accountType: AccountType.GUEST_WALLET,
      ownerType: AccountOwnerType.USER,
      ownerId: String(user._id),
      currency: 'USD',
      accountName: `Guest Wallet - ${user.email || user.phone || 'User'}`,
    });
  }

  /**
   * Create host earnings account
   */
  private async createHostEarnings(user: UserDocument): Promise<AccountDocument> {
    return await this.accountsFacade.createAccount({
      accountType: AccountType.HOST_EARNINGS,
      ownerType: AccountOwnerType.USER,
      ownerId: String(user._id),
      currency: 'USD',
      accountName: `Host Earnings - ${user.email || user.phone || 'User'}`,
    });
  }
}
