import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import { Document, Types, Model } from 'mongoose';
import { InvoiceStatus, CurrencyCode } from '../../common/enums/payment.enums';

export type InvoiceDocument = Invoice & Document;

@Schema({ _id: false })
export class InvoiceAddress {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({
    type: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  })
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

@Schema({ _id: false })
export class InvoiceLineItem {
  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

@Schema({ _id: false })
export class InvoiceTax {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0, max: 100 })
  rate: number;

  @Prop({ required: true, min: 0 })
  amount: number;
}

@Schema({ _id: false })
export class InvoiceDiscount {
  @Prop({ required: true, type: String, enum: ['percentage', 'fixed'] })
  type: 'percentage' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  description?: string;
}

@Schema({ _id: false })
export class InvoicePricing {
  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ type: [InvoiceDiscount], default: [] })
  discounts: InvoiceDiscount[];

  @Prop({ type: [InvoiceTax], default: [] })
  taxes: InvoiceTax[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, type: String, enum: CurrencyCode })
  currency: CurrencyCode;
}

@Schema({ _id: false })
export class InvoicePaymentInfo {
  @Prop({ type: Types.ObjectId, ref: 'PaymentIntent' })
  paymentIntentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PaymentTransaction' })
  transactionId?: Types.ObjectId;

  @Prop({ min: 0 })
  paidAmount?: number;

  @Prop()
  paidAt?: Date;

  @Prop()
  paymentMethod?: string;

  @Prop()
  paymentProvider?: string;
}

@Schema({ timestamps: true, collection: 'invoices' })
export class Invoice {
  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  bookingId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ type: InvoiceAddress, required: true })
  fromAddress: InvoiceAddress;

  @Prop({ type: InvoiceAddress, required: true })
  toAddress: InvoiceAddress;

  @Prop({ type: [InvoiceLineItem], required: true })
  lineItems: InvoiceLineItem[];

  @Prop({ type: InvoicePricing, required: true })
  pricing: InvoicePricing;

  @Prop({ required: true, type: String, enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop()
  notes?: string;

  @Prop()
  dueDate?: Date;

  @Prop()
  sentAt?: Date;

  @Prop({ type: InvoicePaymentInfo })
  paymentInfo?: InvoicePaymentInfo;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Template and customization
  @Prop({ default: 'default' })
  template: string;

  @Prop({ type: Object, default: {} })
  customFields: Record<string, any>;

  // Tracking
  @Prop({ default: 0 })
  viewCount: number;

  @Prop()
  lastViewedAt?: Date;

  // Email tracking
  @Prop({ default: false })
  emailSent: boolean;

  @Prop()
  emailSentAt?: Date;

  @Prop()
  emailSentTo?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Pre-save middleware to generate invoice number
InvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const date = DateUtils.parseDate(Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthStart = DateUtils.startOfMonth(date);
    const monthEnd = DateUtils.endOfMonth(date);
    const count = await (this.constructor as Model<InvoiceDocument>).countDocuments({
      createdAt: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    });
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual fields for invoice relationships
InvoiceSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('paymentIntent', {
  ref: 'PaymentIntent',
  localField: 'paymentInfo.paymentIntentId',
  foreignField: '_id',
  justOne: true,
});

InvoiceSchema.virtual('transaction', {
  ref: 'PaymentTransaction',
  localField: 'paymentInfo.transactionId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
InvoiceSchema.set('toJSON', { virtuals: true });
InvoiceSchema.set('toObject', { virtuals: true });

// Indexes
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ bookingId: 1 });
InvoiceSchema.index({ customerId: 1, createdAt: -1 });
InvoiceSchema.index({ status: 1, createdAt: -1 });
InvoiceSchema.index({ 'pricing.currency': 1, createdAt: -1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });
InvoiceSchema.index({ 'fromAddress.email': 1 });
InvoiceSchema.index({ 'toAddress.email': 1 });
