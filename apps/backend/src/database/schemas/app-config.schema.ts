import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppConfigDocument = AppConfig & Document;

export enum ConfigCategory {
  GENERAL = 'general',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  PAYOUT = 'payout',
  NOTIFICATIONS = 'notifications',
  SECURITY = 'security',
  FEATURES = 'features',
  EMAIL = 'email',
  SMS = 'sms',
  UI = 'ui',
}

@Schema({ timestamps: true, collection: 'app_configs' })
export class AppConfig extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  title: string; // Human-readable title for frontend display

  @Prop()
  description?: string; // Optional: for UI, docs, etc.

  @Prop({ required: true, enum: ConfigCategory, default: ConfigCategory.GENERAL })
  category: ConfigCategory;

  @Prop({ default: 0 })
  sortOrder: number; // For ordering within categories

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
