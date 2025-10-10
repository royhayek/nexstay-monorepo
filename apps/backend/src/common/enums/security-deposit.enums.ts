export enum SecurityDepositStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized', // Payment method authorized but not charged
  HELD = 'held', // Amount successfully held/charged
  RELEASED = 'released', // Fully released back to guest
  PARTIALLY_CLAIMED = 'partially_claimed', // Part claimed by host
  FULLY_CLAIMED = 'fully_claimed', // Fully claimed by host
  EXPIRED = 'expired', // Hold expired without capture
  CANCELLED = 'cancelled', // Cancelled before processing
  DISPUTED = 'disputed', // Under dispute resolution
  ADMIN_REVIEW = 'admin_review', // Requires admin intervention
  FAILED = 'failed', // Processing failed
}

export enum ClaimReason {
  PROPERTY_DAMAGE = 'property_damage',
  MISSING_ITEMS = 'missing_items',
  EXCESSIVE_CLEANING = 'excessive_cleaning',
  UNAUTHORIZED_GUESTS = 'unauthorized_guests',
  SMOKING_VIOLATION = 'smoking_violation',
  PET_VIOLATION = 'pet_violation',
  NOISE_COMPLAINTS = 'noise_complaints',
  EARLY_DEPARTURE = 'early_departure',
  LATE_CHECKOUT = 'late_checkout',
  LOST_KEYS = 'lost_keys',
  UTILITY_OVERUSE = 'utility_overuse',
  RULE_VIOLATIONS = 'rule_violations',
  OTHER = 'other',
}

export enum SecurityDepositClaimStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_APPROVED = 'partially_approved',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

// Security deposit processing actions
export enum SecurityDepositAction {
  HOLD = 'hold',
  RELEASE = 'release',
  CLAIM = 'claim',
  DISPUTE = 'dispute',
  APPROVE_CLAIM = 'approve_claim',
  REJECT_CLAIM = 'reject_claim',
  PARTIAL_CLAIM = 'partial_claim',
  CANCEL = 'cancel',
  EXPIRE = 'expire',
  ADMIN_OVERRIDE = 'admin_override',
}

// Auto-release triggers
export enum SecurityDepositReleaseReason {
  AUTO_RELEASE = 'auto_release', // Automatic after grace period
  MANUAL_RELEASE = 'manual_release', // Manual by host
  ADMIN_RELEASE = 'admin_release', // Admin intervention
  NO_CLAIMS = 'no_claims', // No claims filed within time limit
  CHECKOUT_COMPLETE = 'checkout_complete', // Successful checkout
  DISPUTE_RESOLVED = 'dispute_resolved', // Dispute resolved in guest favor
}
