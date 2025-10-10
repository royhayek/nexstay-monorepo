import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PaymentProvider,
  PaymentTransactionStatus,
  CurrencyCode,
} from '../../common/enums/payment.enums';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ _id: false })
export class TransactionAmount {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, type: String, enum: CurrencyCode })
  currency: CurrencyCode;
}

@Schema({ timestamps: true, collection: 'payment_transactions' })
export class PaymentTransaction {
  @Prop({ type: Types.ObjectId, ref: 'PaymentIntent', required: true })
  paymentIntentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: TransactionAmount, required: true })
  amount: TransactionAmount;

  @Prop({ required: true, type: String, enum: PaymentTransactionStatus })
  status: PaymentTransactionStatus;

  @Prop({ required: true, type: String, enum: PaymentProvider })
  provider: PaymentProvider;

  @Prop()
  providerTransactionId?: string;

  @Prop({ type: Object, default: {} })
  providerResponse: Record<string, any>;

  @Prop()
  paymentMethodId?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  failureCode?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Refund information
  @Prop({ min: 0 })
  refundAmount?: number;

  @Prop()
  refundDate?: Date;

  @Prop()
  refundReason?: string;

  @Prop()
  providerRefundId?: string;

  // Fee information
  @Prop({ min: 0 })
  processingFee?: number;

  @Prop()
  netAmount?: number;

  // Risk assessment
  @Prop()
  riskScore?: number;

  @Prop()
  riskLevel?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentTransactionSchema = SchemaFactory.createForClass(PaymentTransaction);

// Virtual fields for payment transaction relationships
PaymentTransactionSchema.virtual('paymentIntent', {
  ref: 'PaymentIntent',
  localField: 'paymentIntentId',
  foreignField: '_id',
  justOne: true,
});

PaymentTransactionSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

PaymentTransactionSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
PaymentTransactionSchema.set('toJSON', { virtuals: true });
PaymentTransactionSchema.set('toObject', { virtuals: true });

// Indexes
PaymentTransactionSchema.index({ paymentIntentId: 1 });
PaymentTransactionSchema.index({ customerId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ bookingId: 1 });
PaymentTransactionSchema.index({ provider: 1, status: 1 });
PaymentTransactionSchema.index({ providerTransactionId: 1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });
PaymentTransactionSchema.index({ 'amount.currency': 1, createdAt: -1 });
