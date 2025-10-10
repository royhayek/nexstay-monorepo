import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentProvider } from '../../common/enums/payment.enums';

export type PaymentCustomerDocument = PaymentCustomer & Document;

@Schema({ timestamps: true, collection: 'payment_customers' })
export class PaymentCustomer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, type: String, enum: PaymentProvider })
  provider: PaymentProvider;

  @Prop({ required: true })
  providerCustomerId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Object, default: {} })
  providerData: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentCustomerSchema = SchemaFactory.createForClass(PaymentCustomer);

// Indexes
PaymentCustomerSchema.index({ userId: 1, provider: 1 }, { unique: true });
PaymentCustomerSchema.index({ providerCustomerId: 1, provider: 1 }, { unique: true });
PaymentCustomerSchema.index({ email: 1 });
PaymentCustomerSchema.index({ provider: 1, isActive: 1 });
