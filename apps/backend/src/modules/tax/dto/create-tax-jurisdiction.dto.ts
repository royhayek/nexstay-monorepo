import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsObject, IsArray, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxJurisdictionLevel, TaxStatus } from '../../../common/enums/tax.enums';
import {
  IsNameField,
  IsEnumField,
  IsCountryCodeField,
  IsPostalCodeField,
  IsUuidField,
  IsDateField,
  IsTextAreaField,
  IsIdentifierField,
} from '../../../common/validators/standardized-validators';

class BoundariesDto {
  @ApiProperty({ enum: ['Polygon'], description: 'Geometry type' })
  @IsString()
  type: 'Polygon';

  @ApiProperty({ description: 'Polygon coordinates [[[longitude, latitude]]]' })
  @IsArray()
  coordinates: number[][][];
}

export class CreateTaxJurisdictionDto {
  @IsNameField({ required: true, maxLength: 100, example: 'City of Paris' })
  name: string;

  @IsIdentifierField({ required: true, example: 'PAR001' })
  code: string;

  @IsEnumField(TaxJurisdictionLevel, { required: true, example: TaxJurisdictionLevel.CITY })
  level: TaxJurisdictionLevel;

  @IsCountryCodeField({ required: true, example: 'FR' })
  country: string;

  @IsNameField({ required: false, maxLength: 100, example: 'Île-de-France' })
  state?: string;

  @IsNameField({ required: false, maxLength: 100, example: 'Paris' })
  city?: string;

  @IsPostalCodeField({ required: false, example: '75001' })
  postalCode?: string;

  @IsUuidField({ required: false })
  parentJurisdiction?: string;

  @ApiPropertyOptional({ type: BoundariesDto, description: 'Geographic boundaries' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BoundariesDto)
  boundaries?: BoundariesDto;

  @IsEnumField(TaxStatus, { required: false, example: TaxStatus.ACTIVE })
  status?: TaxStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  metadata?: Record<string, any>;

  @IsTextAreaField({
    required: false,
    maxLength: 500,
    example: 'City of Paris tax jurisdiction for tourist taxes',
  })
  description?: string;

  @IsDateField({ required: true })
  effectiveFrom: Date;

  @IsDateField({ required: false })
  effectiveTo?: Date;
}
