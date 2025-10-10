import {
  PayoutDocument,
  PayoutFeeBreakdown,
  PayoutBookingReference,
} from '../../../database/schemas/payout.schema';
import { PayoutMethodDocument } from '../../../database/schemas/payout-method.schema';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { PropertyDocument } from '../../../database/schemas/property.schema';
import { UserDocument } from '../../../database/schemas/user.schema';
import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';
import { UpdatePayoutPreferencesDto } from '../dto/payout-preferences.dto';
import { PayoutType } from '../../../common/enums/payout.enums';
import {
  PayoutSearchFilters,
  PayoutPaginationOptions,
  PaginatedPayoutResult,
} from './payout-service.interface';
import {
  AutoPayoutProcessingResult,
  EligibleEarningsData,
  PayoutPreferencesResponse,
} from './payout-types.interface';

/**
 * =============================================================================
 * CORE SERVICE INTERFACES
 * =============================================================================
 */

/**
 * Interface for payout core service operations
 */
export interface IPayoutsCoreService {
  createPayout(userId: string, data: CreatePayoutData): Promise<PayoutDocument>;
  cancelPayout(userId: string, payoutId: string, reason?: string): Promise<PayoutDocument>;
  getPayouts(
    filters: PayoutSearchFilters,
    pagination: PayoutPaginationOptions,
  ): Promise<PaginatedPayoutResult>;
  getPayoutById(payoutId: string, userId?: string): Promise<PayoutDocument>;
  getEligibleEarnings(userId: string): Promise<EligibleEarningsData>;
  updatePayoutPreferences(
    userId: string,
    dto: UpdatePayoutPreferencesDto,
  ): Promise<PayoutPreferencesResponse>;
  getPayoutPreferences(userId: string): Promise<PayoutPreferencesResponse>;
}

/**
 * Interface for payout method service operations
 */
export interface IPayoutsMethodService {
  createPayoutMethod(userId: string, dto: CreatePayoutMethodDto): Promise<PayoutMethodDocument>;
  updatePayoutMethod(
    userId: string,
    payoutMethodId: string,
    dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodDocument>;
  deletePayoutMethod(userId: string, payoutMethodId: string): Promise<void>;
  getPayoutMethods(userId: string): Promise<PayoutMethodDocument[]>;
  getPayoutMethodById(userId: string, payoutMethodId: string): Promise<PayoutMethodDocument>;
  verifyPayoutMethod(payoutMethodId: string): Promise<PayoutMethodDocument>;
  suspendPayoutMethod(
    payoutMethodId: string,
    reason: string,
    adminId?: string,
  ): Promise<PayoutMethodDocument>;
}

/**
 * Interface for payout processing service operations
 */
export interface IPayoutsProcessingService {
  processAutomaticPayouts(): Promise<AutoPayoutProcessingResult>;
  processScheduledPayouts(): Promise<void>;
  retryFailedPayout(payoutId: string, adminId?: string): Promise<PayoutDocument>;
  processBatchPayouts(
    hostIds: string[],
    adminId: string,
  ): Promise<{
    batchId: string;
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }>;
}

/**
 * =============================================================================
 * DATA INTERFACES
 * =============================================================================
 */

// Using schema types directly - PayoutFeeBreakdown and PayoutBookingReference are imported from payout.schema.ts

/**
 * Interface for creating payout data
 */
export interface CreatePayoutData {
  payoutMethodId: string;
  type: PayoutType;
  payoutMethod: PayoutMethodDocument;
  grossAmount: number;
  fees: PayoutFeeBreakdown;
  netAmount: number;
  bookings: PayoutBookingReference[];
  description?: string;
}

/**
 * Interface for populated booking with virtual fields
 */
export interface PopulatedBookingDocument extends BookingDocument {
  property?: PropertyDocument;
  guest?: UserDocument;
  host?: UserDocument;
}

/**
 * Interface for payout fee configuration
 */
export interface PayoutFeeConfig {
  platformFeePercent: number;
  processingFeePercent: number;
  withdrawalFeeFixed: number;
  taxWithholdingPercent: number;
  minimumPayout: number;
  maximumPayout: number;
}
