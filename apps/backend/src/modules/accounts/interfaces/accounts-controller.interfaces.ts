import { TransactionType } from '../../../database/schemas/transaction.schema';
import { TransactionDataDto } from '../dto/transaction-response.dto';

// ================================
// Request Body Interfaces
// ================================

export interface FreezeAccountRequest {
  reason: string;
}

export interface CancelEscrowRequest {
  reason: string;
}

export interface FailPayoutRequest {
  reason: string;
}

export interface BulkFreezeAccountsRequest {
  accountIds: string[];
  reason: string;
}

export interface CreateManualTransactionRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
}

// ================================
// Response Interfaces
// ================================

export interface EscrowReleaseResponse {
  hostPayout: TransactionDataDto;
  platformFee: TransactionDataDto;
}
