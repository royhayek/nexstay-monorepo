import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type BedTypeDocument = BedType & Document;

@Schema({ timestamps: true, collection: 'bed_types' })
export class BedType extends BaseCatalog {
  // Additional properties specific to bed types can be added here
}

export const BedTypeSchema = SchemaFactory.createForClass(BedType);
