import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

@Schema({ _id: false })
export class MessageAttachment {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;
}

@Schema({ _id: false })
export class MessageReadReceipt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  read_at: Date;
}

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender_id: Types.ObjectId;

  @Prop({ required: true })
  content: string; // Encrypted message content

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  message_type: MessageType;

  @Prop({ type: [MessageAttachment], default: [] })
  attachments: MessageAttachment[];

  @Prop({ type: [MessageReadReceipt], default: [] })
  read_by: MessageReadReceipt[];

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop()
  deleted_at?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  reply_to?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Virtual fields for cleaner API responses
MessageSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.virtual('conversation', {
  ref: 'Conversation',
  localField: 'conversation_id',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.virtual('replyTo', {
  ref: 'Message',
  localField: 'reply_to',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included when converting to JSON
MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

// Indexes
MessageSchema.index({ conversation_id: 1, createdAt: -1 });
MessageSchema.index({ sender_id: 1, createdAt: -1 });
MessageSchema.index({ is_deleted: 1 });
MessageSchema.index({ conversation_id: 1, is_deleted: 1, createdAt: -1 });
