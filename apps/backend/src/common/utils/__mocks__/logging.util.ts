/**
 * Mock implementation of LoggingUtil for testing
 * This prevents error logs from appearing during tests while maintaining test functionality
 */

interface MockLogger {
  log: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
  verbose: jest.Mock;
}

export class LoggingUtil {
  private static instances = new Map<string, MockLogger>();

  static getLogger(context?: string): MockLogger {
    const contextKey = context || 'Application';
    if (!this.instances.has(contextKey)) {
      this.instances.set(contextKey, {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      });
    }
    return this.instances.get(contextKey)!;
  }

  static log = jest.fn();
  static error = jest.fn();
  static errorWithException = jest.fn();
  static warn = jest.fn();
  static debug = jest.fn();
  static verbose = jest.fn();

  static formatMessage(message: string, _metadata?: unknown): string {
    return message;
  }

  static formatRequestLog(
    req: { method: string; url: string },
    res: { statusCode: number },
    responseTime: number,
  ): string {
    return `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;
  }

  static formatErrorLog(error: { message?: string }, _req?: unknown): string {
    return error.message || 'Unknown error';
  }

  static reset(): void {
    this.log.mockClear();
    this.error.mockClear();
    this.errorWithException.mockClear();
    this.warn.mockClear();
    this.debug.mockClear();
    this.verbose.mockClear();
    this.instances.clear();
  }
}
