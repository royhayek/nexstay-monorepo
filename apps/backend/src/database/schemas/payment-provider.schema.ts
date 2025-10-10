import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type PaymentProviderDocument = PaymentProvider & Document;

@Schema({ timestamps: true, collection: 'payment_providers' })
export class PaymentProvider extends BaseCatalog {
  @Prop({ default: false })
  isEnabled: boolean;

  @Prop({ type: [String] })
  supportedRegions?: string[];

  @Prop({ type: Object })
  fees?: Record<string, any>;

  @Prop({ type: Object, select: false })
  credentials?: Record<string, any>;

  @Prop({ type: [String] })
  supportedMethods?: string[];
}

export const PaymentProviderSchema = SchemaFactory.createForClass(PaymentProvider);
