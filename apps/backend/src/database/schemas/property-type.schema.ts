import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type PropertyTypeDocument = PropertyType & Document;

@Schema({ timestamps: true, collection: 'property_types' })
export class PropertyType extends BaseCatalog {
  // Additional properties specific to property types can be added here
}

export const PropertyTypeSchema = SchemaFactory.createForClass(PropertyType);
