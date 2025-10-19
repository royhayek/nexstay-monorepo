import { applyDecorators } from '@nestjs/common';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem } from '../../database/schemas/catalog-item.schema';

/**
 * Custom validator constraint that validates against catalog items in the database
 * This replaces static enum validation with dynamic database-driven validation
 */
@ValidatorConstraint({ name: 'IsCatalogValue', async: true })
@Injectable()
export class IsCatalogValueConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(CatalogItem.name)
    private readonly catalogItemModel: Model<CatalogItem>,
  ) {}

  async validate(value: string | string[], args: ValidationArguments): Promise<boolean> {
    const [catalogType] = args.constraints;

    if (!value) {
      return true; // Let @IsOptional handle empty values
    }

    const values = Array.isArray(value) ? value : [value];

    try {
      // Query active catalog items for this type
      const validItems = await this.catalogItemModel
        .find({
          catalogType,
          key: { $in: values.map((v) => v.toUpperCase()) },
          isActive: true,
          deletedAt: null,
        })
        .select('key')
        .lean()
        .exec();

      const validKeys = new Set(validItems.map((item) => item.key));

      // Check if all provided values exist in catalog
      return values.every((v) => validKeys.has(v.toUpperCase()));
    } catch (error) {
      console.error(`Catalog validation error for ${catalogType}:`, error);
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [catalogType] = args.constraints;
    return `Invalid ${catalogType} value. Please provide a valid ${catalogType} from the catalog.`;
  }
}

/**
 * Decorator function to validate against catalog items
 *
 * @param catalogType - The type of catalog to validate against (e.g., 'PropertyType', 'RoomType')
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * @IsCatalogField('PropertyType', { description: 'Property type' })
 * propertyType: string;
 *
 * @IsCatalogField('RoomType', { required: false, description: 'Room type' })
 * roomType?: string;
 *
 * @IsCatalogField('Amenity', { isArray: true, description: 'Property amenities' })
 * amenities: string[];
 * ```
 */
export function IsCatalogField(
  catalogType: string,
  options?: {
    required?: boolean;
    isArray?: boolean;
    example?: unknown;
    description?: string;
    validationOptions?: ValidationOptions;
  },
) {
  const opts = options || {};
  const required = opts.required ?? true; // Default to required for consistency with IsEnumField
  const isArray = opts.isArray ?? false;
  const example = opts.example;
  const description = opts.description ?? `${catalogType} from catalog`;
  const validationOptions = opts.validationOptions ?? {};

  const decorators: Array<PropertyDecorator | MethodDecorator> = [];

  // Add Swagger documentation
  if (required) {
    decorators.push(
      ApiProperty({
        description: `${description} (validated against catalog)`,
        type: isArray ? [String] : String,
        example: example || (isArray ? ['APARTMENT', 'HOUSE'] : 'APARTMENT'),
        // Note: We can't provide enum values here as they're dynamic
        // The admin can see valid values via GET /v1/catalogs?include={catalogType}
      }),
    );
  } else {
    decorators.push(
      ApiPropertyOptional({
        description: `${description} (validated against catalog)`,
        type: isArray ? [String] : String,
        example: example || (isArray ? ['APARTMENT', 'HOUSE'] : 'APARTMENT'),
      }),
    );
  }

  // Add string validation
  if (isArray) {
    decorators.push(
      IsArray({ message: 'validation.MUST_BE_ARRAY', ...validationOptions }),
      IsString({ each: true, message: 'validation.MUST_BE_STRING', ...validationOptions }),
      ArrayUnique({ message: 'validation.ARRAY_UNIQUE', ...validationOptions }),
    );
  } else {
    decorators.push(IsString({ message: 'validation.MUST_BE_STRING', ...validationOptions }));
  }

  // Add custom catalog validator
  decorators.push(function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [catalogType],
      validator: IsCatalogValueConstraint,
    });
  });

  // Add optional decorator if not required
  if (!required) {
    decorators.push(IsOptional());
  }

  return applyDecorators(...decorators);
}
