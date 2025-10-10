import { Injectable } from '@nestjs/common';
import { AccountsFacadeService } from '../../accounts/services/accounts-facade.service';
import { TransactionDocument } from '../../../database/schemas/transaction.schema';
import { PayoutDocument } from '../../../database/schemas/payout.schema';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface PayoutAccountsIntegrationResult {
  success: boolean;
  transaction?: TransactionDocument;
  errors: string[];
}

export interface HostEarningsData {
  availableBalance: number;
  pendingBalance: number;
  escrowedBalance: number;
  totalBalance: number;
  currency: string;
  accountId: string;
  hasAccount: boolean;
}

/**
 * Service handling integration between payouts module and accounts module
 * Uses accounts module as single source of truth for balances
 */
@Injectable()
export class PayoutsAccountsIntegrationService {
  constructor(private readonly accountsFacade: AccountsFacadeService) {}

  /**
   * Get host earnings from accounts module
   * This replaces the old method of calculating from bookings
   */
  async getHostEarningsFromAccounts(hostId: string): Promise<HostEarningsData> {
    try {
      LoggingUtil.log(
        `Getting host earnings from accounts module for host: ${hostId}`,
        'PayoutsAccountsIntegrationService',
      );

      // Get host earnings account from accounts module
      const accounts = await this.accountsFacade.getUserAccounts(hostId);
      const hostAccount = accounts.hostEarnings;

      if (!hostAccount) {
        LoggingUtil.warn(
          `No HOST_EARNINGS account found for host: ${hostId}`,
          'PayoutsAccountsIntegrationService',
        );
        return {
          availableBalance: 0,
          pendingBalance: 0,
          escrowedBalance: 0,
          totalBalance: 0,
          currency: 'USD',
          accountId: '',
          hasAccount: false,
        };
      }

      return {
        availableBalance: hostAccount.balance.available,
        pendingBalance: hostAccount.balance.pending,
        escrowedBalance: hostAccount.balance.escrowed,
        totalBalance: hostAccount.balance.total,
        currency: hostAccount.currency,
        accountId: String(hostAccount._id),
        hasAccount: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Error getting host earnings: ${errorMessage}`,
        'PayoutsAccountsIntegrationService',
      );
      throw error;
    }
  }

  /**
   * Process payout through accounts module
   * Moves money from HOST_EARNINGS to pending payout
   */
  async processPayoutThroughAccounts(
    hostId: string,
    payoutAmount: number,
    payoutId: string,
    fastPay = false,
  ): Promise<PayoutAccountsIntegrationResult> {
    const errors: string[] = [];

    try {
      LoggingUtil.log(
        `Processing payout ${payoutId} through accounts module for host: ${hostId}`,
        'PayoutsAccountsIntegrationService',
      );

      // Get host earnings account
      const accounts = await this.accountsFacade.getUserAccounts(hostId);
      const hostAccount = accounts.hostEarnings;

      if (!hostAccount) {
        const error = 'No HOST_EARNINGS account found for host';
        errors.push(error);
        return { success: false, errors };
      }

      // Check if host has sufficient balance
      if (hostAccount.balance.available < payoutAmount) {
        const error = `Insufficient balance. Available: ${hostAccount.balance.available}, Requested: ${payoutAmount}`;
        errors.push(error);
        return { success: false, errors };
      }

      // Process the payout through accounts module
      // This will handle the actual transaction and update balances
      const result = await this.accountsFacade.processHostPayout(
        hostId,
        payoutAmount,
        payoutId, // Use payout ID as reference
        fastPay,
      );

      if (!result.transaction) {
        const error = 'Failed to create payout transaction in accounts module';
        errors.push(error);
        return { success: false, errors };
      }

      LoggingUtil.log(
        `Successfully processed payout ${payoutId} through accounts module`,
        'PayoutsAccountsIntegrationService',
      );

      return {
        success: true,
        transaction: result.transaction,
        errors: [],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Error processing payout through accounts: ${errorMessage}`,
        'PayoutsAccountsIntegrationService',
      );
      errors.push(errorMessage);
      return { success: false, errors };
    }
  }

