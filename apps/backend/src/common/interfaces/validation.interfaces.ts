/**
 * Validation utility interfaces for type-safe validation operations
 * Provides comprehensive typing for validation handling across the application
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  context?: string;
}

export interface ValidationOptions {
  throwOnError?: boolean;
  context?: string;
  includeWarnings?: boolean;
  customMessage?: string;
}

export interface ObjectIdValidationOptions extends ValidationOptions {
  required?: boolean;
  allowEmpty?: boolean;
}

export interface DateRangeValidationOptions extends ValidationOptions {
  allowToday?: boolean;
  allowPast?: boolean;
  maxFutureDays?: number;
  minNights?: number;
  maxNights?: number;
}

export interface BusinessRuleValidationOptions extends ValidationOptions {
  entityType?: string;
  operationType?: string;
  userId?: string;
}

export interface PriceValidationOptions extends ValidationOptions {
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  allowZero?: boolean;
}

export interface ArrayValidationOptions extends ValidationOptions {
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  itemValidator?: (item: any) => ValidationResult;
}

export interface EntityExistenceOptions extends ValidationOptions {
  entityName?: string;
  checkPermissions?: boolean;
  userId?: string;
}
