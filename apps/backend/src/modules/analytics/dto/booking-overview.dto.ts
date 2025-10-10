import { ApiProperty } from '@nestjs/swagger';

export class BookingStatisticsDto {
  @ApiProperty({ description: 'Year of the statistics' })
  year: number;

  @ApiProperty({ description: 'Number of sold/confirmed bookings' })
  sold: number;

  @ApiProperty({ description: 'Number of canceled bookings' })
  canceled: number;
}

export class CustomerReviewDto {
  @ApiProperty({ description: 'Review ID' })
  id: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer avatar URL' })
  customerAvatar?: string;

  @ApiProperty({ description: 'Review content' })
  content: string;

  @ApiProperty({ description: 'Rating out of 5' })
  rating: number;

  @ApiProperty({ description: 'Posted date' })
  postedAt: Date;

  @ApiProperty({ description: 'Review tags/categories' })
  tags: string[];

  @ApiProperty({ description: 'Property name reviewed' })
  propertyName?: string;

  @ApiProperty({ description: 'Review status for moderation' })
  status: 'pending' | 'approved' | 'rejected';
}

export class NewestBookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer avatar URL' })
  customerAvatar?: string;

  @ApiProperty({ description: 'Booking date' })
  bookingDate: Date;

  @ApiProperty({ description: 'Number of nights' })
  nights: number;

  @ApiProperty({ description: 'Number of guests' })
  guests: number;

  @ApiProperty({ description: 'Property name/destination' })
  destination: string;

  @ApiProperty({ description: 'Property main image URL' })
  propertyImage?: string;

  @ApiProperty({ description: 'Total booking amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Booking status' })
  status: string;
}

export class BookingDetailDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Property destination/name' })
  destination: string;

  @ApiProperty({ description: 'Property image URL' })
  propertyImage?: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer phone number' })
  customerPhone?: string;

  @ApiProperty({ description: 'Check-in date' })
  checkIn: Date;

  @ApiProperty({ description: 'Check-out date' })
  checkOut: Date;

  @ApiProperty({ description: 'Booking status' })
  status: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Number of nights' })
  nights: number;

  @ApiProperty({ description: 'Number of guests' })
  guests: number;
}

export class BookingOverviewDto {
  @ApiProperty({ description: 'Total bookings count' })
  totalBookings: number;

  @ApiProperty({ description: 'Sold bookings count' })
  soldBookings: number;

  @ApiProperty({ description: 'Canceled bookings count' })
  canceledBookings: number;

  @ApiProperty({ description: 'Yearly statistics', type: [BookingStatisticsDto] })
  yearlyStatistics: BookingStatisticsDto[];

  @ApiProperty({ description: 'Recent customer reviews', type: [CustomerReviewDto] })
  customerReviews: CustomerReviewDto[];

  @ApiProperty({ description: 'Newest bookings', type: [NewestBookingDto] })
  newestBookings: NewestBookingDto[];

  @ApiProperty({ description: 'Tours/bookings available count' })
  toursAvailable: number;

  @ApiProperty({ description: 'Sold out tours count' })
  soldOutTours: number;

  @ApiProperty({ description: 'Available tours count' })
  availableTours: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  lastUpdated: Date;
}
