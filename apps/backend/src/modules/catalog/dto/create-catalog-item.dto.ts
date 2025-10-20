import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  IsBoolean,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateCatalogItemDto {
  @ApiProperty({
    description: 'Catalog type (e.g., PropertyType, Amenity, RoomType)',
    example: 'Amenity',
  })
  @IsString()
  catalogType: string;

  @ApiProperty({
    description: 'Unique key (uppercase)',
    example: 'WIFI',
  })
  @IsString()
  @Matches(/^[A-Z0-9_]+$/, { message: 'Key must be uppercase alphanumeric with underscores' })
  key: string;

  @ApiProperty({
    description: 'URL-friendly slug (lowercase)',
    example: 'wifi',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with hyphens' })
  slug: string;

  @ApiProperty({
    description: 'Internationalized labels (language codes are configurable)',
    example: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي', es: 'WiFi' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsObject()
  label: Record<string, string>;

  @ApiProperty({
    description: 'Internationalized descriptions (optional, language codes are configurable)',
    example: {
      en: 'High-speed internet access',
      fr: 'Accès Internet haut débit',
      es: 'Acceso a Internet de alta velocidad',
    },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @ApiProperty({
    description: 'Icon componentName from Iconsax library with optional variant (format: ComponentName or ComponentName:variant)',
    example: 'Wifi:Linear',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z][a-zA-Z0-9]*(?::(Linear|Outline|Bold|Bulk|Broken|TwoTone))?$/, {
    message: 'Icon must be in format "ComponentName" or "ComponentName:variant" where ComponentName is PascalCase (e.g., Wifi, MonitorMobbile) and variant is one of: Linear, Outline, Bold, Bulk, Broken, TwoTone',
  })
  icon?: string;

  @ApiProperty({
    description: 'Optional grouping category',
    example: 'connectivity',
  })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({
    description: 'Display sort order',
    example: 1,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  sortOrder?: number;

  @ApiProperty({
    description: 'Whether item is visible in UI',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiProperty({
    description: 'Whether item is active and available for use',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Flexible metadata for additional properties',
    example: { color: '#4CAF50', category: 'essential' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
