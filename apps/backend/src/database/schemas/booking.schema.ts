import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BookingStatus, PaymentStatus } from '../../common/enums/booking.enums';
import { PayoutStatus } from '../../common/enums/payout.enums';

export type BookingDocument = Booking & Document;

@Schema({ _id: false })
export class BookingPricing {
  @Prop({ required: true })
  baseAmount: number;

  @Prop({ default: 0 })
  cleaningFee: number;

  @Prop({ default: 0 })
  serviceFee: number;

  @Prop({ default: 0 })
  occupancyTaxes: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;
}

@Schema({ _id: false })
export class GuestInfo {
  @Prop({ required: true, min: 1 })
  adults: number;

  @Prop({ default: 0, min: 0 })
  children: number;

  @Prop({ default: 0, min: 0 })
  infants: number;

  @Prop({ required: true, min: 1 })
  totalGuests: number;
}

@Schema({ _id: false })
export class BaseAmountBreakdown {
  @Prop({ required: true })
  nightlyRate: number;

  @Prop({ required: true })
  numberOfNights: number;

  @Prop({ required: true })
  subtotal: number;

  @Prop()
  weeklyDiscount?: number;

  @Prop()
  monthlyDiscount?: number;

  @Prop({ required: true })
  finalBaseAmount: number;
}

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  // Dates
  @Prop({ required: true })
  checkIn: Date;

  @Prop({ required: true })
  checkOut: Date;

  @Prop({ required: true, min: 1 })
  nights: number;

  // Guests
  @Prop({ type: GuestInfo, required: true })
  guests: GuestInfo;

  // Pricing
  @Prop({ type: BookingPricing, required: true })
  pricing: BookingPricing;

  // Status
  @Prop({ required: true, type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ required: true, type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  // Special Requests
  @Prop()
  specialRequests?: string;

  @Prop()
  estimatedArrivalTime?: string;

  // Guest Contact Info (for host)
  @Prop()
  guestPhone?: string;

  @Prop()
  guestEmail?: string;

  // Confirmation & Tracking
  @Prop()
  confirmationCode?: string;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledBy?: Types.ObjectId;

  // Review tracking
  @Prop({ default: false })
  guestReviewed: boolean;

  @Prop({ default: false })
  hostReviewed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  guestReviewId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Review' })
  hostReviewId?: Types.ObjectId;

  // Payment tracking
  @Prop()
  paymentIntentId?: string;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundDate?: Date;

  // Payout tracking
  @Prop({ type: String, enum: PayoutStatus, default: PayoutStatus.PENDING })
  payoutStatus?: PayoutStatus;

  // Multi-currency support
  @Prop()
  exchangeRate?: number;

  @Prop()
  originalCurrency?: string;

  @Prop()
  originalAmount?: number;

  // Payment plan options
  @Prop({ default: false })
  hasInstallmentPlan: boolean;

  @Prop({ default: 1 })
  totalInstallments: number;

  @Prop()
  nextInstallmentDue?: Date;

  @Prop({ default: 0 })
  paidInstallments: number;

  @Prop({ default: 0 })
  remainingAmount: number;

  // Security deposit
  @Prop({ default: false })
  hasSecurityDeposit: boolean;

  @Prop()
  securityDepositAmount?: number;

  @Prop()
  securityDepositCurrency?: string;

  @Prop()
  securityDepositStatus?: string; // 'pending', 'held', 'released', 'claimed'

  // Enhanced pricing breakdown
  @Prop({ type: BaseAmountBreakdown })
  baseAmountBreakdown?: BaseAmountBreakdown;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Virtual fields for cleaner API responses
BookingSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

BookingSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true,
});

BookingSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

BookingSchema.virtual('guestReview', {
  ref: 'Review',
  localField: 'guestReviewId',
  foreignField: '_id',
  justOne: true,
});

BookingSchema.virtual('hostReview', {
  ref: 'Review',
  localField: 'hostReviewId',
  foreignField: '_id',
  justOne: true,
});

BookingSchema.virtual('installments', {
  ref: 'BookingInstallment',
  localField: '_id',
  foreignField: 'bookingId',
});

BookingSchema.virtual('securityDeposit', {
  ref: 'SecurityDeposit',
  localField: '_id',
  foreignField: 'bookingId',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
BookingSchema.set('toJSON', { virtuals: true });
BookingSchema.set('toObject', { virtuals: true });

// Indexes
BookingSchema.index({ propertyId: 1 });
BookingSchema.index({ guestId: 1, createdAt: -1 });
BookingSchema.index({ hostId: 1, createdAt: -1 });
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ paymentStatus: 1 });
BookingSchema.index({ confirmationCode: 1 });
BookingSchema.index(
  {
    propertyId: 1,
    checkIn: 1,
    checkOut: 1,
    status: 1,
  },
  {
    name: 'availability_check',
  },
);
