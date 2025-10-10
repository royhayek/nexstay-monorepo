import {
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  CurrencyCode,
} from '../../../common/enums/payment.enums';
import { PaymentIntentDocument } from '../../../database/schemas/payment-intent.schema';
import { PaymentTransactionDocument } from '../../../database/schemas/payment-transaction.schema';

export interface PaymentIntentFilters {
  provider?: PaymentProvider;
  status?: PaymentIntentStatus;
  currency?: CurrencyCode;
  customerId?: string;
  bookingId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  sortBy?: 'createdAt' | 'amount' | 'status' | 'provider';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaymentTransactionFilters {
  provider?: PaymentProvider;
  transactionStatus?: PaymentTransactionStatus;
  currency?: CurrencyCode;
  customerId?: string;
  bookingId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  sortBy?: 'createdAt' | 'amount' | 'status' | 'provider';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface MongoQuery {
  provider?: PaymentProvider;
  status?: PaymentIntentStatus | PaymentTransactionStatus;
  'amount.currency'?: CurrencyCode;
  customerId?: string;
  bookingId?: string;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  'amount.amount'?: {
    $gte?: number;
    $lte?: number;
  };
  $or?: Array<{
    'metadata.guestEmail'?: { $regex: string; $options: string };
    'metadata.confirmationCode'?: { $regex: string; $options: string };
    'metadata.description'?: { $regex: string; $options: string };
    providerTransactionId?: { $regex: string; $options: string };
  }>;
}

export interface MongoSort {
  [key: string]: 1 | -1;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated payment intents response
 */
export interface PaginatedPaymentIntentsResult {
  intents: PaymentIntentDocument[];
  total: number;
  page: number;
  pages: number;
}

/**
 * Paginated payment transactions response
 */
export interface PaginatedPaymentTransactionsResult {
  transactions: PaymentTransactionDocument[];
  total: number;
  page: number;
  pages: number;
}