  /**
   * Reconcile payout status with accounts module
   * Updates account balances based on external payout status
   */
  async reconcilePayoutStatus(
    payout: PayoutDocument,
    newStatus: PayoutStatus,
  ): Promise<PayoutAccountsIntegrationResult> {
    const errors: string[] = [];

    try {
      LoggingUtil.log(
        `Reconciling payout ${String(payout._id)} status: ${newStatus}`,
        'PayoutsAccountsIntegrationService',
      );

      const hostId = String(payout.hostId);
      const amount =
        typeof payout.netAmount === 'object' && payout.netAmount
          ? payout.netAmount.amount
          : Number(payout.netAmount);

      switch (newStatus) {
        case PayoutStatus.COMPLETED:
          // Payout successfully sent to bank
          // Move from pending to completed in accounts
          LoggingUtil.log(
            `Payout ${String(payout._id)} completed, updating accounts`,
            'PayoutsAccountsIntegrationService',
          );
          // In the future, we might track completed payouts separately
          break;

        case PayoutStatus.FAILED: {
          // Payout failed, return funds to available balance
          LoggingUtil.log(
            `Payout ${String(payout._id)} failed, returning funds to available balance`,
            'PayoutsAccountsIntegrationService',
          );

          // Credit the amount back to host's available balance
          const accounts = await this.accountsFacade.getUserAccounts(hostId);
          if (!accounts.hostEarnings) {
            errors.push('No host earnings account found');
            return { success: false, errors };
          }
          await this.accountsFacade.updateAccountBalance(String(accounts.hostEarnings._id), {
            creditAmount: amount,
          });
          break;
        }

        case PayoutStatus.CANCELLED: {
          // Similar to failed, return funds if they were already deducted
          if (payout.status === PayoutStatus.PROCESSING || payout.status === PayoutStatus.PENDING) {
            LoggingUtil.log(
              `Payout ${String(payout._id)} cancelled, returning funds`,
              'PayoutsAccountsIntegrationService',
            );

            const accounts = await this.accountsFacade.getUserAccounts(hostId);
            if (!accounts.hostEarnings) {
              errors.push('No host earnings account found');
              return { success: false, errors };
            }
            await this.accountsFacade.updateAccountBalance(String(accounts.hostEarnings._id), {
              creditAmount: amount,
            });
          }
          break;
        }

        default:
          LoggingUtil.debug(
            `No account reconciliation needed for status: ${newStatus}`,
            'PayoutsAccountsIntegrationService',
          );
      }

      return { success: true, errors: [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Error reconciling payout status: ${errorMessage}`,
        'PayoutsAccountsIntegrationService',
      );
      errors.push(errorMessage);
      return { success: false, errors };
    }
  }

  /**
   * Check if host has minimum balance for payout
   */
  async hasMinimumBalance(hostId: string, minimumAmount: number): Promise<boolean> {
    try {
      const earnings = await this.getHostEarningsFromAccounts(hostId);
      return earnings.availableBalance >= minimumAmount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Error checking minimum balance: ${errorMessage}`,
        'PayoutsAccountsIntegrationService',
      );
      return false;
    }
  }

  /**
   * Get recent transactions for a host from accounts module
   */
  async getHostTransactionHistory(hostId: string, limit = 10): Promise<TransactionDocument[]> {
    try {
      // Get host's account
      const accounts = await this.accountsFacade.getUserAccounts(hostId);
      const hostAccount = accounts.hostEarnings;

      if (!hostAccount) {
        return [];
      }

      // Get transactions for this account
      // For internal use, we need to call with admin role to bypass access check
      const result = await this.accountsFacade.getAccountTransactionHistory(
        String(hostAccount._id),
        { page: 1, limit },
        'admin',
      );
      return result.items || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Error getting transaction history: ${errorMessage}`,
        'PayoutsAccountsIntegrationService',
      );
      return [];
    }
  }
}
