import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CurrencyCode } from '../../common/enums/payment.enums';
import { PayoutStatus, PayoutType, PayoutProvider } from '../../common/enums/payout.enums';

export type PayoutDocument = Payout & Document;

@Schema({ _id: false })
export class PayoutAmount {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, type: String, enum: CurrencyCode })
  currency: CurrencyCode;
}

@Schema({ _id: false })
export class PayoutFeeBreakdown {
  @Prop({ required: true, min: 0 })
  platformFee: number;

  @Prop({ default: 0, min: 0 })
  processingFee: number;

  @Prop({ default: 0, min: 0 })
  withdrawalFee: number;

  @Prop({ default: 0, min: 0 })
  taxWithholding: number;

  @Prop({ required: true, min: 0 })
  totalFees: number;
}

@Schema({ _id: false })
export class PayoutBookingReference {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ required: true })
  bookingAmount: number;

  @Prop({ required: true })
  hostEarning: number;

  @Prop({ required: true })
  checkOutDate: Date;

  @Prop({ required: true })
  propertyName: string;
}

@Schema({ timestamps: true, collection: 'payouts' })
export class Payout {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PayoutMethod', required: true })
  payoutMethodId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: PayoutType })
  type: PayoutType;

  @Prop({ required: true, type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Prop({ type: PayoutAmount, required: true })
  grossAmount: PayoutAmount;

  @Prop({ type: PayoutFeeBreakdown, required: true })
  fees: PayoutFeeBreakdown;

  @Prop({ type: PayoutAmount, required: true })
  netAmount: PayoutAmount;

  @Prop({ type: [PayoutBookingReference], default: [] })
  bookings: PayoutBookingReference[];

  @Prop({ required: true, type: String, enum: PayoutProvider })
  provider: PayoutProvider;

  @Prop()
  externalTransactionId?: string;

  @Prop()
  providerPayoutId?: string;

  @Prop({ type: Object, default: {} })
  providerResponse: Record<string, any>;

  @Prop({ required: true })
  payoutDate: Date;

  @Prop()
  expectedArrival?: Date;

  @Prop()
  completedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  failureReason?: string;

  @Prop()
  failureCode?: string;

  @Prop({ default: 0, min: 0 })
  retryAttempts: number;

  @Prop()
  nextRetryAt?: Date;

  @Prop()
  reference: string;

  @Prop()
  description?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancelledReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

// Virtual fields for population
PayoutSchema.virtual('payoutMethod', {
  ref: 'PayoutMethod',
  localField: 'payoutMethodId',
  foreignField: '_id',
  justOne: true,
});

PayoutSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

PayoutSchema.virtual('cancelledByUser', {
  ref: 'User',
  localField: 'cancelledBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
PayoutSchema.set('toJSON', { virtuals: true });
PayoutSchema.set('toObject', { virtuals: true });

// Indexes
PayoutSchema.index({ hostId: 1, payoutDate: -1 });
PayoutSchema.index({ status: 1, payoutDate: 1 });
PayoutSchema.index({ reference: 1 }, { unique: true });
PayoutSchema.index({ 'bookings.bookingId': 1 });
PayoutSchema.index({ provider: 1, status: 1 });
PayoutSchema.index({ providerPayoutId: 1 });
PayoutSchema.index({ payoutDate: 1, status: 1 });
PayoutSchema.index({ 'grossAmount.currency': 1, createdAt: -1 });
