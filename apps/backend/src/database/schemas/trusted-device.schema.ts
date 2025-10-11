import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TrustedDeviceDocument = TrustedDevice & Document;

@Schema({ timestamps: true, collection: 'trusted_devices' })
export class TrustedDevice {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  user!: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  deviceFingerprint!: string; // Hash of (userAgent + IP)

  @Prop({ required: true })
  deviceName!: string; // User-friendly name (e.g., "Chrome on Windows")

  @Prop({ required: false })
  userAgent?: string;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ type: Date, required: true, default: Date.now })
  lastUsedAt!: Date;

  @Prop({ type: Date, required: true, default: Date.now })
  firstSeenAt!: Date;

  @Prop({ type: Boolean, required: true, default: true })
  isActive!: boolean;

  @Prop({ type: Date, required: false })
  deactivatedAt?: Date;

  @Prop({ required: false })
  deactivationReason?: string;
}

export const TrustedDeviceSchema = SchemaFactory.createForClass(TrustedDevice);

// Add compound index for efficient lookups
TrustedDeviceSchema.index({ user: 1, deviceFingerprint: 1 }, { unique: true });
TrustedDeviceSchema.index({ user: 1, isActive: 1 });
TrustedDeviceSchema.index({ lastUsedAt: 1 }); // For cleanup of old devices
