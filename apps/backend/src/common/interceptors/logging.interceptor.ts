import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { LoggingUtil } from '../utils/logging.util';

interface RequestWithUser extends Request {
  user?: { id: string; email?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const userId = request.user?.id || 'Anonymous';

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log format: METHOD /path [userId] - XXXms (XXX)
        const logMessage = `${method} ${url} [${userId}] - ${duration}ms (${statusCode})`;

        if (statusCode >= 400) {
          LoggingUtil.warn(logMessage, 'LoggingInterceptor');
        } else if (duration > 1000) {
          // Log slow requests as warnings
          LoggingUtil.warn(`SLOW REQUEST: ${logMessage}`, 'LoggingInterceptor');
        } else {
          LoggingUtil.log(logMessage, 'LoggingInterceptor');
        }

        // Additional context for errors or slow requests
        if (statusCode >= 400 || duration > 1000) {
          LoggingUtil.debug(
            `Request details - IP: ${ip}, User-Agent: ${userAgent}`,
            'LoggingInterceptor',
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const errorMessage = `${method} ${url} [${userId}] - ${duration}ms (ERROR)`;

        LoggingUtil.error(errorMessage, undefined, 'LoggingInterceptor');
        LoggingUtil.error(
          `Error details - IP: ${ip}, User-Agent: ${userAgent}`,
          undefined,
          'LoggingInterceptor',
        );

        return throwError(() => error as Error);
      }),
    );
  }
}
