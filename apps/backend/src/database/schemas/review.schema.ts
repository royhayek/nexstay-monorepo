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

  // ========================================
  // ENHANCEMENT 1: Photo Upload Support
  // ========================================
  @Prop([
    {
      url: String,
      thumbnailUrl: String,
      originalFilename: String,
      size: Number,
      mimeType: String,
      uploadedAt: Date,
    },
  ])
  photos?: Array<{
    url: string;
    thumbnailUrl: string;
    originalFilename: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  }>;

  @Prop({ default: 0 })
  photoCount: number;

  // ========================================
  // ENHANCEMENT 2: Review Translation
  // ========================================
  @Prop({ type: String, enum: ['en', 'fr', 'ar'], default: 'en' })
  originalLanguage: string;

  @Prop({
    type: Map,
    of: {
      publicReview: String,
      translatedAt: Date,
      autoTranslated: Boolean,
    },
  })
  translations?: Map<
    string,
    {
      publicReview: string;
      translatedAt: Date;
      autoTranslated: boolean;
    }
  >;

  // ========================================
  // ENHANCEMENT 3: Sentiment Analysis
  // ========================================
  @Prop({
    type: {
      score: { type: Number, min: -1, max: 1 },
      label: { type: String, enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'] },
      confidence: { type: Number, min: 0, max: 1 },
      analyzedAt: Date,
    },
  })
  sentiment?: {
    score: number;
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
    confidence: number;
    analyzedAt: Date;
  };

  @Prop({ default: false })
  requiresManualReview: boolean;

  // ========================================
  // ENHANCEMENT 4: Helpful Voting System
  // ========================================
  @Prop([
    {
      userId: { type: Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['helpful', 'not_helpful'] },
      votedAt: Date,
    },
  ])
  votes?: Array<{
    userId: Types.ObjectId;
    vote: 'helpful' | 'not_helpful';
    votedAt: Date;
  }>;

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: 0 })
  notHelpfulCount: number;

  @Prop({ default: 0 })
  helpfulnessScore: number;

  // ========================================
  // ENHANCEMENT 5: Verified Stay Badges
  // ========================================
  @Prop({ default: false })
  isVerifiedStay: boolean;

  @Prop({
    type: {
      bookingVerified: Boolean,
      paymentVerified: Boolean,
      stayCompleted: Boolean,
      verifiedAt: Date,
      verificationMethod: { type: String, enum: ['auto', 'manual'] },
    },
  })
  verification?: {
    bookingVerified: boolean;
    paymentVerified: boolean;
    stayCompleted: boolean;
    verifiedAt: Date;
    verificationMethod: 'auto' | 'manual';
  };

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

// Enhancement indexes
ReviewSchema.index({ helpfulnessScore: -1 }); // Sort by helpfulness
ReviewSchema.index({ 'votes.userId': 1 }); // Check if user voted
ReviewSchema.index({ isVerifiedStay: 1 }); // Filter verified stays
ReviewSchema.index({ 'sentiment.label': 1 }); // Filter by sentiment
ReviewSchema.index({ photoCount: -1 }); // Filter reviews with photos
ReviewSchema.index({ requiresManualReview: 1 }); // Admin moderation queue
