import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CatalogVersionDocument = CatalogVersion & Document;

@Schema({ timestamps: true, collection: 'catalog_versions' })
export class CatalogVersion extends Document {
  @Prop({ required: true, unique: true, default: 'default' })
  declare id: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop()
  lastModifiedBy?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const CatalogVersionSchema = SchemaFactory.createForClass(CatalogVersion);
