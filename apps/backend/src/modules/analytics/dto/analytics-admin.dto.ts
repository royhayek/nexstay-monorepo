import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, IsArray } from 'class-validator';
import {
  IsNameField,
  IsEmailField,
  IsUuidField,
  IsDateField,
  IsUrlField,
} from '../../../common/validators/standardized-validators';

/**
 * Enhanced booking detail DTO for admin analytics with additional context
 */
export class BookingDetailAnalyticsDto {
  @IsUuidField({
    required: true,
    example: '507f1f77bcf86cd799439011',
    description: 'Booking unique identifier',
  })
  id: string;

  @IsNameField({
    required: true,
    example: 'Beautiful Downtown Apartment',
    description: 'Property destination name',
  })
  destination: string;

  @IsUrlField({
    example: 'https://example.com/property-image.jpg',
    description: 'Property main image URL',
  })
  propertyImage?: string;

  @IsNameField({
    required: true,
    example: 'John Doe',
    description: 'Customer full name',
  })
  customerName: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+1234567890',
  })
  @IsOptional()
  customerPhone?: string;

  @IsUrlField({
    example: 'https://example.com/avatar.jpg',
    description: 'Customer avatar image URL',
  })
  customerAvatar?: string;

  @ApiProperty({
    description: 'Check-in date',
    example: '2024-10-10T14:00:00Z',
  })
  @IsNotEmpty()
  checkIn: Date;

  @ApiProperty({
    description: 'Check-out date',
    example: '2024-10-15T11:00:00Z',
  })
  @IsNotEmpty()
  checkOut: Date;

  @ApiProperty({
    description: 'Booking status',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    example: 'confirmed',
  })
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status: string;

  @ApiProperty({
    description: 'Total booking amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Number of nights',
    example: 5,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  nights: number;

  @ApiProperty({
    description: 'Total number of guests',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  guests: number;

  @ApiPropertyOptional({
    description: 'Booking confirmation code',
    example: 'BK-ABC123',
  })
  @IsOptional()
  confirmationCode?: string;

  @ApiProperty({
    description: 'Booking creation date',
    example: '2024-10-01T10:00:00Z',
  })
  @IsNotEmpty()
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Property location',
    example: 'New York City',
  })
  @IsOptional()
  location?: string;
}

/**
 * Enhanced top host DTO for analytics with performance metrics
 */
export class TopHostAnalyticsDto {
  @IsUuidField({
    required: true,
    example: '507f1f77bcf86cd799439011',
    description: 'Host unique identifier',
  })
  id: string;

  @IsNameField({
    required: true,
    example: 'Jane Smith',
    description: 'Host full name',
  })
  name: string;

  @IsEmailField({
    example: 'jane.smith@example.com',
    description: 'Host email address',
  })
  email?: string;

  @IsUrlField({
    example: 'https://example.com/host-avatar.jpg',
    description: 'Host profile image URL',
  })
  avatar?: string;

  @ApiProperty({
    description: 'Total number of bookings',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalBookings: number;

  @ApiProperty({
    description: 'Total revenue generated',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalRevenue: number;

  @ApiProperty({
    description: 'Total number of properties',
    example: 5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalProperties: number;

  @ApiProperty({
    description: 'Average rating',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  rating: number;

  @ApiProperty({
    description: 'Total number of reviews',
    example: 75,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  reviewCount: number;

  @ApiProperty({
    description: 'Response rate percentage',
    example: 95,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  responseRate: number;

  @ApiProperty({
    description: 'Host join date',
    example: '2023-01-15T00:00:00Z',
  })
  @IsNotEmpty()
  joinDate: Date;

  @ApiPropertyOptional({
    description: 'Last active date',
    example: '2024-10-15T10:30:00Z',
  })
  @IsOptional()
  lastActiveAt?: Date;

  @ApiProperty({
    description: 'Host verification status',
    example: true,
    default: false,
  })
  @IsOptional()
  isVerified?: boolean;
}

/**
 * Enhanced recent invoice DTO for analytics
 */
export class RecentInvoiceAnalyticsDto {
  @IsUuidField({
    required: true,
    example: 'INV-2024-001',
    description: 'Invoice number or ID',
  })
  id: string;

  @ApiProperty({
    description: 'Invoice category',
    enum: ['Booking', 'General', 'Service', 'Refund'],
    example: 'Booking',
  })
  @IsEnum(['Booking', 'General', 'Service', 'Refund'])
  category: string;

  @ApiProperty({
    description: 'Invoice amount',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'Invoice status',
    enum: ['paid', 'pending', 'overdue', 'cancelled'],
    example: 'paid',
  })
  @IsEnum(['paid', 'pending', 'overdue', 'cancelled'])
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';

  @ApiProperty({
    description: 'Invoice creation date',
    example: '2024-10-01T00:00:00Z',
  })
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty({
    description: 'Invoice due date',
    example: '2024-10-31T23:59:59Z',
  })
  @IsNotEmpty()
  dueDate: Date;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Associated booking ID',
  })
  bookingId?: string;

  @ApiPropertyOptional({
    description: 'Invoice description',
    example: 'Booking payment for downtown apartment',
  })
  @IsOptional()
  description?: string;
}

/**
 * Yearly booking statistics with revenue data
 */
export class YearlyBookingStatisticsDto {
  @ApiProperty({
    description: 'Year',
    example: 2024,
    minimum: 2020,
  })
  @IsNumber()
  @Min(2020)
  year: number;

  @ApiProperty({
    description: 'Number of sold bookings',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sold: number;

  @ApiProperty({
    description: 'Number of cancelled bookings',
    example: 25,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cancelled: number;

  @ApiProperty({
    description: 'Total revenue for the year',
    example: 75000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  revenue: number;

  @ApiProperty({
    description: 'Total bookings for the year',
    example: 175,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalBookings: number;
}

/**
 * Enhanced customer review DTO with analytics context
 */
export class CustomerReviewAnalyticsDto {
  @IsUuidField({
    required: true,
    example: '507f1f77bcf86cd799439011',
    description: 'Review unique identifier',
  })
  id: string;

  @IsNameField({
    required: true,
    example: 'Alice Johnson',
    description: 'Customer name',
  })
  customerName: string;

  @IsUrlField({
    example: 'https://example.com/customer-avatar.jpg',
    description: 'Customer profile image URL',
  })
  customerAvatar?: string;

  @ApiProperty({
    description: 'Review content',
    example: 'Amazing stay! The property was exactly as described.',
  })
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Overall rating',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  rating: number;

  @ApiProperty({
    description: 'Review posting date',
    example: '2024-10-15T14:30:00Z',
  })
  @IsNotEmpty()
  postedAt: Date;

  @ApiProperty({
    description: 'Review tags',
    example: ['Great service', 'Recommended', 'Best price'],
    type: [String],
  })
  @IsArray()
  tags: string[];

  @IsNameField({
    example: 'Beautiful Downtown Apartment',
    description: 'Property name',
  })
  propertyName?: string;

  @IsUrlField({
    example: 'https://example.com/property-image.jpg',
    description: 'Property image URL',
  })
  propertyImage?: string;

  @ApiPropertyOptional({
    description: 'Associated booking confirmation code',
    example: 'BK-ABC123',
  })
  @IsOptional()
  bookingCode?: string;

  @ApiProperty({
    description: 'Review status',
    enum: ['pending', 'approved', 'rejected'],
    example: 'approved',
    default: 'approved',
  })
  @IsEnum(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Review sentiment analysis',
    enum: ['positive', 'neutral', 'negative'],
    example: 'positive',
  })
  @IsEnum(['positive', 'neutral', 'negative'])
  sentiment: 'positive' | 'neutral' | 'negative';
}

/**
 * Tours/Properties availability analytics
 */
export class ToursAvailabilityDto {
  @ApiProperty({
    description: 'Total number of properties',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Number of active properties',
    example: 450,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  active: number;

  @ApiProperty({
    description: 'Number of inactive properties',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  inactive: number;

  @ApiProperty({
    description: 'Number of sold out properties',
    example: 290,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  soldOut: number;

  @ApiProperty({
    description: 'Number of available properties',
    example: 160,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  available: number;

  @ApiProperty({
    description: 'Overall occupancy rate percentage',
    example: 65,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  occupancyRate: number;
}

/**
 * Admin analytics filters specifically for complex queries
 */
export class AdminAnalyticsFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    example: 'confirmed',
  })
  @IsOptional()
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsDateField({
    example: '2024-01-01',
    description: 'Filter start date',
  })
  startDate?: string;

  @IsDateField({
    example: '2024-12-31',
    description: 'Filter end date',
  })
  endDate?: string;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by property ID',
  })
  propertyId?: string;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by guest ID',
  })
  guestId?: string;

  @IsUuidField({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by host ID',
  })
  hostId?: string;

  @ApiPropertyOptional({
    description: 'Minimum booking amount',
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum booking amount',
    minimum: 0,
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}
