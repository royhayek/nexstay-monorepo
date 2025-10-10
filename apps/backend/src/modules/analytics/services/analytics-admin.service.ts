import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { Invoice, InvoiceDocument } from '../../../database/schemas/invoice.schema';
import {
  AdminAnalyticsFiltersDto,
  BookingDetailAnalyticsDto,
  TopHostAnalyticsDto,
  RecentInvoiceAnalyticsDto,
  YearlyBookingStatisticsDto,
  CustomerReviewAnalyticsDto,
  ToursAvailabilityDto,
} from '../dto/analytics-admin.dto';
import {
  TopHostAggregationResult,
  YearlyStatsAggregationResult,
  PopulatedReview,
  PopulatedBooking,
  PopulatedInvoice,
  FilterQuery,
  BookingStatusAggregationResult,
} from '../interfaces/mongodb-aggregation.interfaces';
import { PaginationConfig } from 'src/common/interfaces/database.interfaces';

/**
 * Admin Analytics Service
 * Handles admin-specific analytics operations, complex aggregations, and detailed reporting
 */
@Injectable()
export class AnalyticsAdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<InvoiceDocument>,
  ) {}

  /**
   * Get paginated booking details for admin dashboard
   */
  async getBookingDetailsWithFilters(
    filters: AdminAnalyticsFiltersDto,
    pagination: PaginationConfig,
  ): Promise<{
    items: BookingDetailAnalyticsDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const { page: validPage, limit: validLimit, skip } = validatePagination(pagination);

      // Build filter query
      const query = this.buildBookingFiltersQuery(filters);

      const [bookings, total] = await Promise.all([
        this.bookingModel
          .find(query)
          .populate('guest', 'firstName lastName phone profileImage')
          .populate('property', 'name images address')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validLimit)
          .lean(),
        this.bookingModel.countDocuments(query),
      ]);

      const bookingDetails = bookings.map((booking) =>
        this.transformToBookingDetailDto(booking as unknown as PopulatedBooking),
      );
      const paginationResult = buildPaginatedResult(bookingDetails, total, validPage, validLimit);

      return {
        items: paginationResult.data,
        total: paginationResult.total,
        page: paginationResult.page,
        limit: paginationResult.limit,
        totalPages: paginationResult.totalPages,
        hasNextPage: paginationResult.hasNextPage,
        hasPrevPage: paginationResult.hasPrevPage,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching booking details with filters:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get top performing hosts with detailed analytics
   */
  async getTopHosts(limit: number = 10): Promise<TopHostAnalyticsDto[]> {
    try {
      const topHosts = await this.userModel.aggregate<TopHostAggregationResult>([
        {
          $match: {
            roles: 'host',
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: 'properties',
            localField: '_id',
            foreignField: 'hostId',
            as: 'properties',
          },
        },
        {
          $lookup: {
            from: 'bookings',
            localField: 'properties._id',
            foreignField: 'propertyId',
            as: 'bookings',
          },
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'revieweeId',
            as: 'reviews',
          },
        },
        {
          $addFields: {
            totalBookings: { $size: '$bookings' },
            totalRevenue: {
              $sum: {
                $map: {
                  input: '$bookings',
                  as: 'booking',
                  in: '$$booking.totalAmount',
                },
              },
            },
            averageRating: { $avg: '$reviews.overallRating' },
            totalProperties: { $size: '$properties' },
            reviewCount: { $size: '$reviews' },
          },
        },
        {
          $sort: { totalRevenue: -1 },
        },
        {
          $limit: limit,
        },
        {
          $project: {
            id: { $toString: '$_id' },
            name: { $concat: ['$firstName', ' ', '$lastName'] },
            email: 1,
            avatar: '$profileImage',
            totalBookings: 1,
            totalRevenue: 1,
            totalProperties: 1,
            rating: { $round: ['$averageRating', 1] },
            reviewCount: 1,
            responseRate: 95, // Implementation pending - requires message response analytics
            joinDate: '$createdAt',
            lastActiveAt: 1,
            isVerified: { $ifNull: ['$isVerified', false] },
          },
        },
      ]);

      return topHosts.map((host: TopHostAggregationResult) => ({
        id: host._id.toString(),
        name: `${host.firstName || ''} ${host.lastName || ''}`.trim() || 'Unknown Host',
        email: host.email || '',
        avatar: host.profileImage,
        totalBookings: host.totalBookings,
        totalRevenue: Math.round(host.totalRevenue || 0),
        totalProperties: host.totalProperties,
        rating: Math.round((host.averageRating || 0) * 10) / 10,
        reviewCount: host.reviewCount,
        responseRate: host.responseRate || 95,
        joinDate: host.createdAt,
        lastActiveAt: host.lastActiveAt,
        isVerified: host.isVerified || false,
      }));
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching top hosts analytics:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get recent invoices with analytics data
   */
  async getRecentInvoices(limit: number = 10): Promise<RecentInvoiceAnalyticsDto[]> {
    try {
      const invoices = await this.invoiceModel
        .find({ deletedAt: null })
        .populate('bookingId', 'guest property')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return invoices.map((invoice) => ({
        id: invoice.invoiceNumber || String(invoice._id as any),
        category: invoice.bookingId ? 'Booking' : 'General',
        amount: invoice.pricing?.totalAmount || 0,
        currency: invoice.pricing?.currency || 'USD',
        status: invoice.status as 'paid' | 'pending' | 'overdue' | 'cancelled',
        createdAt: invoice.createdAt,
        dueDate: invoice.dueDate || invoice.createdAt,
        bookingId: invoice.bookingId
          ? String((invoice.bookingId as PopulatedInvoice['bookingId'])?._id)
          : undefined,
        description: String(invoice.invoiceNumber || 'Invoice'),
      }));
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching recent invoices:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get yearly booking statistics for trend analysis
   */
  async getYearlyBookingStatistics(years: number = 6): Promise<YearlyBookingStatisticsDto[]> {
    try {
      const currentYear = DateUtils.now().getFullYear();
      const startYear = currentYear - years + 1;

      const yearlyStats = await this.bookingModel.aggregate<YearlyStatsAggregationResult>([
        {
          $match: {
            createdAt: {
              $gte: DateUtils.create(new Date(startYear, 0, 1)),
              $lte: DateUtils.create(new Date(currentYear, 11, 31)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              status: '$status',
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
          },
        },
        {
          $group: {
            _id: '$_id.year',
            statuses: {
              $push: {
                status: '$_id.status',
                count: '$count',
                revenue: '$revenue',
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return yearlyStats.map((yearData: YearlyStatsAggregationResult) => {
        const statusMap = yearData.statuses.reduce(
          (acc: Record<string, { count: number; revenue: number }>, status) => {
            acc[status.status] = { count: status.count, revenue: status.revenue };
            return acc;
          },
          {} as Record<string, { count: number; revenue: number }>,
        );

        const confirmedData = statusMap.confirmed || { count: 0, revenue: 0 };
        const completedData = statusMap.completed || { count: 0, revenue: 0 };
        const cancelledData = statusMap.cancelled || { count: 0, revenue: 0 };

        return {
          year: yearData._id,
          sold: confirmedData.count + completedData.count,
          cancelled: cancelledData.count,
          revenue: confirmedData.revenue + completedData.revenue,
          totalBookings: yearData.statuses.reduce((sum, status) => sum + status.count, 0),
        };
      });
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating yearly booking statistics:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get customer reviews with analytics context
   */
  async getCustomerReviews(limit: number = 10): Promise<CustomerReviewAnalyticsDto[]> {
    try {
      const reviews = await this.reviewModel
        .find({ deletedAt: null })
        .populate('reviewer', 'firstName lastName profileImage')
        .populate('property', 'name images')
        .populate('booking', 'confirmationCode')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return reviews.map((review) => {
        const populatedReview = review as unknown as PopulatedReview;
        return {
          id: String(populatedReview._id),
          customerName: this.buildFullName(
            populatedReview.reviewer?.firstName,
            populatedReview.reviewer?.lastName,
          ),
          customerAvatar: populatedReview.reviewer?.profileImage,
          content: review.publicReview || '',
          rating: review.overallRating || 0,
          postedAt: review.createdAt,
          tags: this.generateReviewTags(review.overallRating || 0),
          propertyName: populatedReview.property?.name || 'Unknown Property',
          propertyImage: populatedReview.property?.images?.[0]?.url,
          bookingCode: populatedReview.booking?.confirmationCode,
          status: 'approved', // Assuming all fetched reviews are approved
          sentiment: this.analyzeSentiment(review.overallRating || 0),
        };
      });
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching customer reviews:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get tours/properties availability analytics
   */
  async getToursAvailability(): Promise<ToursAvailabilityDto> {
    try {
      const [totalProperties, activeProperties, unavailableCount] = await Promise.all([
        this.propertyModel.countDocuments({ deletedAt: null }),
        this.propertyModel.countDocuments({
          deletedAt: null,
          isActive: true,
        }),
        this.propertyModel.countDocuments({
          deletedAt: null,
          isActive: false,
        }),
      ]);

      // Calculate availability based on active properties and bookings
      const soldOut = Math.floor(activeProperties * 0.65); // Mock calculation - 65% occupancy
      const available = activeProperties - soldOut;

      return {
        total: totalProperties,
        active: activeProperties,
        inactive: unavailableCount,
        soldOut,
        available,
        occupancyRate: totalProperties > 0 ? Math.round((soldOut / totalProperties) * 100) : 0,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating tours availability:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  /**
   * Get comprehensive booking statistics breakdown
   */
  async getBookingStatusBreakdown(): Promise<Record<string, number>> {
    try {
      const statusStats = await this.bookingModel.aggregate<BookingStatusAggregationResult>([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      return statusStats.reduce(
        (acc: Record<string, number>, stat: BookingStatusAggregationResult) => {
          acc[stat._id] = stat.count;
          return acc;
        },
        {} as Record<string, number>,
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating booking status breakdown:`,
        error,
        'AnalyticsAdminService',
      );
      throw error;
    }
  }

  // Private helper methods

  private buildBookingFiltersQuery(filters: AdminAnalyticsFiltersDto): FilterQuery {
    const query: FilterQuery = { deletedAt: null };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      ValidationUtils.validateDateRange(filters.startDate, filters.endDate, {
        context: 'AnalyticsAdminService',
      });
      query.createdAt = {
        $gte: DateUtils.create(filters.startDate),
        $lte: DateUtils.create(filters.endDate),
      };
    }

    if (filters.propertyId) {
      ValidationUtils.validateObjectId(filters.propertyId, 'propertyId', {
        context: 'AnalyticsAdminService',
      });
      query.propertyId = filters.propertyId;
    }

    if (filters.guestId) {
      ValidationUtils.validateObjectId(filters.guestId, 'guestId', {
        context: 'AnalyticsAdminService',
      });
      query.guestId = filters.guestId;
    }

    if (filters.minAmount || filters.maxAmount) {
      query.totalAmount = {};
      if (filters.minAmount) query.totalAmount.$gte = filters.minAmount;
      if (filters.maxAmount) query.totalAmount.$lte = filters.maxAmount;
    }

    return query;
  }

  private transformToBookingDetailDto(booking: PopulatedBooking): BookingDetailAnalyticsDto {
    return {
      id: String(booking._id as any),
      destination: booking.property?.name || 'Unknown Property',
      propertyImage: booking.property?.images?.[0]?.url,
      customerName: this.buildFullName(booking.guest?.firstName, booking.guest?.lastName),
      customerPhone: booking.guest?.phone,
      customerAvatar: booking.guest?.profileImage,
      checkIn: booking.checkIn || DateUtils.now(),
      checkOut: booking.checkOut || DateUtils.now(),
      status: booking.status || 'unknown',
      totalAmount: booking.pricing?.totalAmount || booking.totalAmount || 0,
      currency: booking.pricing?.currency || 'USD',
      nights: booking.nights || 0,
      guests: booking.guests?.totalGuests || 0,
      confirmationCode: booking.confirmationCode,
      createdAt: booking.createdAt,
      location: booking.property?.address?.city || 'Unknown Location',
    };
  }

  private buildFullName(firstName?: string, lastName?: string): string {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  }

  private generateReviewTags(rating: number): string[] {
    const tags: string[] = [];
    if (rating >= 4) {
      tags.push('Great service', 'Recommended');
      if (rating === 5) tags.push('Best price');
    } else if (rating >= 3) {
      tags.push('Good experience');
    } else {
      tags.push('Needs improvement');
    }
    return tags;
  }

  private analyzeSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
    if (rating >= 4) return 'positive';
    if (rating >= 3) return 'neutral';
    return 'negative';
  }
}
