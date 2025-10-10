import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  TaxType,
  TaxCalculationMethod,
  TaxApplicability,
  TaxStatus,
} from '../../common/enums/tax.enums';

export type TaxRateDocument = TaxRate & Document;

@Schema({ timestamps: true, collection: 'tax_rates' })
export class TaxRate {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, type: String, enum: TaxType })
  type: TaxType;

  @Prop({ required: true, type: Types.ObjectId, ref: 'TaxJurisdiction' })
  jurisdictionId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: TaxCalculationMethod })
  calculationMethod: TaxCalculationMethod;

  @Prop({ required: true, min: 0 })
  rate: number;

  @Prop({ min: 0 })
  minimumAmount?: number;

  @Prop({ min: 0 })
  maximumAmount?: number;

  @Prop({ min: 0 })
  fixedAmount?: number;

  @Prop({ required: true, type: String, enum: TaxApplicability })
  applicability: TaxApplicability;

  @Prop({ type: [String], default: [] })
  applicablePropertyTypes: string[];

  @Prop({ min: 1 })
  minimumStayDays?: number;

  @Prop({ min: 1 })
  maximumStayDays?: number;

  @Prop({ min: 0 })
  minimumBookingAmount?: number;

  @Prop({ min: 0 })
  maximumBookingAmount?: number;

  @Prop([
    {
      from: { type: Number, required: true },
      to: { type: Number },
      rate: { type: Number, required: true },
      fixedAmount: { type: Number },
    },
  ])
  progressiveRates?: Array<{
    from: number;
    to?: number;
    rate: number;
    fixedAmount?: number;
  }>;

  @Prop({ required: true, type: String, enum: TaxStatus, default: TaxStatus.ACTIVE })
  status: TaxStatus;

  @Prop({ required: true, type: Date })
  effectiveFrom: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  @Prop({ type: Number, min: 1, default: 1 })
  priority: number;

  @Prop({ type: Object })
  exemptionCriteria?: Record<string, any>;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ trim: true, maxlength: 20 })
  registrationNumber?: string;

  @Prop({ trim: true, maxlength: 100 })
  remittanceAccount?: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const TaxRateSchema = SchemaFactory.createForClass(TaxRate);

// Virtual fields for tax rate relationships
TaxRateSchema.virtual('jurisdiction', {
  ref: 'TaxJurisdiction',
  localField: 'jurisdictionId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
TaxRateSchema.set('toJSON', { virtuals: true });
TaxRateSchema.set('toObject', { virtuals: true });

// Indexes
TaxRateSchema.index({ jurisdictionId: 1, type: 1, effectiveFrom: 1, effectiveTo: 1 });
TaxRateSchema.index({ status: 1, effectiveFrom: 1, effectiveTo: 1 });
TaxRateSchema.index({ type: 1, applicability: 1 });
TaxRateSchema.index({ priority: 1, effectiveFrom: 1 });
