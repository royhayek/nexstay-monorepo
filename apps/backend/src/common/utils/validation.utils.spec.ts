import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ValidationUtils } from './validation.utils';
import { LoggingUtil } from './logging.util';
import { DateUtils } from './date.utils';

// Mock LoggingUtil to prevent actual logging during tests
jest.mock('./logging.util', () => ({
  LoggingUtil: {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn(),
  },
}));

describe('ValidationUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateObjectId', () => {
    it('should validate a valid ObjectId string', () => {
      const validId = new Types.ObjectId().toString();
      const result = ValidationUtils.validateObjectId(validId, 'testId');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw BadRequestException for invalid ObjectId when throwOnError=true', () => {
      expect(() => {
        ValidationUtils.validateObjectId('invalid-id', 'testId');
      }).toThrow(BadRequestException);
    });

    it('should return invalid result for invalid ObjectId when throwOnError=false', () => {
      const result = ValidationUtils.validateObjectId('invalid-id', 'testId', {
        throwOnError: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('testId must be a valid ObjectId');
    });

    it('should handle null/undefined values when not required', () => {
      const result = ValidationUtils.validateObjectId(null, 'testId', {
        required: false,
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw error for null/undefined when required=true', () => {
      expect(() => {
        ValidationUtils.validateObjectId(null, 'testId', { required: true });
      }).toThrow(BadRequestException);
    });

    it('should reject non-string values', () => {
      expect(() => {
        ValidationUtils.validateObjectId(123, 'testId');
      }).toThrow('testId must be a string');
    });
  });

  describe('validateAndConvertObjectId', () => {
    it('should convert valid ObjectId string to Types.ObjectId', () => {
      const validId = new Types.ObjectId().toString();
      const result = ValidationUtils.validateAndConvertObjectId(validId, 'testId');

      expect(result).toBeInstanceOf(Types.ObjectId);
      expect(result.toString()).toBe(validId);
    });

    it('should throw error for invalid ObjectId', () => {
      expect(() => {
        ValidationUtils.validateAndConvertObjectId('invalid', 'testId');
      }).toThrow(BadRequestException);
    });
  });

  describe('validateObjectIdArray', () => {
    it('should validate array of valid ObjectIds', () => {
      const validIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()];

      const result = ValidationUtils.validateObjectIdArray(validIds, 'testIds');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject array with invalid ObjectIds', () => {
      const mixedIds = ['valid-id', 'invalid-id'];

      expect(() => {
        ValidationUtils.validateObjectIdArray(mixedIds, 'testIds');
      }).toThrow(BadRequestException);
    });

    it('should handle empty array based on allowEmpty setting', () => {
      const result = ValidationUtils.validateObjectIdArray([], 'testIds', {
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
    });

    it('should enforce maximum length', () => {
      const longArray = Array(1000).fill(new Types.ObjectId().toString());

      expect(() => {
        ValidationUtils.validateObjectIdArray(longArray, 'testIds', { maxItems: 100 });
      }).toThrow(BadRequestException);
    });
  });

  describe('validateEntityExists', () => {
    it('should not throw for existing entity', () => {
      const entity = { id: '123', name: 'test' };

      expect(() => {
        ValidationUtils.validateEntityExists(entity, '123');
      }).not.toThrow();
    });

    it('should throw NotFoundException for null entity', () => {
      expect(() => {
        ValidationUtils.validateEntityExists(null, '123');
      }).toThrow(NotFoundException);
    });

    it('should throw NotFoundException for undefined entity', () => {
      expect(() => {
        ValidationUtils.validateEntityExists(undefined, '123');
      }).toThrow(NotFoundException);
    });

    it('should include entityName in error message', () => {
      expect(() => {
        ValidationUtils.validateEntityExists(null, '123', {
          entityName: 'User',
        });
      }).toThrow('User with ID 123 not found');
    });
  });

  describe('validateDateRange', () => {
    const today = DateUtils.now();
    const tomorrow = DateUtils.create(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = DateUtils.create(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    it('should validate a valid date range', () => {
      const result = ValidationUtils.validateDateRange(tomorrow, nextWeek, {
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw error when end date is before start date', () => {
      expect(() => {
        ValidationUtils.validateDateRange(nextWeek, tomorrow);
      }).toThrow(BadRequestException);
    });

    it('should enforce minimum nights requirement', () => {
      expect(() => {
        ValidationUtils.validateDateRange(tomorrow, nextWeek, {
          minNights: 10,
        });
      }).toThrow(BadRequestException);
    });

    it('should enforce maximum nights limit', () => {
      const farFuture = DateUtils.create(today);
      farFuture.setDate(farFuture.getDate() + 365);

      expect(() => {
        ValidationUtils.validateDateRange(tomorrow, farFuture, {
          maxNights: 30,
        });
      }).toThrow(BadRequestException);
    });

    it('should handle past dates based on allowPast setting', () => {
      const yesterday = DateUtils.create(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const result = ValidationUtils.validateDateRange(yesterday, today, {
        allowPast: true,
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePrice', () => {
    it('should validate a valid price', () => {
      const result = ValidationUtils.validatePrice(100.5, 'price');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative prices', () => {
      expect(() => {
        ValidationUtils.validatePrice(-10, 'price');
      }).toThrow(BadRequestException);
    });

    it('should reject zero when allowZero=false', () => {
      expect(() => {
        ValidationUtils.validatePrice(0, 'price', { allowZero: false });
      }).toThrow(BadRequestException);
    });

    it('should allow zero when allowZero=true', () => {
      const result = ValidationUtils.validatePrice(0, 'price', {
        allowZero: true,
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
    });

    it('should handle non-numeric values', () => {
      expect(() => {
        ValidationUtils.validatePrice('not-a-number' as unknown as number, 'price');
      }).toThrow(BadRequestException);
    });
  });

  describe('validateArray', () => {
    it('should validate a valid array', () => {
      const arr = ['item1', 'item2', 'item3'];
      const result = ValidationUtils.validateArray(arr, 'items');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-array values', () => {
      expect(() => {
        ValidationUtils.validateArray('not-array' as unknown as unknown[], 'items');
      }).toThrow(BadRequestException);
    });

    it('should enforce minimum length', () => {
      expect(() => {
        ValidationUtils.validateArray(['one'], 'items', { minItems: 2 });
      }).toThrow(BadRequestException);
    });

    it('should enforce maximum length', () => {
      const longArray = new Array(10).fill('item');

      expect(() => {
        ValidationUtils.validateArray(longArray, 'items', { maxItems: 5 });
      }).toThrow(BadRequestException);
    });

    it('should handle empty arrays', () => {
      const result1 = ValidationUtils.validateArray([], 'items', {
        throwOnError: false,
      });
      expect(result1.isValid).toBe(true);
    });
  });

  describe('validateEmailFormat', () => {
    it('should validate a valid email', () => {
      const result = ValidationUtils.validateEmailFormat('test@example.com');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test@.com', ''];

      invalidEmails.forEach((email) => {
        expect(() => {
          ValidationUtils.validateEmailFormat(email);
        }).toThrow(BadRequestException);
      });
    });

    it('should handle empty email when not required', () => {
      const result = ValidationUtils.validateEmailFormat('', {
        throwOnError: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePhoneFormat', () => {
    it('should validate valid phone formats', () => {
      const validPhones = ['+1234567890', '+12345678901', '+123456789012'];

      validPhones.forEach((phone) => {
        const result = ValidationUtils.validatePhoneFormat(phone, { throwOnError: false });
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        'not-a-phone', // Contains letters
        '123', // Too short (< 7 digits)
        '+12345678901234567890', // Too long (> 15 digits)
      ];

      invalidPhones.forEach((phone) => {
        expect(() => {
          ValidationUtils.validatePhoneFormat(phone);
        }).toThrow(BadRequestException);
      });
    });
  });

  describe('validateCoordinates', () => {
    it('should validate valid coordinates', () => {
      const result = ValidationUtils.validateCoordinates(40.7128, -74.006, {
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid latitude', () => {
      expect(() => {
        ValidationUtils.validateCoordinates(91, -74.006);
      }).toThrow(BadRequestException);

      expect(() => {
        ValidationUtils.validateCoordinates(-91, -74.006);
      }).toThrow(BadRequestException);
    });

    it('should reject invalid longitude', () => {
      expect(() => {
        ValidationUtils.validateCoordinates(40.7128, 181);
      }).toThrow(BadRequestException);

      expect(() => {
        ValidationUtils.validateCoordinates(40.7128, -181);
      }).toThrow(BadRequestException);
    });

    it('should handle non-numeric coordinates', () => {
      expect(() => {
        ValidationUtils.validateCoordinates('not-number' as never, -74.006);
      }).toThrow(BadRequestException);
    });

    it('should validate boundary values', () => {
      // Test exact boundaries
      const result1 = ValidationUtils.validateCoordinates(90, 180, {
        throwOnError: false,
      });
      expect(result1.isValid).toBe(true);

      const result2 = ValidationUtils.validateCoordinates(-90, -180, {
        throwOnError: false,
      });
      expect(result2.isValid).toBe(true);
    });
  });

  describe('validateUserPermissions', () => {
    const userId = new Types.ObjectId().toString();
    const ownerId = new Types.ObjectId().toString();

    it('should validate when user owns the resource', () => {
      expect(() => {
        ValidationUtils.validateUserPermissions(userId, userId, 'update');
      }).not.toThrow();
    });

    it('should throw error when user does not own the resource', () => {
      expect(() => {
        ValidationUtils.validateUserPermissions(userId, ownerId, 'delete');
      }).toThrow();
    });

    it('should use correct error type', () => {
      expect(() => {
        ValidationUtils.validateUserPermissions(userId, ownerId, 'access');
      }).toThrow('User');
    });
  });

  describe('composeValidationResults', () => {
    it('should compose multiple validation results', () => {
      const results = [
        { isValid: true, errors: [], warnings: [] },
        { isValid: false, errors: ['Error 1'], warnings: [] },
        { isValid: true, errors: [], warnings: ['Warning 1'] },
      ];

      const composed = ValidationUtils.composeValidationResults(results);

      expect(composed.isValid).toBe(false);
      expect(composed.errors).toContain('Error 1');
      expect(composed.warnings).toContain('Warning 1');
    });

    it('should return valid result when all results are valid', () => {
      const results = [
        { isValid: true, errors: [], warnings: [] },
        { isValid: true, errors: [], warnings: [] },
      ];

      const composed = ValidationUtils.composeValidationResults(results);

      expect(composed.isValid).toBe(true);
      expect(composed.errors).toHaveLength(0);
    });

    it('should handle empty results array', () => {
      const composed = ValidationUtils.composeValidationResults([]);

      expect(composed.isValid).toBe(true);
      expect(composed.errors).toHaveLength(0);
    });
  });

  describe('error handling and logging', () => {
    it('should log validation warnings', () => {
      try {
        ValidationUtils.validateObjectId('invalid', 'testId');
      } catch {
        // Expected to throw
      }

      expect(jest.mocked(LoggingUtil).warn).toHaveBeenCalled();
    });

    it('should provide meaningful error messages', () => {
      expect(() => {
        ValidationUtils.validatePrice(-10, 'bookingPrice');
      }).toThrow('bookingPrice cannot be negative');

      expect(() => {
        ValidationUtils.validateArray('not-array' as unknown as unknown[], 'amenities');
      }).toThrow('amenities must be an array');
    });

    it('should include context in validation results', () => {
      const result = ValidationUtils.validateObjectId('invalid', 'testId', {
        throwOnError: false,
        context: 'TestService',
      });

      expect(result.context).toBe('TestService');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Test with optional validation
      const result = ValidationUtils.validateObjectId(undefined, 'optionalId', {
        required: false,
        throwOnError: false,
      });

      expect(result.isValid).toBe(true);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);

      expect(() => {
        ValidationUtils.validateObjectId(longString, 'id');
      }).toThrow(BadRequestException);
    });

    it('should validate ObjectId array with mixed valid/invalid IDs', () => {
      const validId = new Types.ObjectId().toString();
      const mixedIds = [validId, 'invalid-id'];

      expect(() => {
        ValidationUtils.validateObjectIdArray(mixedIds, 'ids');
      }).toThrow(BadRequestException);
    });

    it('should handle concurrent validation calls', async () => {
      const validId = new Types.ObjectId().toString();

      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(
          ValidationUtils.validateObjectId(validId, 'id', {
            throwOnError: false,
          }),
        ),
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle extreme date ranges', () => {
      const veryFarFuture = DateUtils.now();
      veryFarFuture.setDate(veryFarFuture.getDate() + 100); // 100 days in future
      const nextWeek = DateUtils.now();
      nextWeek.setDate(nextWeek.getDate() + 7);

      expect(() => {
        ValidationUtils.validateDateRange(veryFarFuture, veryFarFuture, {
          maxFutureDays: 30, // Limit to 30 days in future
        });
      }).toThrow(BadRequestException);
    });
  });
});
