import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReviewType } from '../../common/enums/property.enums';

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  bookingId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: ReviewType })
  reviewType: ReviewType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reviewerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  revieweeId: Types.ObjectId;

  @Prop({ min: 1, max: 5 })
  overallRating?: number;

  @Prop({ min: 1, max: 5 })
  accuracy?: number;

  @Prop({ min: 1, max: 5 })
  communication?: number;

  @Prop({ min: 1, max: 5 })
  cleanliness?: number;

  @Prop({ min: 1, max: 5 })
  location?: number;

  @Prop({ min: 1, max: 5 })
  checkIn?: number;

  @Prop({ min: 1, max: 5 })
  value?: number;

  @Prop()
  publicReview?: string;

  @Prop()
  privateFeedback?: string;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: false })
  isReported: boolean;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop({ default: true })
  isApproved: boolean;

  @Prop({ default: false })
  isHidden: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId;

  @Prop()
  moderatedAt?: Date;

  @Prop()
  moderationReason?: string;

  // Host response (for guest reviews)
  @Prop()
  hostResponse?: string;

  @Prop()
  hostResponseDate?: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Virtual fields for cleaner API responses
ReviewSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'bookingId',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewerId',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('reviewee', {
  ref: 'User',
  localField: 'revieweeId',
  foreignField: '_id',
  justOne: true,
});

ReviewSchema.virtual('moderator', {
  ref: 'User',
  localField: 'moderatedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

// Indexes
ReviewSchema.index({ propertyId: 1, createdAt: -1 });
ReviewSchema.index({ reviewerId: 1, createdAt: -1 });
ReviewSchema.index({ revieweeId: 1, createdAt: -1 });
ReviewSchema.index({ bookingId: 1 });
ReviewSchema.index({ reviewType: 1 });
ReviewSchema.index({ overallRating: -1 });
ReviewSchema.index({ isPublished: 1 });
ReviewSchema.index(
  {
    bookingId: 1,
    reviewerId: 1,
    reviewType: 1,
  },
  {
    unique: true,
    name: 'unique_review_per_booking',
  },
);
