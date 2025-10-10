import type {
  JsonParseOptions,
  JsonStringifyOptions,
  JsonValidationResult,
} from '../interfaces/json.interfaces';
import { LoggingUtil } from './logging.util';

export class JsonUtils {
  private static readonly DEFAULT_MAX_DEPTH = 10;
  private static readonly CIRCULAR_REFERENCE_MARKER = '[Circular]';
  private static readonly NON_SERIALIZABLE_MARKER = '[Non-serializable]';

  /**
   * Safely parse JSON string with validation and error handling
   * @param jsonString - JSON string to parse
   * @param options - Parse options including fallback, schema validation, etc.
   * @returns Parsed object or fallback value
   */
  static safeParse<T = any>(
    jsonString: string | null | undefined,
    options: JsonParseOptions<T> = {},
  ): T | undefined {
    const { fallback, schema, maxDepth = this.DEFAULT_MAX_DEPTH, context = 'JsonUtils' } = options;

    if (!jsonString || typeof jsonString !== 'string') {
      if (fallback !== undefined) {
        LoggingUtil.debug(
          `safeParse: Invalid input (${typeof jsonString}), returning fallback`,
          context,
        );
        return fallback;
      }
      LoggingUtil.warn(
        `safeParse: Invalid input (${typeof jsonString}), returning undefined`,
        context,
      );
      return undefined;
    }

    try {
      const parsed: unknown = JSON.parse(jsonString);

      // Check depth to prevent stack overflow
      if (this.getObjectDepth(parsed) > maxDepth) {
        LoggingUtil.warn(`safeParse: Object depth exceeds maximum (${maxDepth})`, context);
        return fallback;
      }

      // Schema validation if provided
      if (schema && !schema(parsed)) {
        LoggingUtil.warn(`safeParse: Schema validation failed`, context);
        return fallback;
      }

      return parsed as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.warn(`safeParse: JSON parse failed - ${errorMessage}`, context);
      return fallback;
    }
  }

