import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseCatalog } from './base-catalog.schema';

export type NotificationTypeDocument = NotificationType & Document;

@Schema({ timestamps: true, collection: 'notification_types' })
export class NotificationType extends BaseCatalog {
  @Prop({ type: [String], required: true })
  availableChannels: string[];

  @Prop({ default: 'normal' })
  defaultPriority: string;

  @Prop({ type: Object })
  template?: Record<string, string>;
}

export const NotificationTypeSchema = SchemaFactory.createForClass(NotificationType);
