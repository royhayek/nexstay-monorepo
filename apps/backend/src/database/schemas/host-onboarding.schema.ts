import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HostOnboardingDocument = HostOnboarding & Document;

export enum OnboardingStep {
  BASIC_INFO = 'basic_info',
  LOCATION = 'location',
  PROPERTY_DETAILS = 'property_details',
  AMENITIES = 'amenities',
  PHOTOS = 'photos',
  PRICING = 'pricing',
  AVAILABILITY_RULES = 'availability_rules',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true, collection: 'host_onboardings' })
export class HostOnboarding {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: OnboardingStep, default: OnboardingStep.BASIC_INFO })
  currentStep!: OnboardingStep;

  @Prop({ type: [String], enum: OnboardingStep, default: [] })
  completedSteps!: OnboardingStep[];

  @Prop({ type: Object, default: {} })
  basicInfo?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  location?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  propertyDetails?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  amenities?: Record<string, any>;

  @Prop({ type: Array, default: [] })
  photos?: any[];

  @Prop({ type: Object, default: {} })
  pricing?: Record<string, any>;

  @Prop({ type: Object, default: {} })
  availabilityRules?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'Property', required: false })
  createdPropertyId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Date, required: false })
  completedAt?: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt!: Date;
  updatedAt!: Date;
}

export const HostOnboardingSchema = SchemaFactory.createForClass(HostOnboarding);

// Indexes
HostOnboardingSchema.index({ userId: 1, isCompleted: 1 });
HostOnboardingSchema.index({ createdAt: -1 });
