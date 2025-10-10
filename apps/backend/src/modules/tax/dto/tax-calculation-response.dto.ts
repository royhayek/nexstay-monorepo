import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaxType, TaxApplicability, TaxCalculationMethod } from '../../../common/enums/tax.enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class TaxBreakdownItemDto {
  @ApiProperty({ description: 'Tax rate ID' })
  taxRateId: string;

  @ApiProperty({ description: 'Jurisdiction ID' })
  jurisdictionId: string;

  @ApiProperty({ enum: TaxType, description: 'Type of tax' })
  taxType: TaxType;

  @ApiProperty({ description: 'Tax name' })
  taxName: string;

  @ApiProperty({ enum: TaxApplicability, description: 'Who pays this tax' })
  applicability: TaxApplicability;

  @ApiProperty({ enum: TaxCalculationMethod, description: 'How tax is calculated' })
  calculationMethod: TaxCalculationMethod;

  @ApiProperty({ description: 'Base amount used for calculation' })
  baseAmount: number;

  @ApiProperty({ description: 'Tax rate applied' })
  rate: number;

  @ApiProperty({ description: 'Calculated tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Whether this tax is exempted' })
  isExempted: boolean;

  @ApiPropertyOptional({ description: 'Exemption reason if applicable' })
  exemptionReason?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class TaxExemptionSummaryDto {
  @ApiProperty({ description: 'Total exempted tax amount' })
  totalExemptedAmount: number;

  @ApiProperty({ type: [String], description: 'List of exempted tax types' })
  exemptedTaxes: string[];
}

export class TaxCalculationDataDto {
  @ApiProperty({ description: 'Subtotal amount before taxes' })
  subtotalAmount: number;

  @ApiProperty({ description: 'Total tax amount' })
  totalTaxAmount: number;

  @ApiProperty({ description: 'Total amount including taxes' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ type: [TaxBreakdownItemDto], description: 'Detailed tax breakdown' })
  taxBreakdown: TaxBreakdownItemDto[];

  @ApiPropertyOptional({
    type: TaxExemptionSummaryDto,
    description: 'Exemption summary if applicable',
  })
  exemptionSummary?: TaxExemptionSummaryDto;
}

export class TaxCalculationResponseDto extends BaseResponseDto<TaxCalculationDataDto> {
  @ApiProperty({
    description: 'Tax calculation data',
    type: TaxCalculationDataDto,
  })
  declare data: TaxCalculationDataDto;
}
