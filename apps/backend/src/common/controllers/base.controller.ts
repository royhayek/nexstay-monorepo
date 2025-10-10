import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  RequestTimeoutException,
} from '@nestjs/common';
import { Error as MongooseError } from 'mongoose';
import { I18nService } from 'nestjs-i18n';
import { DateUtils } from '../utils/date.utils';
import { ErrorCodeEnum, ErrorSeverityEnum } from '../enums/error-codes.enums';
import { LoggingUtil } from '../utils/logging.util';
import { JsonUtils } from '../utils/json.utils';

/**
 * Standard metadata interface for responses
 */
export interface ResponseMetadata {
  timestamp?: string;
  requestId?: string;
  executionTime?: number;
  [key: string]: unknown;
}

/**
 * Standard success response interface
 */
export interface StandardResponse<T> {
  status: 'success';
  title: string;
  message: string;
  data: T;
  metadata?: ResponseMetadata;
}

/**
 * Paginated data structure for operations
 */
export interface PaginatedOperationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Enhanced error context for better debugging and monitoring
 */
export interface ErrorContext {
  operation: string;
  errorCode?: ErrorCodeEnum;
  severity?: ErrorSeverityEnum;
  userId?: string;
  requestId?: string;
  timestamp: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Retry configuration for operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
}

/**
 * Base controller with common error handling patterns
 * Use this as a base class for all controllers to ensure consistent error handling
 */
export abstract class BaseController {
  constructor(protected readonly i18nService?: I18nService) {}

  /**
   * Enhanced error logging with context
   * @param error The error to log
   * @param context Error context information
   */
  protected logError(error: unknown, context: ErrorContext): void {
    const errorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    // Log based on severity
    const contextName = this.constructor.name;
    switch (context.severity) {
      case ErrorSeverityEnum.CRITICAL:
        LoggingUtil.error(JsonUtils.safeStringify(errorInfo), errorInfo.stack, contextName);
        break;
      case ErrorSeverityEnum.HIGH:
        LoggingUtil.error(JsonUtils.safeStringify(errorInfo), errorInfo.stack, contextName);
        break;
      case ErrorSeverityEnum.MEDIUM:
        LoggingUtil.warn(JsonUtils.safeStringify(errorInfo), contextName);
        break;
      case ErrorSeverityEnum.LOW:
      default:
        LoggingUtil.debug(JsonUtils.safeStringify(errorInfo), contextName);
        break;
    }
  }

  /**
   * Get translated message
   */
  protected getTranslation(key: string, fallback: string = key): string {
    if (this.i18nService) {
      try {
        return this.i18nService.t(key) || fallback;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  /**
   * Enhanced error handler with better categorization and logging
   * @param error The caught error
   * @param operation Description of the operation that failed
   * @param fallbackMessage Message to show users for unknown errors
   * @param context Additional context for error tracking
   */
  protected handleError(
    error: unknown,
    operation: string,
    fallbackMessage = 'Operation failed',
    context?: Partial<ErrorContext>,
  ): never {
    // Create error context for logging
    const errorContext: ErrorContext = {
      operation,
      timestamp: DateUtils.now().toISOString(),
      severity: ErrorSeverityEnum.MEDIUM,
      ...context,
    };

    // Re-throw known NestJS HTTP exceptions with enhanced logging
    if (error instanceof HttpException) {
      this.logError(error, errorContext);
      throw error;
    }

    // Handle Mongoose validation errors
    if (error instanceof MongooseError.ValidationError) {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      const translatedMessage = this.getTranslation(
        'errors.VALIDATION_FAILED',
        `Validation failed: ${message}`,
      );
      errorContext.errorCode = ErrorCodeEnum.VALIDATION_FAILED;
      errorContext.severity = ErrorSeverityEnum.LOW;
      this.logError(error, errorContext);
      throw new BadRequestException(translatedMessage);
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (error instanceof MongooseError.CastError) {
      const translatedMessage = this.getTranslation(
        'errors.INVALID_ID_FORMAT',
        `Invalid ${error.path}: ${error.value}`,
      );
      errorContext.errorCode = ErrorCodeEnum.INVALID_ID_FORMAT;
      errorContext.severity = ErrorSeverityEnum.LOW;
      this.logError(error, errorContext);
      throw new BadRequestException(translatedMessage);
    }

    // Handle duplicate key errors (MongoDB 11000)
    if (
      error instanceof Error &&
      typeof (error as { code?: unknown }).code !== 'undefined' &&
      (error as { code?: unknown }).code === 11000
    ) {
      const translatedMessage = this.getTranslation(
        'errors.DUPLICATE_RESOURCE',
        'Resource already exists',
      );
      errorContext.errorCode = ErrorCodeEnum.DUPLICATE_RESOURCE;
      errorContext.severity = ErrorSeverityEnum.LOW;
      this.logError(error, errorContext);
      throw new ConflictException(translatedMessage);
    }

    // Handle timeout errors
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.message.includes('timeout'))
    ) {
      const translatedMessage = this.getTranslation(
        'errors.TIMEOUT_ERROR',
        'Operation timed out. Please try again.',
      );
      errorContext.errorCode = ErrorCodeEnum.TIMEOUT_ERROR;
      errorContext.severity = ErrorSeverityEnum.MEDIUM;
      this.logError(error, errorContext);
      throw new RequestTimeoutException(translatedMessage);
    }

    // Handle custom error messages from services
    if (error instanceof Error) {
      const errorMappings = {
        FORBIDDEN: () =>
          new ForbiddenException(this.getTranslation('errors.ACCESS_DENIED', 'Access denied')),
        NOT_FOUND: () =>
          new NotFoundException(
            this.getTranslation('errors.RESOURCE_NOT_FOUND', 'Resource not found'),
          ),
        INVALID_DATES: () =>
          new BadRequestException(
            this.getTranslation(
              'errors.INVALID_DATE_FORMAT',
              'Invalid date format. Use YYYY-MM-DD.',
            ),
          ),
        UNAUTHORIZED: () =>
          new UnauthorizedException(this.getTranslation('errors.UNAUTHORIZED', 'Unauthorized')),
        CONFLICT: () =>
          new ConflictException(
            this.getTranslation('errors.RESOURCE_CONFLICT', 'Resource conflict'),
          ),
        PROPERTY_DELETED: () =>
          new BadRequestException(
            this.getTranslation(
              'errors.PROPERTY_DELETED',
              'Cannot update status of a deleted property',
            ),
          ),
      };

      const errorKey = error.message as keyof typeof errorMappings;
      if (errorMappings[errorKey]) {
        throw errorMappings[errorKey]();
      }

      if (error.message.includes('required') || error.message.includes('validation')) {
        throw new BadRequestException(error.message);
      }
    }

    // Log unexpected errors for debugging
    LoggingUtil.error(
      `${operation} failed`,
      error instanceof Error ? error.stack : undefined,
      this.constructor.name,
    );

    // Throw generic error for unknown exceptions
    const translatedFallback = this.getTranslation('errors.INTERNAL_SERVER_ERROR', fallbackMessage);
    throw new InternalServerErrorException(translatedFallback);
  }

  /**
   * Execute operation with retry logic for transient failures
   * @param operation The operation to retry
   * @param config Retry configuration
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      exponentialBackoff: true,
    },
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry for client errors (4xx) or final attempt
        if (
          attempt === config.maxAttempts ||
          (error instanceof HttpException && error.getStatus() < 500)
        ) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = config.exponentialBackoff
          ? Math.min(config.baseDelayMs * Math.pow(2, attempt - 1), config.maxDelayMs)
          : config.baseDelayMs;

        await new Promise((resolve) => setTimeout(resolve, delay));

        LoggingUtil.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms... Error: ${error instanceof Error ? error.message : String(error)}`,
          this.constructor.name,
        );
      }
    }

    throw lastError;
  }

  /**
   * Execute a service method with standard error handling
   * @param operation The service operation to execute
   * @param operationName Description for logging
   * @param fallbackMessage User-friendly error message
   * @param context Additional error context
   */
  protected async executeWithErrorHandling<T>(
    operation: () => Promise<T> | T,
    operationName: string,
    fallbackMessage?: string,
    context?: Partial<ErrorContext>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, operationName, fallbackMessage, context);
    }
  }

