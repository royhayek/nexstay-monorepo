import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxType, TaxApplicability } from '../../common/enums/tax.enums';

export type TaxCalculationDocument = TaxCalculation & Document;

@Schema({ timestamps: true, collection: 'tax_calculations' })
export class TaxCalculation {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Booking' })
  bookingId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Property' })
  propertyId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  guestId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  hostId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  subtotalAmount: number;

  @Prop({ required: true, min: 0 })
  totalTaxAmount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, trim: true, maxlength: 3 })
  currency: string;

  @Prop([
    {
      taxRateId: { type: Types.ObjectId, ref: 'TaxRate', required: true },
      jurisdictionId: { type: Types.ObjectId, ref: 'TaxJurisdiction', required: true },
      taxType: { type: String, enum: Object.values(TaxType), required: true },
      taxName: { type: String, required: true, maxlength: 100 },
      applicability: { type: String, enum: Object.values(TaxApplicability), required: true },
      calculationMethod: { type: String, required: true },
      baseAmount: { type: Number, required: true, min: 0 },
      rate: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0 },
      isExempted: { type: Boolean, default: false },
      exemptionReason: { type: String, maxlength: 200 },
      metadata: { type: Object },
    },
  ])
  taxBreakdown: Array<{
    taxRateId: Types.ObjectId;
    jurisdictionId: Types.ObjectId;
    taxType: TaxType;
    taxName: string;
    applicability: TaxApplicability;
    calculationMethod: string;
    baseAmount: number;
    rate: number;
    taxAmount: number;
    isExempted: boolean;
    exemptionReason?: string;
    metadata?: Record<string, any>;
  }>;

  @Prop({ required: true, type: Date })
  calculationDate: Date;

  @Prop({ type: Date })
  checkInDate: Date;

  @Prop({ type: Date })
  checkOutDate: Date;

  @Prop({ required: true, min: 1 })
  numberOfNights: number;

  @Prop({ required: true, min: 1 })
  numberOfGuests: number;

  @Prop({
    type: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      postalCode: { type: String },
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    },
    required: true,
  })
  propertyLocation: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  @Prop({ type: Object })
  exemptionDetails?: {
    isExempt: boolean;
    exemptionType?: string;
    exemptionCertificate?: string;
    exemptionAmount?: number;
    reason?: string;
  };

  @Prop({ type: Object })
  complianceData?: {
    vatNumber?: string;
    businessLicense?: string;
    taxRegistrationNumber?: string;
    remittanceStatus?: string;
    reportingPeriod?: string;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const TaxCalculationSchema = SchemaFactory.createForClass(TaxCalculation);

// Virtual fields for tax calculation relationships
TaxCalculationSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

TaxCalculationSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

TaxCalculationSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true,
});

TaxCalculationSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
TaxCalculationSchema.set('toJSON', { virtuals: true });
TaxCalculationSchema.set('toObject', { virtuals: true });

// Indexes
TaxCalculationSchema.index({ bookingId: 1 }, { unique: true });
TaxCalculationSchema.index({ propertyId: 1, calculationDate: -1 });
TaxCalculationSchema.index({ guestId: 1, calculationDate: -1 });
TaxCalculationSchema.index({ hostId: 1, calculationDate: -1 });
TaxCalculationSchema.index({ 'taxBreakdown.jurisdictionId': 1, calculationDate: -1 });
TaxCalculationSchema.index({ 'taxBreakdown.taxType': 1, calculationDate: -1 });
