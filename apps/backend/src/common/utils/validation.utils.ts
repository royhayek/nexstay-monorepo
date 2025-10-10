import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DateUtils } from './date.utils';
import { LoggingUtil } from './logging.util';
import type {
  ValidationResult,
  ValidationOptions,
  ObjectIdValidationOptions,
  DateRangeValidationOptions,
  BusinessRuleValidationOptions,
  PriceValidationOptions,
  ArrayValidationOptions,
  EntityExistenceOptions,
} from '../interfaces/validation.interfaces';

/**
 * Enhanced Validation Utility
 * Provides comprehensive validation patterns beyond field validation
 * Eliminates repetitive validation code across services
 */
export class ValidationUtils {
  /**
   * Validate MongoDB ObjectId with comprehensive options
   */
  static validateObjectId(
    value: any,
    fieldName: string,
    options: ObjectIdValidationOptions = {},
  ): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils', required = true } = options;
    const errors: string[] = [];

    // Check if value is provided when required
    if (!value) {
      if (required) {
        errors.push(`${fieldName} is required`);
      }
    } else if (typeof value === 'string') {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(value)) {
        errors.push(`${fieldName} must be a valid ObjectId`);
      }
    } else {
      errors.push(`${fieldName} must be a string`);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(
        `ObjectId validation failed for ${fieldName}: ${errors.join(', ')}`,
        context,
      );
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate ObjectId and convert to Types.ObjectId
   */
  static validateAndConvertObjectId(value: unknown, fieldName: string): Types.ObjectId {
    this.validateObjectId(value, fieldName, { throwOnError: true });
    return new Types.ObjectId(value as string);
  }

  /**
   * Validate array of ObjectIds
   */
  static validateObjectIdArray(
    values: any[],
    fieldName: string,
    options: ArrayValidationOptions = {},
  ): ValidationResult {
    const {
      throwOnError = true,
      context = 'ValidationUtils',
      minItems,
      maxItems,
      uniqueItems = true,
    } = options;
    const errors: string[] = [];

    if (!Array.isArray(values)) {
      errors.push(`${fieldName} must be an array`);
    } else {
      // Check array length constraints
      if (minItems !== undefined && values.length < minItems) {
        errors.push(`${fieldName} must contain at least ${minItems} items`);
      }
      if (maxItems !== undefined && values.length > maxItems) {
        errors.push(`${fieldName} must contain at most ${maxItems} items`);
      }

      // Validate each ObjectId in the array
      const invalidIds: string[] = [];
      const seenIds = new Set<string>();

      values.forEach((value, index) => {
        if (!Types.ObjectId.isValid(value as string)) {
          invalidIds.push(`index ${index}`);
        } else if (uniqueItems) {
          const stringValue = String(value);
          if (seenIds.has(stringValue)) {
            errors.push(`Duplicate ObjectId found at index ${index}: ${stringValue}`);
          }
          seenIds.add(stringValue);
        }
      });

      if (invalidIds.length > 0) {
        errors.push(`Invalid ObjectIds in ${fieldName} at: ${invalidIds.join(', ')}`);
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(
        `ObjectId array validation failed for ${fieldName}: ${errors.join(', ')}`,
        context,
      );
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate date range for bookings, searches, reports
   */
  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date,
    options: DateRangeValidationOptions = {},
  ): ValidationResult {
    const {
      throwOnError = true,
      context = 'ValidationUtils',
      allowToday = false,
      allowPast = false,
      maxFutureDays,
      minNights = 1,
      maxNights,
    } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const start = DateUtils.parseDate(startDate);
      const end = DateUtils.parseDate(endDate);
      const now = DateUtils.now();
      const today = DateUtils.startOfDay(now);

      // Validate date parsing
      if (!DateUtils.isValidDate(start)) {
        errors.push('Start date is invalid');
      }
      if (!DateUtils.isValidDate(end)) {
        errors.push('End date is invalid');
      }

      if (errors.length === 0) {
        // Check if end date is after start date
        if (!DateUtils.isAfter(end, start)) {
          errors.push('End date must be after start date');
        }

        // Check past dates
        if (!allowPast) {
          const startOfStartDate = DateUtils.startOfDay(start);
          if (
            allowToday
              ? DateUtils.isBefore(startOfStartDate, today)
              : !DateUtils.isAfter(startOfStartDate, today)
          ) {
            errors.push(
              allowToday
                ? 'Start date cannot be in the past'
                : 'Start date cannot be today or in the past',
            );
          }
        }

        // Check maximum future constraint
        if (maxFutureDays) {
          const maxFutureDate = DateUtils.addDays(today, maxFutureDays);
          if (DateUtils.isAfter(start, maxFutureDate)) {
            warnings.push(`Start date is more than ${maxFutureDays} days in the future`);
          }
        }

        // Check nights constraints
        const nights = DateUtils.daysBetween(start, end);
        if (nights < minNights) {
          errors.push(`Minimum ${minNights} night(s) required`);
        }
        if (maxNights && nights > maxNights) {
          errors.push(`Maximum ${maxNights} nights allowed`);
        }
      }
    } catch (error) {
      errors.push(`Date parsing error: ${error instanceof Error ? error.message : String(error)}`);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Date range validation failed: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate price amounts with currency and range constraints
   */
  static validatePrice(
    amount: number,
    fieldName: string,
    options: PriceValidationOptions = {},
  ): ValidationResult {
    const {
      throwOnError = true,
      context = 'ValidationUtils',
      minAmount = 0,
      maxAmount,
      allowZero = false,
      currency,
    } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if amount is a valid number
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      errors.push(`${fieldName} must be a valid number`);
    } else {
      // Check negative amounts
      if (amount < 0) {
        errors.push(`${fieldName} cannot be negative`);
      }

      // Check zero amounts
      if (amount === 0 && !allowZero) {
        errors.push(`${fieldName} cannot be zero`);
      }

      // Check minimum amount
      if (amount < minAmount) {
        errors.push(`${fieldName} must be at least ${minAmount}${currency ? ` ${currency}` : ''}`);
      }

      // Check maximum amount
      if (maxAmount && amount > maxAmount) {
        errors.push(`${fieldName} cannot exceed ${maxAmount}${currency ? ` ${currency}` : ''}`);
      }

      // Check for suspicious amounts
      if (amount > 100000) {
        warnings.push(`${fieldName} is unusually high: ${amount}${currency ? ` ${currency}` : ''}`);
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Price validation failed for ${fieldName}: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate entity existence (for foreign key references)
   */
  static validateEntityExists(
    entity: any,
    entityId: string,
    options: EntityExistenceOptions = {},
  ): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils', entityName = 'Entity' } = options;
    const errors: string[] = [];

    if (!entity) {
      errors.push(`${entityName} with ID ${entityId} not found`);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Entity existence validation failed: ${errors.join(', ')}`, context);
      throw new NotFoundException(errors[0]);
    }

    return result;
  }

  /**
   * Validate user permissions for entity operations
   */
  static validateUserPermissions(
    userId: string,
    ownerId: string,
    operation: string,
    options: BusinessRuleValidationOptions = {},
  ): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils', entityType = 'resource' } = options;
    const errors: string[] = [];

    if (userId !== ownerId) {
      errors.push(`User ${userId} is not authorized to ${operation} this ${entityType}`);
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Permission validation failed: ${errors.join(', ')}`, context);
      throw new UnauthorizedException(errors[0]);
    }

    return result;
  }

  /**
   * Validate array constraints (length, uniqueness, etc.)
   */
  static validateArray<T>(
    array: T[],
    fieldName: string,
    options: ArrayValidationOptions = {},
  ): ValidationResult {
    const {
      throwOnError = true,
      context = 'ValidationUtils',
      minItems,
      maxItems,
      uniqueItems = false,
      itemValidator,
    } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(array)) {
      errors.push(`${fieldName} must be an array`);
    } else {
      // Check length constraints
      if (minItems !== undefined && array.length < minItems) {
        errors.push(`${fieldName} must contain at least ${minItems} items`);
      }
      if (maxItems !== undefined && array.length > maxItems) {
        errors.push(`${fieldName} must contain at most ${maxItems} items`);
      }

      // Check uniqueness
      if (uniqueItems) {
        const seen = new Set();
        const duplicates: number[] = [];
        array.forEach((item, index) => {
          const key = JSON.stringify(item);
          if (seen.has(key)) {
            duplicates.push(index);
          }
          seen.add(key);
        });
        if (duplicates.length > 0) {
          errors.push(`Duplicate items found in ${fieldName} at indices: ${duplicates.join(', ')}`);
        }
      }

      // Validate individual items
      if (itemValidator) {
        array.forEach((item, index) => {
          try {
            const itemResult = itemValidator(item);
            if (!itemResult.isValid) {
              errors.push(`Invalid item at index ${index}: ${itemResult.errors.join(', ')}`);
            }
            warnings.push(...itemResult.warnings);
          } catch (error) {
            errors.push(
              `Validation error at index ${index}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        });
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Array validation failed for ${fieldName}: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate email format (enhanced beyond standard validators)
   */
  static validateEmailFormat(email: string, options: ValidationOptions = {}): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils' } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email is required and must be a string');
    } else {
      // Enhanced email regex with better validation
      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      } else {
        // Check for suspicious patterns
        if (email.includes('..')) {
          warnings.push('Email contains consecutive dots');
        }
        if (email.length > 254) {
          errors.push('Email exceeds maximum length (254 characters)');
        }
        const [localPart, domain] = email.split('@');
        if (localPart.length > 64) {
          errors.push('Email local part exceeds maximum length (64 characters)');
        }
        if (domain.length > 253) {
          errors.push('Email domain exceeds maximum length (253 characters)');
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Email validation failed: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate phone number format with international support
   */
  static validatePhoneFormat(phone: string, options: ValidationOptions = {}): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils' } = options;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!phone || typeof phone !== 'string') {
      errors.push('Phone number is required and must be a string');
    } else {
      // Remove common formatting characters
      const cleanPhone = phone.replace(/[\s\-()\\+]/g, '');

      // Check if it's all digits
      if (!/^\d+$/.test(cleanPhone)) {
        errors.push('Phone number must contain only digits and formatting characters');
      } else {
        // Check length constraints
        if (cleanPhone.length < 7) {
          errors.push('Phone number is too short');
        }
        if (cleanPhone.length > 15) {
          errors.push('Phone number is too long');
        }

        // Check for international format
        if (phone.startsWith('+') && cleanPhone.length < 10) {
          warnings.push('International phone number seems short');
        }
      }
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Phone validation failed: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Validate coordinate values (latitude/longitude)
   */
  static validateCoordinates(
    latitude: number,
    longitude: number,
    options: ValidationOptions = {},
  ): ValidationResult {
    const { throwOnError = true, context = 'ValidationUtils' } = options;
    const errors: string[] = [];

    if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
      errors.push('Latitude must be a valid number');
    } else if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }

    if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
      errors.push('Longitude must be a valid number');
    } else if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      context,
    };

    if (throwOnError && !result.isValid) {
      LoggingUtil.warn(`Coordinate validation failed: ${errors.join(', ')}`, context);
      throw new BadRequestException(errors[0]);
    }

    return result;
  }

  /**
   * Compose multiple validation results
   */
  static composeValidationResults(results: ValidationResult[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let isValid = true;

    results.forEach((result) => {
      if (!result.isValid) {
        isValid = false;
      }
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      context: 'ComposedValidation',
    };
  }
}
