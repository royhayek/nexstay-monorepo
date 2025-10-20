import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsUuidField,
  IsDateField,
  IsGuestCountField,
  IsTextAreaField,
  IsTimeField,
  IsPhoneField,
  IsEmailField,
} from '../../../common/validators/standardized-validators';
import { BOOKING_VALIDATION_CONSTANTS } from '../constants/booking.constants';

export class CreateGuestInfoDto {
  @IsGuestCountField({
    required: true,
    description: 'Number of adults',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_ADULTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_ADULTS,
  })
  adults: number;

  @IsGuestCountField({
    description: 'Number of children',
    example: 0,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_CHILDREN,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_CHILDREN,
  })
  children?: number;

  @IsGuestCountField({
    description: 'Number of infants',
    example: 0,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_INFANTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_INFANTS,
  })
  infants?: number;

  @IsGuestCountField({
    required: true,
    description: 'Total number of guests',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_TOTAL_GUESTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_TOTAL_GUESTS,
  })
  totalGuests: number;
}

export class CreateBookingDto {
  @IsUuidField({
    required: true,
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId: string;

  @IsDateField({
    required: true,
    description: 'Check-in date',
    example: '2025-10-10',
  })
  checkIn: string;

  @IsDateField({
    required: true,
    description: 'Check-out date',
    example: '2025-10-12',
  })
  checkOut: string;

  @IsGuestCountField({
    required: true,
    description: 'Number of nights',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_NIGHTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_NIGHTS,
  })
  nights: number;

  @ApiProperty({ description: 'Guest information' })
  @ValidateNested()
  @Type(() => CreateGuestInfoDto)
  guests: CreateGuestInfoDto;

  @IsTextAreaField({
    description: 'Special requests from guest',
    maxLength: 500,
  })
  specialRequests?: string;

  @IsTimeField({
    description: 'Estimated arrival time',
    example: '15:00',
  })
  estimatedArrivalTime?: string;

  @IsPhoneField({
    description: 'Guest phone number for host communication',
    example: '+1234567890',
  })
  guestPhone?: string;

  @IsEmailField({
    description: 'Guest email for booking communication',
    example: 'guest@example.com',
  })
  guestEmail?: string;

  @IsUuidField({
    description: 'Payment intent ID to link booking with payment',
    example: '507f1f77bcf86cd799439014',
  })
  paymentIntentId?: string;
}
