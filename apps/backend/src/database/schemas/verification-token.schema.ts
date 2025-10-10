import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AuthMethod } from '../../modules/auth/dto/login.dto';

export type VerificationTokenDocument = HydratedDocument<VerificationToken>;

@Schema({ timestamps: true, collection: 'verification_tokens' })
export class VerificationToken {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  user?: Types.ObjectId;

  @Prop({ type: String, index: true })
  identifier?: string; // email or phone for non-registered users

  @Prop({ type: String, enum: AuthMethod, required: true })
  type: AuthMethod; // 'email' | 'phone' | 'password_reset'

  @Prop({ required: true })
  codeHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  // used to track if otp has been consumed
  @Prop({ type: Boolean, default: false })
  used: boolean;

  // count failed attempts (verify/reset)
  @Prop({ type: Number, default: 0 })
  attempts: number;

  // help enforce resend cooldown
  @Prop({ type: Date })
  lastSentAt?: Date;

  // sliding-window rate limit
  @Prop({ type: [Date], default: [] })
  requestLog?: Date[];

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const VerificationTokenSchema = SchemaFactory.createForClass(VerificationToken);

// Auto cleanup when expired (MongoDB TTL monitor)
// expiresAt is an absolute time; expireAfterSeconds: 0 means expire AT that time.
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Only one active token per (user,type) when used=false (for existing users)
VerificationTokenSchema.index(
  { user: 1, type: 1, used: 1 },
  { unique: true, partialFilterExpression: { used: false, user: { $exists: true } } },
);

// Only one active token per (identifier,type) when used=false (for signup flow)
VerificationTokenSchema.index(
  { identifier: 1, type: 1, used: 1 },
  { unique: true, partialFilterExpression: { used: false, identifier: { $exists: true } } },
);
