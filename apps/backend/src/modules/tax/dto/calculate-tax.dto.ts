import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateNested, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TaxExemptionType } from '../../../common/enums/tax.enums';
import {
  IsNameField,
  IsUuidField,
  IsDateField,
  IsGuestCountField,
  IsPriceField,
  IsCurrencyCodeField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

class PropertyLocationDto {
  @IsNameField({
    required: true,
    description: 'Property address',
    example: '123 Main St',
  })
  address: string;

  @IsNameField({
    required: true,
    description: 'City name',
    example: 'New York',
  })
  city: string;

  @IsNameField({
    description: 'State/Province',
    example: 'NY',
  })
  state?: string;

  @IsNameField({
    required: true,
    description: 'Country code',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  country: string;

  @IsNameField({
    description: 'Postal code',
    example: '10001',
  })
  postalCode?: string;

  @ApiProperty({ type: Object, description: 'Geographic coordinates' })
  @IsObject()
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

class ExemptionDetailsDto {
  @IsEnumField(TaxExemptionType, {
    description: 'Type of tax exemption',
    example: TaxExemptionType.BUSINESS_TRAVEL,
  })
  exemptionType?: TaxExemptionType;

  @IsNameField({
    description: 'Exemption certificate number',
    example: 'CERT-2024-001',
  })
  exemptionCertificate?: string;

  @IsNameField({
    description: 'Business tax ID',
    example: 'TAX-ID-12345',
  })
  businessTaxId?: string;
}

export class CalculateTaxDto {
  @IsUuidField({
    required: true,
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId: string;

  @IsUuidField({
    required: true,
    description: 'Guest user ID',
    example: '507f1f77bcf86cd799439012',
  })
  guestId: string;

  @IsUuidField({
    required: true,
    description: 'Host user ID',
    example: '507f1f77bcf86cd799439013',
  })
  hostId: string;

  @IsDateField({
    required: true,
    description: 'Check-in date',
    example: '2024-01-15',
  })
  checkInDate: string;

  @IsDateField({
    required: true,
    description: 'Check-out date',
    example: '2024-01-20',
  })
  checkOutDate: string;

  @IsGuestCountField({
    required: true,
    description: 'Number of guests',
    example: 2,
    minValue: 1,
    maxValue: 20,
  })
  numberOfGuests: number;

  @IsPriceField({
    required: true,
    description: 'Subtotal amount before taxes',
    example: 299.99,
    minValue: 0.01,
    maxValue: 999999.99,
  })
  subtotalAmount: number;

  @IsCurrencyCodeField({
    required: true,
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({ type: PropertyLocationDto, description: 'Property location details' })
  @ValidateNested()
  @Type(() => PropertyLocationDto)
  propertyLocation: PropertyLocationDto;

  @ApiPropertyOptional({ type: ExemptionDetailsDto, description: 'Tax exemption details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExemptionDetailsDto)
  exemptionDetails?: ExemptionDetailsDto;
}
