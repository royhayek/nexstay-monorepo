import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IdentityVerificationDocument = IdentityVerification & Document;

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVERS_LICENSE = 'drivers_license',
  RESIDENCE_PERMIT = 'residence_permit',
}

export enum VerificationRejectionReason {
  DOCUMENT_UNCLEAR = 'document_unclear',
  DOCUMENT_EXPIRED = 'document_expired',
  DOCUMENT_INVALID = 'document_invalid',
  PERSONAL_INFO_MISMATCH = 'personal_info_mismatch',
  DOCUMENT_TAMPERED = 'document_tampered',
  UNSUPPORTED_DOCUMENT = 'unsupported_document',
  POOR_IMAGE_QUALITY = 'poor_image_quality',
  INCOMPLETE_SUBMISSION = 'incomplete_submission',
  FRAUDULENT_DOCUMENT = 'fraudulent_document',
  OTHER = 'other',
}

@Schema({ timestamps: true, collection: 'identity_verifications' })
export class IdentityVerification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
    index: true,
  })
  status!: VerificationStatus;

  @Prop({ type: String, enum: DocumentType, required: true })
  documentType!: DocumentType;

  @Prop({ required: true })
  documentNumber!: string;

  @Prop({ required: true })
  issuingCountry!: string;

  @Prop({ required: false })
  issuingState?: string;

  @Prop({ required: true })
  expirationDate!: Date;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: false })
  middleName?: string;

  @Prop({ required: true })
  dateOfBirth!: Date;

  @Prop({ required: false })
  placeOfBirth?: string;

  @Prop({ required: false })
  nationality?: string;

  @Prop({ required: false })
  gender?: string;

  @Prop({ required: true })
  documentFrontImageUrl!: string;

  @Prop({ required: false })
  documentBackImageUrl?: string;

  @Prop({ required: false })
  selfieImageUrl?: string;

  @Prop({ required: false })
  proofOfAddressImageUrl?: string;

  @Prop({ type: Date, required: false })
  submittedAt?: Date;

  @Prop({ type: Date, required: false })
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: String, enum: VerificationRejectionReason, required: false })
  rejectionReason?: VerificationRejectionReason;

  @Prop({ required: false })
  rejectionComment?: string;

  @Prop({ type: Date, required: false })
  verifiedAt?: Date;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @Prop({ type: Number, default: 0 })
  attemptCount!: number;

  @Prop({ type: Boolean, default: false })
  isActive!: boolean;

  @Prop({ type: Object, required: false })
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    geolocation?: {
      country?: string;
      region?: string;
      city?: string;
    };
    ocrResults?: {
      extractedText?: string;
      confidence?: number;
      fields?: Record<string, string>;
    };
    fraudDetection?: {
      riskScore?: number;
      flags?: string[];
      provider?: string;
    };
  };

  @Prop([
    {
      status: { type: String, enum: VerificationStatus },
      changedAt: Date,
      changedBy: { type: Types.ObjectId, ref: 'User' },
      comment: String,
      metadata: Object,
    },
  ])
  statusHistory: {
    status: VerificationStatus;
    changedAt: Date;
    changedBy?: Types.ObjectId;
    comment?: string;
    metadata?: Record<string, any>;
  }[];

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const IdentityVerificationSchema = SchemaFactory.createForClass(IdentityVerification);

// Virtual fields for identity verification relationships
IdentityVerificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

IdentityVerificationSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
IdentityVerificationSchema.set('toJSON', { virtuals: true });
IdentityVerificationSchema.set('toObject', { virtuals: true });

// Create compound index for efficient querying
IdentityVerificationSchema.index({ userId: 1, status: 1 });
IdentityVerificationSchema.index({ status: 1, createdAt: -1 });
IdentityVerificationSchema.index({ documentNumber: 1, documentType: 1 });
IdentityVerificationSchema.index({ expirationDate: 1 });
IdentityVerificationSchema.index({ isActive: 1, status: 1 });
