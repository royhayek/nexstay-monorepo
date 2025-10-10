import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
} from '@nestjs/common';
import { BookingStatus, PaymentStatus } from '../../../common/enums/booking.enums';
import { ApiTags, ApiQuery, ApiParam, ApiExtraModels } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import type { BookingStatusOverrideRequest } from '../interfaces/bookings-controller.interfaces';
import {
  BookingResponseDto,
  SingleBookingResponseDto,
  BookingListResponseDto,
} from '../dto/booking-response.dto';
import {
  BookingDeletionResponseDto,
  UserBookingsResponseDto,
} from '../dto/booking-operation-response.dto';
import { BookingFacadeService } from '../services/booking-facade.service';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

/**
 * Admin Controller for Bookings
 * Handles administrative booking management operations
 */
@Controller('admin/bookings')
@ApiTags('Bookings Management')
@ApiExtraModels(BookingResponseDto, PaginatedDto)
export class BookingsAdminController extends BaseController {
  constructor(private readonly bookingsService: BookingFacadeService) {
    super();
  }

  @Get()
  @AdminEndpoint(
    'Get all bookings with filtering and pagination (Admin only)',
    'Retrieve all bookings with comprehensive filtering and pagination capabilities',
    BookingListResponseDto,
  )
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by guest name, property name, or booking ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    type: String,
    description:
      'Filter by payment status (comma-separated for multiple statuses, e.g., "paid,pending")',
  })
  @ApiQuery({ name: 'guestId', required: false, type: String, description: 'Filter by guest ID' })
  @ApiQuery({ name: 'hostId', required: false, type: String, description: 'Filter by host ID' })
  @ApiQuery({
    name: 'propertyId',
    required: false,
    type: String,
    description: 'Filter by property ID',
  })
  @ApiQuery({
    name: 'checkIn',
    required: false,
    type: String,
    description: 'Filter by check-in date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'checkOut',
    required: false,
    type: String,
    description: 'Filter by check-out date (YYYY-MM-DD)',
  })
  async getAllBookings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') _search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('guestId') guestId?: string,
    @Query('hostId') hostId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ): Promise<BookingListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingsService.findAllForAdmin(
          {
            status: status as BookingStatus,
            paymentStatus: paymentStatus as PaymentStatus,
            guestId,
            hostId,
            propertyId,
            checkInFrom: checkIn,
            checkInTo: checkOut,
          },
          { page, limit: Math.min(limit, 100) },
        );

        const items = result.items.map((booking) =>
          plainToInstance(BookingResponseDto, booking.toObject()),
        );

        return {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get all bookings',
      'All Bookings List',
      'Bookings retrieved successfully',
      'Failed to retrieve bookings',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get booking by ID (Admin only)',
    'Retrieve detailed information for a specific booking by its ID',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async getBookingById(@Param('id') id: string): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.findById(id);
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Get booking by ID',
      'Booking Details',
      'Booking retrieved successfully',
      'Failed to retrieve booking',
    );
  }

  @Get('user/:userId')
  @AdminEndpoint(
    'Get bookings of a specific user (Admin only)',
    'Retrieve bookings for a specific user with filtering and pagination',
    UserBookingsResponseDto,
  )
  @ApiParam({ name: 'userId', description: 'User ID to fetch bookings for' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort by field (default: createdAt)',
    enum: ['createdAt', 'checkIn', 'checkOut', 'totalAmount', 'status'],
  })
  @ApiQuery({
    name: 'sortDirection',
    required: false,
    type: String,
    description: 'Sort direction: asc or desc (default: desc)',
    enum: ['asc', 'desc'],
  })
  async getUserBookings(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('sortBy', new DefaultValuePipe('createdAt')) _sortBy?: string,
    @Query('sortDirection', new DefaultValuePipe('desc')) _sortDirection?: 'asc' | 'desc',
  ): Promise<UserBookingsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingsService.findByUserId(
          userId,
          { status: status as BookingStatus },
          { page, limit: Math.min(limit, 100) },
        );

        // Data is already transformed by the service
        const items = result.items.map((booking) =>
          plainToInstance(BookingResponseDto, booking.toObject()),
        );

        return {
          items,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get user bookings',
      'User Bookings Retrieved',
      'User bookings retrieved successfully',
      'Failed to retrieve user bookings',
    );
  }

  @Put(':id')
  @AdminEndpoint(
    'Update booking by admin (Admin only)',
    'Update booking information and settings as an administrator',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.updateByAdmin(
          id,
          updateBookingDto,
          String(adminUser._id),
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Update booking',
      'Update Booking Details',
      'Booking updated successfully',
      'Failed to update booking',
    );
  }

  @Delete(':id')
  @AdminEndpoint(
    'Delete booking by admin (Admin only)',
    'Permanently delete a booking record and associated data',
    BookingDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async deleteBooking(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<BookingDeletionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.bookingsService.deleteByAdmin(id, String(adminUser._id));
        return { deleted: true };
      },
      'Delete booking',
      'Delete Booking Record',
      'Booking deleted successfully',
      'Failed to delete booking',
    );
  }

  @Put(':id/force-cancel')
  @AdminEndpoint(
    'Force cancel booking (Admin only)',
    'Force cancel a booking regardless of its current status',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async forceCancelBooking(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.forceCancelByAdmin(id, String(adminUser._id));
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Force cancel booking',
      'Force Cancel Booking',
      'Booking force cancelled successfully',
      'Failed to force cancel booking',
    );
  }

  @Put(':id/override-status')
  @AdminEndpoint(
    'Override booking status (Admin only)',
    'Override the status of a booking with admin privileges',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async overrideBookingStatus(
    @Param('id') id: string,
    @Body() body: BookingStatusOverrideRequest,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.overrideStatusByAdmin(
          id,
          body.status,
          String(adminUser._id),
          body.reason,
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Override booking status',
      'Override Booking Status',
      'Booking status overridden successfully',
      'Failed to override booking status',
    );
  }

  @Put(':id/confirm')
  @AdminEndpoint(
    'Confirm booking (Admin, System Admin, Moderator)',
    'Confirm a pending booking',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async confirmBooking(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.overrideStatusByAdmin(
          id,
          BookingStatus.CONFIRMED,
          String(adminUser._id),
          `Confirmed by admin: ${adminUser.firstName} ${adminUser.lastName}`,
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Confirm booking',
      'Confirm Booking',
      'Booking confirmed successfully',
      'Failed to confirm booking',
    );
  }

  @Put(':id/check-in')
  @AdminEndpoint(
    'Check-in booking (Admin, System Admin, Moderator)',
    'Mark a booking as checked-in',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async checkInBooking(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.overrideStatusByAdmin(
          id,
          BookingStatus.CHECKED_IN,
          String(adminUser._id),
          `Checked-in by admin: ${adminUser.firstName} ${adminUser.lastName}`,
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Check-in booking',
      'Check-in Booking',
      'Booking checked-in successfully',
      'Failed to check-in booking',
    );
  }

  @Put(':id/check-out')
  @AdminEndpoint(
    'Check-out booking (Admin, System Admin, Moderator)',
    'Mark a booking as checked-out',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async checkOutBooking(
    @Param('id') id: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.overrideStatusByAdmin(
          id,
          BookingStatus.CHECKED_OUT,
          String(adminUser._id),
          `Checked-out by admin: ${adminUser.firstName} ${adminUser.lastName}`,
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Check-out booking',
      'Check-out Booking',
      'Booking checked-out successfully',
      'Failed to check-out booking',
    );
  }
}
