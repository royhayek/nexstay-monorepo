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
  property_image?: string;

  @Prop()
  property_location?: string;

  @Prop()
  property_type?: string;

  @Prop()
  nightly_rate?: number;

  @Prop()
  published_date?: Date;

  @Prop()
  property_url?: string;

  @Prop()
  dashboard_url?: string;

  @Prop()
  host_guide_url?: string;

  @Prop()
  pricing_tips_url?: string;

  @Prop()
  photos_guide_url?: string;

  @Prop()
  safety_guide_url?: string;

  @Prop()
  support_email?: string;

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

  // Payment-related fields
  @Prop()
  receipt_number?: string;

  @Prop()
  payment_date?: Date;

  @Prop()
  payment_method?: string;

  @Prop()
  transaction_id?: string;

  @Prop()
  price_per_night?: number;

  @Prop()
  nights?: number;

  @Prop()
  subtotal?: number;

  @Prop()
  service_fee?: number;

  @Prop()
  cleaning_fee?: number;

  @Prop()
  taxes?: number;

  // Payout-related fields
  @Prop()
  payout_id?: string;

  @Prop()
  payout_date?: Date;

  @Prop()
  expected_arrival?: Date;

  @Prop()
  transfer_time?: string;

  @Prop()
  payment_method_type?: string;

  @Prop()
  payment_method_details?: string;

  @Prop()
  gross_earnings?: number;

  @Prop()
  adjustments?: number;

  @Prop()
  next_payout_date?: Date;

  @Prop()
  pending_earnings?: number;

  // Message-related fields
  @Prop()
  conversation_id?: string;

  @Prop()
  sender_name?: string;

  @Prop()
  message_preview?: string;

  @Prop()
  unread_count?: number;

  // Password reset fields
  @Prop()
  reset_token?: string;

  @Prop()
  expiry_time?: string;

  @Prop()
  ip_address?: string;

  @Prop()
  location?: string;

  @Prop()
  device?: string;

  @Prop()
  user_email?: string;

  @Prop()
  user_name?: string;

  // Review-related fields
  @Prop()
  review_deadline?: Date;

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
