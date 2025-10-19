import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument, ImageSchema } from '../../../database/schemas/property.schema';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { BlockedDate, BlockedDateDocument } from '../../../database/schemas/blocked-date.schema';
import { S3Service } from '../../storage/services/s3.service';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { PropertyPricingUpdateData, PropertyStatistics } from '../types/booking-fields.interface';
import { BookingCompletionStatus, BookingActiveStatus } from '../../../common/enums/booking.enums';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import {
  BlockDatesDto,
  BlockedDateDataDto,
  UnblockDatesDataDto,
  BookingCalendarDataDto,
  CalendarViewDataDto,
} from '../dto/calendar-management.dto';

/**
 * Property Management Service
 * Handles property images, availability, pricing, and statistics
 */
@Injectable()
export class PropertyManagementService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(BlockedDate.name)
    private readonly blockedDateModel: Model<BlockedDateDocument>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Add image to property
   */
  async addImage(propertyId: string, imageData: ImageSchema): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const property = await this.propertyModel.findByIdAndUpdate(
      propertyId,
      { $push: { images: imageData } },
      { new: true },
    );

    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    return property!;
  }

  /**
   * Remove image from property
   */
  async removeImage(propertyId: string, imageKey: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const property = await this.propertyModel.findById(propertyId);
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    // Find the image to remove
    const imageToRemove = property!.images?.find((img) => img.key === imageKey);
    if (imageToRemove) {
      // Delete from S3
      try {
        await this.s3Service.deleteFile(imageKey);
        // Delete variants if they exist
        if (imageToRemove.variants) {
          await Promise.all(
            imageToRemove.variants.map((variant) => this.s3Service.deleteFile(variant.key)),
          );
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          'Failed to delete image from S3',
          error,
          'PropertyManagementService',
        );
      }
    }

    // Remove from property
    property!.images = property!.images?.filter((img) => img.key !== imageKey);
    return await property!.save();
  }

  /**
   * Update property availability
   */
  async updateAvailability(
    propertyId: string,
    dates: Date[],
    available: boolean,
  ): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const property = await this.propertyModel.findById(propertyId);
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    if (available) {
      // Add available dates
      const uniqueDates = dates.filter(
        (date) => !property!.availableDates?.some((d) => d.getTime() === date.getTime()),
      );
      property!.availableDates = [...(property!.availableDates || []), ...uniqueDates];
    } else {
      // Remove dates (mark as unavailable)
      property!.availableDates = property!.availableDates?.filter(
        (availDate) => !dates.some((date) => date.getTime() === availDate.getTime()),
      );
    }

    return await property!.save();
  }

  /**
   * Update property pricing
   */
  async updatePricing(
    propertyId: string,
    pricePerNight: number,
    cleaningFee?: number,
    serviceFee?: number,
  ): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    // Validate price values
    ValidationUtils.validatePrice(pricePerNight, 'pricePerNight', {
      allowZero: false,
      context: 'PropertyManagementService',
    });

    if (cleaningFee !== undefined) {
      ValidationUtils.validatePrice(cleaningFee, 'cleaningFee', {
        allowZero: true,
        context: 'PropertyManagementService',
      });
    }

    if (serviceFee !== undefined) {
      ValidationUtils.validatePrice(serviceFee, 'serviceFee', {
        allowZero: true,
        context: 'PropertyManagementService',
      });
    }

    const updateData: PropertyPricingUpdateData = { pricePerNight };
    if (cleaningFee !== undefined) updateData.cleaningFee = cleaningFee;
    if (serviceFee !== undefined) updateData.serviceFee = serviceFee;

    const property = await this.propertyModel.findByIdAndUpdate(propertyId, updateData, {
      new: true,
    });

    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    return property!;
  }

  /**
   * Get property statistics
   */
  async getStatistics(propertyId: string): Promise<PropertyStatistics> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const property = await this.propertyModel.findById(propertyId);
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    // Get booking statistics
    const bookings = await this.bookingModel.find({
      property: propertyId,
      status: { $in: [BookingCompletionStatus.CONFIRMED, BookingCompletionStatus.COMPLETED] },
    });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.pricing?.totalAmount || 0);
    }, 0);

    // Calculate occupancy rate (last 30 days)
    const thirtyDaysAgo = DateUtils.now();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = bookings.filter((booking) => {
      return booking.checkIn >= thirtyDaysAgo;
    });
    const bookedNights = recentBookings.reduce((sum, booking) => {
      const nights = Math.ceil(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + nights;
    }, 0);

    const occupancyRate = (bookedNights / 30) * 100;

    return {
      totalBookings,
      totalRevenue,
      averageRating: property!.rating || 0,
      reviewCount: property!.reviewCount || 0,
      occupancyRate: Math.min(occupancyRate, 100),
      viewCount: property!.viewCount || 0,
    };
  }

  /**
   * Increment view count
   */
  async incrementViewCount(propertyId: string): Promise<void> {
    try {
      ValidationUtils.validateObjectId(propertyId, 'propertyId', {
        context: 'PropertyManagementService',
      });
    } catch (error) {
      LoggingUtil.errorWithException(
        'Invalid propertyId in incrementViewCount',
        error,
        'PropertyManagementService',
      );
      return;
    }

    await this.propertyModel.findByIdAndUpdate(propertyId, { $inc: { viewCount: 1 } });
  }

  /**
   * Update property rating based on reviews
   */
  async updateRating(propertyId: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const reviews = await this.reviewModel.find({ property: propertyId });

    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => {
            return sum + (review.overallRating || 0);
          }, 0) / reviewCount
        : 0;

    const property = await this.propertyModel.findByIdAndUpdate(
      propertyId,
      {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount,
      },
      { new: true },
    );

    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyManagementService',
    });

    return property!;
  }

  /**
   * Check property availability for date range
   * Now also checks for blocked dates in addition to bookings
   */
  async checkAvailability(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    // Validate date range
    ValidationUtils.validateDateRange(checkIn, checkOut, {
      allowToday: true,
      allowPast: false,
      minNights: 1,
      context: 'PropertyManagementService',
    });

    // Check for conflicting bookings
    const conflictingBookings = await this.bookingModel.findOne({
      property: propertyId,
      status: { $in: [BookingActiveStatus.PENDING, BookingActiveStatus.CONFIRMED] },
      $or: [
        { checkIn: { $lt: checkOut, $gte: checkIn } },
        { checkOut: { $gt: checkIn, $lte: checkOut } },
        { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } },
      ],
    });

    if (conflictingBookings) {
      return false;
    }

    // Check for blocked dates
    const blockedDates = await this.blockedDateModel.findOne({
      propertyId: new Types.ObjectId(propertyId),
      $or: [
        { startDate: { $lt: checkOut }, endDate: { $gt: checkIn } },
        { startDate: { $lte: checkIn }, endDate: { $gte: checkOut } },
      ],
    });

    return !blockedDates;
  }

  /**
   * Get booked dates for a property
   */
  async getBookedDates(propertyId: string): Promise<Date[]> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyManagementService',
    });

    const bookings = await this.bookingModel.find({
      property: propertyId,
      status: { $in: [BookingActiveStatus.PENDING, BookingActiveStatus.CONFIRMED] },
    });

    const bookedDates: Date[] = [];

    bookings.forEach((booking) => {
      const currentDate = DateUtils.create(booking.checkIn);
      const endDate = DateUtils.create(booking.checkOut);
      while (currentDate < endDate) {
        bookedDates.push(DateUtils.create(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return bookedDates;
  }

  // ========== CALENDAR MANAGEMENT METHODS ==========

  /**
   * Block dates for a property
   * Creates a blocked date range that prevents bookings
   */
  async blockDates(
    propertyId: string,
    blockDatesDto: BlockDatesDto,
    userId: string,
  ): Promise<BlockedDateDataDto> {
    try {
      ValidationUtils.validateObjectId(propertyId, 'propertyId', {
        context: 'PropertyManagementService',
      });
      ValidationUtils.validateObjectId(userId, 'userId', {
        context: 'PropertyManagementService',
      });

      // Verify property exists
      const property = await this.propertyModel.findById(propertyId);
      ValidationUtils.validateEntityExists(property, propertyId, {
        entityName: 'Property',
        context: 'PropertyManagementService',
      });

      // Validate date range
      const startDate = DateUtils.create(blockDatesDto.startDate);
      const endDate = DateUtils.create(blockDatesDto.endDate);

      ValidationUtils.validateDateRange(startDate, endDate, {
        allowToday: true,
        allowPast: false,
        minNights: 1,
        context: 'PropertyManagementService',
      });

      // Check for conflicting bookings
      const conflictingBookings = await this.bookingModel.findOne({
        property: propertyId,
        status: { $in: [BookingActiveStatus.PENDING, BookingActiveStatus.CONFIRMED] },
        $or: [
          { checkIn: { $lt: endDate }, checkOut: { $gt: startDate } },
          { checkIn: { $lte: startDate }, checkOut: { $gte: endDate } },
        ],
      });

      if (conflictingBookings) {
        throw new BadRequestException(
          'Cannot block dates that overlap with existing confirmed bookings',
        );
      }

      // Create blocked date record
      const blockedDate = new this.blockedDateModel({
        propertyId: new Types.ObjectId(propertyId),
        startDate,
        endDate,
        reason: blockDatesDto.reason,
        createdBy: new Types.ObjectId(userId),
      });

      const savedBlockedDate = await blockedDate.save();

      LoggingUtil.log(
        `Dates blocked for property ${propertyId}: ${startDate.toISOString()} - ${endDate.toISOString()}`,
        'PropertyManagementService',
      );

      return {
        id: String(savedBlockedDate._id),
        propertyId: String(savedBlockedDate.propertyId),
        startDate: savedBlockedDate.startDate,
        endDate: savedBlockedDate.endDate,
        reason: savedBlockedDate.reason,
        createdBy: String(savedBlockedDate.createdBy),
        updatedBy: savedBlockedDate.updatedBy ? String(savedBlockedDate.updatedBy) : undefined,
        createdAt: savedBlockedDate.createdAt,
        updatedAt: savedBlockedDate.updatedAt,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error blocking dates for property ${propertyId}:`,
        error,
        'PropertyManagementService',
      );
      throw error;
    }
  }

  /**
   * Unblock dates for a property
   * Removes blocked date records by their IDs
   */
  async unblockDates(
    propertyId: string,
    blockedDateIds: string[],
    userId: string,
  ): Promise<UnblockDatesDataDto> {
    try {
      ValidationUtils.validateObjectId(propertyId, 'propertyId', {
        context: 'PropertyManagementService',
      });
      ValidationUtils.validateObjectId(userId, 'userId', {
        context: 'PropertyManagementService',
      });

      // Validate all blocked date IDs
      blockedDateIds.forEach((id) => {
        ValidationUtils.validateObjectId(id, 'blockedDateId', {
          context: 'PropertyManagementService',
        });
      });

      // Verify property exists
      const property = await this.propertyModel.findById(propertyId);
      ValidationUtils.validateEntityExists(property, propertyId, {
        entityName: 'Property',
        context: 'PropertyManagementService',
      });

      // Delete the blocked date records
      const deleteResult = await this.blockedDateModel.deleteMany({
        _id: { $in: blockedDateIds.map((id) => new Types.ObjectId(id)) },
        propertyId: new Types.ObjectId(propertyId),
      });

      if (deleteResult.deletedCount === 0) {
        throw new NotFoundException('No matching blocked dates found to unblock');
      }

      LoggingUtil.log(
        `Unblocked ${deleteResult.deletedCount} date ranges for property ${propertyId}`,
        'PropertyManagementService',
      );

      return {
        unblocked: deleteResult.deletedCount || 0,
        unblockedIds: blockedDateIds.slice(0, deleteResult.deletedCount),
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error unblocking dates for property ${propertyId}:`,
        error,
        'PropertyManagementService',
      );
      throw error;
    }
  }

  /**
   * Get calendar view for a property
   * Returns both bookings and blocked dates for calendar display
   */
  async getCalendarView(
    propertyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CalendarViewDataDto> {
    try {
      ValidationUtils.validateObjectId(propertyId, 'propertyId', {
        context: 'PropertyManagementService',
      });

      // Verify property exists
      const property = await this.propertyModel.findById(propertyId);
      ValidationUtils.validateEntityExists(property, propertyId, {
        entityName: 'Property',
        context: 'PropertyManagementService',
      });

      // Build date filter
      const dateFilter: Record<string, unknown> = { propertyId: new Types.ObjectId(propertyId) };
      if (startDate || endDate) {
        const checkInFilter: Record<string, Date> = {};
        if (startDate) checkInFilter.$gte = DateUtils.create(startDate);
        if (endDate) checkInFilter.$lte = DateUtils.create(endDate);
        dateFilter.checkIn = checkInFilter;
      }

      // Get bookings
      const bookings = await this.bookingModel
        .find(dateFilter)
        .populate('guest', 'firstName lastName')
        .sort({ checkIn: 1 })
        .exec();

      // Build blocked dates filter
      const blockedFilter: Record<string, unknown> = {
        propertyId: new Types.ObjectId(propertyId),
      };
      if (startDate || endDate) {
        const dateRangeFilter: Array<Record<string, unknown>> = [];
        if (startDate) {
          dateRangeFilter.push({ endDate: { $gte: DateUtils.create(startDate) } });
        }
        if (endDate) {
          dateRangeFilter.push({ startDate: { $lte: DateUtils.create(endDate) } });
        }
        if (dateRangeFilter.length > 0) {
          blockedFilter.$and = dateRangeFilter;
        }
      }

      // Get blocked dates
      const blockedDates = await this.blockedDateModel
        .find(blockedFilter)
        .sort({ startDate: 1 })
        .exec();

      // Transform bookings to calendar format
      const bookingCalendarData: BookingCalendarDataDto[] = bookings.map((booking) => {
        // Access populated guest data through the booking's virtual field
        const populatedBooking = booking as unknown as {
          _id: unknown;
          checkIn: Date;
          checkOut: Date;
          status: string;
          nights: number;
          guests: { totalGuests: number };
          confirmationCode?: string;
          guest?: { firstName?: string; lastName?: string };
        };

        const guest = populatedBooking.guest;
        const guestName =
          guest && guest.firstName && guest.lastName
            ? `${guest.firstName} ${guest.lastName}`
            : 'Guest';

        return {
          id: String(populatedBooking._id),
          checkIn: populatedBooking.checkIn,
          checkOut: populatedBooking.checkOut,
          status: populatedBooking.status,
          guestName,
          nights: populatedBooking.nights,
          totalGuests: populatedBooking.guests.totalGuests,
          confirmationCode: populatedBooking.confirmationCode,
        };
      });

      // Transform blocked dates to DTO format
      const blockedDateData: BlockedDateDataDto[] = blockedDates.map((blocked) => ({
        id: String(blocked._id),
        propertyId: String(blocked.propertyId),
        startDate: blocked.startDate,
        endDate: blocked.endDate,
        reason: blocked.reason,
        createdBy: String(blocked.createdBy),
        updatedBy: blocked.updatedBy ? String(blocked.updatedBy) : undefined,
        createdAt: blocked.createdAt,
        updatedAt: blocked.updatedAt,
      }));

      return {
        bookings: bookingCalendarData,
        blockedDates: blockedDateData,
        startDate: startDate ? DateUtils.create(startDate) : undefined,
        endDate: endDate ? DateUtils.create(endDate) : undefined,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting calendar view for property ${propertyId}:`,
        error,
        'PropertyManagementService',
      );
      throw error;
    }
  }
}
