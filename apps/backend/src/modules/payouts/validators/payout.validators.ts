import { applyDecorators } from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  ValidationOptions,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * Payout amount field validator
 */
export function IsPayoutAmountField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Payout amount',
    example = 500,
    minValue = 1,
    maxValue = 1000000,
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
    IsNumber(
      { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
      { message: 'validation.MUST_BE_NUMBER', ...validationOptions },
    ),
    Min(minValue, { message: 'validation.MIN_AMOUNT', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_AMOUNT', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Fee amount field validator
 */
export function IsFeeAmountField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  minValue?: number;
  maxValue?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Fee amount',
    example = 15,
    minValue = 0,
    maxValue = 100000,
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
    IsNumber(
      { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
      { message: 'validation.MUST_BE_NUMBER', ...validationOptions },
    ),
    Min(minValue, { message: 'validation.MIN_FEE', ...validationOptions }),
    Max(maxValue, { message: 'validation.MAX_FEE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Bank account number field validator
 */
export function IsBankAccountField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Bank account number',
    example = '1234567890',
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
    // Basic account number format (alphanumeric, hyphens allowed)
    Matches(/^[A-Za-z0-9-]{4,34}$/, {
      message: 'validation.INVALID_ACCOUNT_NUMBER',
      ...validationOptions,
    }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Bank routing number field validator
 */
export function IsBankRoutingField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Bank routing number',
    example = '123456789',
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
    // US routing number format (9 digits) or international formats
    Matches(/^[0-9]{9}$|^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
      message: 'validation.INVALID_ROUTING_NUMBER',
      ...validationOptions,
    }),
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
 * Wallet address field validator
 */
export function IsWalletAddressField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Digital wallet address',
    example = 'user@wallet.com',
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
    Length(3, 100, { message: 'validation.INVALID_LENGTH', ...validationOptions }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Payout reference field validator
 */
export function IsPayoutReferenceField(options?: {
  required?: boolean;
  description?: string;
  example?: string;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Unique payout reference',
    example = 'PO1642320000ABC123',
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
    Matches(/^[A-Z0-9]{2}[0-9]{10}[A-Z0-9]{6}$/, {
      message: 'validation.INVALID_REFERENCE_FORMAT',
      ...validationOptions,
    }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Minimum payout amount field validator
 */
export function IsMinimumPayoutField(options?: {
  required?: boolean;
  description?: string;
  example?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Minimum payout amount',
    example = 100,
    validationOptions = {},
  } = options || {};

  const decorators = [
    required
      ? ApiProperty({
          description,
          example,
          type: Number,
          minimum: 0,
          maximum: 10000,
        })
      : ApiPropertyOptional({
          description,
          example,
          type: Number,
          minimum: 0,
          maximum: 10000,
        }),
    Type(() => Number),
    IsNumber(
      { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
      { message: 'validation.MUST_BE_NUMBER', ...validationOptions },
    ),
    Min(0, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(10000, { message: 'validation.MAX_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}
