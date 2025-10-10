import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
} from '../../common/enums/notification.enums';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
export class NotificationData {
  @Prop()
  booking_id?: string;

  @Prop()
  property_id?: string;

  @Prop()
  review_id?: string;

  @Prop()
  message_id?: string;

  @Prop()
  amount?: number;

  @Prop()
  currency?: string;

  @Prop()
  property_name?: string;

  @Prop()
  guest_name?: string;

  @Prop()
  host_name?: string;

  @Prop()
  check_in_date?: Date;

  @Prop()
  check_out_date?: Date;

  @Prop()
  confirmation_code?: string;

  @Prop()
  reason?: string;

  @Prop()
  review_text?: string;

  @Prop()
  rating?: number;

  // Any additional custom data
  @Prop({ type: Map, of: String })
  custom_data?: Map<string, string>;
}

@Schema({ _id: false })
export class NotificationDelivery {
  @Prop({ required: true, type: String, enum: NotificationChannel })
  channel: NotificationChannel;

  @Prop({
    required: true,
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop()
  sent_at?: Date;

  @Prop()
  delivered_at?: Date;

  @Prop()
  read_at?: Date;

  @Prop()
  failed_at?: Date;

  @Prop()
  error_message?: string;

  @Prop()
  external_id?: string; // Firebase message ID, email ID, etc.
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender_id?: Types.ObjectId;

  @Prop({ required: true, type: String, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  image_url?: string;

  @Prop({ type: NotificationData })
  data?: NotificationData;

  @Prop({
    required: true,
    type: String,
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Prop({ type: [NotificationDelivery], default: [] })
  deliveries: NotificationDelivery[];

  @Prop({ default: false })
  is_read: boolean;

  @Prop()
  read_at?: Date;

  @Prop({ default: false })
  is_silent: boolean;

  @Prop()
  scheduled_at?: Date;

  @Prop()
  expires_at?: Date;

  @Prop({ default: true })
  is_active: boolean;

  // Deep link or action URL
  @Prop()
  action_url?: string;

  // Grouping related notifications
  @Prop()
  group_key?: string;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Virtual fields for cleaner API responses
NotificationSchema.virtual('recipient', {
  ref: 'User',
  localField: 'recipient_id',
  foreignField: '_id',
  justOne: true,
});

NotificationSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

// Indexes for performance
NotificationSchema.index({ recipient_id: 1, createdAt: -1 });
NotificationSchema.index({ recipient_id: 1, is_read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ scheduled_at: 1 });
NotificationSchema.index({ expires_at: 1 });
NotificationSchema.index({ 'deliveries.status': 1 });
NotificationSchema.index({ group_key: 1 });
NotificationSchema.index({ is_active: 1 });
