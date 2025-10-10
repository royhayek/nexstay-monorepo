import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SecurityDepositStatus, ClaimReason } from '../../common/enums/security-deposit.enums';

export type SecurityDepositDocument = SecurityDeposit & Document;

@Schema({ _id: false })
export class SecurityDepositAmount {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop()
  exchangeRate?: number; // Rate used if converted from property currency

  @Prop()
  originalAmount?: number; // Original amount in property currency

  @Prop()
  originalCurrency?: string; // Property's original currency
}

@Schema({ _id: false })
export class SecurityDepositClaim {
  @Prop({ required: true, type: String, enum: ClaimReason })
  reason: ClaimReason;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop([String])
  evidence: string[]; // URLs to uploaded evidence files

  @Prop({ required: true, default: Date.now })
  claimedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  claimedBy: Types.ObjectId;

  @Prop()
  guestResponse?: string;

  @Prop()
  adminDecision?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;
}

@Schema({ timestamps: true, collection: 'security_deposits' })
export class SecurityDeposit {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  // Deposit amounts
  @Prop({ type: SecurityDepositAmount, required: true })
  depositAmount: SecurityDepositAmount;

  @Prop({ type: SecurityDepositAmount })
  refundAmount?: SecurityDepositAmount;

  // Status tracking
  @Prop({
    required: true,
    type: String,
    enum: SecurityDepositStatus,
    default: SecurityDepositStatus.PENDING,
  })
  status: SecurityDepositStatus;

  // Payment references
  @Prop()
  holdPaymentIntentId?: string; // Payment intent for hold

  @Prop()
  refundPaymentIntentId?: string; // Payment intent for refund

  // Important dates
  @Prop()
  heldAt?: Date; // When deposit was successfully held

  @Prop()
  releaseScheduledAt?: Date; // When deposit should be auto-released

  @Prop()
  releasedAt?: Date; // When deposit was actually released

  @Prop()
  expiredAt?: Date; // When deposit hold expired

  // Claims and disputes
  @Prop([SecurityDepositClaim])
  claims: SecurityDepositClaim[];

  @Prop({ default: 0 })
  totalClaimedAmount: number;

  @Prop({ default: false })
  hasActiveClaims: boolean;

  @Prop({ default: false })
  requiresAdminReview: boolean;

  // Automatic release settings
  @Prop({ default: 14 }) // Days after checkout
  autoReleaseAfterDays: number;

  // Notes and communication
  @Prop()
  hostNotes?: string;

  @Prop()
  adminNotes?: string;

  // Audit trail
  @Prop()
  processedBy?: Types.ObjectId;

  @Prop()
  processedAt?: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const SecurityDepositSchema = SchemaFactory.createForClass(SecurityDeposit);

// Virtual relationships
SecurityDepositSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

SecurityDepositSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

SecurityDepositSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true,
});

SecurityDepositSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
SecurityDepositSchema.set('toJSON', { virtuals: true });
SecurityDepositSchema.set('toObject', { virtuals: true });

// Indexes for performance
SecurityDepositSchema.index({ bookingId: 1 }, { unique: true });
SecurityDepositSchema.index({ guestId: 1, status: 1 });
SecurityDepositSchema.index({ hostId: 1, status: 1 });
SecurityDepositSchema.index({ status: 1, releaseScheduledAt: 1 }); // For auto-release jobs
SecurityDepositSchema.index({ hasActiveClaims: 1, requiresAdminReview: 1 });
SecurityDepositSchema.index({ createdAt: -1 });
