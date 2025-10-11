import { SetMetadata } from '@nestjs/common';
import { AuditLogAction, AuditLogSeverity } from '../../database/schemas/audit-log.schema';

export const AUDIT_LOG_KEY = 'auditLog';

/**
 * Configuration for audit logging decorator
 */
export interface AuditLogOptions {
  /**
   * The action being performed
   */
  action: AuditLogAction;

  /**
   * Severity level of this action
   * @default AuditLogSeverity.MEDIUM
   */
  severity?: AuditLogSeverity;

  /**
   * Type of resource being acted upon (e.g., 'User', 'Session', 'Property')
   */
  resourceType?: string;

  /**
   * Function to extract resource ID from request/response
   * @param req - The request object
   * @param result - The response/result object
   * @returns The resource ID or undefined
   */
  getResourceId?: (req: any, result?: any) => string | undefined;

  /**
   * Function to extract additional metadata
   * @param req - The request object
   * @param result - The response/result object
   * @returns Additional metadata object
   */
  getMetadata?: (req: any, result?: any) => Record<string, any> | undefined;

  /**
   * Human-readable description of the action
   */
  description?: string;

  /**
   * Whether to log only on failure (default: false, logs both success and failure)
   */
  onlyLogFailures?: boolean;
}

/**
 * Decorator for automatic audit logging of controller methods
 *
 * This decorator marks a method for audit logging. The actual logging is performed
 * by the AuditLogInterceptor which should be registered globally or at the controller level.
 *
 * @example
 * ```typescript
 * @AuditLog({
 *   action: AuditLogAction.PASSWORD_CHANGED,
 *   severity: AuditLogSeverity.HIGH,
 *   resourceType: 'User',
 *   description: 'User changed their password'
 * })
 * async changePassword(@Req() req: AuthRequest, @Body() dto: ChangePasswordDto) {
 *   // ...
 * }
 * ```
 *
 * @example Advanced usage with resource ID extraction
 * ```typescript
 * @AuditLog({
 *   action: AuditLogAction.SESSION_TERMINATED,
 *   resourceType: 'Session',
 *   getResourceId: (req) => req.params.sessionId,
 *   getMetadata: (req) => ({ targetSessionId: req.params.sessionId })
 * })
 * async terminateSession(@Req() req: AuthRequest, @Param('sessionId') sessionId: string) {
 *   // ...
 * }
 * ```
 */
export const AuditLog = (options: AuditLogOptions) => {
  return SetMetadata(AUDIT_LOG_KEY, options);
};

/**
 * Predefined audit log configurations for common operations
 */
export const AuditLogPresets = {
  LOGIN_SUCCESS: {
    action: AuditLogAction.LOGIN_SUCCESS,
    severity: AuditLogSeverity.MEDIUM,
    description: 'User logged in successfully',
  },
  LOGIN_FAILURE: {
    action: AuditLogAction.LOGIN_FAILURE,
    severity: AuditLogSeverity.HIGH,
    description: 'Failed login attempt',
    onlyLogFailures: true,
  },
  LOGOUT: {
    action: AuditLogAction.LOGOUT,
    severity: AuditLogSeverity.LOW,
    description: 'User logged out',
  },
  PASSWORD_CHANGED: {
    action: AuditLogAction.PASSWORD_CHANGED,
    severity: AuditLogSeverity.HIGH,
    description: 'Password changed',
  },
  SESSION_TERMINATED: {
    action: AuditLogAction.SESSION_TERMINATED,
    severity: AuditLogSeverity.MEDIUM,
    resourceType: 'Session',
    description: 'Session terminated',
  },
  ACCOUNT_DEACTIVATED: {
    action: AuditLogAction.ACCOUNT_DEACTIVATED,
    severity: AuditLogSeverity.CRITICAL,
    resourceType: 'User',
    description: 'Account deactivated',
  },
  ROLE_MODIFIED: {
    action: AuditLogAction.PERMISSIONS_MODIFIED,
    severity: AuditLogSeverity.CRITICAL,
    resourceType: 'User',
    description: 'User roles or permissions modified',
  },
};
