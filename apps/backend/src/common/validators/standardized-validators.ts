import { applyDecorators } from '@nestjs/common';
import {
  IsEmail,
  IsString,
  IsOptional,
  Length,
  Matches,
  IsDateString,
  IsEnum,
  IsArray,
  ArrayUnique,
  ArrayNotEmpty,
  ArrayMinSize,
  ArrayMaxSize,
  ValidationOptions,
  IsNotEmpty,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsUppercase,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * Standardized validation decorators with consistent Swagger documentation
 * These decorators combine validation, transformation, and API documentation
 */

export function IsEmailField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = 'user@example.com',
    description = 'Email address',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          format: 'email',
        })
      : ApiPropertyOptional({
          description,
          example,
          format: 'email',
        }),
    IsEmail(
      {},
      {
        message: 'validation.INVALID_EMAIL',
        ...validationOptions,
      },
    ),
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.toLowerCase().trim() : value,
    ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsPhoneField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = '+1234567890',
    description = 'Phone number in international format',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
        })
      : ApiPropertyOptional({
          description,
          example,
        }),
    Matches(/^\+?[1-9]\d{1,14}$/, {
      message: 'validation.INVALID_PHONE',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsNameField(options?: {
  required?: boolean;
  field?: 'firstName' | 'lastName' | 'name';
  description?: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    field = 'name',
    description,
    example,
    minLength = 1,
    maxLength = 50,
    validationOptions = {},
  } = options || {};

  const examples = {
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
  };

  const descriptions = {
    firstName: 'First name',
    lastName: 'Last name',
    name: 'Full name',
  };

  const decorators = [
    required
      ? ApiProperty({
          description: description || descriptions[field],
          example: example || examples[field],
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description: description || descriptions[field],
          example: example || examples[field],
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

export function IsPasswordField(options?: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    minLength = 8,
    maxLength = 64,
    example = 'MySecurePassword123!',
    description = `Password (${minLength}-${maxLength} characters with uppercase, lowercase, number and special character)`,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
      message: 'validation.INVALID_PASSWORD_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

export function IsUrlField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  allowCustomSchemes?: boolean;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = 'https://example.com',
    description = 'URL address',
    allowCustomSchemes = false,
    validationOptions = {},
  } = options || {};

  const urlOptions = allowCustomSchemes
    ? { require_protocol: true, require_tld: false, protocols: ['http', 'https', 'nexstay', 'app'] }
    : { require_tld: false };

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          format: 'uri',
        })
      : ApiPropertyOptional({
          description,
          example,
          format: 'uri',
        }),
    IsUrl(urlOptions, {
      message: 'validation.INVALID_URL',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsTextAreaField(options?: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    minLength = 0,
    maxLength = 1000,
    example = 'Description text...',
    description = 'Text content',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

export function IsDateField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = '1990-01-15',
    description = 'Date in ISO 8601 format',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          format: 'date',
        })
      : ApiPropertyOptional({
          description,
          example,
          format: 'date',
        }),
    IsDateString(
      {},
      {
        message: 'validation.INVALID_DATE',
        ...validationOptions,
      },
    ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsTimezoneField(options?: {
  required?: boolean;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Timezone identifier',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example: 'America/New_York',
        })
      : ApiPropertyOptional({
          description,
          example: 'America/New_York',
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    // Basic timezone format validation
    Matches(/^[A-Za-z_]+\/[A-Za-z_]+$/, {
      message: 'validation.INVALID_TIMEZONE',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsLocaleField(options?: {
  required?: boolean;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Locale identifier',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example: 'en-US',
        })
      : ApiPropertyOptional({
          description,
          example: 'en-US',
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    // Basic locale format validation (language-COUNTRY)
    Matches(/^[a-z]{2}-[A-Z]{2}$/, {
      message: 'validation.INVALID_LOCALE',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsLanguageField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = 'en',
    description = 'Language code',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength: 2,
          maxLength: 10,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength: 2,
          maxLength: 10,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(2, 10, {
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    // Basic language code format validation (ISO 639-1 or with region)
    Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
      message: 'validation.INVALID_LANGUAGE_CODE',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsEnumField<T extends Record<string, any>>(
  enumObjectOrArray: T | any[],
  options?: {
    required?: boolean;
    isArray?: boolean;
    example?: unknown;
    description?: string;
    validationOptions?: ValidationOptions;
  },
) {
  const opts = options || {};
  const required = opts.required ?? false;
  const isArray = opts.isArray ?? false;
  const example = opts.example;
  const validationOptions = opts.validationOptions ?? {};

  // Handle both arrays and enum objects
  const isInputArray = Array.isArray(enumObjectOrArray);
  let enumForValidator: T | Record<string, any>;
  let enumValues: any[];

  if (isInputArray) {
    // Convert array ['warning', 'urgent', 'critical'] to object { warning: 'warning', urgent: 'urgent', critical: 'critical' }
    enumForValidator = enumObjectOrArray.reduce((acc, value) => {
      // Handle both primitive values and enum values
      const key = typeof value === 'string' ? value : String(value);
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
    enumValues = enumObjectOrArray;
  } else {
    enumForValidator = enumObjectOrArray;
    enumValues = Object.values(enumObjectOrArray);
  }

  const description = opts.description ?? `Valid values: ${enumValues.join(', ')}`;

  const decorators = [
    required
      ? ApiProperty({
          description,
          enum: enumForValidator,
          isArray,
          example: example || (isArray ? [enumValues[0]] : enumValues[0]),
        })
      : ApiPropertyOptional({
          description,
          enum: enumForValidator,
          isArray,
          example: example || (isArray ? [enumValues[0]] : enumValues[0]),
        }),
    IsEnum(enumForValidator, {
      each: isArray,
      message: 'validation.INVALID_ENUM_VALUE',
      ...validationOptions,
    }),
  ];

  if (isArray) {
    decorators.push(
      IsArray({ message: 'validation.MUST_BE_ARRAY', ...validationOptions }),
      ArrayUnique({ message: 'validation.ARRAY_UNIQUE', ...validationOptions }),
    );
  }

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsUuidField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = '507f1f77bcf86cd799439011',
    description = 'Unique identifier',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
        })
      : ApiPropertyOptional({
          description,
          example,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    // For MongoDB ObjectId format
    Matches(/^[0-9a-fA-F]{24}$/, {
      message: 'validation.INVALID_ID_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsSearchField(options?: {
  required?: boolean;
  example?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = 'john',
    description = 'Search term',
    minLength = 0,
    maxLength = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) => value?.trim(), { toClassOnly: true }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

export function IsUuidArrayField(options?: {
  required?: boolean;
  example?: string[];
  description?: string;
  minItems?: number;
  maxItems?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    example = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    description = 'Array of unique identifiers',
    minItems = 1,
    maxItems = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: [String],
          minItems,
          maxItems,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: [String],
          minItems,
          maxItems,
        }),
    IsArray({ message: 'validation.MUST_BE_ARRAY', ...validationOptions }),
    ArrayUnique({ message: 'validation.ARRAY_UNIQUE', ...validationOptions }),
    IsString({ each: true, message: 'validation.MUST_BE_STRING', ...validationOptions }),
    // For MongoDB ObjectId format validation on each item
    Matches(/^[0-9a-fA-F]{24}$/, {
      each: true,
      message: 'validation.INVALID_ID_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(ArrayNotEmpty({ message: 'validation.ARRAY_NOT_EMPTY', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Page field for pagination
 */
export function IsPageField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Page number for pagination',
    example = 1,
    minValue = 1,
    maxValue = 1000,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    IsInt({ message: 'validation.MUST_BE_INTEGER', ...validationOptions }),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Limit field for pagination with max constraints
 */
export function IsLimitField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Number of items per page',
    example = 20,
    minValue = 1,
    maxValue = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    IsInt({ message: 'validation.MUST_BE_INTEGER', ...validationOptions }),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Currency code field (ISO 4217 codes)
 */
export function IsCurrencyCodeField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'ISO 4217 currency code',
    example = 'USD',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength: 3,
          maxLength: 3,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength: 3,
          maxLength: 3,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(3, 3, { message: 'validation.INVALID_LENGTH', ...validationOptions }),
    IsUppercase({ message: 'validation.MUST_BE_UPPERCASE', ...validationOptions }),
    // Common currency codes validation
    Matches(
      /^(USD|EUR|GBP|JPY|CAD|AUD|CHF|CNY|SEK|NZD|MXN|SGD|HKD|NOK|ZAR|TRY|BRL|INR|KRW|RUB|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|LYD)$/,
      {
        message: 'validation.INVALID_CURRENCY_CODE',
        ...validationOptions,
      },
    ),
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.toUpperCase().trim() : value,
    ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * String array field with validation
 */
export function IsStringArrayField(options?: {
  required?: boolean;
  description?: string;
  example?: string[];
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Array of text values',
    example = ['example1', 'example2'],
    minItems = 0,
    maxItems = 50,
    minLength = 1,
    maxLength = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: [String],
          minItems,
          maxItems,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: [String],
          minItems,
          maxItems,
        }),
    IsArray({ message: 'validation.MUST_BE_ARRAY', ...validationOptions }),
    ArrayMinSize(minItems, { message: 'validation.ARRAY_MIN_SIZE', ...validationOptions }),
    ArrayMaxSize(maxItems, { message: 'validation.ARRAY_MAX_SIZE', ...validationOptions }),
    IsString({ each: true, message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      each: true,
      message: 'validation.INVALID_LENGTH',
      ...validationOptions,
    }),
    Transform(({ value }: { value: unknown }) => {
      if (Array.isArray(value)) {
        return value.map((item: unknown) => (typeof item === 'string' ? item.trim() : item));
      }
      return value;
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(ArrayNotEmpty({ message: 'validation.ARRAY_NOT_EMPTY', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Boolean field with proper transformation
 */
export function IsBooleanField(options?: {
  required?: boolean;
  description?: string;
  example?: boolean;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Boolean value',
    example = true,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Boolean,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Boolean,
        }),
    Type(() => Boolean),
    IsBoolean({ message: 'validation.MUST_BE_BOOLEAN', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Guest count field validator with proper validation ranges
 */
export function IsGuestCountField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Number of guests',
    example = 1,
    minValue = 0,
    maxValue = 20,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    IsInt({ message: 'validation.MUST_BE_INTEGER', ...validationOptions }),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Rating field validator for review/rating values (1-5 scale with decimals)
 */
export function IsRatingField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Rating score',
    example = 4.5,
    minValue = 1,
    maxValue = 5,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    Min(minValue, { message: 'validation.MIN_RATING', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_RATING', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Time field validator for time strings (HH:MM format)
 */
export function IsTimeField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Time in HH:MM format',
    example = '15:00',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: String,
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
        })
      : ApiPropertyOptional({
          description,
          example,
          type: String,
          pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: 'validation.INVALID_TIME_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Number field validator with validation ranges
 */
export function IsNumberField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  isInteger?: boolean;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Numeric value',
    example = 0,
    minValue = 0,
    maxValue = Number.MAX_SAFE_INTEGER,
    isInteger = true,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
  ];

  if (isInteger) {
    decorators.push(IsInt({ message: 'validation.MUST_BE_INTEGER', ...validationOptions }));
  }

  decorators.push(
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
  );

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Identifier field that accepts both email and phone number formats
 */
export function IsIdentifierField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Email address or phone number',
    example = 'user@example.com',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
        })
      : ApiPropertyOptional({
          description,
          example,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.toLowerCase().trim() : value,
    ),
    Matches(/^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[1-9]\d{1,14})$/, {
      message: 'validation.INVALID_EMAIL_OR_PHONE',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * OTP code field validator for 6-digit codes
 */
export function IsOtpCodeField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  length?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = '6-digit verification code',
    example = '123456',
    length = 6,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength: length,
          maxLength: length,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength: length,
          maxLength: length,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(length, length, {
      message: 'validation.INVALID_OTP_LENGTH',
      ...validationOptions,
    }),
    Matches(new RegExp(`^\\d{${length}}$`), {
      message: 'validation.INVALID_OTP_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Price field validator for monetary amounts
 */
export function IsPriceField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  currency?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Price amount',
    example = 100.0,
    minValue = 0,
    maxValue = 999999.99,
    currency,
    validationOptions = {},
  } = options || {};

  const finalDescription = currency ? `${description} (${currency})` : description;

  const decorators = [
    required
      ? ApiProperty({
          description: finalDescription,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description: finalDescription,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
    Transform(({ value }: { value: unknown }) => parseFloat(value as string)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Coordinate field for latitude/longitude values
 */
export function IsCoordinateField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  type?: 'latitude' | 'longitude';
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description,
    example,
    type = 'latitude',
    validationOptions = {},
  } = options || {};

  const isLatitude = type === 'latitude';
  const defaultDescription = isLatitude ? 'Latitude coordinate' : 'Longitude coordinate';
  const defaultExample = isLatitude ? 40.7128 : -74.006;
  const minValue = isLatitude ? -90 : -180;
  const maxValue = isLatitude ? 90 : 180;

  const decorators = [
    required
      ? ApiProperty({
          description: description || defaultDescription,
          example: example || defaultExample,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description: description || defaultDescription,
          example: example || defaultExample,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    Min(minValue, { message: 'validation.INVALID_COORDINATE', ...validationOptions }),
    Max(maxValue, { message: 'validation.INVALID_COORDINATE', ...validationOptions }),
    Transform(({ value }: { value: unknown }) => parseFloat(value as string)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Address field for physical addresses
 */
export function IsAddressField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Physical address',
    example = '123 Main Street, City, Country',
    minLength = 10,
    maxLength = 500,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, { message: 'validation.INVALID_LENGTH', ...validationOptions }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.NOT_EMPTY', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Country code field (ISO 3166-1 alpha-2)
 */
export function IsCountryCodeField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Country code (ISO 3166-1 alpha-2)',
    example = 'US',
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength: 2,
          maxLength: 2,
          pattern: '^[A-Z]{2}$',
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength: 2,
          maxLength: 2,
          pattern: '^[A-Z]{2}$',
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(2, 2, { message: 'validation.INVALID_COUNTRY_CODE', ...validationOptions }),
    IsUppercase({ message: 'validation.MUST_BE_UPPERCASE', ...validationOptions }),
    Matches(/^[A-Z]{2}$/, { message: 'validation.INVALID_COUNTRY_CODE', ...validationOptions }),
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.toUpperCase().trim() : value,
    ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.NOT_EMPTY', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Postal/ZIP code field
 */
export function IsPostalCodeField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  minLength?: number;
  maxLength?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Postal/ZIP code',
    example = '10001',
    minLength = 3,
    maxLength = 10,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          minLength,
          maxLength,
        })
      : ApiPropertyOptional({
          description,
          example,
          minLength,
          maxLength,
        }),
    IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }),
    Length(minLength, maxLength, {
      message: 'validation.INVALID_POSTAL_CODE',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) =>
      typeof value === 'string' ? value.trim().replace(/\s+/g, '') : value,
    ),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.NOT_EMPTY', ...validationOptions }));
  }

  return applyDecorators(...decorators);
}

/**
 * Percentage field (0-100)
 */
export function IsPercentageField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Percentage value',
    example = 15.5,
    minValue = 0,
    maxValue = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Number,
          minimum: minValue,
          maximum: maxValue,
        }),
    Type(() => Number),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_VALUE', ...validationOptions }),
    Transform(({ value }: { value: unknown }) => parseFloat(value as string)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}
