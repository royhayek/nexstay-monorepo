import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentProvider, PaymentMethodType } from '../../common/enums/payment.enums';

export type PaymentMethodDocument = PaymentMethod & Document;

@Schema({ timestamps: true, collection: 'payment_methods' })
export class PaymentMethod {
  @Prop({ type: Types.ObjectId, ref: 'PaymentCustomer', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: PaymentMethodType })
  type: PaymentMethodType;

  @Prop({ required: true, type: String, enum: PaymentProvider })
  provider: PaymentProvider;

  @Prop({ required: true })
  providerMethodId: string;

  @Prop({ type: Object, default: {} })
  details: Record<string, any>;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop()
  lastUsedAt?: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

// Indexes
PaymentMethodSchema.index({ customerId: 1, isActive: 1 });
PaymentMethodSchema.index({ provider: 1, providerMethodId: 1 }, { unique: true });
PaymentMethodSchema.index({ customerId: 1, isDefault: 1 });
PaymentMethodSchema.index({ type: 1, provider: 1 });
