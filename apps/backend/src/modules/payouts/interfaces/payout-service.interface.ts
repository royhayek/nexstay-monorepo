import { PayoutDocument } from '../../../database/schemas/payout.schema';
import { PayoutMethodDocument } from '../../../database/schemas/payout-method.schema';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';
import { UpdatePayoutPreferencesDto } from '../dto/payout-preferences.dto';
import {
  EligibleEarningsData,
  AutoPayoutProcessingResult,
  PayoutPreferencesResponse,
} from './payout-types.interface';
import { PayoutStatus } from '../../../common/enums/payout.enums';

/**
 * Interface for payout search filters
 */
export interface PayoutSearchFilters {
  hostId?: string;
  status?: PayoutStatus | PayoutStatus[];
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  payoutMethodId?: string;
  provider?: string;
}

/**
 * Interface for payout pagination options
 */
export interface PayoutPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for paginated payout results
 */
export interface PaginatedPayoutResult {
  items: PayoutDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage?: number;
    previousPage?: number;
  };
}

/**
 * Interface for payout service operations
 */
export interface IPayoutService {
  // Payout Method Operations
  createPayoutMethod(userId: string, dto: CreatePayoutMethodDto): Promise<PayoutMethodDocument>;

  updatePayoutMethod(
    userId: string,
    payoutMethodId: string,
    dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodDocument>;

  deletePayoutMethod(userId: string, payoutMethodId: string): Promise<void>;

  getPayoutMethods(userId: string): Promise<PayoutMethodDocument[]>;

  getPayoutMethodById(userId: string, payoutMethodId: string): Promise<PayoutMethodDocument>;

  // Payout Operations
  createPayout(userId: string, dto: CreatePayoutDto): Promise<PayoutDocument>;

  cancelPayout(userId: string, payoutId: string, reason?: string): Promise<PayoutDocument>;

  retryFailedPayout(payoutId: string, adminId?: string): Promise<PayoutDocument>;

  getPayouts(
    filters: PayoutSearchFilters,
    pagination: PayoutPaginationOptions,
  ): Promise<PaginatedPayoutResult>;

  getPayoutById(payoutId: string, userId?: string): Promise<PayoutDocument>;

  // Earnings Operations
  getEligibleEarnings(userId: string): Promise<EligibleEarningsData>;

  // Preferences Operations
  updatePayoutPreferences(
    userId: string,
    dto: UpdatePayoutPreferencesDto,
  ): Promise<PayoutPreferencesResponse>;

  getPayoutPreferences(userId: string): Promise<PayoutPreferencesResponse>;

  // Automated Processing
  processAutomaticPayouts(): Promise<AutoPayoutProcessingResult>;

  processScheduledPayouts(): Promise<void>;
}

/**
 * Interface for payout calculation service
 */
export interface IPayoutCalculationService {
  calculateFees(
    amount: number,
    currency: string,
  ): Promise<{
    platformFee: number;
    processingFee: number;
    withdrawalFee: number;
    taxWithholding: number;
    totalFees: number;
  }>;

  calculateNetAmount(grossAmount: number, currency: string): Promise<number>;

  calculateNextPayoutDate(frequency: string, lastPayoutDate?: Date): Date;

  validatePayoutAmount(
    amount: number,
    currency: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
}

/**
 * Interface for payout provider service
 */
export interface IPayoutProviderService {
  initiateTransfer(
    payoutId: string,
    amount: number,
    payoutMethod: PayoutMethodDocument,
  ): Promise<{
    providerPayoutId: string;
    status: PayoutStatus;
    expectedArrival?: Date;
  }>;

  checkTransferStatus(providerPayoutId: string): Promise<{
    status: PayoutStatus;
    completedAt?: Date;
    failureReason?: string;
    failureCode?: string;
  }>;

  cancelTransfer(providerPayoutId: string): Promise<boolean>;

  validatePayoutMethod(payoutMethod: PayoutMethodDocument): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
}

/**
 * Interface for payout notification service
 */
export interface IPayoutNotificationService {
  notifyPayoutInitiated(payoutId: string): Promise<void>;
  notifyPayoutCompleted(payoutId: string): Promise<void>;
  notifyPayoutFailed(payoutId: string, reason: string): Promise<void>;
  notifyMinimumReached(userId: string, amount: number): Promise<void>;
  notifyMethodAdded(userId: string, methodId: string): Promise<void>;
  notifyMethodVerified(userId: string, methodId: string): Promise<void>;
}
