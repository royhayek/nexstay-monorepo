import { FilterQuery } from 'mongoose';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

export interface DateRangeFilter {
  $gte?: Date;
  $lte?: Date;
}

export interface RegexFilter {
  $regex: string;
  $options: string;
}

export interface BookingQueryFilter extends FilterQuery<BookingDocument> {
  checkIn?: DateRangeFilter;
  confirmationCode?: RegexFilter;
}

export interface BookingFiltersDto {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  payoutStatus?: PayoutStatus;
  hostId?: string;
  guestId?: string;
  propertyId?: string;
  checkInFrom?: string;
  checkInTo?: string;
  confirmationCode?: string;
}

export interface RevenueAggregateResult {
  _id: null;
  totalRevenue: number;
  averageBookingValue: number;
}

export interface StatusAggregateResult {
  _id: BookingStatus;
  count: number;
}

export interface PaymentStatusAggregateResult {
  _id: PaymentStatus;
  count: number;
}

export interface MonthlyAggregateResult {
  _id: {
    year: number;
    month: number;
  };
  bookings: number;
  revenue: number;
}

export interface BookingStatsDto {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  statusBreakdown: Record<BookingStatus, number>;
  paymentStatusBreakdown: Record<PaymentStatus, number>;
  monthlyStats: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface UserBookingFilters {
  status?: BookingStatus;
  checkInFrom?: string;
  checkInTo?: string;
}

// Use the standard PaginatedDto pattern like properties module
export type BookingListResponse = PaginatedDto<BookingDocument> & {
  bookings: BookingDocument[]; // Alias for items for backward compatibility
};
