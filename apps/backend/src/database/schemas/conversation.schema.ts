import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationType {
  BOOKING = 'booking', // Guest ↔ Host about specific booking
  PROPERTY_INQUIRY = 'property_inquiry', // Guest ↔ Host about property
  SUPPORT_GUEST = 'support_guest', // Guest ↔ Support
  SUPPORT_HOST = 'support_host', // Host ↔ Support
  GENERAL = 'general', // General conversations
}

export enum ConversationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportTicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING_USER = 'pending_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop([{ type: Types.ObjectId, ref: 'User', required: true }])
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Property' })
  property_id?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: ConversationType, default: ConversationType.GENERAL })
  type: ConversationType;

  @Prop({ type: String, enum: ConversationPriority, default: ConversationPriority.NORMAL })
  priority: ConversationPriority;

  @Prop({ type: String, enum: SupportTicketStatus })
  support_status?: SupportTicketStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assigned_support_agent?: Types.ObjectId;

  @Prop()
  support_category?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  last_message_id?: Types.ObjectId;

  @Prop({ default: Date.now })
  last_activity: Date;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Virtual fields for cleaner API responses
ConversationSchema.virtual('booking', {
  ref: 'Booking',
  localField: 'booking_id',
  foreignField: '_id',
  justOne: true,
});

ConversationSchema.virtual('property', {
  ref: 'Property',
  localField: 'property_id',
  foreignField: '_id',
  justOne: true,
});

ConversationSchema.virtual('supportAgent', {
  ref: 'User',
  localField: 'assigned_support_agent',
  foreignField: '_id',
  justOne: true,
});

ConversationSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: 'last_message_id',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
ConversationSchema.set('toJSON', { virtuals: true });
ConversationSchema.set('toObject', { virtuals: true });

// Indexes
ConversationSchema.index({ participants: 1, last_activity: -1 });
ConversationSchema.index({ booking_id: 1 });
ConversationSchema.index({ property_id: 1 });
ConversationSchema.index({ is_active: 1, last_activity: -1 });
ConversationSchema.index({ type: 1, last_activity: -1 });
ConversationSchema.index({ support_status: 1, priority: 1 });
ConversationSchema.index({ assigned_support_agent: 1, support_status: 1 });
ConversationSchema.index({ type: 1, participants: 1 });
