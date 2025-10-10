import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import { Document, Types } from 'mongoose';

export interface AccountDocument extends Account, Document {
  canDebit(amount: number): boolean;
  canCredit(amount: number): boolean;
  updateBalance(debitAmount?: number, creditAmount?: number): void;
}

/**
 * Account Types for Airbnb-style platform
 */
export enum AccountType {
  // User Accounts
  GUEST_WALLET = 'GUEST_WALLET', // Guest's balance for payments
  HOST_EARNINGS = 'HOST_EARNINGS', // Host's earnings account

  // Platform Accounts
  PLATFORM_CASH = 'PLATFORM_CASH', // Platform operational account
  PLATFORM_REVENUE = 'PLATFORM_REVENUE', // Platform fees

  // Specialized Accounts
  ESCROW = 'ESCROW', // Temporary holding for bookings (24h after check-in)
  GUEST_DEPOSIT = 'GUEST_DEPOSIT', // Security deposits
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  DORMANT = 'DORMANT',
  CLOSED = 'CLOSED',
}

export enum AccountOwnerType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
  EXTERNAL = 'EXTERNAL',
}

@Schema({ _id: false })
export class AccountBalance {
  @Prop({ required: true, default: 0 })
  available: number; // Available for immediate use

  @Prop({ required: true, default: 0 })
  pending: number; // In processing (payouts, etc.)

  @Prop({ required: true, default: 0 })
  escrowed: number; // Held in escrow until release (24h after check-in)

  @Prop({ required: true, default: 0 })
  total: number; // Sum of all balances
}

@Schema({ _id: false })
export class PayoutSettings {
  @Prop({ default: 'STANDARD' })
  payoutMethod: 'STANDARD' | 'FAST_PAY'; // Standard (1-7 days) or Fast Pay (30 mins)

  @Prop({ default: false })
  fastPayEnabled: boolean; // Fast Pay with 1.5% fee

  @Prop({ default: 0 })
  minimumPayoutAmount: number; // Minimum amount for payout

  @Prop({ type: Types.ObjectId, ref: 'PayoutMethod' })
  defaultPayoutMethodId?: Types.ObjectId;

  @Prop({ default: false })
  isNewHost: boolean; // New hosts have 30-day additional hold
}

@Schema({ timestamps: true, collection: 'accounts' })
export class Account {
  @Prop({ required: true, enum: AccountType })
  accountType: AccountType;

  @Prop({ required: true })
  accountNumber: string; // Unique identifier (e.g., "GUEST-000001", "HOST-000001")

  @Prop()
  accountName: string; // Human-readable name

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId?: Types.ObjectId; // User who owns this account (null for system accounts)

  @Prop({ required: true, enum: AccountOwnerType })
  ownerType: AccountOwnerType;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: AccountBalance, required: true })
  balance: AccountBalance;

  @Prop({ required: true, enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Prop({ type: PayoutSettings })
  payoutSettings?: PayoutSettings; // Only for HOST_EARNINGS accounts

  // Audit fields
  @Prop()
  lastActivityAt?: Date;

  @Prop({ default: 0 })
  transactionCount: number;

  // Security (simplified)
  @Prop()
  frozenAt?: Date;

  @Prop()
  frozenReason?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Version for optimistic locking
  @Prop({ default: 0 })
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

// Indexes for performance
AccountSchema.index({ accountType: 1, status: 1 });
AccountSchema.index({ ownerId: 1, accountType: 1 });
AccountSchema.index({ accountNumber: 1 }, { unique: true });
AccountSchema.index({ currency: 1, accountType: 1 });
AccountSchema.index({ 'balance.available': 1 });
AccountSchema.index({ lastActivityAt: -1 });

// Compound indexes for common queries
AccountSchema.index({
  accountType: 1,
  status: 1,
  'balance.available': 1,
});

// Virtual for owner population
AccountSchema.virtual('owner', {
  ref: 'User',
  localField: 'ownerId',
  foreignField: '_id',
  justOne: true,
});

// Methods
AccountSchema.methods.canDebit = function (this: AccountDocument, amount: number): boolean {
  return this.status === AccountStatus.ACTIVE && this.balance.available >= amount;
};

AccountSchema.methods.canCredit = function (this: AccountDocument, _amount: number): boolean {
  return this.status === AccountStatus.ACTIVE;
};

// Update balance with validation
AccountSchema.methods.updateBalance = function (
  this: AccountDocument,
  debitAmount: number = 0,
  creditAmount: number = 0,
): void {
  const assetAccounts = [
    AccountType.HOST_EARNINGS,
    AccountType.GUEST_WALLET,
    AccountType.PLATFORM_CASH,
  ];

  if (assetAccounts.includes(this.accountType)) {
    // Asset accounts: Debit increases, Credit decreases
    this.balance.available += debitAmount - creditAmount;
  } else {
    // Liability/Revenue accounts: Credit increases, Debit decreases
    this.balance.available += creditAmount - debitAmount;
  }

  this.balance.total = this.balance.available + this.balance.pending + this.balance.escrowed;
  this.lastActivityAt = DateUtils.parseDate(Date.now());
  this.version += 1;
};

// Pre-save middleware for balance validation
AccountSchema.pre('save', function (this: AccountDocument, next) {
  // Ensure balance total is accurate
  this.balance.total = this.balance.available + this.balance.pending + this.balance.escrowed;

  // Validate negative balances based on account type
  const liabilityAccounts = [AccountType.GUEST_DEPOSIT];
  if (liabilityAccounts.includes(this.accountType) && this.balance.available < 0) {
    // Liability accounts can have negative balances (we owe money)
    return next();
  } else if (this.balance.available < 0 && !this.metadata?.allowNegative) {
    return next(new Error(`Negative balance not allowed for account type ${this.accountType}`));
  }

  next();
});

// Ensure virtual fields are serialized
AccountSchema.set('toJSON', { virtuals: true });
AccountSchema.set('toObject', { virtuals: true });
