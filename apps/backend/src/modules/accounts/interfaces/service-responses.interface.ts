import { TransactionDocument } from '../../../database/schemas/transaction.schema';
import { AccountDocument } from '../../../database/schemas/account.schema';
import { PayoutDocument } from '../../../database/schemas/payout.schema';

/**
 * Paginated list response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Transaction history response - specific implementation of paginated transaction results
 */
export type TransactionHistoryResponse = PaginatedResponse<TransactionDocument>;

/**
 * Transaction statistics by type
 */
export interface TransactionStatsByType {
  count: number;
  amount: number;
}

/**
 * Transaction statistics by status
 */
export interface TransactionStatsByStatus {
  [status: string]: number;
}

/**
 * Transaction statistics response
 */
export interface TransactionStatsResponse {
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  byType: Record<string, TransactionStatsByType>;
  byStatus: TransactionStatsByStatus;
}

/**
 * User accounts response
 */
export interface UserAccountsData {
  guestWallet?: AccountDocument;
  hostEarnings?: AccountDocument;
}

/**
 * Account summary data
 */
export interface AccountSummaryData {
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  escrowedBalance: number;
  accounts: AccountDocument[];
}

/**
 * Payout processing result
 */
export interface PayoutProcessingResult {
  transaction: TransactionDocument;
  payout?: PayoutDocument; // Proper typing with PayoutDocument
  fastPayFee?: number;
}

/**
 * Reconciliation inconsistency item
 */
export interface ReconciliationInconsistency {
  accountId: string;
  accountNumber: string;
  issue: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
}

/**
 * Reconciliation report data
 */
export interface ReconciliationReportData {
  totalAccounts: number;
  totalBalance: number;
  totalAvailable: number;
  totalPending: number;
  totalEscrowed: number;
  accountsByType: Record<
    string,
    {
      count: number;
      totalBalance: number;
      availableBalance: number;
    }
  >;
  systemAccounts: Record<
    string,
    {
      count: number;
      totalBalance: number;
      availableBalance: number;
    }
  >;
  inconsistencies: ReconciliationInconsistency[];
}

/**
 * Payout request result for controller response
 */
export interface PayoutRequestResult {
  transactionId: string;
  payoutId?: string;
  amount: number;
  fastPayFee?: number;
  estimatedArrival?: Date;
}

/**
 * Bulk operation result
 */
export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: string[];
}
