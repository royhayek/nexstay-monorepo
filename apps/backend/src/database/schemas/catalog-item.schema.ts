import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CatalogItemDocument = CatalogItem & Document;

/**
 * CatalogItem Schema
 *
 * Unified schema for all catalog data (PropertyType, RoomType, BedType, Amenities, etc.)
 * Icons are stored as string names (e.g., 'wifi', 'car') chosen from Iconsax library in dashboard
 */
@Schema({ timestamps: true, collection: 'catalog_items' })
export class CatalogItem extends Document {
  @Prop({ required: true, index: true, type: String })
  catalogType: string; // e.g., 'PropertyType', 'Amenity', 'RoomType'

  @Prop({ required: true, uppercase: true, type: String })
  key: string; // e.g., 'WIFI', 'APARTMENT', 'FLEXIBLE'

  @Prop({ required: true, lowercase: true, type: String })
  slug: string; // e.g., 'wifi', 'apartment', 'flexible'

  @Prop({ type: Object, required: true })
  label: Record<string, string>; // i18n labels (language codes configurable): { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي', es: 'WiFi', ... }

  @Prop({ type: Object })
  description?: Record<string, string>; // Optional i18n descriptions (supports any language codes)

  @Prop()
  icon?: string; // Icon name from Iconsax (e.g., 'wifi', 'car', 'pool', 'weight')

  @Prop()
  group?: string; // Optional grouping (e.g., 'connectivity', 'parking', 'fitness')

  @Prop({ default: 0 })
  sortOrder: number; // Display order

  @Prop({ default: true })
  isVisible: boolean; // Show in UI

  @Prop({ default: true })
  isActive: boolean; // Available for use

  @Prop({ default: false })
  isDeprecated: boolean; // Legacy support

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Flexible additional data

  @Prop()
  deletedAt?: Date; // Soft delete timestamp

  @Prop()
  createdBy?: string; // User ID who created

  @Prop()
  updatedBy?: string; // User ID who last updated

  // Timestamps (automatically managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

// Indexes for performance
CatalogItemSchema.index({ catalogType: 1, key: 1 }, { unique: true }); // Compound unique index
CatalogItemSchema.index({ catalogType: 1, sortOrder: 1 }); // Query by type and sort
CatalogItemSchema.index({ slug: 1 }); // Query by slug
CatalogItemSchema.index({ isActive: 1, isVisible: 1 }); // Filter by status
CatalogItemSchema.index({ deletedAt: 1 }); // Soft delete queries
CatalogItemSchema.index({ group: 1 }); // Filter by group
