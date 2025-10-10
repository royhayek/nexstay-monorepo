import { Logger } from '@nestjs/common';
import type { LogContext } from '../interfaces/logging.interfaces';

export class LoggingUtil {
  private static instances = new Map<string, Logger>();

  static getLogger(context?: string): Logger {
    const contextKey = context || 'Application';

    if (!this.instances.has(contextKey)) {
      this.instances.set(contextKey, new Logger(contextKey));
    }

    return this.instances.get(contextKey)!;
  }

  static log(message: string, context?: string, metadata?: LogContext): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);
    logger.log(formattedMessage);
  }

  static error(message: string, trace?: string, context?: string, metadata?: LogContext): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);

    if (trace) {
      logger.error(formattedMessage, trace);
    } else {
      logger.error(formattedMessage);
    }
  }

  static errorWithException(
    message: string,
    error: unknown,
    context?: string,
    metadata?: LogContext,
  ): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);

    if (error instanceof Error) {
      logger.error(formattedMessage, error.stack);
    } else {
      logger.error(formattedMessage, String(error));
    }
  }

  static warn(message: string, context?: string, metadata?: LogContext): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);
    logger.warn(formattedMessage);
  }

  static debug(message: string, context?: string, metadata?: LogContext): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);
    logger.debug(formattedMessage);
  }

  static verbose(message: string, context?: string, metadata?: LogContext): void {
    const logger = this.getLogger(context);
    const formattedMessage = this.formatMessage(message, metadata);
    logger.verbose(formattedMessage);
  }

  // Specialized methods for common patterns
  static seedLog(name: string, message: string, metadata?: Record<string, unknown>): void {
    this.log(`✅ ${name} ${message}`, 'Seeder', { metadata });
  }

  static seedError(name: string, error: Error, metadata?: Record<string, unknown>): void {
    this.errorWithException(`❌ Error seeding ${name}: ${error.message}`, error, 'Seeder', {
      metadata,
    });
  }

  static seedWarn(name: string, message: string, metadata?: Record<string, unknown>): void {
    this.warn(`🔄 ${name} ${message}`, 'Seeder', { metadata });
  }

  static seedSkip(name: string, reason?: string, metadata?: Record<string, unknown>): void {
    const reasonText = reason ? ` (${reason})` : '';
    this.log(`💡 ${name} already seeded, skipping${reasonText}`, 'Seeder', { metadata });
  }

  static migrationLog(message: string, metadata?: Record<string, unknown>): void {
    this.log(`🔄 ${message}`, 'Migration', { metadata });
  }

  static migrationSuccess(message: string, metadata?: Record<string, unknown>): void {
    this.log(`✅ ${message}`, 'Migration', { metadata });
  }

  static migrationError(message: string, error: Error, metadata?: Record<string, unknown>): void {
    this.errorWithException(`❌ ${message}: ${error.message}`, error, 'Migration', { metadata });
  }

  static debugLog(label: string, data?: unknown, context?: string): void {
    if (data !== undefined) {
      let dataStr: string;
      if (typeof data === 'object' && data !== null) {
        try {
          dataStr = JSON.stringify(data, null, 2);
        } catch {
          dataStr = '[Circular or non-serializable object]';
        }
      } else if (
        typeof data === 'string' ||
        typeof data === 'number' ||
        typeof data === 'boolean'
      ) {
        dataStr = String(data);
      } else {
        dataStr = 'undefined';
      }
      this.debug(`=== ${label} ===\n${dataStr}\n=== End ${label} ===`, context);
    } else {
      this.debug(`=== ${label} ===`, context);
    }
  }

  private static formatMessage(message: string, metadata?: LogContext): string {
    if (!metadata) return message;

    let formatted = message;

    if (metadata.userId) {
      formatted = `[User: ${metadata.userId}] ${formatted}`;
    }

    if (metadata.requestId) {
      formatted = `[Req: ${metadata.requestId}] ${formatted}`;
    }

    if (metadata.metadata && Object.keys(metadata.metadata).length > 0) {
      const metadataStr = JSON.stringify(metadata.metadata);
      formatted = `${formatted} | Metadata: ${metadataStr}`;
    }

    return formatted;
  }

  // Migration utility methods for easy replacement
  static consoleLog(message?: unknown, ...optionalParams: unknown[]): void {
    const combinedMessage = this.combineConsoleParams(message, ...optionalParams);
    this.log(combinedMessage, 'Console');
  }

  static consoleError(message?: unknown, ...optionalParams: unknown[]): void {
    const combinedMessage = this.combineConsoleParams(message, ...optionalParams);
    this.error(combinedMessage, undefined, 'Console');
  }

  static consoleWarn(message?: unknown, ...optionalParams: unknown[]): void {
    const combinedMessage = this.combineConsoleParams(message, ...optionalParams);
    this.warn(combinedMessage, 'Console');
  }

  private static combineConsoleParams(message?: unknown, ...optionalParams: unknown[]): string {
    const allParams = [message, ...optionalParams];
    return allParams
      .map((param) => {
        if (typeof param === 'object' && param !== null) {
          return JSON.stringify(param, null, 2);
        }
        return String(param);
      })
      .join(' ');
  }
}

// Export convenience methods for easy migration
export const log = (message: string, context?: string, metadata?: LogContext): void =>
  LoggingUtil.log(message, context, metadata);
export const error = (
  message: string,
  trace?: string,
  context?: string,
  metadata?: LogContext,
): void => LoggingUtil.error(message, trace, context, metadata);
export const errorWithException = (
  message: string,
  error: unknown,
  context?: string,
  metadata?: LogContext,
): void => LoggingUtil.errorWithException(message, error, context, metadata);
export const warn = (message: string, context?: string, metadata?: LogContext): void =>
  LoggingUtil.warn(message, context, metadata);
export const debug = (message: string, context?: string, metadata?: LogContext): void =>
  LoggingUtil.debug(message, context, metadata);
export const verbose = (message: string, context?: string, metadata?: LogContext): void =>
  LoggingUtil.verbose(message, context, metadata);

// Console replacement exports
export const consoleLog = (message?: unknown, ...optionalParams: unknown[]): void =>
  LoggingUtil.consoleLog(message, ...optionalParams);
export const consoleError = (message?: unknown, ...optionalParams: unknown[]): void =>
  LoggingUtil.consoleError(message, ...optionalParams);
export const consoleWarn = (message?: unknown, ...optionalParams: unknown[]): void =>
  LoggingUtil.consoleWarn(message, ...optionalParams);
