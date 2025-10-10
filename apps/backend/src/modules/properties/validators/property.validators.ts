import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsInt, Min, Max, IsArray, ValidationOptions } from 'class-validator';

/**
 * Price field for property filtering
 */
export function IsPriceField(options?: {
  required?: boolean;
  fieldType: 'minimum' | 'maximum' | 'base' | 'perNight' | 'fee' | 'deposit';
  description?: string;
  example?: number;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    fieldType,
    description,
    example,
    validationOptions = {},
  } = options || {};

  let defaultDescription: string;
  let defaultExample: number;

  switch (fieldType) {
    case 'minimum':
      defaultDescription = 'Minimum price per night';
      defaultExample = 50;
      break;
    case 'maximum':
      defaultDescription = 'Maximum price per night';
      defaultExample = 500;
      break;
    case 'base':
      defaultDescription = 'Base price per night';
      defaultExample = 150;
      break;
    case 'perNight':
      defaultDescription = 'Price per night';
      defaultExample = 150;
      break;
    case 'fee':
      defaultDescription = 'Fee amount';
      defaultExample = 50;
      break;
    case 'deposit':
      defaultDescription = 'Deposit amount';
      defaultExample = 200;
      break;
    default:
      defaultDescription = 'Price amount';
      defaultExample = 100;
  }

  const decorators = [
    required
      ? ApiProperty({
          description: description || defaultDescription,
          example: example || defaultExample,
          minimum: 0,
        })
      : ApiPropertyOptional({
          description: description || defaultDescription,
          example: example || defaultExample,
          minimum: 0,
        }),
    Type(() => Number),
    IsNumber({}, { message: 'validation.MUST_BE_NUMBER', ...validationOptions }),
    Min(0, { message: 'validation.MIN_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Guest count field for property search
 */
export function IsGuestCountField(options?: {
  required?: boolean;
  description?: string;
  allowZero?: boolean;
  validationOptions?: ValidationOptions;
}) {
  const {
    required = false,
    description = 'Number of guests',
    allowZero = false,
    validationOptions = {},
  } = options || {};

  const minValue = allowZero ? 0 : 1;

  const decorators = [
    required
      ? ApiProperty({
          description,
          example: allowZero ? 0 : 2,
          minimum: minValue,
        })
      : ApiPropertyOptional({
          description,
          example: allowZero ? 0 : 2,
          minimum: minValue,
        }),
    Type(() => Number),
    IsInt({ message: 'validation.MUST_BE_INTEGER', ...validationOptions }),
    Min(minValue, { message: 'validation.MIN_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}

/**
 * Coordinate field (latitude or longitude)
 */
export function IsCoordinateField(options?: {
  required?: boolean;
  type: 'latitude' | 'longitude' | 'coordinates';
  description?: string;
  example?: number | [number, number];
  validationOptions?: ValidationOptions;
}) {
  const { required = false, type, description, example, validationOptions = {} } = options || {};

  if (type === 'coordinates') {
    // Special handling for coordinate arrays
    const decorators = [
      required
        ? ApiProperty({
            description: description || 'Coordinates [longitude, latitude]',
            example: example || [-122.4194, 37.7749],
            type: [Number],
          })
        : ApiPropertyOptional({
            description: description || 'Coordinates [longitude, latitude]',
            example: example || [-122.4194, 37.7749],
            type: [Number],
          }),
      IsArray({ message: 'validation.MUST_BE_ARRAY', ...validationOptions }),
    ];

    if (!required) {
      decorators.push(IsOptional());
    }

    return applyDecorators(...decorators);
  }

  const isLatitude = type === 'latitude';
  const defaultDescription = isLatitude
    ? 'Latitude for location-based search'
    : 'Longitude for location-based search';
  const defaultExample = isLatitude ? 37.7749 : -122.4194;
  const min = isLatitude ? -90 : -180;
  const max = isLatitude ? 90 : 180;

  const decorators = [
    required
      ? ApiProperty({
          description: description || defaultDescription,
          example: example || defaultExample,
          minimum: min,
          maximum: max,
        })
      : ApiPropertyOptional({
          description: description || defaultDescription,
          example: example || defaultExample,
          minimum: min,
          maximum: max,
        }),
    Type(() => Number),
    IsNumber({}, { message: 'validation.MUST_BE_NUMBER', ...validationOptions }),
    Min(min, { message: 'validation.MIN_VALUE', ...validationOptions }),
    Max(max, { message: 'validation.MAX_VALUE', ...validationOptions }),
  ];

  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}
