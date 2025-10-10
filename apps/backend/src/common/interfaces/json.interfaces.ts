/**
 * JSON utility interfaces for type-safe JSON operations
 * Provides comprehensive typing for JSON handling across the application
 */

export interface JsonParseOptions<T = any> {
  fallback?: T;
  schema?: (value: any) => value is T;
  maxDepth?: number;
  allowCircular?: boolean;
  context?: string;
}

export interface JsonStringifyOptions {
  space?: number;
  replacer?: (key: string, value: any) => any;
  maxDepth?: number;
  includeNonSerializable?: boolean;
  context?: string;
}

export interface JsonValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  context?: string;
}
