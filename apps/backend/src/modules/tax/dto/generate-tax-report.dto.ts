import { TaxReportingPeriod } from '../../../common/enums/tax.enums';
import {
  IsUuidField,
  IsEnumField,
  IsDateField,
} from '../../../common/validators/standardized-validators';

export class GenerateTaxReportDto {
  @IsUuidField({ required: true })
  jurisdictionId: string;

  @IsEnumField(TaxReportingPeriod, { required: true, example: TaxReportingPeriod.MONTHLY })
  reportingPeriod: TaxReportingPeriod;

  @IsDateField({ required: true })
  periodStart: Date;

  @IsDateField({ required: true })
  periodEnd: Date;
}
