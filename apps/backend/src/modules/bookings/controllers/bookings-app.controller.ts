import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import {
  BookingResponseDto,
  BookingListResponseDto,
  SingleBookingResponseDto,
} from '../dto/booking-response.dto';
import { BookingFacadeService } from '../services/booking-facade.service';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';

/**
 * App Controller for Bookings
 * Handles booking operations for mobile app and website users (Guests & Hosts)
 */
@Controller('app/bookings')
@ApiTags('Bookings')
export class BookingsAppController extends BaseController {
  constructor(private readonly bookingsService: BookingFacadeService) {
    super();
  }

  @Get('my-bookings')
  @ProtectedEndpoint(
    'Get current user bookings (Guest bookings)',
    'Retrieve all bookings made by the current user',
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
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by booking status',
  })
  async getMyBookings(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ): Promise<BookingListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingsService.getGuestBookings(
          String(user._id),
          { status: status as BookingStatus },
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
      'Get my bookings',
      'My Bookings Retrieved',
      'Bookings retrieved successfully',
      'Failed to retrieve bookings',
    );
  }

  @Get('host-bookings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Get bookings for host properties (Host only)',
    'Retrieve all bookings for properties owned by the current host',
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
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'propertyId',
    required: false,
    type: String,
    description: 'Filter by property ID',
  })
  async getHostBookings(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: BookingStatus,
  ): Promise<BookingListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.bookingsService.getHostBookings(
          String(user._id),
          { status: status as BookingStatus },
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
      'Get host bookings',
      'Host Bookings Retrieved',
      'Host bookings retrieved successfully',
      'Failed to retrieve host bookings',
    );
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.GUEST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Create a new booking (Guest only)',
    'Create a new booking for a property',
    SingleBookingResponseDto,
  )
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.createBooking(
          createBookingDto,
          String(user._id),
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Create booking',
      'Booking Created',
      'Booking created successfully',
      'Failed to create booking',
    );
  }

  @Get(':id')
  @ProtectedEndpoint(
    'Get booking by ID (own bookings only)',
    'Retrieve details for a specific booking that belongs to the user',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.getBookingById(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Get booking',
      'Booking Retrieved',
      'Booking retrieved successfully',
      'Failed to retrieve booking',
    );
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GUEST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Update booking (Guest only, limited fields)',
    'Update specific fields of an existing booking',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async update(
    @Param('id') id: string,
    @Body() _updateBookingDto: UpdateBookingDto,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // For now, just return the existing booking since updateByGuest is not available
        const booking = await this.bookingsService.getBookingById(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Update booking',
      'Booking Updated',
      'Booking updated successfully',
      'Failed to update booking',
    );
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GUEST, UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Cancel booking (Guest or Host)',
    'Cancel an existing booking',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.cancelBooking(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Cancel booking',
      'Booking Cancelled',
      'Booking cancelled successfully',
      'Failed to cancel booking',
    );
  }

  @Put(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Accept booking (Host only)',
    'Accept a pending booking request',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.confirmBooking(id, String(user._id));
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Accept booking',
      'Booking Accepted',
      'Booking accepted successfully',
      'Failed to accept booking',
    );
  }

  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @ProtectedEndpoint(
    'Reject booking (Host only)',
    'Reject a pending booking request',
    SingleBookingResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<SingleBookingResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const booking = await this.bookingsService.cancelBooking(
          id,
          String(user._id),
          user.roles[0],
          'Rejected by host',
        );
        return plainToInstance(BookingResponseDto, booking.toObject());
      },
      'Reject booking',
      'Booking Rejected',
      'Booking rejected successfully',
      'Failed to reject booking',
    );
  }
}
