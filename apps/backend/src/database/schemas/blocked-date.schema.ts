import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlockedDateDocument = BlockedDate & Document;

/**
 * BlockedDate Schema
 * Represents date ranges that are blocked for a property and unavailable for booking
 * Separate from bookings to allow hosts to manually block dates for maintenance, personal use, etc.
 */
@Schema({ timestamps: true, collection: 'blocked_dates' })
export class BlockedDate {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ required: true, maxlength: 500 })
  reason!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt!: Date;
  updatedAt!: Date;
}

export const BlockedDateSchema = SchemaFactory.createForClass(BlockedDate);

// Indexes for efficient querying
BlockedDateSchema.index({ propertyId: 1, startDate: 1, endDate: 1 });
BlockedDateSchema.index({ startDate: 1, endDate: 1 });

// Compound index for availability checks (similar to booking availability_check index)
BlockedDateSchema.index(
  {
    propertyId: 1,
    startDate: 1,
    endDate: 1,
  },
  {
    name: 'blocked_date_availability_check',
  },
);

// Virtual to populate property details
BlockedDateSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate creator details
BlockedDateSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

// Virtual to populate updater details
BlockedDateSchema.virtual('updater', {
  ref: 'User',
  localField: 'updatedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
BlockedDateSchema.set('toJSON', { virtuals: true });
BlockedDateSchema.set('toObject', { virtuals: true });

// Pre-save validation to ensure endDate is after startDate
BlockedDateSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});
