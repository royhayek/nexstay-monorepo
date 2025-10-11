import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

/**
 * Audit log action types for authentication and authorization events
 */
export enum AuditLogAction {
  // Authentication actions
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  SESSION_TERMINATED = 'session_terminated',
  TOKEN_REFRESHED = 'token_refreshed',
  TOKEN_REFRESH_FAILED = 'token_refresh_failed',

  // Password management
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PASSWORD_RESET_FAILED = 'password_reset_failed',

  // Account management
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_ACTIVATED = 'account_activated',
  ACCOUNT_DEACTIVATED = 'account_deactivated',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_DELETED = 'account_deleted',

  // Verification actions
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  IDENTITY_VERIFIED = 'identity_verified',

  // Permission changes
  ROLE_ADDED = 'role_added',
  ROLE_REMOVED = 'role_removed',
  PERMISSIONS_MODIFIED = 'permissions_modified',

  // Profile updates
  PROFILE_UPDATED = 'profile_updated',
  SECURITY_SETTINGS_CHANGED = 'security_settings_changed',

  // Device management
  DEVICE_TRUSTED = 'device_trusted',
  DEVICE_UNTRUSTED = 'device_untrusted',

  // Sensitive data access
  SENSITIVE_DATA_ACCESSED = 'sensitive_data_accessed',
  ADMIN_ACTION_PERFORMED = 'admin_action_performed',
}

/**
 * Result of the audited action
 */
export enum AuditLogResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

/**
 * Severity level for audit logs
 */
export enum AuditLogSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Audit log schema for tracking sensitive operations
 */
@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ required: true, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: AuditLogAction, index: true })
  action: AuditLogAction;

  @Prop({ required: true, type: String, enum: AuditLogResult })
  result: AuditLogResult;

  @Prop({ type: String, enum: AuditLogSeverity, default: AuditLogSeverity.MEDIUM })
  severity: AuditLogSeverity;

  // Resource information
  @Prop()
  resourceType?: string; // e.g., 'User', 'Session', 'Property'

  @Prop()
  resourceId?: string; // ID of the affected resource

  // Request metadata
  @Prop({ index: true })
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  deviceFingerprint?: string;

  // Additional context
  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop()
  errorMessage?: string; // For failed actions

  @Prop()
  description?: string; // Human-readable description

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Compound index for efficient user-specific audit log queries
// Optimizes: find({ userId: userId }).sort({ createdAt: -1 })
AuditLogSchema.index({ userId: 1, createdAt: -1 });

// Index for filtering by action type and time range
// Optimizes: find({ action: 'login_failure', createdAt: { $gte: date } })
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Index for IP-based suspicious activity detection
// Optimizes: find({ ipAddress: ip, result: 'failure' })
AuditLogSchema.index({ ipAddress: 1, result: 1, createdAt: -1 });

// TTL index to automatically delete old audit logs after 90 days
// This helps with GDPR compliance and database size management
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
