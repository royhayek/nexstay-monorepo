/**
 * Logging utility interfaces for type-safe logging operations
 * Provides comprehensive typing for logging across the application
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export interface LogContext {
  context?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
  stack?: string;
}