  /**
   * Execute a service method with standard error handling and wrap response with message
   * @param operation The service operation to execute
   * @param operationName Description for logging
   * @param title Success title to include in response
   * @param successMessage Success message to include in response
   * @param fallbackMessage User-friendly error message
   */
  protected async executeWithErrorHandlingAndMessage<T>(
    operation: () => Promise<T> | T,
    operationName: string,
    title: string,
    successMessage: string,
    fallbackMessage?: string,
    metadata?: ResponseMetadata,
  ): Promise<StandardResponse<T>> {
    const startTime = DateUtils.nowTimestamp();
    try {
      const data = await operation();
      const executionTime = DateUtils.nowTimestamp() - startTime;

      const responseMetadata: ResponseMetadata = {
        timestamp: DateUtils.now().toISOString(),
        executionTime,
        ...metadata,
      };

      return this.createSuccessResponse(data, title, successMessage, responseMetadata);
    } catch (error) {
      this.handleError(error, operationName, fallbackMessage);
    }
  }

  /**
   * Create a standardized success response
   * @param data The response data
   * @param title Success title
   * @param message Success message
   * @param metadata Optional metadata
   */
  protected createSuccessResponse<T>(
    data: T,
    title: string,
    message: string,
    metadata?: ResponseMetadata,
  ): {
    status: 'success';
    title: string;
    message: string;
    data: T;
    metadata?: ResponseMetadata;
  } {
    const translatedTitle = this.getTranslation(title, title);
    const translatedMessage = this.getTranslation(message, message);

    const response: {
      status: 'success';
      title: string;
      message: string;
      data: T;
      metadata?: ResponseMetadata;
    } = {
      status: 'success',
      title: translatedTitle,
      message: translatedMessage,
      data,
    };

    if (metadata) {
      response.metadata = metadata;
    }

    return response;
  }

  /**
   * Create a paginated success response
   * @param items The array of items
   * @param total Total number of items
   * @param page Current page
   * @param limit Items per page
   * @param title Success title
   * @param message Success message
   */
  protected createPaginatedResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    title: string,
    message: string,
  ): {
    status: 'success';
    title: string;
    message: string;
    data: {
      items: T[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage?: number;
        previousPage?: number;
      };
    };
  } {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      status: 'success',
      title,
      message,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
          nextPage: hasNextPage ? page + 1 : undefined,
          previousPage: hasPreviousPage ? page - 1 : undefined,
        },
      },
    };
  }

  /**
   * Execute operation and return paginated response
   * @param operation The paginated service operation
   * @param operationName Description for logging
   * @param title Success title
   * @param successMessage Success message
   * @param fallbackMessage Error message
   */
  protected async executeWithPaginatedResponse<T>(
    operation: () => Promise<PaginatedOperationResult<T>>,
    operationName: string,
    title: string,
    successMessage: string,
    fallbackMessage?: string,
  ) {
    try {
      const result = await operation();
      return this.createPaginatedResponse(
        result.items,
        result.total,
        result.page,
        result.limit,
        title,
        successMessage,
      );
    } catch (error) {
      this.handleError(error, operationName, fallbackMessage);
    }
  }
}
