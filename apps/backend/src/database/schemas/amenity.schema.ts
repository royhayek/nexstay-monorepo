import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';
import { AmenityCategory } from './amenity-category.schema';

export type AmenityDocument = Amenity & Document;

@Schema({ timestamps: true, collection: 'amenities' })
export class Amenity extends BaseCatalog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'AmenityCategory', required: true })
  categoryId: AmenityCategory;
}

export const AmenitySchema = SchemaFactory.createForClass(Amenity);

// Virtual fields for amenity relationships
AmenitySchema.virtual('category', {
  ref: 'AmenityCategory',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
AmenitySchema.set('toJSON', { virtuals: true });
AmenitySchema.set('toObject', { virtuals: true });
