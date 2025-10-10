import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxJurisdictionLevel, TaxStatus } from '../../common/enums/tax.enums';

export type TaxJurisdictionDocument = TaxJurisdiction & Document;

@Schema({ timestamps: true, collection: 'tax_jurisdictions' })
export class TaxJurisdiction {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 10 })
  code: string;

  @Prop({ required: true, type: String, enum: TaxJurisdictionLevel })
  level: TaxJurisdictionLevel;

  @Prop({ required: true, trim: true, maxlength: 3 })
  country: string;

  @Prop({ trim: true, maxlength: 100 })
  state?: string;

  @Prop({ trim: true, maxlength: 100 })
  city?: string;

  @Prop({ trim: true, maxlength: 20 })
  postalCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'TaxJurisdiction' })
  parentJurisdiction?: Types.ObjectId;

  @Prop({ required: true, type: String, enum: TaxStatus, default: TaxStatus.ACTIVE })
  status: TaxStatus;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ type: Date })
  effectiveFrom: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const TaxJurisdictionSchema = SchemaFactory.createForClass(TaxJurisdiction);

// Indexes
TaxJurisdictionSchema.index({ code: 1, level: 1 }, { unique: true });
TaxJurisdictionSchema.index({ country: 1, state: 1, city: 1 });
TaxJurisdictionSchema.index({ status: 1, effectiveFrom: 1, effectiveTo: 1 });
TaxJurisdictionSchema.index({ parentJurisdiction: 1 });
