import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true, collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop()
  userAgent?: string; // optional metadata
  @Prop()
  ipAddress?: string;

  @Prop({ required: true })
  expiresAt: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
