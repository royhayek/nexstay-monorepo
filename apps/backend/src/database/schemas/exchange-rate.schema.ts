import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExchangeRateDocument = ExchangeRate & Document;

@Schema({ _id: false })
export class RateHistory {
  @Prop({ required: true })
  rate: number;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  source?: string; // 'manual', 'api', 'admin'
}

@Schema({ timestamps: true, collection: 'exchange_rates' })
export class ExchangeRate {
  @Prop({ required: true, uppercase: true, length: 3 })
  fromCurrency: string; // Base currency (e.g., 'USD')

  @Prop({ required: true, uppercase: true, length: 3 })
  toCurrency: string; // Target currency (e.g., 'LBP')

  @Prop({ required: true, min: 0 })
  rate: number; // Current exchange rate

  @Prop({ required: true, default: Date.now })
  lastUpdated: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isManual: boolean; // Manual rate vs API-fetched

  @Prop()
  source?: string; // Rate source (API provider, manual, etc.)

  @Prop([RateHistory])
  history: RateHistory[];

  // Metadata
  @Prop()
  createdBy?: Types.ObjectId;

  @Prop()
  updatedBy?: Types.ObjectId;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);

// Virtual fields for exchange rate relationships
ExchangeRateSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

ExchangeRateSchema.virtual('updater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
ExchangeRateSchema.set('toJSON', { virtuals: true });
ExchangeRateSchema.set('toObject', { virtuals: true });

// Unique compound index
ExchangeRateSchema.index({ fromCurrency: 1, toCurrency: 1 }, { unique: true });

// Query optimization indexes
ExchangeRateSchema.index({ isActive: 1, lastUpdated: -1 });
ExchangeRateSchema.index({ fromCurrency: 1, isActive: 1 });
