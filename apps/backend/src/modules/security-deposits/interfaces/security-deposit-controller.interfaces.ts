import {
  SecurityDepositStatus,
  SecurityDepositReleaseReason,
} from '../../../common/enums/security-deposit.enums';

// ================================
// Filter Interfaces
// ================================

export interface AdminSecurityDepositFilters {
  status?: SecurityDepositStatus;
  hasActiveClaims?: boolean;
  requiresAdminReview?: boolean;
}

// ================================
// Request Body Interfaces
// ================================

export interface ReleaseSecurityDepositRequest {
  reason?: SecurityDepositReleaseReason;
  notes?: string;
}
