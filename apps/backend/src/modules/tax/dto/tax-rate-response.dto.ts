import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  TaxType,
  TaxCalculationMethod,
  TaxApplicability,
  TaxStatus,
} from '../../../common/enums/tax.enums';

class ProgressiveRateDataDto {
  @ApiProperty({ description: 'Rate from amount' })
  from: number;

  @ApiPropertyOptional({ description: 'Rate to amount' })
  to?: number;

  @ApiProperty({ description: 'Tax rate percentage' })
  rate: number;

  @ApiPropertyOptional({ description: 'Fixed amount for this bracket' })
  fixedAmount?: number;
}

export class TaxRateDataDto {
  @ApiProperty({ description: 'Tax rate ID' })
  _id: string;

  @ApiProperty({ description: 'Tax rate name' })
  name: string;

  @ApiProperty({ enum: TaxType, description: 'Type of tax' })
  type: TaxType;

  @ApiProperty({ description: 'Tax jurisdiction ID' })
  jurisdictionId: string;

  @ApiProperty({ enum: TaxCalculationMethod, description: 'Calculation method' })
  calculationMethod: TaxCalculationMethod;

  @ApiProperty({ description: 'Tax rate (percentage or amount depending on method)' })
  rate: number;

  @ApiPropertyOptional({ description: 'Minimum tax amount' })
  minimumAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum tax amount' })
  maximumAmount?: number;

  @ApiPropertyOptional({ description: 'Fixed tax amount' })
  fixedAmount?: number;

  @ApiProperty({ enum: TaxApplicability, description: 'Who pays this tax' })
  applicability: TaxApplicability;

  @ApiPropertyOptional({ type: [String], description: 'Applicable property types' })
  applicablePropertyTypes?: string[];

  @ApiPropertyOptional({ description: 'Minimum stay days for applicability' })
  minimumStayDays?: number;

  @ApiPropertyOptional({ description: 'Maximum stay days for applicability' })
  maximumStayDays?: number;

  @ApiPropertyOptional({ description: 'Minimum booking amount for applicability' })
  minimumBookingAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum booking amount for applicability' })
  maximumBookingAmount?: number;

  @ApiPropertyOptional({ type: [ProgressiveRateDataDto], description: 'Progressive tax rates' })
  progressiveRates?: ProgressiveRateDataDto[];

  @ApiProperty({ enum: TaxStatus, description: 'Tax rate status' })
  status: TaxStatus;

  @ApiProperty({ description: 'Effective from date' })
  effectiveFrom: Date;

  @ApiPropertyOptional({ description: 'Effective to date' })
  effectiveTo?: Date;

  @ApiPropertyOptional({ description: 'Priority (lower number = higher priority)' })
  priority?: number;

  @ApiPropertyOptional({ description: 'Exemption criteria' })
  exemptionCriteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Tax registration number' })
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'Remittance account' })
  remittanceAccount?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class TaxRateListDataDto {
  @ApiProperty({ description: 'Tax rates', type: [TaxRateDataDto] })
  items: TaxRateDataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevPage: boolean;
}

export class TaxRateResponseDto extends BaseResponseDto<TaxRateDataDto> {
  @ApiProperty({
    description: 'Tax rate data',
    type: TaxRateDataDto,
  })
  declare data: TaxRateDataDto;
}

export class TaxRateListResponseDto extends BaseResponseDto<TaxRateListDataDto> {
  @ApiProperty({
    description: 'Tax rate list data',
    type: TaxRateListDataDto,
  })
  declare data: TaxRateListDataDto;
}
