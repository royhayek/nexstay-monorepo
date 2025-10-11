import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';
import { AuditLogService } from '../../modules/auth/services/audit-log.service';
import { AuditLogResult } from '../../database/schemas/audit-log.schema';

interface RequestWithUser extends Request {
  user?: {
    _id: string;
    email?: string;
    roles?: string[];
  };
}

/**
 * Interceptor for automatic audit logging
 *
 * This interceptor reads the @AuditLog decorator metadata and logs
 * actions to the audit log database. It captures:
 * - User information from the request
 * - IP address and user agent
 * - Success/failure status
 * - Resource information
 * - Additional metadata
 *
 * Register globally in main.ts or app.module.ts:
 * ```typescript
 * app.useGlobalInterceptors(new AuditLogInterceptor(reflector, auditLogService));
 * ```
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only process HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }

    // Get audit log configuration from decorator metadata
    const auditOptions = this.reflector.get<AuditLogOptions>(AUDIT_LOG_KEY, context.getHandler());

    // If no audit configuration, skip logging
    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Extract request metadata
    const userId = request.user?._id;
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.get('User-Agent');

    // If no user ID and not a public endpoint, skip logging
    // (public endpoints like login will be logged with the user ID from the response)
    if (!userId && !this.isPublicEndpoint(auditOptions)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        // Skip if configured to only log failures
        if (auditOptions.onlyLogFailures) {
          return;
        }

        // Extract resource ID and metadata using provided functions
        const resourceId = auditOptions.getResourceId
          ? auditOptions.getResourceId(request, result)
          : undefined;

        const metadata = auditOptions.getMetadata
          ? auditOptions.getMetadata(request, result)
          : undefined;

        // Get user ID from result if not in request (for login/signup)
        const effectiveUserId = userId || this.extractUserIdFromResult(result);

        if (!effectiveUserId) {
          // Cannot log without a user ID
          return;
        }

        // Log successful action (fire and forget to avoid blocking request)
        void this.auditLogService.log({
          userId: effectiveUserId,
          action: auditOptions.action,
          result: AuditLogResult.SUCCESS,
          severity: auditOptions.severity,
          resourceType: auditOptions.resourceType,
          resourceId,
          ipAddress,
          userAgent,
          metadata,
          description: auditOptions.description,
        });
      }),
      catchError((error) => {
        // Log failed action
        this.logFailure(userId || 'unknown', auditOptions, request, error).catch(() => {
          // Silently fail audit logging to avoid breaking the request
        });

        return throwError(() => error as Error);
      }),
    );
  }

  /**
   * Log a failed action
   */
  private async logFailure(
    userId: string,
    auditOptions: AuditLogOptions,
    request: RequestWithUser,
    error: unknown,
  ): Promise<void> {
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.get('User-Agent');

    // Extract resource ID using provided function
    const resourceId = auditOptions.getResourceId
      ? auditOptions.getResourceId(request, undefined)
      : undefined;

    const metadata = auditOptions.getMetadata
      ? auditOptions.getMetadata(request, undefined)
      : undefined;

    // Extract error message safely
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

    await this.auditLogService.log({
      userId,
      action: auditOptions.action,
      result: AuditLogResult.FAILURE,
      severity: auditOptions.severity,
      resourceType: auditOptions.resourceType,
      resourceId,
      ipAddress,
      userAgent,
      metadata,
      errorMessage,
      description: auditOptions.description,
    });
  }

  /**
   * Extract IP address from request, handling proxies
   */
  private extractIpAddress(request: Request): string {
    const xForwardedFor = request.get('X-Forwarded-For');
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return xForwardedFor.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }

  /**
   * Check if this is a public endpoint (login, signup, etc.)
   */
  private isPublicEndpoint(auditOptions: AuditLogOptions): boolean {
    const publicActions = [
      'login_success',
      'login_failure',
      'account_created',
      'password_reset_requested',
    ];
    return publicActions.includes(auditOptions.action);
  }

  /**
   * Extract user ID from result object (for login/signup responses)
   */
  private extractUserIdFromResult(result: unknown): string | undefined {
    // Handle different response structures
    if (this.hasNestedUser(result, ['data', 'user', '_id'])) {
      return String(result.data.user._id);
    }
    if (this.hasNestedUser(result, ['data', 'user', 'id'])) {
      return String(result.data.user.id);
    }
    if (this.hasNestedUser(result, ['user', '_id'])) {
      return String(result.user._id);
    }
    if (this.hasNestedUser(result, ['user', 'id'])) {
      return String(result.user.id);
    }
    if (this.hasProperty(result, 'userId')) {
      return String((result as { userId: unknown }).userId);
    }
    return undefined;
  }

  /**
   * Type guard to check if object has nested properties
   */
  private hasNestedUser(obj: unknown, path: string[]): obj is Record<string, any> {
    let current: any = obj;
    for (const key of path) {
      if (typeof current !== 'object' || current === null || !(key in current)) {
        return false;
      }
      current = current[key];
    }
    return current != null;
  }

  /**
   * Type guard to check if object has property
   */
  private hasProperty(obj: unknown, prop: string): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null && prop in obj;
  }
}
