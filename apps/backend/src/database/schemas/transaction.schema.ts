import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface TransactionDocument extends Transaction, Document {
  isProcessable(): boolean;
  isEscrowRelease(): boolean;
  canBeProcessed(): boolean;
  canBeReleased(): boolean;
}

export enum TransactionType {
  BOOKING_PAYMENT = 'BOOKING_PAYMENT', // Guest pays for booking
  ESCROW_RELEASE = 'ESCROW_RELEASE', // Release to host after check-in
  PLATFORM_FEE = 'PLATFORM_FEE', // Platform fee collection
  HOST_PAYOUT = 'HOST_PAYOUT', // Payout to host's bank
  REFUND = 'REFUND', // Refund to guest
  SECURITY_DEPOSIT = 'SECURITY_DEPOSIT', // Hold/release security deposit
  FAST_PAY_FEE = 'FAST_PAY_FEE', // Fast Pay processing fee
  TRANSFER = 'TRANSFER', // General transfer between accounts
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RefundType {
  FULL_REFUND = 'FULL_REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  HOST_PENALTY_REFUND = 'HOST_PENALTY_REFUND',
  DISPUTE_REFUND = 'DISPUTE_REFUND',
}

@Schema({ _id: false })
export class TransactionAmount {
  @Prop({ required: true })
  value: number; // Amount in smallest currency unit (cents)

  @Prop({ required: true, default: 'USD' })
  currency: string; // ISO 4217 code
}

@Schema({ _id: false })
export class TransactionReference {
  @Prop({ required: true })
  type: string; // 'Booking', 'Payout', 'SplitPayment', etc.

  @Prop({ required: true, type: Types.ObjectId })
  id: Types.ObjectId;

  @Prop()
  code?: string; // External reference code
}

@Schema({ _id: false })
export class TransactionMetadata {
  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  guestId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  hostId?: Types.ObjectId;

  @Prop()
  platformFeeRate?: number; // Platform fee percentage (e.g., 0.15 for 15%)

  @Prop()
  fastPayFee?: number; // Fast Pay fee amount

  @Prop({ enum: RefundType })
  refundType?: RefundType;

  @Prop()
  escrowReleaseDate?: Date; // When escrow should be released

  @Prop()
  payoutMethod?: 'STANDARD' | 'FAST_PAY';

  @Prop({ type: Object })
  additionalData?: Record<string, any>;
}

@Schema({ timestamps: true, collection: 'transactions' })
export class Transaction {
  @Prop({ required: true })
  transactionId: string; // Unique identifier for idempotency

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  fromAccountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  toAccountId: Types.ObjectId;

  @Prop({ type: TransactionAmount, required: true })
  amount: TransactionAmount;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @Prop({ required: true })
  description: string;

  @Prop()
  narrative?: string; // Detailed explanation for user-facing history

  @Prop({ type: TransactionReference })
  reference?: TransactionReference;

  @Prop({ type: TransactionMetadata })
  metadata?: TransactionMetadata;

  // Processing information
  @Prop()
  processedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy?: Types.ObjectId;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  // For escrow transactions
  @Prop()
  scheduledReleaseAt?: Date; // When this transaction should be processed

  // Balance snapshots for audit
  @Prop()
  fromAccountBalanceBefore?: number;

  @Prop()
  fromAccountBalanceAfter?: number;

  @Prop()
  toAccountBalanceBefore?: number;

  @Prop()
  toAccountBalanceAfter?: number;

  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Indexes for performance
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ fromAccountId: 1, createdAt: -1 });
TransactionSchema.index({ toAccountId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, scheduledReleaseAt: 1 });
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ 'reference.type': 1, 'reference.id': 1 });
TransactionSchema.index({ 'metadata.bookingId': 1 });

// Compound indexes for common queries
TransactionSchema.index({
  fromAccountId: 1,
  toAccountId: 1,
  status: 1,
  createdAt: -1,
});

// For escrow processing
TransactionSchema.index({
  status: 1,
  scheduledReleaseAt: 1,
  type: 1,
});

// User transaction history indexes already covered by main indexes above

// Virtual for populated references
TransactionSchema.virtual('fromAccount', {
  ref: 'Account',
  localField: 'fromAccountId',
  foreignField: '_id',
  justOne: true,
});

TransactionSchema.virtual('toAccount', {
  ref: 'Account',
  localField: 'toAccountId',
  foreignField: '_id',
  justOne: true,
});

// Methods
TransactionSchema.methods.isProcessable = function (this: TransactionDocument): boolean {
  return this.status === TransactionStatus.PENDING;
};

TransactionSchema.methods.isEscrowRelease = function (this: TransactionDocument): boolean {
  return this.type === TransactionType.ESCROW_RELEASE;
};

TransactionSchema.methods.canBeProcessed = function (this: TransactionDocument): boolean {
  if (this.status !== TransactionStatus.PENDING) return false;
  if (!this.scheduledReleaseAt) return true; // Process immediately
  return Date.now() >= this.scheduledReleaseAt.getTime(); // Process after scheduled time
};

TransactionSchema.methods.canBeReleased = function (this: TransactionDocument): boolean {
  // For escrow release: transaction must be COMPLETED (money in escrow) and release time must have passed
  if (this.status !== TransactionStatus.COMPLETED) return false;
  if (this.type !== TransactionType.BOOKING_PAYMENT) return false;
  if (!this.scheduledReleaseAt) return false; // Must have a scheduled release date
  if (!this.metadata?.hostId) return false; // Must have a host to release to
  return Date.now() >= this.scheduledReleaseAt.getTime(); // Release time must have passed
};

// Pre-save validation
TransactionSchema.pre('save', function (this: TransactionDocument, next) {
  // Ensure from and to accounts are different
  if (this.fromAccountId.equals(this.toAccountId)) {
    return next(new Error('From and to accounts cannot be the same'));
  }

  // Validate amount is positive
  if (this.amount.value <= 0) {
    return next(new Error('Transaction amount must be positive'));
  }

  // Generate transaction ID if not provided
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  next();
});

// Ensure virtual fields are serialized
TransactionSchema.set('toJSON', { virtuals: true });
TransactionSchema.set('toObject', { virtuals: true });
