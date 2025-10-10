import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PaymentProvider,
  PaymentIntentStatus,
  CurrencyCode,
} from '../../common/enums/payment.enums';

export type PaymentIntentDocument = PaymentIntent & Document;

@Schema({ _id: false })
export class PaymentAmount {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, type: String, enum: CurrencyCode })
  currency: CurrencyCode;
}

@Schema({ timestamps: true, collection: 'payment_intents' })
export class PaymentIntent {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: PaymentAmount, required: true })
  amount: PaymentAmount;

  @Prop({ required: true, type: String, enum: PaymentIntentStatus })
  status: PaymentIntentStatus;

  @Prop({ required: true, type: String, enum: PaymentProvider })
  provider: PaymentProvider;

  @Prop()
  providerIntentId?: string;

  @Prop()
  clientSecret?: string;

  @Prop()
  paymentMethodId?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  returnUrl?: string;

  @Prop()
  cancelUrl?: string;

  @Prop({ type: Object, default: {} })
  providerData: Record<string, any>;

  @Prop()
  failureReason?: string;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentIntentSchema = SchemaFactory.createForClass(PaymentIntent);

// Indexes
PaymentIntentSchema.index({ customerId: 1, createdAt: -1 });
PaymentIntentSchema.index({ bookingId: 1 });
PaymentIntentSchema.index({ provider: 1, status: 1 });
PaymentIntentSchema.index({ providerIntentId: 1 });
PaymentIntentSchema.index({ status: 1, createdAt: -1 });
