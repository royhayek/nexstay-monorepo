import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type AmenityCategoryDocument = AmenityCategory & Document;

@Schema({ timestamps: true, collection: 'amenity_categories' })
export class AmenityCategory extends BaseCatalog {
  // Additional properties specific to amenity categories can be added here
}

export const AmenityCategorySchema = SchemaFactory.createForClass(AmenityCategory);

// Virtual fields for amenity category relationships
AmenityCategorySchema.virtual('amenities', {
  ref: 'Amenity',
  localField: '_id',
  foreignField: 'categoryId',
});

// Ensure virtual fields are serialized
AmenityCategorySchema.set('toJSON', { virtuals: true });
AmenityCategorySchema.set('toObject', { virtuals: true });
