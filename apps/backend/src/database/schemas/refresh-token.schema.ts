import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  // Device/Session metadata
  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceName?: string; // User-friendly device name (e.g., "Chrome on Windows")

  @Prop()
  deviceFingerprint?: string; // Hash of device info for session identification

  @Prop({ type: Date })
  lastUsedAt?: Date; // Track last activity for this session

  @Prop({ required: true })
  expiresAt: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Compound index for efficient refresh token lookup by user
// Optimizes the query: find({ user: userId, expiresAt: { $gt: now } })
// This makes refresh token lookup O(1) by filtering to only that user's tokens
RefreshTokenSchema.index({ user: 1, expiresAt: 1 });

// Index on tokenHash for uniqueness constraint and direct hash lookups
// Already has unique: true constraint which creates an index automatically
