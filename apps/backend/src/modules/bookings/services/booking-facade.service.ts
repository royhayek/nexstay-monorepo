import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { BookingCoreService } from './booking-core.service';
import { BookingAdminService } from './booking-admin.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { PaginationDto } from '../../messaging/dto/pagination.dto';
import { BOOKING_MESSAGES } from '../constants/booking.constants';
import { UserRole } from '../../../database/schemas/user.schema';
import {
  BookingFiltersDto,
  BookingListResponse,
  UserBookingFilters,
} from '../interfaces/booking-query.interfaces';
import {
  BookingNotFoundException,
  BookingValidationException,
} from '../exceptions/booking.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Facade service for booking operations
 * Orchestrates business logic by coordinating between core, admin, and other services
 * Implements proper separation of concerns with comprehensive error handling
 */
@Injectable()
export class BookingFacadeService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly bookingCoreService: BookingCoreService,
    private readonly bookingAdminService: BookingAdminService,
  ) {}

  // ========================================
  // CORE BOOKING OPERATIONS
  // ========================================

  async createBooking(dto: CreateBookingDto, guestId: string): Promise<BookingDocument> {
    try {
      LoggingUtil.log(
        `Creating booking for guest ${guestId} and property ${dto.propertyId}`,
        'BookingFacadeService',
      );
      return await this.bookingCoreService.createBooking(dto, guestId);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error creating booking for guest ${guestId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async getBookingById(
    bookingId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId);
      this.validateBookingAccess(booking, userId, userRole);
      return booking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error retrieving booking ${bookingId} for user ${userId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async getGuestBookings(
    guestId: string,
    filters: UserBookingFilters,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    ValidationUtils.validateObjectId(guestId, 'guestId', {
      context: 'BookingFacadeService',
    });

    try {
      const adminFilters: BookingFiltersDto = {
        guestId,
        ...filters,
      };

      return await this.bookingAdminService.findAllWithFilters(adminFilters, pagination);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error retrieving guest bookings for ${guestId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async getHostBookings(
    hostId: string,
    filters: UserBookingFilters,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    ValidationUtils.validateObjectId(hostId, 'hostId', {
      context: 'BookingFacadeService',
    });

    try {
      const adminFilters: BookingFiltersDto = {
        hostId,
        ...filters,
      };

      return await this.bookingAdminService.findAllWithFilters(adminFilters, pagination);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error retrieving host bookings for ${hostId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    userRole: UserRole,
    reason?: string,
  ): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);

      if (userRole === UserRole.ADMIN) {
        return await this.bookingAdminService.cancelBookingAsAdmin(bookingId, userId, reason);
      }

      ValidationUtils.validateObjectId(userId, 'userId', {
        context: 'BookingFacadeService',
      });

      const userObjectId = new Types.ObjectId(userId);
      const isGuest = booking.guestId.equals(userObjectId);
      const isHost = booking.hostId.equals(userObjectId);

      if (!isGuest && !isHost) {
        throw new ForbiddenException('Access denied to cancel this booking');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BadRequestException(BOOKING_MESSAGES.BOOKING_NOT_CANCELLABLE);
      }

      if (booking.status === BookingStatus.CHECKED_OUT) {
        throw new BadRequestException(BOOKING_MESSAGES.BOOKING_NOT_CANCELLABLE);
      }

      return await this.bookingCoreService.updateStatus(bookingId, BookingStatus.CANCELLED, userId);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error cancelling booking ${bookingId} by user ${userId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async confirmBooking(bookingId: string, hostId: string): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);
      this.validateHostAccess(booking, hostId, 'confirm this booking');
      this.validateBookingStatus(booking, [BookingStatus.PENDING], 'confirm');

      return await this.bookingCoreService.updateStatus(bookingId, BookingStatus.CONFIRMED, hostId);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error confirming booking ${bookingId} by host ${hostId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async checkInGuest(bookingId: string, hostId: string): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);
      this.validateHostAccess(booking, hostId, 'check in guests');
      this.validateBookingStatus(booking, [BookingStatus.CONFIRMED], 'check in');

      const today = DateUtils.now();
      const checkInDate = DateUtils.create(booking.checkIn);
      if (checkInDate > today) {
        throw new BookingValidationException('Check-in date has not arrived yet', 'checkIn');
      }

      return await this.bookingCoreService.updateStatus(
        bookingId,
        BookingStatus.CHECKED_IN,
        hostId,
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error checking in booking ${bookingId} by host ${hostId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async checkOutGuest(bookingId: string, hostId: string): Promise<BookingDocument> {
    try {
      const booking = await this.bookingCoreService.findById(bookingId, false);
      this.validateHostAccess(booking, hostId, 'check out guests');
      this.validateBookingStatus(booking, [BookingStatus.CHECKED_IN], 'check out');

      return await this.bookingCoreService.updateStatus(
        bookingId,
        BookingStatus.CHECKED_OUT,
        hostId,
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error checking out booking ${bookingId} by host ${hostId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async getBookingsByProperty(
    propertyId: string,
    hostId: string,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    try {
      const filters: BookingFiltersDto = {
        propertyId,
        hostId,
      };

      return await this.bookingAdminService.findAllWithFilters(filters, pagination);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error retrieving bookings for property ${propertyId} by host ${hostId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async getUpcomingBookings(userId: string, userRole: UserRole): Promise<BookingDocument[]> {
    try {
      const tomorrow = DateUtils.now();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const query: FilterQuery<BookingDocument> = {
        checkIn: { $gte: DateUtils.now(), $lte: tomorrow },
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      };

      if (userRole === UserRole.GUEST) {
        query.guestId = new Types.ObjectId(userId);
      } else if (userRole === UserRole.HOST) {
        query.hostId = new Types.ObjectId(userId);
      }

      const upcomingBookings = await this.bookingModel
        .find(query)
        .populate('property', 'title address')
        .populate('guest', 'firstName lastName')
        .populate('host', 'firstName lastName')
        .sort({ checkIn: 1 })
        .limit(10)
        .exec();

      return upcomingBookings;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error retrieving upcoming bookings for user ${userId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async findByConfirmationCode(confirmationCode: string): Promise<BookingDocument> {
    try {
      const booking = await this.bookingModel
        .findOne({ confirmationCode })
        .populate('property', 'title address')
        .populate('guest', 'firstName lastName email phone')
        .populate('host', 'firstName lastName email phone')
        .exec();

      if (!booking) {
        throw new BookingNotFoundException();
      }

      return booking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error finding booking by confirmation code ${confirmationCode}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  // ========================================
  // USER ROLE-BASED ACCESS CONTROL
  // ========================================

  /**
   * Validate user access to booking based on role and ownership
   */
  private validateBookingAccess(
    booking: BookingDocument,
    userId: string,
    userRole: UserRole,
    operation: string = 'access',
  ): void {
    if (userRole === UserRole.ADMIN) {
      return; // Admin has access to everything
    }

    const userObjectId = new Types.ObjectId(userId);
    const isGuest = booking.guestId.equals(userObjectId);
    const isHost = booking.hostId.equals(userObjectId);

    if (!isGuest && !isHost) {
      throw new ForbiddenException(`Access denied to ${operation} this booking`);
    }
  }

  /**
   * Validate host-only operations
   */
  private validateHostAccess(booking: BookingDocument, hostId: string, operation: string): void {
    const hostObjectId = new Types.ObjectId(hostId);
    if (!booking.hostId.equals(hostObjectId)) {
      throw new ForbiddenException(`Only the host can ${operation}`);
    }
  }

  /**
   * Validate booking status for specific operations
   */
  private validateBookingStatus(
    booking: BookingDocument,
    allowedStatuses: BookingStatus[],
    operation: string,
  ): void {
    if (!allowedStatuses.includes(booking.status)) {
      throw new BookingValidationException(
        `Booking must be in status [${allowedStatuses.join(', ')}] to ${operation}`,
        'status',
      );
    }
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================
  async findAllForAdmin(
    filters: BookingFiltersDto,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    try {
      return await this.bookingAdminService.findAllWithFilters(filters, pagination);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching bookings for admin:',
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async findById(bookingId: string): Promise<BookingDocument> {
    try {
      return await this.bookingCoreService.findById(bookingId);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error finding booking ${bookingId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async findByUserId(
    userId: string,
    filters: UserBookingFilters,
    pagination: PaginationDto,
  ): Promise<BookingListResponse> {
    try {
      return await this.getGuestBookings(userId, filters, pagination);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error finding bookings for user ${userId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async updateByAdmin(
    bookingId: string,
    _dto: UpdateBookingDto,
    adminId: string,
  ): Promise<BookingDocument> {
    try {
      // For admin updates, we'll just return the booking for now
      // This should be expanded to handle all update fields
      const booking = await this.bookingCoreService.findById(bookingId, false);
      LoggingUtil.log(`Admin ${adminId} updating booking ${bookingId}`, 'BookingFacadeService');
      return booking;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating booking ${bookingId} by admin ${adminId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async deleteByAdmin(bookingId: string, adminId: string): Promise<void> {
    try {
      // For safety, we should cancel rather than delete
      await this.bookingAdminService.cancelBookingAsAdmin(
        bookingId,
        adminId,
        'Deleted by administrator',
      );
      LoggingUtil.log(
        `Booking ${bookingId} cancelled (deleted) by admin ${adminId}`,
        'BookingFacadeService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error deleting booking ${bookingId} by admin ${adminId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async forceCancelByAdmin(bookingId: string, adminId: string): Promise<BookingDocument> {
    try {
      return await this.bookingAdminService.cancelBookingAsAdmin(
        bookingId,
        adminId,
        'Force cancelled by administrator',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error force cancelling booking ${bookingId} by admin ${adminId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }

  async overrideStatusByAdmin(
    bookingId: string,
    status: string,
    adminId: string,
    _reason?: string,
  ): Promise<BookingDocument> {
    try {
      const bookingStatus = status as BookingStatus;

      // Update the status directly through the core service
      return await this.bookingCoreService.updateStatus(bookingId, bookingStatus, adminId);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error overriding booking ${bookingId} status to ${status} by admin ${adminId}:`,
        error,
        'BookingFacadeService',
      );
      throw error;
    }
  }
}
