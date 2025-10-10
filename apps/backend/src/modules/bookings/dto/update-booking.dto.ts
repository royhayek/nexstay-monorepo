import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsDateField,
  IsGuestCountField,
  IsTextAreaField,
  IsTimeField,
  IsPhoneField,
  IsEmailField,
  IsEnumField,
  IsNumberField,
} from '../../../common/validators/standardized-validators';
import { BOOKING_VALIDATION_CONSTANTS } from '../constants/booking.constants';
import {
  BookingStatus,
  PaymentStatus,
  RefundTypeEnum,
  CancellationInitiatorEnum,
} from '../../../common/enums/booking.enums';
import { PayoutStatus } from '../../../common/enums/payout.enums';

export class UpdateGuestInfoDto {
  @IsGuestCountField({
    description: 'Number of adults',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_ADULTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_ADULTS,
  })
  adults?: number;

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
    description: 'Total number of guests',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_TOTAL_GUESTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_TOTAL_GUESTS,
  })
  totalGuests?: number;
}

export class UpdateBookingDatesDto {
  @IsDateField({
    description: 'Updated check-in date',
    example: '2025-10-10',
  })
  checkIn?: string;

  @IsDateField({
    description: 'Updated check-out date',
    example: '2025-10-12',
  })
  checkOut?: string;

  @IsGuestCountField({
    description: 'Updated number of nights',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_NIGHTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_NIGHTS,
  })
  nights?: number;
}

export class UpdateBookingDetailsDto {
  @IsTextAreaField({
    description: 'Updated special requests from guest',
    maxLength: 500,
  })
  specialRequests?: string;

  @IsTimeField({
    description: 'Updated estimated arrival time',
    example: '15:00',
  })
  estimatedArrivalTime?: string;

  @IsPhoneField({
    description: 'Updated guest phone number',
    example: '+1234567890',
  })
  guestPhone?: string;

  @IsEmailField({
    description: 'Updated guest email',
    example: 'guest@example.com',
  })
  guestEmail?: string;
}

export class UpdateBookingDto {
  @IsDateField({
    description: 'Check-in date',
    example: '2025-10-10',
  })
  checkIn?: string;

  @IsDateField({
    description: 'Check-out date',
    example: '2025-10-12',
  })
  checkOut?: string;

  @IsGuestCountField({
    description: 'Number of nights',
    example: 2,
    minValue: BOOKING_VALIDATION_CONSTANTS.MIN_NIGHTS,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_NIGHTS,
  })
  nights?: number;

  @ApiProperty({ description: 'Updated guest information', required: false })
  @ValidateNested()
  @Type(() => UpdateGuestInfoDto)
  guests?: UpdateGuestInfoDto;

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
    description: 'Guest phone number',
    example: '+1234567890',
  })
  guestPhone?: string;

  @IsEmailField({
    description: 'Guest email',
    example: 'guest@example.com',
  })
  guestEmail?: string;
}

export class UpdateBookingStatusDto {
  @IsEnumField(BookingStatus, {
    required: true,
    description: 'New booking status',
    example: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @IsTextAreaField({
    description: 'Reason for status change',
    maxLength: 500,
  })
  reason?: string;
}

export class UpdatePaymentStatusDto {
  @IsEnumField(PaymentStatus, {
    required: true,
    description: 'New payment status',
    example: PaymentStatus.PAID,
  })
  paymentStatus: PaymentStatus;

  @IsTextAreaField({
    description: 'Payment intent ID from payment provider',
    maxLength: 255,
  })
  paymentIntentId?: string;

  @IsTextAreaField({
    description: 'Payment notes or reference',
    maxLength: 200,
  })
  paymentNotes?: string;
}

export class UpdatePayoutStatusDto {
  @IsEnumField(PayoutStatus, {
    required: true,
    description: 'New payout status',
    example: PayoutStatus.COMPLETED,
  })
  payoutStatus: PayoutStatus;

  @IsTextAreaField({
    description: 'Payout notes or reference',
    maxLength: 200,
  })
  payoutNotes?: string;
}

export class ProcessRefundDto {
  @IsNumberField({
    required: true,
    description: 'Refund amount',
    example: 150.5,
    minValue: 0,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_BASE_AMOUNT,
  })
  refundAmount: number;

  @IsTextAreaField({
    required: true,
    description: 'Reason for refund',
    minLength: 10,
    maxLength: 500,
  })
  refundReason: string;

  @IsEnumField(RefundTypeEnum, {
    description: 'Refund type',
    example: RefundTypeEnum.PARTIAL,
  })
  refundType?: RefundTypeEnum;
}

export class CancelBookingDto {
  @IsTextAreaField({
    required: true,
    description: 'Cancellation reason',
    minLength: 10,
    maxLength: 500,
  })
  cancellationReason: string;

  @IsEnumField(CancellationInitiatorEnum, {
    description: 'Who initiated the cancellation',
    example: CancellationInitiatorEnum.GUEST,
  })
  cancelledBy?: CancellationInitiatorEnum;

  @IsNumberField({
    description: 'Cancellation fee if applicable',
    example: 50.0,
    minValue: 0,
    maxValue: BOOKING_VALIDATION_CONSTANTS.MAX_BASE_AMOUNT,
  })
  cancellationFee?: number;
}
