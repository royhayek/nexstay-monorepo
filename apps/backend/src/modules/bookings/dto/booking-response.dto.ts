import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';
import { PropertyImageInfoDto } from '../../../common/interfaces/cross-module.interfaces';

export class BookingPricingResponseDto {
  @ApiProperty({ description: 'Base amount for the stay' })
  baseAmount: number;

  @ApiProperty({ description: 'Cleaning fee' })
  cleaningFee: number;

  @ApiProperty({ description: 'Service fee' })
  serviceFee: number;

  @ApiProperty({ description: 'Occupancy taxes' })
  occupancyTaxes: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class GuestInfoResponseDto {
  @ApiProperty({ description: 'Number of adults' })
  adults: number;

  @ApiProperty({ description: 'Number of children' })
  children: number;

  @ApiProperty({ description: 'Number of infants' })
  infants: number;

  @ApiProperty({ description: 'Total number of guests' })
  totalGuests: number;
}

export class PropertyAddressResponseDto {
  @ApiProperty({ description: 'Street address' })
  street: string;

  @ApiProperty({ description: 'Country' })
  country: string;

  @ApiProperty({ description: 'Country code' })
  countryCode: string;

  @ApiProperty({
    description: 'Location coordinates',
    type: Object,
    example: { type: 'Point', coordinates: [-73.935242, 40.73061] },
  })
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export class PropertyInfoResponseDto {
  @ApiProperty({ description: 'Property ID' })
  _id: string;

  @ApiProperty({ description: 'Property name' })
  name: string;

  @ApiPropertyOptional({ description: 'Property description' })
  description?: string;

  @ApiProperty({ description: 'Property type' })
  propertyType: string;

  @ApiProperty({ description: 'Room type' })
  roomType: string;

  @ApiProperty({ description: 'Maximum number of guests' })
  accommodates: number;

  @ApiProperty({ description: 'Number of bedrooms' })
  bedrooms: number;

  @ApiProperty({ description: 'Number of beds' })
  beds: number;

  @ApiProperty({ description: 'Number of bathrooms' })
  bathrooms: number;

  @ApiProperty({ description: 'Cancellation policy' })
  cancellationPolicy: string;

  @ApiPropertyOptional({ description: 'Minimum nights stay' })
  minimumNights?: number;

  @ApiPropertyOptional({ description: 'Maximum nights stay' })
  maximumNights?: number;

  @ApiProperty({ description: 'Property address', type: PropertyAddressResponseDto })
  address: PropertyAddressResponseDto;

  @ApiProperty({
    description: 'Property images with variants and metadata',
    type: [PropertyImageInfoDto],
  })
  images: PropertyImageInfoDto[];

  @ApiPropertyOptional({ description: 'Property amenities', type: [String] })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'House rules' })
  houseRules?: string;

  @ApiPropertyOptional({ description: 'Overall review rating' })
  reviewScoresRating?: number;

  @ApiPropertyOptional({ description: 'Total number of reviews' })
  numberOfReviews?: number;
}

export class UserInfoResponseDto {
  @ApiProperty({ description: 'User ID' })
  _id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string;
}

export class BaseAmountBreakdownResponseDto {
  @ApiProperty({ description: 'Nightly rate' })
  nightlyRate: number;

  @ApiProperty({ description: 'Number of nights' })
  numberOfNights: number;

  @ApiProperty({ description: 'Subtotal before discounts' })
  subtotal: number;

  @ApiPropertyOptional({ description: 'Weekly discount amount' })
  weeklyDiscount?: number;

  @ApiPropertyOptional({ description: 'Monthly discount amount' })
  monthlyDiscount?: number;

  @ApiProperty({ description: 'Final base amount after discounts' })
  finalBaseAmount: number;
}

