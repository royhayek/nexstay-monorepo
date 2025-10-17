import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PropertyType,
  RoomType,
  CancellationPolicy,
  PropertyCategory,
  FlexibleDateRange,
} from '../../common/enums/property.enums';

export type SavedSearchDocument = SavedSearch & Document;

/**
 * Saved Search Schema
 * Stores user's favorite search filters for quick access
 */
@Schema({ timestamps: true, collection: 'saved_searches' })
export class SavedSearch {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  name: string;

  @Prop({ maxlength: 500 })
  description?: string;

  // Search filters (matching PropertySearchDto)
  @Prop()
  search?: string;

  @Prop()
  location?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  radius?: number;

  @Prop()
  checkIn?: Date;

  @Prop()
  checkOut?: Date;

  @Prop({ type: String, enum: FlexibleDateRange })
  flexibleDateRange?: FlexibleDateRange;

  @Prop({ type: [String], enum: PropertyType, default: [] })
  propertyTypes?: PropertyType[];

  @Prop({ type: [String], enum: RoomType, default: [] })
  roomTypes?: RoomType[];

  @Prop({ type: [String], enum: PropertyCategory, default: [] })
  categories?: PropertyCategory[];

  @Prop()
  minPrice?: number;

  @Prop()
  maxPrice?: number;

  @Prop()
  currency?: string;

  @Prop()
  guests?: number;

  @Prop()
  adults?: number;

  @Prop()
  children?: number;

  @Prop()
  infants?: number;

  @Prop()
  bedrooms?: number;

  @Prop()
  beds?: number;

  @Prop()
  bathrooms?: number;

  @Prop({ type: [String], default: [] })
  amenities?: string[];

  @Prop()
  instantBookable?: boolean;

  @Prop()
  isSuperhost?: boolean;

  @Prop({ type: String, enum: CancellationPolicy })
  cancellationPolicy?: CancellationPolicy;

  @Prop()
  sortBy?: string;

  @Prop()
  sortOrder?: 'asc' | 'desc';

  // Metadata
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: 0 })
  useCount: number;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  deletedAt?: Date;

  // Timestamps added by schema options
  createdAt?: Date;
  updatedAt?: Date;
}

export const SavedSearchSchema = SchemaFactory.createForClass(SavedSearch);

// Add indexes
SavedSearchSchema.index({ userId: 1 });
SavedSearchSchema.index({ userId: 1, isActive: 1 });
SavedSearchSchema.index({ userId: 1, isDefault: 1 });
SavedSearchSchema.index({ createdAt: -1 });
SavedSearchSchema.index({ lastUsedAt: -1 });
