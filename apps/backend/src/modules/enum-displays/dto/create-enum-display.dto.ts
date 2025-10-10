import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import type { SystemEnumName, SystemEnumValue } from '../../../common/enums/system.enums';
import {
  IsEnumField,
  IsNameField,
  IsNumberField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';

const SYSTEM_ENUM_NAMES = [
  'BookingStatus',
  'PaymentStatus',
  'PaymentTransactionStatus',
  'InvoiceStatus',
  'ReviewType',
  'NotificationStatus',
  'NotificationPriority',
  'DevicePlatform',
  'NotificationChannel',
  'PaymentMethodType',
] as const;

export class CreateEnumDisplayDto {
  @ApiProperty({
    // Swagger needs a concrete enum list, not the TS alias
    enum: SYSTEM_ENUM_NAMES,
    enumName: 'SystemEnumName',
    example: 'BookingStatus',
  })
  @IsEnumField(SYSTEM_ENUM_NAMES, { required: true, example: 'BookingStatus' })
  enumName!: SystemEnumName;

  @ApiProperty({
    type: String,
    description: 'Enum value key',
    example: 'CONFIRMED',
  })
  @IsNameField({ required: true, example: 'CONFIRMED' })
  key!: SystemEnumValue;

  @ApiPropertyOptional({
    description: 'Localized labels for the enum value',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { en: 'Confirmed', fr: 'Confirmé', ar: 'مؤكد' },
  })
  @IsObject()
  label?: Record<string, string>;

  @IsNumberField({ required: false, example: 0 })
  sortOrder?: number;

  @IsBooleanField({ required: false, example: true })
  isVisible?: boolean;
}
