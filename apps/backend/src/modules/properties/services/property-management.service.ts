import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument, ImageSchema } from '../../../database/schemas/property.schema';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { S3Service } from '../../storage/services/s3.service';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { PropertyPricingUpdateData, PropertyStatistics } from '../types/booking-fields.interface';
import { BookingCompletionStatus, BookingActiveStatus } from '../../../common/enums/booking.enums';
import { ValidationUtils } from '../../../common/utils/validation.utils';

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

    return !conflictingBookings;
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
}
