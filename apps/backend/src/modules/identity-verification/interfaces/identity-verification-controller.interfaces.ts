// ================================
// Response Data Interfaces
// ================================

export interface VerificationDeletionData {
  id: string;
  deletedBy: string;
  deletedAt: Date;
}

export interface VerificationExpirationData {
  expiredCount: number;
}
