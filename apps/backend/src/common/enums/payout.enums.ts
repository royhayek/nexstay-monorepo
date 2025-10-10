export enum PayoutMethodType {
  BANK_ACCOUNT = 'bank_account',
  WALLET = 'wallet',
  DEBIT_CARD = 'debit_card',
}

export enum PayoutMethodStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum PayoutStatus {
  PENDING = 'pending',
  PENDING_APPROVAL = 'pending_approval',
  PROCESSING = 'processing',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PayoutType {
  INSTANT = 'instant',
  STANDARD = 'standard',
  MANUAL = 'manual',
  EMERGENCY = 'emergency',
}

export enum PayoutProvider {
  APS = 'aps',
  BANK_TRANSFER = 'bank_transfer',
  MANUAL = 'manual',
}

export enum PayoutTrigger {
  CHECKOUT_COMPLETED = 'checkout_completed',
  MANUAL_REQUEST = 'manual_request',
  SCHEDULED = 'scheduled',
  ADMIN_INITIATED = 'admin_initiated',
  AUTO_PAYOUT = 'auto_payout',
}

export enum PayoutFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MANUAL = 'manual',
}
