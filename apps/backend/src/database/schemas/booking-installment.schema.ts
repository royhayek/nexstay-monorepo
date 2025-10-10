import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import { Document, Types } from 'mongoose';
import { InstallmentStatus, InstallmentType } from '../../common/enums/installment.enums';

export type BookingInstallmentDocument = BookingInstallment & Document;

@Schema({ _id: false })
export class InstallmentAmount {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop()
  exchangeRate?: number;

  @Prop()
  originalAmount?: number;

  @Prop()
  originalCurrency?: string;
}

@Schema({ timestamps: true, collection: 'booking_installments' })
export class BookingInstallment {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId: Types.ObjectId;

  // Installment details
  @Prop({ required: true })
  installmentNumber: number; // 1, 2, 3, etc.

  @Prop({ required: true })
  totalInstallments: number; // Total planned installments

  @Prop({ required: true, type: String, enum: InstallmentType })
  type: InstallmentType; // 'initial', 'monthly', 'final', 'security_deposit'

  // Payment amounts
  @Prop({ type: InstallmentAmount, required: true })
  scheduledAmount: InstallmentAmount;

  @Prop({ type: InstallmentAmount })
  paidAmount?: InstallmentAmount;

  @Prop({ type: InstallmentAmount })
  failedAmount?: InstallmentAmount;

  // Status and timing
  @Prop({
    required: true,
    type: String,
    enum: InstallmentStatus,
    default: InstallmentStatus.SCHEDULED,
  })
  status: InstallmentStatus;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  retryAfter?: Date; // Next retry attempt for failed payments

  // Payment processing
  @Prop()
  paymentIntentId?: string;

  @Prop()
  paymentMethodId?: string;

  @Prop({ default: 0 })
  attemptCount: number; // Number of payment attempts

  @Prop({ default: 3 })
  maxRetryAttempts: number;

  // Notifications and reminders
  @Prop({ default: false })
  reminderSent: boolean;

  @Prop()
  reminderSentAt?: Date;

  @Prop({ default: false })
  failureNotificationSent: boolean;

  // Late payment handling
  @Prop({ default: false })
  isOverdue: boolean;

  @Prop()
  overdueGracePeriodDays: number; // Days after due date before penalties

  @Prop()
  lateFeeAmount?: number;

  @Prop({ default: false })
  lateFeeApplied: boolean;

  // Admin and processing
  @Prop()
  processedBy?: Types.ObjectId;

  @Prop()
  adminNotes?: string;

  @Prop()
  failureReason?: string;

  @Prop()
  retryStrategy?: string; // 'exponential', 'daily', 'weekly'

  // Booking relationship data (for quick access)
  @Prop()
  checkInDate?: Date;

  @Prop()
  checkOutDate?: Date;

  @Prop()
  bookingTotalAmount?: number;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const BookingInstallmentSchema = SchemaFactory.createForClass(BookingInstallment);

// Virtual relationships
BookingInstallmentSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

BookingInstallmentSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

BookingInstallmentSchema.virtual('guest', {
  ref: 'User',
  localField: 'guestId',
  foreignField: '_id',
  justOne: true,
});

BookingInstallmentSchema.virtual('host', {
  ref: 'User',
  localField: 'hostId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
BookingInstallmentSchema.set('toJSON', { virtuals: true });
BookingInstallmentSchema.set('toObject', { virtuals: true });

// Compound indexes for performance
BookingInstallmentSchema.index({ bookingId: 1, installmentNumber: 1 }, { unique: true });

BookingInstallmentSchema.index({ guestId: 1, status: 1, dueDate: 1 });
BookingInstallmentSchema.index({ status: 1, dueDate: 1 }); // For payment processing jobs
BookingInstallmentSchema.index({ status: 1, isOverdue: 1 }); // For overdue handling
BookingInstallmentSchema.index({ dueDate: 1, reminderSent: 1 }); // For reminder jobs
BookingInstallmentSchema.index({ failedAt: 1, retryAfter: 1 }); // For retry processing
BookingInstallmentSchema.index({ createdAt: -1 });

// Pre-save middleware to handle overdue status
BookingInstallmentSchema.pre('save', function (next) {
  const now = DateUtils.parseDate(Date.now());
  if (this.status === InstallmentStatus.SCHEDULED && this.dueDate < now) {
    this.isOverdue = true;
  }
  next();
});
