import { InstallmentStatus } from '../../../common/enums/installment.enums';

// ================================
// Filter Interfaces (for internal use)
// ================================

export interface UserInstallmentFilters {
  guestId: string;
  status?: InstallmentStatus;
}

export interface AdminInstallmentFilters {
  status?: InstallmentStatus;
  isOverdue?: boolean;
}

// ================================
// Request Body Interfaces
// ================================

export interface ProcessInstallmentPaymentRequest {
  paymentMethodId: string;
}

export interface RescheduleInstallmentRequest {
  newDueDate: string;
  reason?: string;
}

export interface CancelInstallmentRequest {
  reason?: string;
}
