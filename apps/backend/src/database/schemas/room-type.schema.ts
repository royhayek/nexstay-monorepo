import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type RoomTypeDocument = RoomType & Document;

@Schema({ timestamps: true, collection: 'room_types' })
export class RoomType extends BaseCatalog {
  // Additional properties specific to room types can be added here
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
