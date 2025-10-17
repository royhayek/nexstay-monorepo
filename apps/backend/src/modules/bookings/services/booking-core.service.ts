import { Model, Types } from 'mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Booking, BookingDocument, BookingPricing } from '../../../database/schemas/booking.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { BlockedDate, BlockedDateDocument } from '../../../database/schemas/blocked-date.schema';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import { BOOKING_BUSINESS_CONSTANTS, BOOKING_STATUS_FLOW } from '../constants/booking.constants';
import { BookingValidationUtils } from '../utils/booking-validation.utils';
import { FeeCalculationService } from '../../fees/services/fee-calculation.service';
import { BookingConfigService } from '../../../common/services/booking-config.service';
import {
  BookingNotFoundException,
  PropertyNotAvailableException,
  InvalidBookingStatusTransitionException,
  BookingValidationException,
  GuestCapacityExceededException,
} from '../exceptions/booking.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * Core service for booking operations
 * Handles basic CRUD operations and business logic validation
 */
@Injectable()
export class BookingCoreService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(BlockedDate.name)
    private readonly blockedDateModel: Model<BlockedDateDocument>,
    private readonly feeCalculationService: FeeCalculationService,
    private readonly bookingConfigService: BookingConfigService,
  ) {}

  /**
   * Create a new booking with validation
   */
  async createBooking(dto: CreateBookingDto, guestId: string): Promise<BookingDocument> {
    try {
      // Validate property ID format
      ValidationUtils.validateObjectId(dto.propertyId, 'propertyId', {
        context: 'BookingCoreService',
        customMessage: 'Invalid property ID format',
      });

      // Validate and get property
      const property = await this.propertyModel.findById(dto.propertyId).exec();
      if (!property) {
        throw new BookingValidationException('Property not found', 'propertyId');
      }

      // Validate guest exists
      const guest = await this.userModel.findById(guestId).exec();
      if (!guest) {
        throw new BookingValidationException('Guest not found', 'guestId');
      }

      // Validate dates
      BookingValidationUtils.validateBookingDates(dto.checkIn, dto.checkOut);

      // Load booking configuration
      const bookingConfig = await this.bookingConfigService.getConfig();

      // Validate guest limits against dynamic configuration
      this.validateGuestLimits(dto.guests, bookingConfig);

      // Validate advance booking rules
      await this.validateAdvanceBookingRules(dto.checkIn, bookingConfig);

      // Calculate pricing
      const pricing = await this.calculatePricing(property, dto);

      // Check availability
      await this.validateAvailability(dto.propertyId, dto.checkIn, dto.checkOut);

      // Validate guest capacity
      this.validateGuestCapacity(dto.guests.totalGuests, property.accommodates);

      // Generate confirmation code
      const confirmationCode = this.generateConfirmationCode();

      // Create booking
      const booking = new this.bookingModel({
        propertyId: new Types.ObjectId(dto.propertyId),
        guestId: new Types.ObjectId(guestId),
        hostId: property.hostId,
        checkIn: DateUtils.create(dto.checkIn),
        checkOut: DateUtils.create(dto.checkOut),
        nights: dto.nights,
        guests: {
          adults: dto.guests.adults,
          children: dto.guests.children,
          infants: dto.guests.infants,
          totalGuests: dto.guests.totalGuests,
        },
        pricing,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        payoutStatus: PayoutStatus.PENDING,
        specialRequests: dto.specialRequests,
        estimatedArrivalTime: dto.estimatedArrivalTime,
        guestPhone: dto.guestPhone,
        guestEmail: dto.guestEmail,
        confirmationCode,
        guestReviewed: false,
        hostReviewed: false,
      });

      const savedBooking = await booking.save();
      LoggingUtil.log(
        `Booking created successfully: ${String(savedBooking._id)}`,
        'BookingCoreService',
      );

      return savedBooking;
    } catch (error) {
      LoggingUtil.errorWithException('Error creating booking:', error, 'BookingCoreService');
      throw error;
    }
  }

  /**
   * Find booking by ID
   */
  async findById(bookingId: string, populate: boolean = true): Promise<BookingDocument> {
    try {
      ValidationUtils.validateObjectId(bookingId, 'bookingId', {
        context: 'BookingCoreService',
        customMessage: 'Invalid booking ID format',
      });

      let query = this.bookingModel.findById(bookingId);

      if (populate) {
        query = query
          .populate('property')
          .populate('guest', 'firstName lastName email avatarUrl')
          .populate('host', 'firstName lastName email avatarUrl')
          .populate('guestReview')
          .populate('hostReview');
      }

      const booking = await query.exec();

      if (!booking) {
        throw new BookingNotFoundException(bookingId);
      }

      return booking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error finding booking ${bookingId}:`,
        error,
        'BookingCoreService',
      );
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    updatedBy: string,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.findById(bookingId, false);

      // Validate status transition
      this.validateStatusTransition(booking.status, status);

      const updateData: Partial<Booking> = { status };

      // Handle status-specific updates
      if (status === BookingStatus.CONFIRMED) {
        updateData.confirmedAt = DateUtils.now();
      } else if (status === BookingStatus.CANCELLED) {
        updateData.cancelledAt = DateUtils.now();
        updateData.cancelledBy = new Types.ObjectId(updatedBy);
      }

      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(bookingId, updateData, { new: true })
        .exec();

      if (!updatedBooking) {
        throw new BookingNotFoundException(bookingId);
      }

      LoggingUtil.log(`Booking ${bookingId} status updated to ${status}`, 'BookingCoreService');
      return updatedBooking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating booking status ${bookingId}:`,
        error,
        'BookingCoreService',
      );
      throw error;
    }
  }

  /**
   * Update booking payment status
   */
  async updatePaymentStatus(
    bookingId: string,
    paymentStatus: PaymentStatus,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.findById(bookingId, false);

      const updateData: Partial<Booking> = {
        paymentStatus,
        ...(paymentStatus === PaymentStatus.PAID && booking.status === BookingStatus.PENDING
          ? { status: BookingStatus.CONFIRMED, confirmedAt: DateUtils.now() }
          : {}),
      };

      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(bookingId, updateData, { new: true })
        .exec();

      if (!updatedBooking) {
        throw new BookingNotFoundException(bookingId);
      }

      LoggingUtil.log(
        `Booking ${bookingId} payment status updated to ${paymentStatus}`,
        'BookingCoreService',
      );
      return updatedBooking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating booking payment status ${bookingId}:`,
        error,
        'BookingCoreService',
      );
      throw error;
    }
  }

  /**
   * Check property availability for given dates
   * Now also checks for blocked dates in addition to bookings
   */
  private async validateAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string,
  ): Promise<void> {
    const checkInDate = DateUtils.create(checkIn);
    const checkOutDate = DateUtils.create(checkOut);

    // Check for conflicting bookings
    const conflictingBookings = await this.bookingModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate },
          },
        ],
      })
      .exec();

    if (conflictingBookings.length > 0) {
      throw new PropertyNotAvailableException(checkIn, checkOut, propertyId);
    }

    // Check for blocked dates
    const blockedDates = await this.blockedDateModel
      .findOne({
        propertyId: new Types.ObjectId(propertyId),
        $or: [
          { startDate: { $lt: checkOutDate }, endDate: { $gt: checkInDate } },
          { startDate: { $lte: checkInDate }, endDate: { $gte: checkOutDate } },
        ],
      })
      .exec();

    if (blockedDates) {
      throw new PropertyNotAvailableException(checkIn, checkOut, propertyId);
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const allowed = BOOKING_STATUS_FLOW.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new InvalidBookingStatusTransitionException(currentStatus, newStatus);
    }
  }

  /**
   * Validate guest capacity with proper type safety
   */
  private validateGuestCapacity(totalGuests: number, maxCapacity: number): void {
    if (totalGuests > maxCapacity) {
      throw new GuestCapacityExceededException(totalGuests, maxCapacity);
    }
  }

  /**
   * Generate confirmation code
   */
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < BOOKING_BUSINESS_CONSTANTS.CONFIRMATION_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Calculate booking pricing using unified fee calculation service
   */
  private async calculatePricing(
    property: PropertyDocument,
    dto: CreateBookingDto,
  ): Promise<BookingPricing> {
    const pricePerNight = Number(property.pricePerNight) || 0;
    const cleaningFeeValue = Number(property.cleaningFee) || 0;

    const baseAmount = pricePerNight * dto.nights;
    const cleaningFee = cleaningFeeValue;

    // Use unified fee calculation service
    const feeBreakdown = await this.feeCalculationService.calculateFeeBreakdown(baseAmount);

    return {
      baseAmount,
      cleaningFee,
      serviceFee: feeBreakdown.guestServiceFee,
      occupancyTaxes: feeBreakdown.occupancyTax,
      totalAmount:
        baseAmount + cleaningFee + feeBreakdown.guestServiceFee + feeBreakdown.occupancyTax,
      currency: feeBreakdown.currency,
    };
  }

  /**
   * Validate guest limits against dynamic configuration
   */
  private validateGuestLimits(
    guests: { adults: number; children?: number; infants?: number; totalGuests: number },
    config: { maxAdults: number; maxChildren: number; maxInfants: number; maxTotalGuests: number },
  ): void {
    if (guests.adults > config.maxAdults) {
      throw new BookingValidationException(
        `Number of adults (${guests.adults}) exceeds maximum allowed (${config.maxAdults})`,
        'adults',
      );
    }

    if (guests.children && guests.children > config.maxChildren) {
      throw new BookingValidationException(
        `Number of children (${guests.children}) exceeds maximum allowed (${config.maxChildren})`,
        'children',
      );
    }

    if (guests.infants && guests.infants > config.maxInfants) {
      throw new BookingValidationException(
        `Number of infants (${guests.infants}) exceeds maximum allowed (${config.maxInfants})`,
        'infants',
      );
    }

    if (guests.totalGuests > config.maxTotalGuests) {
      throw new BookingValidationException(
        `Total number of guests (${guests.totalGuests}) exceeds maximum allowed (${config.maxTotalGuests})`,
        'totalGuests',
      );
    }
  }

  /**
   * Validate advance booking rules against dynamic configuration
   */
  private async validateAdvanceBookingRules(
    checkInDate: string | Date,
    config: { maxAdvanceDays: number; minAdvanceHours: number },
  ): Promise<void> {
    const checkIn = DateUtils.create(checkInDate);
    const now = DateUtils.now();

    // Calculate time difference in hours
    const hoursDifference = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check minimum advance hours
    if (hoursDifference < config.minAdvanceHours) {
      throw new BookingValidationException(
        `Booking must be made at least ${config.minAdvanceHours} hours in advance`,
        'checkIn',
      );
    }

    // Calculate days difference
    const daysDifference = Math.ceil(hoursDifference / 24);

    // Check maximum advance days
    if (daysDifference > config.maxAdvanceDays) {
      throw new BookingValidationException(
        `Booking cannot be made more than ${config.maxAdvanceDays} days in advance`,
        'checkIn',
      );
    }
  }
}
