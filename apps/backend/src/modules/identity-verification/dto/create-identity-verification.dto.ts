import { DocumentType } from '../../../database/schemas/identity-verification.schema';
import {
  IsEnumField,
  IsNameField,
  IsDateField,
  IsCountryCodeField,
  IsIdentifierField,
} from '../../../common/validators/standardized-validators';

enum ResidencyStatus {
  CITIZEN = 'citizen',
  RESIDENT = 'resident',
  TEMPORARY_VISITOR = 'temporary_visitor',
}

export class CreateIdentityVerificationDto {
  @IsEnumField(DocumentType, { required: true, example: DocumentType.NATIONAL_ID })
  documentType!: DocumentType;

  @IsIdentifierField({ required: true, example: '123456789' })
  documentNumber!: string;

  @IsCountryCodeField({ required: true, example: 'LB' })
  issuingCountry!: string;

  @IsNameField({ required: false, example: 'Mount Lebanon' })
  issuingState?: string;

  @IsDateField({ required: true })
  expirationDate!: Date;

  @IsNameField({ required: true, example: 'Ahmad' })
  firstName!: string;

  @IsNameField({ required: true, example: 'Al-Masri' })
  lastName!: string;

  @IsNameField({ required: false, example: 'Hassan' })
  middleName?: string;

  @IsDateField({ required: true })
  dateOfBirth!: Date;

  @IsNameField({ required: false, example: 'Beirut, Lebanon', maxLength: 100 })
  placeOfBirth?: string;

  @IsNameField({ required: false, example: 'Lebanese' })
  nationality?: string;

  @IsNameField({ required: false, example: 'M', maxLength: 10 })
  gender?: string;

  // Lebanon-specific fields
  @IsIdentifierField({ required: false, example: '1990/123456' })
  qaidNumber?: string;

  @IsIdentifierField({ required: false, example: 'BEI001' })
  municipalityCode?: string;

  @IsEnumField(ResidencyStatus, { required: false, example: ResidencyStatus.CITIZEN })
  residencyStatus?: ResidencyStatus;
}
