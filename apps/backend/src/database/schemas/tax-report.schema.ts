import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaxReportingPeriod, TaxComplianceStatus } from '../../common/enums/tax.enums';

export type TaxReportDocument = TaxReport & Document;

@Schema({ timestamps: true, collection: 'tax_reports' })
export class TaxReport {
  @Prop({ required: true, trim: true, maxlength: 100 })
  reportId: string;

  @Prop({ required: true, type: String, enum: TaxReportingPeriod })
  reportingPeriod: TaxReportingPeriod;

  @Prop({ required: true, type: Date })
  periodStart: Date;

  @Prop({ required: true, type: Date })
  periodEnd: Date;

  @Prop({ required: true, type: Types.ObjectId, ref: 'TaxJurisdiction' })
  jurisdictionId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  totalTaxCollected: number;

  @Prop({ required: true, min: 0 })
  totalTaxRemitted: number;

  @Prop({ required: true, min: 0 })
  totalTaxOwed: number;

  @Prop({ required: true, trim: true, maxlength: 3 })
  currency: string;

  @Prop([
    {
      taxType: { type: String, required: true },
      taxCollected: { type: Number, required: true, min: 0 },
      taxRemitted: { type: Number, required: true, min: 0 },
      taxOwed: { type: Number, required: true, min: 0 },
      numberOfBookings: { type: Number, required: true, min: 0 },
      averageTaxRate: { type: Number, required: true, min: 0 },
    },
  ])
  taxBreakdown: Array<{
    taxType: string;
    taxCollected: number;
    taxRemitted: number;
    taxOwed: number;
    numberOfBookings: number;
    averageTaxRate: number;
  }>;

  @Prop({ required: true, min: 0 })
  numberOfBookings: number;

  @Prop({ required: true, min: 0 })
  numberOfProperties: number;

  @Prop({ required: true, min: 0 })
  numberOfHosts: number;

  @Prop({ required: true, type: String, enum: TaxComplianceStatus })
  complianceStatus: TaxComplianceStatus;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  dueDate: Date;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop({
    type: {
      fileName: { type: String, maxlength: 255 },
      fileSize: { type: Number, min: 0 },
      mimeType: { type: String, maxlength: 100 },
      s3Key: { type: String, maxlength: 500 },
      downloadUrl: { type: String, maxlength: 500 },
      generatedAt: { type: Date },
    },
  })
  reportFile?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    downloadUrl: string;
    generatedAt: Date;
  };

  @Prop([
    {
      paymentDate: { type: Date, required: true },
      amount: { type: Number, required: true, min: 0 },
      paymentMethod: { type: String, required: true, maxlength: 50 },
      transactionId: { type: String, maxlength: 100 },
      reference: { type: String, maxlength: 100 },
      status: { type: String, required: true, maxlength: 20 },
    },
  ])
  remittanceHistory: Array<{
    paymentDate: Date;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    reference?: string;
    status: string;
  }>;

  @Prop({ type: Object })
  auditTrail?: {
    createdBy: Types.ObjectId;
    modifiedBy?: Types.ObjectId;
    submittedBy?: Types.ObjectId;
    reviewedBy?: Types.ObjectId;
    actions: Array<{
      action: string;
      performedBy: Types.ObjectId;
      performedAt: Date;
      details?: string;
    }>;
  };

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ trim: true, maxlength: 1000 })
  notes?: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const TaxReportSchema = SchemaFactory.createForClass(TaxReport);

// Indexes
TaxReportSchema.index({ reportId: 1 }, { unique: true });
TaxReportSchema.index({ jurisdictionId: 1, reportingPeriod: 1, periodStart: 1, periodEnd: 1 });
TaxReportSchema.index({ complianceStatus: 1, dueDate: 1 });
TaxReportSchema.index({ submittedAt: 1 });
TaxReportSchema.index({ periodStart: 1, periodEnd: 1 });
