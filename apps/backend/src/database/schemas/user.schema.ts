import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserStatus } from '../../common/enums/user-status.enums';
import { UserPresenceStatus } from '../../common/enums/user-presence.enums';
import { PayoutFrequency } from '../../common/enums/payout.enums';

export type UserDocument = User & Document;

export enum UserRole {
  GUEST = 'guest',
  HOST = 'host',
  ADMIN = 'admin',
  SYSTEM_ADMIN = 'system_admin',
  MODERATOR = 'moderator',
  SUPPORT = 'support',
  COMPLIANCE = 'compliance',
}

export enum OtpNotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum RegistrationState {
  CONTACT_PENDING = 'contact_pending', // Just verified email/phone
  PROFILE_INCOMPLETE = 'profile_incomplete', // Contact verified, need profile details
  PROFILE_COMPLETE = 'profile_complete', // Profile done, can add secondary contact
  FULLY_REGISTERED = 'fully_registered', // All steps complete
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.GUEST] })
  roles!: UserRole[];

  @Prop({ default: true })
  firstLogin!: boolean;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop()
  birthDate?: Date;

  @Prop()
  locale?: string;

  @Prop()
  timezone?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ default: false })
  isPhoneVerified!: boolean;

  @Prop({ default: false })
  isIdentityVerified!: boolean;

  @Prop({ type: Date, required: false })
  identityVerifiedAt?: Date;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status!: UserStatus;

  @Prop({ type: String, enum: UserPresenceStatus, default: UserPresenceStatus.OFFLINE })
  presenceStatus!: UserPresenceStatus;

  @Prop({ type: String, enum: RegistrationState, default: RegistrationState.CONTACT_PENDING })
  registrationState!: RegistrationState;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ unique: true, sparse: true })
  facebookId?: string;

  @Prop({ unique: true, sparse: true })
  appleId?: string;

  @Prop({ type: Number, default: 0 })
  reviewCount!: number;

  @Prop({ type: Number, default: 0 })
  averageRating!: number;

  @Prop({ type: [Types.ObjectId], ref: 'Property', default: [] })
  wishlist!: Types.ObjectId[];

  @Prop({
    type: {
      otpNotificationMethod: {
        type: String,
        enum: OtpNotificationMethod,
        default: OtpNotificationMethod.EMAIL,
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      payout: {
        type: {
          frequency: { type: String, enum: PayoutFrequency, default: PayoutFrequency.WEEKLY },
          minimumAmount: { type: Number, default: 100 },
          preferredMethodId: { type: Types.ObjectId, ref: 'PayoutMethod', required: false },
          autoPayoutEnabled: { type: Boolean, default: true },
          lastAutoPayoutDate: { type: Date, required: false },
        },
        required: false,
      },
    },
    default: () => ({
      otpNotificationMethod: OtpNotificationMethod.EMAIL,
      language: 'en',
      timezone: 'UTC',
      payout: {
        frequency: PayoutFrequency.WEEKLY,
        minimumAmount: 100,
        autoPayoutEnabled: true,
      },
    }),
  })
  preferences: {
    otpNotificationMethod: OtpNotificationMethod;
    language: string;
    timezone: string;
    payout?: {
      frequency: PayoutFrequency;
      minimumAmount: number;
      preferredMethodId?: Types.ObjectId;
      autoPayoutEnabled: boolean;
      lastAutoPayoutDate?: Date;
    };
  };

  @Prop([
    {
      tokenHash: String,
      createdAt: Date,
      expiresAt: Date,
      userAgent: String,
      ipAddress: String,
    },
  ])
  refreshTokens: {
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }[];

  @Prop({ default: Date.now })
  lastActiveAt: Date;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual fields for user relationships
UserSchema.virtual('properties', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'hostId',
});

UserSchema.virtual('guestBookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'guestId',
});

UserSchema.virtual('hostBookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'hostId',
});

UserSchema.virtual('reviewsReceived', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'revieweeId',
});

UserSchema.virtual('reviewsGiven', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'reviewerId',
});

UserSchema.virtual('payoutMethods', {
  ref: 'PayoutMethod',
  localField: '_id',
  foreignField: 'ownerId',
});

UserSchema.virtual('notifications', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'recipient_id',
});

UserSchema.virtual('accounts', {
  ref: 'Account',
  localField: '_id',
  foreignField: 'ownerId',
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
