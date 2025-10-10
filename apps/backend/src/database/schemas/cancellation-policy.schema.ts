import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type CancellationPolicyDocument = CancellationPolicy & Document;

@Schema({ timestamps: true, collection: 'cancellation_policies' })
export class CancellationPolicy extends BaseCatalog {
  @Prop()
  gracePeriodHours?: number;

  @Prop()
  penaltyPercentage?: number;

  @Prop()
  advanceNoticeDays?: number;

  @Prop({ type: Object })
  rules?: Record<string, any>;
}

export const CancellationPolicySchema = SchemaFactory.createForClass(CancellationPolicy);
