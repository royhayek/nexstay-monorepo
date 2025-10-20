import { DocumentType } from '../../../database/schemas/identity-verification.schema';
import {
  IsEnumField,
  IsNameField,
  IsDateField,
  IsCountryCodeField,
} from '../../../common/validators/standardized-validators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';

enum ResidencyStatus {
  CITIZEN = 'citizen',
  RESIDENT = 'resident',
  TEMPORARY_VISITOR = 'temporary_visitor',
}

// Custom validator for document identifiers (alphanumeric with common separators)
function IsDocumentIdField(options?: { required?: boolean; example?: string; description?: string }) {
  const { required = false, example = '123456789', description = 'Document identifier' } = options || {};

  const decorators = [
    required
      ? ApiProperty({ description, example, minLength: 1, maxLength: 50 })
      : ApiPropertyOptional({ description, example, minLength: 1, maxLength: 50 }),
    IsString({ message: 'validation.MUST_BE_STRING' }),
    Length(1, 50, { message: 'validation.INVALID_LENGTH' }),
    Matches(/^[A-Za-z0-9\-\/\s]+$/, { message: 'validation.INVALID_DOCUMENT_ID' }),
    Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value)),
  ];

  if (!required) {
    decorators.push(IsOptional());
  } else {
    decorators.push(IsNotEmpty({ message: 'validation.REQUIRED_FIELD' }));
  }

  return applyDecorators(...decorators);
}

export class CreateIdentityVerificationDto {
  @IsEnumField(DocumentType, { required: true, example: DocumentType.NATIONAL_ID })
  documentType!: DocumentType;

  @IsDocumentIdField({ required: true, example: '123456789', description: 'Document number' })
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
  @IsDocumentIdField({ required: false, example: '1990/123456', description: 'Qaid number (civil registry number)' })
  qaidNumber?: string;

  @IsDocumentIdField({ required: false, example: 'BEI001', description: 'Municipality code' })
  municipalityCode?: string;

  @IsEnumField(ResidencyStatus, { required: false, example: ResidencyStatus.CITIZEN })
  residencyStatus?: ResidencyStatus;
}