export class BookingResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  _id: string;

  @ApiProperty({ description: 'Property information', type: PropertyInfoResponseDto })
  property: PropertyInfoResponseDto;

  @ApiProperty({ description: 'Guest information', type: UserInfoResponseDto })
  guest: UserInfoResponseDto;

  @ApiProperty({ description: 'Host information', type: UserInfoResponseDto })
  host: UserInfoResponseDto;

  @ApiProperty({ description: 'Check-in date' })
  checkIn: Date;

  @ApiProperty({ description: 'Check-out date' })
  checkOut: Date;

  @ApiProperty({ description: 'Number of nights' })
  nights: number;

  @ApiProperty({ description: 'Guest information' })
  guests: GuestInfoResponseDto;

  @ApiProperty({ description: 'Booking pricing details' })
  pricing: BookingPricingResponseDto;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ description: 'Payout status', enum: PayoutStatus })
  payoutStatus?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Special requests' })
  specialRequests?: string;

  @ApiPropertyOptional({ description: 'Estimated arrival time' })
  estimatedArrivalTime?: string;

  @ApiPropertyOptional({ description: 'Guest phone' })
  guestPhone?: string;

  @ApiPropertyOptional({ description: 'Guest email' })
  guestEmail?: string;

  @ApiPropertyOptional({ description: 'Confirmation code' })
  confirmationCode?: string;

  @ApiPropertyOptional({ description: 'Date when booking was confirmed' })
  confirmedAt?: Date;

  @ApiPropertyOptional({ description: 'Date when booking was cancelled' })
  cancelledAt?: Date;

  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  cancellationReason?: string;

  @ApiPropertyOptional({ description: 'User who cancelled the booking' })
  cancelledBy?: string;

  @ApiProperty({ description: 'Guest has reviewed the stay' })
  guestReviewed: boolean;

  @ApiProperty({ description: 'Host has reviewed the guest' })
  hostReviewed: boolean;

  @ApiPropertyOptional({ description: 'Guest review information' })
  guestReview?: string;

  @ApiPropertyOptional({ description: 'Host review information' })
  hostReview?: string;

  @ApiPropertyOptional({ description: 'Payment intent ID' })
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Refund amount if applicable' })
  refundAmount?: number;

  @ApiPropertyOptional({ description: 'Refund date if applicable' })
  refundDate?: Date;

  // Installment plan fields
  @ApiProperty({ description: 'Whether booking has installment plan' })
  hasInstallmentPlan: boolean;

  @ApiProperty({ description: 'Total number of installments' })
  totalInstallments: number;

  @ApiPropertyOptional({ description: 'Next installment due date' })
  nextInstallmentDue?: Date;

  @ApiProperty({ description: 'Number of paid installments' })
  paidInstallments: number;

  @ApiProperty({ description: 'Remaining amount to be paid' })
  remainingAmount: number;

  // Security deposit fields
  @ApiProperty({ description: 'Whether booking has security deposit' })
  hasSecurityDeposit: boolean;

  @ApiPropertyOptional({ description: 'Security deposit amount' })
  securityDepositAmount?: number;

  @ApiPropertyOptional({ description: 'Security deposit currency' })
  securityDepositCurrency?: string;

  @ApiPropertyOptional({ description: 'Security deposit status' })
  securityDepositStatus?: string;

  // Enhanced pricing breakdown
  @ApiPropertyOptional({
    description: 'Base amount breakdown',
    type: BaseAmountBreakdownResponseDto,
  })
  baseAmountBreakdown?: BaseAmountBreakdownResponseDto;

  // Multi-currency support
  @ApiPropertyOptional({ description: 'Exchange rate used' })
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Original currency' })
  originalCurrency?: string;

  @ApiPropertyOptional({ description: 'Original amount' })
  originalAmount?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class BookingSummaryDto {
  @ApiProperty({ description: 'Booking ID' })
  _id: string;

  @ApiProperty({ description: 'Property name' })
  propertyName: string;

  @ApiProperty({ description: 'Property thumbnail URL' })
  propertyThumbnail?: string;

  @ApiProperty({ description: 'Guest name' })
  guestName: string;

  @ApiProperty({ description: 'Check-in date' })
  checkIn: Date;

  @ApiProperty({ description: 'Check-out date' })
  checkOut: Date;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Booking status', enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiPropertyOptional({ description: 'Confirmation code' })
  confirmationCode?: string;
}

// Create a concrete paginated DTO for bookings to ensure proper Swagger generation
export class BookingsPaginatedDto extends PaginatedDto<BookingResponseDto> {
  @ApiProperty({ type: [BookingResponseDto], description: 'Array of booking items' })
  @Type(() => BookingResponseDto)
  declare items: BookingResponseDto[];
}

export class BookingListResponseDto extends BaseResponseDto<BookingsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated booking list data',
    type: BookingsPaginatedDto,
  })
  declare data: BookingsPaginatedDto;
}

export class SingleBookingResponseDto extends BaseResponseDto<BookingResponseDto> {
  @ApiProperty({
    description: 'Booking data',
    type: BookingResponseDto,
  })
  declare data: BookingResponseDto;
}
