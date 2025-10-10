import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';
import { BookingResponseDto, BookingSummaryDto } from './booking-response.dto';

export class BookingCreatedDto {
  @ApiProperty({ description: 'Created booking', type: BookingResponseDto })
  booking: BookingResponseDto;

  @ApiProperty({ description: 'Payment URL if payment is required' })
  paymentUrl?: string;

  @ApiProperty({ description: 'Confirmation message' })
  message: string;
}

export class BookingCreatedResponseDto extends BaseResponseDto<BookingCreatedDto> {
  @ApiProperty({
    description: 'Created booking data',
    type: BookingCreatedDto,
  })
  declare data: BookingCreatedDto;
}

export class BookingUpdatedDto {
  @ApiProperty({ description: 'Updated booking', type: BookingResponseDto })
  booking: BookingResponseDto;

  @ApiProperty({ description: 'Update confirmation message' })
  message: string;

  @ApiProperty({ description: 'Fields that were updated' })
  updatedFields: string[];
}

export class BookingUpdatedResponseDto extends BaseResponseDto<BookingUpdatedDto> {
  @ApiProperty({
    description: 'Updated booking data',
    type: BookingUpdatedDto,
  })
  declare data: BookingUpdatedDto;
}

export class BookingCancelledDto {
  @ApiProperty({ description: 'Cancelled booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Cancellation confirmation' })
  message: string;

  @ApiProperty({ description: 'Refund amount if applicable' })
  refundAmount?: number;

  @ApiProperty({ description: 'Refund status' })
  refundStatus?: string;

  @ApiProperty({ description: 'Cancellation fee if applicable' })
  cancellationFee?: number;

  @ApiProperty({ description: 'Cancelled at timestamp' })
  cancelledAt: Date;

  @ApiProperty({ description: 'Cancelled by' })
  cancelledBy: string;
}

export class BookingCancelledResponseDto extends BaseResponseDto<BookingCancelledDto> {
  @ApiProperty({
    description: 'Cancellation details',
    type: BookingCancelledDto,
  })
  declare data: BookingCancelledDto;
}

export class BookingStatusChangedDto {
  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Previous status' })
  previousStatus: string;

  @ApiProperty({ description: 'New status' })
  newStatus: string;

  @ApiProperty({ description: 'Status change message' })
  message: string;

  @ApiProperty({ description: 'Status changed at' })
  changedAt: Date;

  @ApiProperty({ description: 'Changed by user ID' })
  changedBy: string;
}

export class BookingStatusChangedResponseDto extends BaseResponseDto<BookingStatusChangedDto> {
  @ApiProperty({
    description: 'Status change details',
    type: BookingStatusChangedDto,
  })
  declare data: BookingStatusChangedDto;
}

export class BookingAvailabilityDto {
  @ApiProperty({ description: 'Property ID' })
  propertyId: string;

  @ApiProperty({ description: 'Is available for the requested dates' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Requested check-in date' })
  checkIn: string;

  @ApiProperty({ description: 'Requested check-out date' })
  checkOut: string;

  @ApiProperty({ description: 'Number of nights' })
  nights: number;

  @ApiProperty({ description: 'Estimated pricing if available', required: false })
  estimatedPricing?: {
    baseAmount: number;
    cleaningFee: number;
    serviceFee: number;
    occupancyTaxes: number;
    totalAmount: number;
    currency: string;
  };

  @ApiProperty({ description: 'Unavailable dates in the requested period', type: [String] })
  unavailableDates: string[];

  @ApiProperty({ description: 'Next available check-in date', required: false })
  nextAvailableDate?: string;
}

export class BookingAvailabilityResponseDto extends BaseResponseDto<BookingAvailabilityDto> {
  @ApiProperty({
    description: 'Availability check result',
    type: BookingAvailabilityDto,
  })
  declare data: BookingAvailabilityDto;
}

export class UpcomingBookingsDto {
  @ApiProperty({ description: 'Upcoming bookings', type: [BookingSummaryDto] })
  bookings: BookingSummaryDto[];

  @ApiProperty({ description: 'Total count of upcoming bookings' })
  total: number;

  @ApiProperty({ description: 'Next check-in date', required: false })
  nextCheckin?: Date;

  @ApiProperty({ description: 'Active booking if currently checked in', required: false })
  activeBooking?: BookingSummaryDto;
}

export class UpcomingBookingsResponseDto extends BaseResponseDto<UpcomingBookingsDto> {
  @ApiProperty({
    description: 'Upcoming bookings data',
    type: UpcomingBookingsDto,
  })
  declare data: UpcomingBookingsDto;
}

export class MonthlyStatDto {
  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2024-01' })
  month: string;

  @ApiProperty({ description: 'Number of bookings in this month', example: 15 })
  bookings: number;

  @ApiProperty({ description: 'Revenue for this month', example: 2500.75 })
  revenue: number;
}

export class BookingStatsDtoClass {
  @ApiProperty({ description: 'Total number of bookings' })
  totalBookings: number;

  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Average booking value' })
  averageBookingValue: number;

  @ApiProperty({ description: 'Status breakdown' })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Payment status breakdown' })
  paymentStatusBreakdown: Record<string, number>;

  @ApiProperty({ description: 'Monthly statistics', type: [MonthlyStatDto] })
  monthlyStats: MonthlyStatDto[];
}

export class BookingStatsResponseDto extends BaseResponseDto<BookingStatsDtoClass> {
  @ApiProperty({
    description: 'Booking statistics',
    type: BookingStatsDtoClass,
  })
  declare data: BookingStatsDtoClass;
}

export class BookingReceiptDto {
  @ApiProperty({ description: 'Booking details', type: BookingResponseDto })
  booking: BookingResponseDto;

  @ApiProperty({ description: 'Receipt number' })
  receiptNumber: string;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Payment method' })
  paymentMethod: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiProperty({ description: 'Company information' })
  companyInfo: {
    name: string;
    address: string;
    taxId?: string;
    contactEmail: string;
    contactPhone: string;
  };

  @ApiProperty({ description: 'Tax breakdown' })
  taxBreakdown: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  };
}

export class BookingReceiptResponseDto extends BaseResponseDto<BookingReceiptDto> {
  @ApiProperty({
    description: 'Booking receipt',
    type: BookingReceiptDto,
  })
  declare data: BookingReceiptDto;
}

// Deletion response DTO
export class BookingDeletionDto {
  @ApiProperty({ description: 'Deletion confirmation' })
  deleted: boolean;

  @ApiProperty({ description: 'Booking ID that was deleted' })
  bookingId?: string;
}

export class BookingDeletionResponseDto extends BaseResponseDto<BookingDeletionDto> {
  @ApiProperty({
    description: 'Booking deletion confirmation',
    type: BookingDeletionDto,
  })
  declare data: BookingDeletionDto;
}

// Create a concrete paginated DTO for user bookings to ensure proper Swagger generation
export class UserBookingsPaginatedDto extends PaginatedDto<BookingResponseDto> {
  @ApiProperty({ type: [BookingResponseDto], description: 'Array of booking items' })
  @Type(() => BookingResponseDto)
  declare items: BookingResponseDto[];
}

// User bookings list response (for admin getUserBookings)
export class UserBookingsResponseDto extends BaseResponseDto<UserBookingsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated user bookings data',
    type: UserBookingsPaginatedDto,
  })
  declare data: UserBookingsPaginatedDto;
}
