import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import {
  IsNameField,
  IsNumberField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';

export class CreateAmenityCategoryDto {
  @IsNameField({ required: true, example: 'BASIC_AMENITIES' })
  key: string;

  @IsNameField({ required: true, example: 'basic-amenities' })
  slug: string;

  @ApiProperty({
    description: 'Localized name for the category',
    example: { en: 'Basic Amenities', fr: 'Équipements de base', ar: 'وسائل الراحة الأساسية' },
  })
  @IsObject()
  name: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Localized description for the category',
    example: {
      en: 'Essential amenities for comfortable stay',
      fr: 'Équipements essentiels pour un séjour confortable',
    },
  })
  @IsOptional()
  @IsObject()
  description?: Record<string, string>;

  @IsNameField({ required: false, example: 'essentials' })
  group?: string;

  @IsNameField({ required: false, example: 'home' })
  icon?: string;

  @IsNumberField({ required: false, example: 0 })
  sortOrder?: number;

  @IsBooleanField({ required: false, example: true })
  isActive?: boolean;
}
