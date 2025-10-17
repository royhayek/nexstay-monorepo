import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PropertyType,
  RoomType,
  CancellationPolicy,
  PropertyCategory,
  FlexibleDateRange,
} from '../../common/enums/property.enums';

export type SearchHistoryDocument = SearchHistory & Document;

/**
 * Search History Schema
 * Tracks user's search history for personalization and quick access to recent searches
 */
@Schema({ timestamps: true, collection: 'search_histories' })
export class SearchHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

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
  @Prop({ default: 0 })
  resultsCount: number;

  @Prop({ default: false })
  hasResults: boolean;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  deletedAt?: Date;

  // Timestamps added by schema options
  createdAt?: Date;
  updatedAt?: Date;
}

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);

// Add indexes
SearchHistorySchema.index({ userId: 1 });
SearchHistorySchema.index({ userId: 1, createdAt: -1 });
SearchHistorySchema.index({ location: 1 });
SearchHistorySchema.index({ createdAt: -1 });

// TTL index: automatically delete search history older than 90 days
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
