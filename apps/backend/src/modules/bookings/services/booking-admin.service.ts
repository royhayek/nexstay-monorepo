import { Injectable, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { BookingCoreService } from './booking-core.service';
import { PaginationDto } from '../../messaging/dto/pagination.dto';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { PaginationUtils } from '../../../common/utils/pagination.utils';
import {
  BookingQueryFilter,
  BookingFiltersDto,
  RevenueAggregateResult,
  StatusAggregateResult,
  PaymentStatusAggregateResult,
  MonthlyAggregateResult,
  BookingStatsDto,
  BookingListResponse,
} from '../interfaces/booking-query.interfaces';
import { MonthlyStatDto } from '../dto/booking-operation-response.dto';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class BookingAdminService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly bookingCoreService: BookingCoreService,
    private readonly paginationUtils: PaginationUtils,
  ) {}

  async findAllWithFilters(
    filters: BookingFiltersDto,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    try {
      const query = this.buildFilterQuery(filters);

      // Use dynamic pagination from PaginationUtils
      const normalizedPagination = await this.paginationUtils.normalizePagination({
        page: pagination.page,
        limit: pagination.limit,
      });

      const [bookings, total] = await Promise.all([
        this.bookingModel
          .find(query)
          .populate('property',
            '_id name description propertyType roomType accommodates bedrooms beds bathrooms ' +
            'cancellationPolicy minimumNights maximumNights address images amenities houseRules ' +
            'reviewScores numberOfReviews rating'
          )
          .populate('guest', '_id firstName lastName email avatarUrl')
          .populate('host', '_id firstName lastName email avatarUrl')
          .sort({ createdAt: -1 })
          .skip(normalizedPagination.skip)
          .limit(normalizedPagination.limit)
          .exec(),
        this.bookingModel.countDocuments(query).exec(),
      ]);

      LoggingUtil.log(
        `Admin query returned ${bookings.length} bookings (${total} total)`,
        'BookingAdminService',
      );

      // Use dynamic pagination metadata
      const metadata = this.paginationUtils.createMetadata(
        total,
        normalizedPagination.page,
        normalizedPagination.limit,
      );

      return {
        items: bookings,
        bookings, // Keep for backward compatibility
        total: metadata.total,
        page: metadata.page,
        limit: metadata.limit,
        totalPages: metadata.totalPages,
        hasNextPage: metadata.hasNextPage,
        hasPrevPage: metadata.hasPrevPage,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Error in admin booking query:', error, 'BookingAdminService');
      throw error;
    }
  }

  async getBookingStats(filters?: BookingFiltersDto): Promise<BookingStatsDto> {
    try {
      const query = filters ? this.buildFilterQuery(filters) : {};

      const [
        totalBookings,
        revenueAggregateResult,
        statusBreakdown,
        paymentStatusBreakdown,
        monthlyStats,
      ] = await Promise.all([
        this.bookingModel.countDocuments(query).exec(),
        this.bookingModel
          .aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$pricing.totalAmount' },
                averageBookingValue: { $avg: '$pricing.totalAmount' },
              },
            },
          ])
          .exec(),
        this.getStatusBreakdown(query),
        this.getPaymentStatusBreakdown(query),
        this.getMonthlyStats(query),
      ]);

      const revenueStats: RevenueAggregateResult = (
        revenueAggregateResult as RevenueAggregateResult[]
      )[0] || {
        _id: null,
        totalRevenue: 0,
        averageBookingValue: 0,
      };

      return {
        totalBookings,
        totalRevenue: Math.round(revenueStats.totalRevenue || 0),
        averageBookingValue: Math.round(revenueStats.averageBookingValue || 0),
        statusBreakdown,
        paymentStatusBreakdown,
        monthlyStats,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error calculating booking stats:',
        error,
        'BookingAdminService',
      );
      throw error;
    }
  }

  async cancelBookingAsAdmin(
    bookingId: string,
    adminId: string,
    reason?: string,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException('Booking is already cancelled');
      }

      if (booking.status === BookingStatus.CHECKED_OUT) {
        throw new BadRequestException('Cannot cancel completed booking');
      }

      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(
          bookingId,
          {
            status: BookingStatus.CANCELLED,
            cancelledAt: DateUtils.now(),
            cancelledBy: new Types.ObjectId(adminId),
            cancellationReason: reason || 'Cancelled by administrator',
          },
          { new: true },
        )
        .exec();

      if (!updatedBooking) {
        throw new BadRequestException('Failed to cancel booking');
      }

      LoggingUtil.log(`Admin ${adminId} cancelled booking ${bookingId}`, 'BookingAdminService');
      return updatedBooking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error cancelling booking ${bookingId} as admin:`,
        error,
        'BookingAdminService',
      );
      throw error;
    }
  }

  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: PaymentStatus,
    adminId: string,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);

      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(
          bookingId,
          {
            paymentStatus,
            ...(paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.PENDING
              ? { status: BookingStatus.CONFIRMED, confirmedAt: DateUtils.now() }
              : {}),
          },
          { new: true },
        )
        .exec();

      if (!updatedBooking) {
        throw new BadRequestException('Failed to update payment status');
      }

      LoggingUtil.log(
        `Admin ${adminId} updated booking ${bookingId} payment status to ${paymentStatus}`,
        'BookingAdminService',
      );
      return updatedBooking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating payment status for booking ${bookingId}:`,
        error,
        'BookingAdminService',
      );
      throw error;
    }
  }

  async updatePayoutStatus(
    bookingId: string,
    payoutStatus: PayoutStatus,
    adminId: string,
  ): Promise<BookingDocument> {
    try {
      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(bookingId, { payoutStatus }, { new: true })
        .exec();

      if (!updatedBooking) {
        throw new BadRequestException('Failed to update payout status');
      }

      LoggingUtil.log(
        `Admin ${adminId} updated booking ${bookingId} payout status to ${payoutStatus}`,
        'BookingAdminService',
      );
      return updatedBooking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating payout status for booking ${bookingId}:`,
        error,
        'BookingAdminService',
      );
      throw error;
    }
  }

  private buildFilterQuery(filters: BookingFiltersDto): BookingQueryFilter {
    return QueryBuilder.create()
      .addEnumFilter('status', filters.status)
      .addEnumFilter('paymentStatus', filters.paymentStatus)
      .addEnumFilter('payoutStatus', filters.payoutStatus)
      .addObjectIdFilters({
        hostId: filters.hostId,
        guestId: filters.guestId,
        propertyId: filters.propertyId,
      })
      .addDateRangeFilter('checkIn', filters.checkInFrom, filters.checkInTo)
      .addSearchFilter(filters.confirmationCode, {
        fields: ['confirmationCode'],
        caseSensitive: false,
        exactMatch: false,
      })
      .build();
  }

  private async getStatusBreakdown(
    query: BookingQueryFilter,
  ): Promise<Record<BookingStatus, number>> {
    const breakdown = await this.bookingModel
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const result: Record<BookingStatus, number> = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.CHECKED_IN]: 0,
      [BookingStatus.CHECKED_OUT]: 0,
      [BookingStatus.CANCELLED]: 0,
    };

    (breakdown as StatusAggregateResult[]).forEach((item: StatusAggregateResult) => {
      if (Object.values(BookingStatus).includes(item._id)) {
        result[item._id] = item.count;
      }
    });

    return result;
  }

  private async getPaymentStatusBreakdown(
    query: BookingQueryFilter,
  ): Promise<Record<PaymentStatus, number>> {
    const breakdown = await this.bookingModel
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const result: Record<PaymentStatus, number> = {
      [PaymentStatus.PENDING]: 0,
      [PaymentStatus.PAID]: 0,
      [PaymentStatus.FAILED]: 0,
      [PaymentStatus.REFUNDED]: 0,
    };

    (breakdown as PaymentStatusAggregateResult[]).forEach((item: PaymentStatusAggregateResult) => {
      if (Object.values(PaymentStatus).includes(item._id)) {
        result[item._id] = item.count;
      }
    });

    return result;
  }

  private async getMonthlyStats(query: BookingQueryFilter): Promise<MonthlyStatDto[]> {
    const sixMonthsAgo = DateUtils.now();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await this.bookingModel
      .aggregate([
        {
          $match: {
            ...query,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$pricing.totalAmount' },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ])
      .exec();

    return (monthlyStats as MonthlyAggregateResult[]).map((stat: MonthlyAggregateResult) => ({
      month: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
      bookings: stat.bookings,
      revenue: Math.round(stat.revenue),
    }));
  }
}
