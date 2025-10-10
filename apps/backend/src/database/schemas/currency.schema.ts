import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type CurrencyDocument = Currency & Document;

@Schema({ timestamps: true, collection: 'currencies' })
export class Currency extends BaseCatalog {
  @Prop({ required: true, length: 3 })
  isoCode: string;

  @Prop({ required: true })
  symbol: string;

  @Prop({ default: 2 })
  decimalPlaces: number;

  @Prop({ default: true })
  isSupported: boolean;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);
