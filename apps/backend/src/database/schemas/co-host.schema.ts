import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoHostDocument = CoHost & Document;

/**
 * Co-Host Permissions Enum
 * Defines granular permissions that can be delegated to co-hosts
 */
export enum CoHostPermission {
  VIEW_CALENDAR = 'view_calendar', // View property calendar
  EDIT_CALENDAR = 'edit_calendar', // Modify property calendar/availability
  MESSAGE_GUESTS = 'message_guests', // Communicate with guests
  MANAGE_BOOKINGS = 'manage_bookings', // Accept/decline bookings, view booking details
  VIEW_EARNINGS = 'view_earnings', // View property earnings and financial reports
  MANAGE_PROPERTY = 'manage_property', // Edit property details, pricing, photos
  MANAGE_REVIEWS = 'manage_reviews', // Respond to reviews
  MANAGE_CO_HOSTS = 'manage_co_hosts', // Add/remove other co-hosts (full access only)
}

/**
 * Co-Host Status
 */
export enum CoHostStatus {
  INVITED = 'invited', // Invitation sent, awaiting acceptance
  ACCEPTED = 'accepted', // Co-host accepted and is active
  REJECTED = 'rejected', // Co-host declined invitation
  REMOVED = 'removed', // Co-host was removed by primary host
  EXPIRED = 'expired', // Invitation expired before acceptance
}

/**
 * Co-Host Access Level
 * Pre-defined permission sets for easier management
 */
export enum CoHostAccessLevel {
  FULL = 'full', // All permissions except MANAGE_CO_HOSTS
  LIMITED = 'limited', // VIEW_CALENDAR and MESSAGE_GUESTS only
  CUSTOM = 'custom', // Custom permission selection
}

/**
 * Co-Host Schema
 * Manages delegated permissions from primary hosts to co-hosts
 */
@Schema({ timestamps: true, collection: 'co_hosts' })
export class CoHost {
  /**
   * User ID of the co-host
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  /**
   * Property ID this co-host has access to
   */
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
  propertyId!: Types.ObjectId;

  /**
   * User ID of the primary host who invited this co-host
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy!: Types.ObjectId;

  /**
   * Access level (full, limited, custom)
   */
  @Prop({ type: String, enum: CoHostAccessLevel, required: true })
  accessLevel!: CoHostAccessLevel;

  /**
   * Specific permissions granted to this co-host
   */
  @Prop({ type: [String], enum: CoHostPermission, required: true })
  permissions!: CoHostPermission[];

  /**
   * Status of the co-host invitation/relationship
   */
  @Prop({ type: String, enum: CoHostStatus, default: CoHostStatus.INVITED, index: true })
  status!: CoHostStatus;

  /**
   * Date when invitation was sent
   */
  @Prop({ required: true, default: () => new Date() })
  invitedAt!: Date;

  /**
   * Date when co-host accepted invitation
   */
  @Prop()
  acceptedAt?: Date;

  /**
   * Date when invitation expires (if not accepted)
   */
  @Prop()
  expiresAt?: Date;

  /**
   * Date when co-host was removed
   */
  @Prop()
  removedAt?: Date;

  /**
   * Reason for removal (if removed)
   */
  @Prop()
  removalReason?: string;

  /**
   * Optional message from primary host to co-host
   */
  @Prop()
  invitationMessage?: string;

  /**
   * Whether the co-host can receive notifications about this property
   */
  @Prop({ default: true })
  receiveNotifications!: boolean;

  /**
   * IP address from which invitation was created
   */
  @Prop()
  ipAddress?: string;

  /**
   * Additional metadata
   */
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const CoHostSchema = SchemaFactory.createForClass(CoHost);

// Compound index to prevent duplicate co-host invitations for same user+property
// Only one active/invited relationship per user per property
CoHostSchema.index({ userId: 1, propertyId: 1, status: 1 }, { unique: false });

// Index for finding all co-hosts for a property (for host dashboard)
CoHostSchema.index({ propertyId: 1, status: 1 });

// Index for finding all properties a user is co-hosting (for co-host dashboard)
CoHostSchema.index({ userId: 1, status: 1 });

// Index for invitation management
CoHostSchema.index({ invitedBy: 1, status: 1 });

// TTL index to automatically expire old pending invitations after 7 days
CoHostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for co-host user population
CoHostSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for property population
CoHostSchema.virtual('property', {
  ref: 'Property',
  localField: 'propertyId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for inviter population
CoHostSchema.virtual('inviter', {
  ref: 'User',
  localField: 'invitedBy',
  foreignField: '_id',
  justOne: true,
});

// Transform to include virtuals in JSON
CoHostSchema.set('toJSON', { virtuals: true });
CoHostSchema.set('toObject', { virtuals: true });

/**
 * Pre-defined permission sets for easy access level management
 */
export const ACCESS_LEVEL_PERMISSIONS: Record<CoHostAccessLevel, CoHostPermission[]> = {
  [CoHostAccessLevel.FULL]: [
    CoHostPermission.VIEW_CALENDAR,
    CoHostPermission.EDIT_CALENDAR,
    CoHostPermission.MESSAGE_GUESTS,
    CoHostPermission.MANAGE_BOOKINGS,
    CoHostPermission.VIEW_EARNINGS,
    CoHostPermission.MANAGE_PROPERTY,
    CoHostPermission.MANAGE_REVIEWS,
    // Note: MANAGE_CO_HOSTS is intentionally excluded from FULL access
    // Only primary host can manage co-hosts by default
  ],
  [CoHostAccessLevel.LIMITED]: [
    CoHostPermission.VIEW_CALENDAR,
    CoHostPermission.MESSAGE_GUESTS,
  ],
  [CoHostAccessLevel.CUSTOM]: [], // Will be specified individually
};

/**
 * Maximum number of co-hosts per property (Airbnb allows 10)
 */
export const MAX_CO_HOSTS_PER_PROPERTY = 10;

/**
 * Default invitation expiration time (7 days)
 */
export const INVITATION_EXPIRATION_DAYS = 7;
