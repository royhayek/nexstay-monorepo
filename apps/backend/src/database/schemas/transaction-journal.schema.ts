import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionJournalDocument = TransactionJournal & Document;

export enum JournalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum JournalType {
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  BOOKING_SPLIT = 'BOOKING_SPLIT',
  HOST_PAYOUT = 'HOST_PAYOUT',
  GUEST_REFUND = 'GUEST_REFUND',
  TAX_REMITTANCE = 'TAX_REMITTANCE',
  FEE_COLLECTION = 'FEE_COLLECTION',
  ADJUSTMENT = 'ADJUSTMENT',
  MONTH_END_CLOSE = 'MONTH_END_CLOSE',
}

@Schema({ _id: false })
export class JournalEntry {
  @Prop({ required: true })
  sequenceNumber: number;

  @Prop({ type: Types.ObjectId, ref: 'AccountLedger', required: true })
  ledgerEntryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  debitAccountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  creditAccountId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  description: string;

  @Prop({ default: 'PENDING' })
  status: string;

  @Prop()
  processedAt?: Date;

  @Prop()
  failureReason?: string;
}

@Schema({ _id: false })
export class JournalValidation {
  @Prop({ required: true, default: false })
  balanceValidated: boolean;

  @Prop({ required: true, default: false })
  doubleEntryValidated: boolean;

  @Prop({ required: true, default: false })
  sequenceValidated: boolean;

  @Prop({ required: true, default: false })
  amountValidated: boolean;

  @Prop()
  validatedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy?: Types.ObjectId;

  @Prop()
  validationErrors?: string[];
}

/**
 * Transaction Journal - Groups multiple ledger entries as one atomic transaction
 * Ensures ACID properties for complex multi-account transactions
 */
@Schema({ timestamps: true, collection: 'transaction_journals' })
export class TransactionJournal {
  // Unique identifier for idempotency
  @Prop({ required: true, unique: true })
  journalId: string;

  @Prop({ required: true, enum: JournalType })
  type: JournalType;

  @Prop({ required: true, enum: JournalStatus, default: JournalStatus.DRAFT })
  status: JournalStatus;

  // Reference to the business object
  @Prop()
  referenceType?: string; // 'Booking', 'Payout', etc.

  @Prop({ type: Types.ObjectId, refPath: 'referenceType' })
  referenceId?: Types.ObjectId;

  @Prop()
  referenceCode?: string;

  // Journal entries
  @Prop({ type: [JournalEntry], required: true })
  entries: JournalEntry[];

  // Summary
  @Prop({ required: true })
  totalDebits: number;

  @Prop({ required: true })
  totalCredits: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  entryCount: number;

  // Validation
  @Prop({ type: JournalValidation, required: true })
  validation: JournalValidation;

  // Business metadata
  @Prop({ required: true })
  description: string;

  @Prop()
  narrative?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Processing information
  @Prop()
  processedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  lastRetryAt?: Date;

  // Reversal information
  @Prop()
  reversedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reversedBy?: Types.ObjectId;

  @Prop()
  reversalReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'TransactionJournal' })
  reversalOfId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TransactionJournal' })
  reversedById?: Types.ObjectId;

  // Approval workflow
  @Prop({ default: false })
  requiresApproval: boolean;

  @Prop()
  approvalThreshold?: number;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  rejectedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  rejectedBy?: Types.ObjectId;

  @Prop()
  rejectionReason?: string;

  // Audit trail
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  source?: string; // 'API', 'ADMIN', 'SYSTEM', 'CRON'

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  // Period tracking for accounting
  @Prop()
  accountingPeriod?: string; // '2024-01'

  @Prop()
  fiscalYear?: number;

  @Prop()
  fiscalQuarter?: number;

  // Lock for concurrent processing
  @Prop()
  lockedAt?: Date;

  @Prop()
  lockedBy?: string; // Process ID or worker ID

  @Prop({ default: 0 })
  version: number; // Optimistic locking

  createdAt: Date;
  updatedAt: Date;
}

export const TransactionJournalSchema = SchemaFactory.createForClass(TransactionJournal);

// Indexes
TransactionJournalSchema.index({ journalId: 1 }, { unique: true });
TransactionJournalSchema.index({ type: 1, status: 1 });
TransactionJournalSchema.index({ referenceType: 1, referenceId: 1 });
TransactionJournalSchema.index({ status: 1, processedAt: 1 });
TransactionJournalSchema.index({ requiresApproval: 1, approvedAt: 1 });
TransactionJournalSchema.index({ accountingPeriod: 1, status: 1 });
TransactionJournalSchema.index({ createdAt: -1 });
TransactionJournalSchema.index({ 'entries.ledgerEntryId': 1 });

// Compound indexes
TransactionJournalSchema.index({
  status: 1,
  requiresApproval: 1,
  totalDebits: 1,
});

// Methods
TransactionJournalSchema.methods.isBalanced = function (this: TransactionJournalDocument): boolean {
  return Math.abs(this.totalDebits - this.totalCredits) < 0.01;
};

TransactionJournalSchema.methods.canProcess = function (this: TransactionJournalDocument): boolean {
  const isBalanced = Math.abs(this.totalDebits - this.totalCredits) < 0.01;
  return (
    this.status === JournalStatus.PENDING &&
    isBalanced &&
    (!this.requiresApproval || Boolean(this.approvedAt))
  );
};

TransactionJournalSchema.methods.canReverse = function (this: TransactionJournalDocument): boolean {
  return this.status === JournalStatus.COMPLETED && !this.reversedById;
};

// Pre-save validation
TransactionJournalSchema.pre('save', function (this: TransactionJournalDocument, next) {
  // Calculate totals
  this.totalDebits = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  this.totalCredits = this.entries.reduce((sum, entry) => sum + entry.amount, 0);
  this.entryCount = this.entries.length;

  // Validate double-entry bookkeeping
  if (Math.abs(this.totalDebits - this.totalCredits) > 0.01) {
    this.validation.doubleEntryValidated = false;
    this.validation.validationErrors = this.validation.validationErrors || [];
    this.validation.validationErrors.push('Journal is not balanced: Debits do not equal Credits');
  } else {
    this.validation.doubleEntryValidated = true;
  }

  // Validate amount
  if (this.totalDebits <= 0) {
    this.validation.amountValidated = false;
    this.validation.validationErrors = this.validation.validationErrors || [];
    this.validation.validationErrors.push('Journal total must be positive');
  } else {
    this.validation.amountValidated = true;
  }

  // Check for approval requirement based on amount
  if (this.totalDebits > (this.approvalThreshold || 10000)) {
    this.requiresApproval = true;
  }

  next();
});

// Virtual fields
TransactionJournalSchema.virtual('ledgerEntries', {
  ref: 'AccountLedger',
  localField: 'entries.ledgerEntryId',
  foreignField: '_id',
});

// Ensure virtual fields are serialized
TransactionJournalSchema.set('toJSON', { virtuals: true });
TransactionJournalSchema.set('toObject', { virtuals: true });
