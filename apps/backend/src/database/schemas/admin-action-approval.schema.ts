import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminActionApprovalDocument = AdminActionApproval & Document;

/**
 * Types of actions that require approval
 */
export enum ApprovalActionType {
  USER_PERMANENT_DELETION = 'user_permanent_deletion',
  USER_BULK_OPERATION = 'user_bulk_operation',
  ROLE_ASSIGNMENT_SYSTEM_ADMIN = 'role_assignment_system_admin',
  FINANCIAL_ADJUSTMENT = 'financial_adjustment',
  SYSTEM_CONFIG_CHANGE = 'system_config_change',
  REFUND_EXCEEDING_LIMIT = 'refund_exceeding_limit',
  PROPERTY_BULK_OPERATION = 'property_bulk_operation',
  BOOKING_BULK_OPERATION = 'booking_bulk_operation',
  HOST_APPLICATION = 'host_application',
}

/**
 * Approval request status
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Approval priority level
 */
export enum ApprovalPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Admin Action Approval Schema
 * Tracks approval requests for critical administrative operations
 */
@Schema({ timestamps: true, collection: 'admin_action_approvals' })
export class AdminActionApproval {
  @Prop({ type: String, enum: ApprovalActionType, required: true, index: true })
  actionType!: ApprovalActionType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  requestedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  approvedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  assignedTo?: Types.ObjectId;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING, index: true })
  status!: ApprovalStatus;

  @Prop({ type: String, enum: ApprovalPriority, default: ApprovalPriority.MEDIUM })
  priority!: ApprovalPriority;

  @Prop({ type: Object, required: true })
  actionPayload!: Record<string, any>;

  @Prop({ required: true, minlength: 20, maxlength: 2000 })
  requestReason!: string;

  @Prop({ required: false, minlength: 10, maxlength: 1000 })
  approvalComment?: string;

  @Prop({ type: Date, required: false })
  reviewedAt?: Date;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ required: false })
  userAgent?: string;

  @Prop({ type: Object, required: false })
  metadata?: {
    affectedUsers?: string[];
    affectedResourceIds?: string[];
    estimatedImpact?: string;
    rollbackPlan?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };

  @Prop([
    {
      status: { type: String, enum: ApprovalStatus },
      changedAt: Date,
      changedBy: { type: Types.ObjectId, ref: 'User' },
      comment: String,
    },
  ])
  statusHistory!: Array<{
    status: ApprovalStatus;
    changedAt: Date;
    changedBy: Types.ObjectId;
    comment?: string;
  }>;

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt!: Date;
  updatedAt!: Date;
}

export const AdminActionApprovalSchema = SchemaFactory.createForClass(AdminActionApproval);

// Virtual fields
AdminActionApprovalSchema.virtual('requester', {
  ref: 'User',
  localField: 'requestedBy',
  foreignField: '_id',
  justOne: true,
});

AdminActionApprovalSchema.virtual('approver', {
  ref: 'User',
  localField: 'approvedBy',
  foreignField: '_id',
  justOne: true,
});

AdminActionApprovalSchema.virtual('assignee', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
AdminActionApprovalSchema.set('toJSON', { virtuals: true });
AdminActionApprovalSchema.set('toObject', { virtuals: true });

// Compound indexes for efficient querying
AdminActionApprovalSchema.index({ status: 1, createdAt: -1 });
AdminActionApprovalSchema.index({ requestedBy: 1, status: 1 });
AdminActionApprovalSchema.index({ approvedBy: 1, reviewedAt: -1 });
AdminActionApprovalSchema.index({ assignedTo: 1, status: 1 });
AdminActionApprovalSchema.index({ actionType: 1, status: 1 });
AdminActionApprovalSchema.index({ expiresAt: 1 }, { sparse: true });

// TTL index to automatically delete old completed approvals after 180 days (6 months)
AdminActionApprovalSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 15552000, // 180 days
    partialFilterExpression: {
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, ApprovalStatus.EXPIRED] },
    },
  },
);
