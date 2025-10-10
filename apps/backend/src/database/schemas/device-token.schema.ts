import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DevicePlatform } from '../../common/enums/notification.enums';

export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true, collection: 'device_tokens' })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, type: String, enum: DevicePlatform })
  platform: DevicePlatform;

  @Prop()
  device_id?: string;

  @Prop()
  device_name?: string;

  @Prop()
  app_version?: string;

  @Prop()
  os_version?: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop()
  last_used_at?: Date;

  // For tracking notification preferences per device
  @Prop({ default: true })
  push_enabled: boolean;

  @Prop({ default: true })
  marketing_enabled: boolean;

  @Prop({ default: true })
  booking_notifications: boolean;

  @Prop({ default: true })
  review_notifications: boolean;

  @Prop({ default: true })
  message_notifications: boolean;

  @Prop({ default: true })
  payment_notifications: boolean;

  // Time zone for scheduling notifications
  @Prop()
  timezone?: string;

  // Language preference for localized notifications
  @Prop({ default: 'en' })
  language: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Indexes
DeviceTokenSchema.index({ user_id: 1 });
DeviceTokenSchema.index({ token: 1 }, { unique: true });
DeviceTokenSchema.index({ user_id: 1, platform: 1 });
DeviceTokenSchema.index({ is_active: 1 });
DeviceTokenSchema.index({ last_used_at: 1 });

// Compound index for finding active tokens for a user
DeviceTokenSchema.index({ user_id: 1, is_active: 1, push_enabled: 1 });