  /**
   * Safely stringify object with circular reference detection
   * @param obj - Object to stringify
   * @param options - Stringify options including space, replacer, etc.
   * @returns JSON string or error message
   */
  static safeStringify(obj: any, options: JsonStringifyOptions = {}): string {
    const {
      space = 0,
      replacer,
      maxDepth = this.DEFAULT_MAX_DEPTH,
      includeNonSerializable = false,
      context = 'JsonUtils',
    } = options;

    if (obj === null) return 'null';
    if (obj === undefined) return includeNonSerializable ? '"[undefined]"' : '{}';

    try {
      const seen = new WeakSet();
      let currentDepth = 0;

      const circularReplacer = (key: string, value: any): any => {
        // Handle depth limit
        if (currentDepth >= maxDepth) {
          return '[Max depth exceeded]';
        }

        if (typeof value === 'object' && value !== null) {
          // Handle circular references
          if (seen.has(value as WeakKey)) {
            return this.CIRCULAR_REFERENCE_MARKER;
          }
          seen.add(value as WeakKey);
          currentDepth++;
        }

        // Handle non-serializable values
        if (typeof value === 'function') {
          return includeNonSerializable ? '[Function]' : undefined;
        }
        if (typeof value === 'symbol') {
          return includeNonSerializable ? value.toString() : undefined;
        }
        if (typeof value === 'bigint') {
          return includeNonSerializable ? value.toString() : undefined;
        }
        if (value === undefined) {
          return includeNonSerializable ? '[undefined]' : undefined;
        }

        // Handle Date objects
        if (value instanceof Date) {
          return value.toISOString();
        }

        // Handle RegExp objects
        if (value instanceof RegExp) {
          return value.toString();
        }

        // Apply custom replacer if provided
        if (replacer) {
          return replacer(key, value);
        }

        return value;
      };

      return JSON.stringify(obj, circularReplacer, space);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`safeStringify: Failed to stringify object - ${errorMessage}`, context);
      return this.NON_SERIALIZABLE_MARKER;
    }
  }

  /**
   * Parse JSON with comprehensive validation result
   * @param jsonString - JSON string to parse
   * @param options - Parse options
   * @returns Validation result with success status and error details
   */
  static parseWithValidation<T = any>(
    jsonString: string | null | undefined,
    options: JsonParseOptions<T> = {},
  ): JsonValidationResult<T> {
    const { context = 'JsonUtils' } = options;

    if (!jsonString || typeof jsonString !== 'string') {
      return {
        success: false,
        error: `Invalid input: expected string, got ${typeof jsonString}`,
        context,
      };
    }

    try {
      const parsed: unknown = JSON.parse(jsonString);

      // Check object depth
      const depth = this.getObjectDepth(parsed);
      if (depth > (options.maxDepth || this.DEFAULT_MAX_DEPTH)) {
        return {
          success: false,
          error: `Object depth (${depth}) exceeds maximum (${options.maxDepth || this.DEFAULT_MAX_DEPTH})`,
          context,
        };
      }

      // Schema validation
      if (options.schema && !options.schema(parsed)) {
        return {
          success: false,
          error: 'Schema validation failed',
          context,
        };
      }

      return {
        success: true,
        data: parsed as T,
        context,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `JSON parse error: ${errorMessage}`,
        context,
      };
    }
  }

  /**
   * Check if string is valid JSON
   * @param jsonString - String to validate
   * @returns true if valid JSON, false otherwise
   */
  static isValidJson(jsonString: string | null | undefined): boolean {
    if (!jsonString || typeof jsonString !== 'string') {
      return false;
    }

    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Deep clone object using JSON parse/stringify with safe handling
   * @param obj - Object to clone
   * @param options - Clone options
   * @returns Deep cloned object or original if cloning fails
   */
  static deepClone<T>(obj: T, options: JsonStringifyOptions = {}): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    try {
      const jsonString = this.safeStringify(obj, options);
      if (jsonString === this.NON_SERIALIZABLE_MARKER) {
        LoggingUtil.warn(
          'deepClone: Object contains non-serializable values, returning original',
          'JsonUtils',
        );
        return obj;
      }
      return this.safeParse<T>(jsonString, { fallback: obj }) || obj;
    } catch {
      LoggingUtil.warn('deepClone: Failed to clone object, returning original', 'JsonUtils');
      return obj;
    }
  }

  /**
   * Compare two objects using JSON serialization
   * @param obj1 - First object
   * @param obj2 - Second object
   * @returns true if objects are equivalent when serialized
   */
  static deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return obj1 === obj2;
    if (obj1 === undefined || obj2 === undefined) return obj1 === obj2;

    try {
      const str1 = this.safeStringify(obj1, { space: 0 });
      const str2 = this.safeStringify(obj2, { space: 0 });
      return str1 === str2;
    } catch {
      return false;
    }
  }

  /**
   * Extract specific fields from JSON object
   * @param jsonString - JSON string to parse
   * @param fields - Array of field names to extract
   * @param options - Parse options
   * @returns Object with only specified fields
   */
  static extractFields<T extends Record<string, any>>(
    jsonString: string,
    fields: (keyof T)[],
    options: JsonParseOptions<T> = {},
  ): Partial<T> | undefined {
    const parsed = this.safeParse<T>(jsonString, options);
    if (!parsed || typeof parsed !== 'object') {
      return undefined;
    }

    const result: Partial<T> = {};
    fields.forEach((field) => {
      if (field in parsed) {
        result[field] = parsed[field];
      }
    });

    return result;
  }

  /**
   * Sanitize object for safe logging (remove sensitive information)
   * @param obj - Object to sanitize
   * @param sensitiveKeys - Array of keys to mask or remove
   * @param maskValue - Value to use for masking (default: '[REDACTED]')
   * @returns Sanitized object
   */
  static sanitizeForLogging(
    obj: any,
    sensitiveKeys: string[] = ['password', 'secret', 'token', 'key', 'credentials'],
    maskValue: string = '[REDACTED]',
  ): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sanitized = this.deepClone(obj);
    this.sanitizeObjectRecursive(sanitized, sensitiveKeys, maskValue);
    return sanitized;
  }

  /**
   * Convert object to pretty-printed JSON string for debugging
   * @param obj - Object to pretty print
   * @param options - Stringify options
   * @returns Formatted JSON string
   */
  static prettyPrint(obj: any, options: JsonStringifyOptions = {}): string {
    return this.safeStringify(obj, { ...options, space: options.space || 2 });
  }

  /**
   * Merge multiple JSON objects
   * @param objects - Array of objects to merge
   * @param deep - Whether to perform deep merge
   * @returns Merged object
   */
  static merge<T extends Record<string, any>>(...objects: Partial<T>[]): T {
    const result = {} as T;

    objects.forEach((obj) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach((key) => {
          const value = obj[key];
          if (value !== undefined) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              result[key as keyof T] = this.merge((result[key as keyof T] as any) || {}, value);
            } else {
              result[key as keyof T] = value as T[keyof T];
            }
          }
        });
      }
    });

    return result;
  }

  // Private helper methods

  private static getObjectDepth(obj: any, depth = 0): number {
    if (obj === null || typeof obj !== 'object') {
      return depth;
    }

    if (depth > this.DEFAULT_MAX_DEPTH) {
      return depth;
    }

    let maxChildDepth = depth;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const childDepth = this.getObjectDepth(obj[key], depth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
    }

    return maxChildDepth;
  }

  private static sanitizeObjectRecursive(
    obj: any,
    sensitiveKeys: string[],
    maskValue: string,

    visited = new WeakSet(),
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (obj === null || typeof obj !== 'object' || visited.has(obj)) {
      return;
    }

    visited.add(obj as WeakKey);

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some((sensitiveKey) =>
          lowerKey.includes(sensitiveKey.toLowerCase()),
        );

        if (isSensitive) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          obj[key] = maskValue;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          this.sanitizeObjectRecursive(obj[key], sensitiveKeys, maskValue, visited);
        }
      }
    }
  }
}

// Type guards for common validation scenarios
export const JsonTypeGuards = {
  isString: (value: any): value is string => typeof value === 'string',
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  isBoolean: (value: any): value is boolean => typeof value === 'boolean',
  isArray: (value: any): value is any[] => Array.isArray(value),
  isObject: (value: any): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isDate: (value: any): value is string => typeof value === 'string' && !isNaN(Date.parse(value)),
  isUuid: (value: any): value is string =>
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  isEmail: (value: any): value is string =>
    typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
};

// Common schema validators
export const JsonSchemas = {
  pagination: (value: any): value is { page: number; limit: number; total?: number } =>
    JsonTypeGuards.isObject(value) &&
    JsonTypeGuards.isNumber(value.page) &&
    JsonTypeGuards.isNumber(value.limit) &&
    value.page > 0 &&
    value.limit > 0,

  dateRange: (value: any): value is { startDate: string; endDate: string } =>
    JsonTypeGuards.isObject(value) &&
    JsonTypeGuards.isDate(value.startDate) &&
    JsonTypeGuards.isDate(value.endDate),

  coordinates: (value: any): value is { latitude: number; longitude: number } =>
    JsonTypeGuards.isObject(value) &&
    JsonTypeGuards.isNumber(value.latitude) &&
    JsonTypeGuards.isNumber(value.longitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    value.longitude >= -180 &&
    value.longitude <= 180,
};
