import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsObject, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import {
  TaxType,
  TaxCalculationMethod,
  TaxApplicability,
  TaxStatus,
} from '../../../common/enums/tax.enums';
import {
  IsNameField,
  IsEnumField,
  IsUuidField,
  IsPriceField,
  IsNumberField,
  IsDateField,
  IsTextAreaField,
  IsIdentifierField,
  IsStringArrayField,
} from '../../../common/validators/standardized-validators';

class ProgressiveRateDto {
  @IsPriceField({ required: true, example: 0.0 })
  from: number;

  @IsPriceField({ required: false, example: 1000.0 })
  to?: number;

  @IsNumberField({ required: true, minValue: 0, maxValue: 100, example: 15 })
  rate: number;

  @IsPriceField({ required: false, example: 50.0 })
  fixedAmount?: number;
}

export class CreateTaxRateDto {
  @IsNameField({ required: true, maxLength: 100, example: 'City Tourist Tax' })
  name: string;

  @IsEnumField(TaxType, { required: true, example: TaxType.TOURISM_TAX })
  type: TaxType;

  @IsUuidField({ required: true })
  jurisdictionId: string;

  @IsEnumField(TaxCalculationMethod, { required: true, example: TaxCalculationMethod.PERCENTAGE })
  calculationMethod: TaxCalculationMethod;

  @IsNumberField({ required: true, minValue: 0, maxValue: 100, example: 15 })
  rate: number;

  @IsPriceField({ required: false, example: 5.0 })
  minimumAmount?: number;

  @IsPriceField({ required: false, example: 100.0 })
  maximumAmount?: number;

  @IsPriceField({ required: false, example: 25.0 })
  fixedAmount?: number;

  @IsEnumField(TaxApplicability, { required: true, example: TaxApplicability.GUEST_PAID })
  applicability: TaxApplicability;

  @IsStringArrayField({ required: false, example: ['APARTMENT', 'HOUSE'] })
  applicablePropertyTypes?: string[];

  @IsNumberField({ required: false, minValue: 1, example: 2 })
  minimumStayDays?: number;

  @IsNumberField({ required: false, minValue: 1, example: 30 })
  maximumStayDays?: number;

  @IsPriceField({ required: false, example: 100.0 })
  minimumBookingAmount?: number;

  @IsPriceField({ required: false, example: 5000.0 })
  maximumBookingAmount?: number;

  @ApiPropertyOptional({ type: [ProgressiveRateDto], description: 'Progressive tax rates' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressiveRateDto)
  progressiveRates?: ProgressiveRateDto[];

  @IsEnumField(TaxStatus, { required: false, example: TaxStatus.ACTIVE })
  status?: TaxStatus;

  @IsDateField({ required: true })
  effectiveFrom: Date;

  @IsDateField({ required: false })
  effectiveTo?: Date;

  @IsNumberField({ required: false, minValue: 1, example: 1 })
  priority?: number;

  @ApiPropertyOptional({ description: 'Exemption criteria' })
  @IsOptional()
  @IsObject()
  exemptionCriteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsTextAreaField({
    required: false,
    maxLength: 500,
    example: 'Tourist tax applied to overnight stays',
  })
  description?: string;

  @IsIdentifierField({ required: false, example: 'TX12345' })
  registrationNumber?: string;

  @IsNameField({ required: false, maxLength: 100, example: 'TaxCollectionAccount' })
  remittanceAccount?: string;
}
