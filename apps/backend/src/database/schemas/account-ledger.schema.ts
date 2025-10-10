import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountLedgerDocument = AccountLedger & Document;

export enum LedgerEntryType {
  // Payment related
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_SPLIT = 'PAYMENT_SPLIT',
  PAYOUT = 'PAYOUT',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',

  // Fee related
  PLATFORM_FEE = 'PLATFORM_FEE',
  PROCESSING_FEE = 'PROCESSING_FEE',
  PENALTY_FEE = 'PENALTY_FEE',

  // Adjustments
  ADJUSTMENT = 'ADJUSTMENT',
  CORRECTION = 'CORRECTION',
  WRITE_OFF = 'WRITE_OFF',

  // Transfers
  TRANSFER = 'TRANSFER',
  HOLD = 'HOLD',
  RELEASE = 'RELEASE',

  // Tax related
  TAX_COLLECTION = 'TAX_COLLECTION',
  TAX_REMITTANCE = 'TAX_REMITTANCE',
}

export enum LedgerStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
}

@Schema({ _id: false })
export class LedgerAmount {
  @Prop({ required: true })
  amount: number; // In smallest currency unit

  @Prop({ required: true })
  currency: string;

  @Prop()
  exchangeRate?: number; // If currency conversion applied

  @Prop()
  originalAmount?: number; // Amount before conversion

  @Prop()
  originalCurrency?: string;
}

@Schema({ _id: false })
export class AccountSnapshot {
  @Prop({ required: true })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  accountNumber: string;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true })
  availableBalanceAfter: number;

  @Prop({ required: true })
  pendingBalanceAfter: number;

  @Prop({ required: true })
  version: number; // For optimistic locking check
}

@Schema({ _id: false })
export class LedgerReference {
  @Prop({ required: true })
  type: string; // 'Booking', 'Payout', 'SplitPayment', etc.

  @Prop({ required: true, type: Types.ObjectId, refPath: 'type' })
  id: Types.ObjectId;

  @Prop()
  code?: string; // External reference code

  @Prop()
  description?: string;
}

@Schema({ timestamps: true, collection: 'account_ledger' })
export class AccountLedger {
  // Unique transaction ID for idempotency
  @Prop({ required: true })
  transactionId: string;

  // Double-entry accounts
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  debitAccountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  creditAccountId: Types.ObjectId;

  // Entry type and status
  @Prop({ required: true, enum: LedgerEntryType })
  entryType: LedgerEntryType;

  @Prop({ required: true, enum: LedgerStatus, default: LedgerStatus.PENDING })
  status: LedgerStatus;

  // Amount details
  @Prop({ type: LedgerAmount, required: true })
  amount: LedgerAmount;

  // Account snapshots for audit trail
  @Prop({ type: AccountSnapshot, required: true })
  debitSnapshot: AccountSnapshot;

  @Prop({ type: AccountSnapshot, required: true })
  creditSnapshot: AccountSnapshot;

  // Reference to source
  @Prop({ type: LedgerReference })
  reference?: LedgerReference;

  // Business metadata
  @Prop({ required: true })
  description: string;

  @Prop()
  narrative?: string; // Detailed explanation

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Processing information
  @Prop()
  processedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  // Reversal information
  @Prop()
  reversedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reversedBy?: Types.ObjectId;

  @Prop()
  reversalReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'AccountLedger' })
  reversalOfId?: Types.ObjectId; // If this reverses another entry

  @Prop({ type: Types.ObjectId, ref: 'AccountLedger' })
  reversedById?: Types.ObjectId; // Entry that reverses this one

  // Compliance and audit
  @Prop()
  taxYear?: number;

  @Prop()
  taxPeriod?: string;

  @Prop({ default: false })
  requiresReview: boolean;

  @Prop()
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  // Batch processing
  @Prop()
  batchId?: string;

  @Prop()
  sequenceInBatch?: number;

  // Settlement information
  @Prop()
  settlementDate?: Date;

  @Prop()
  settlementBatchId?: string;

  @Prop({ default: false })
  isSettled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AccountLedgerSchema = SchemaFactory.createForClass(AccountLedger);

// Indexes for performance
AccountLedgerSchema.index({ transactionId: 1 }, { unique: true });
AccountLedgerSchema.index({ debitAccountId: 1, createdAt: -1 });
AccountLedgerSchema.index({ creditAccountId: 1, createdAt: -1 });
AccountLedgerSchema.index({ status: 1, processedAt: 1 });
AccountLedgerSchema.index({ entryType: 1, status: 1 });
AccountLedgerSchema.index({ 'reference.type': 1, 'reference.id': 1 });
AccountLedgerSchema.index({ batchId: 1, sequenceInBatch: 1 });
AccountLedgerSchema.index({ settlementDate: 1, isSettled: 1 });
AccountLedgerSchema.index({ reversalOfId: 1 });
AccountLedgerSchema.index({ requiresReview: 1, reviewedAt: 1 });

// Compound indexes for common queries
AccountLedgerSchema.index({
  debitAccountId: 1,
  creditAccountId: 1,
  createdAt: -1,
});

AccountLedgerSchema.index({
  status: 1,
  entryType: 1,
  createdAt: -1,
});

// Text index for searching
AccountLedgerSchema.index({
  description: 'text',
  narrative: 'text',
  'reference.description': 'text',
});

// Virtuals for populated references
AccountLedgerSchema.virtual('debitAccount', {
  ref: 'Account',
  localField: 'debitAccountId',
  foreignField: '_id',
  justOne: true,
});

AccountLedgerSchema.virtual('creditAccount', {
  ref: 'Account',
  localField: 'creditAccountId',
  foreignField: '_id',
  justOne: true,
});

AccountLedgerSchema.virtual('reversal', {
  ref: 'AccountLedger',
  localField: 'reversedById',
  foreignField: '_id',
  justOne: true,
});

// Methods
AccountLedgerSchema.methods.isReversible = function (this: AccountLedgerDocument): boolean {
  return this.status === LedgerStatus.COMPLETED && !this.reversedById && !this.isSettled;
};

AccountLedgerSchema.methods.canProcess = function (this: AccountLedgerDocument): boolean {
  return this.status === LedgerStatus.PENDING;
};

// Pre-save validation
AccountLedgerSchema.pre('save', function (this: AccountLedgerDocument, next) {
  // Ensure debit and credit accounts are different
  if (this.debitAccountId.equals(this.creditAccountId)) {
    return next(new Error('Debit and credit accounts cannot be the same'));
  }

  // Validate amount is positive
  if (this.amount.amount <= 0) {
    return next(new Error('Ledger amount must be positive'));
  }

  // Ensure snapshots are consistent
  if (this.status === LedgerStatus.COMPLETED) {
    const debitDiff = this.debitSnapshot.balanceAfter - this.debitSnapshot.balanceBefore;
    const creditDiff = this.creditSnapshot.balanceAfter - this.creditSnapshot.balanceBefore;

    // For double-entry, debits should equal credits
    if (Math.abs(Math.abs(debitDiff) - Math.abs(creditDiff)) > 0.01) {
      return next(new Error('Double-entry validation failed: Debits do not equal credits'));
    }
  }

  next();
});

// Ensure virtual fields are serialized
AccountLedgerSchema.set('toJSON', { virtuals: true });
AccountLedgerSchema.set('toObject', { virtuals: true });
