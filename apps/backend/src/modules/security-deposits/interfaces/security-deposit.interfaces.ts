import { Types } from 'mongoose';
import { SecurityDepositStatus } from '../../../common/enums/security-deposit.enums';

export interface CreateSecurityDepositRequest {
  bookingId: string;
  propertyId: string;
  guestId: string;
  hostId: string;
  amount: number;
  currency: string;
  autoReleaseAfterDays?: number;
}

export interface SecurityDepositFilters {
  status?: SecurityDepositStatus;
  hostId?: string;
  guestId?: string;
  propertyId?: string;
  hasActiveClaims?: boolean;
  requiresAdminReview?: boolean;
  releaseDueBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SecurityDepositQuery {
  status?: SecurityDepositStatus;
  hostId?: Types.ObjectId;
  guestId?: Types.ObjectId;
  propertyId?: Types.ObjectId;
  hasActiveClaims?: boolean;
  requiresAdminReview?: boolean;
  releaseScheduledAt?: {
    $lte?: Date;
  };
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface SecurityDepositStatsAggregationResult {
  _id: null;
  total: number;
  totalAmount: number;
  statuses: string[];
  activeClaimsCount: number;
}

export interface SecurityDepositsPaginatedResponse {
  deposits: unknown[];
  total: number;
  pages: number;
}
