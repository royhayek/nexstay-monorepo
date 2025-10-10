import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { DateUtils } from '../utils/date.utils';
import { LoggingUtil } from '../utils/logging.util';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as Record<string, unknown>;
        message = (response.message as string) || exception.message;
        details = response.error || response.details;
      }
    } else {
      // Log unexpected errors for debugging
      LoggingUtil.errorWithException(
        `Unexpected error on ${request.method} ${request.url}:`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    const errorResponse: Record<string, unknown> = {
      status: 'error',
      statusCode: status,
      message,
      timestamp: DateUtils.now().toISOString(),
      path: request.url,
    };

    // Include validation details if available (for 400 errors)
    if (details && status === HttpStatus.BAD_REQUEST) {
      errorResponse.details = details;
    }

    response.status(status).json(errorResponse);
  }
}
