import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BookingInstallmentService } from '../services/booking-installment.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { InstallmentStatus } from '../../../common/enums/installment.enums';
import type {
  UserInstallmentFilters,
  ProcessInstallmentPaymentRequest,
} from '../interfaces/booking-installment-controller.interfaces';

@ApiTags('Booking Installments')
@Controller('booking-installments')
export class BookingInstallmentController {
  constructor(private readonly installmentService: BookingInstallmentService) {}

  @Get('my-installments')
  @ProtectedEndpoint(
    'Get user installments',
    'Retrieve all payment installments for the authenticated user',
  )
  async getMyInstallments(
    @CurrentUser() user: UserDocument,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: InstallmentStatus,
  ) {
    const filters: UserInstallmentFilters = {
      guestId: String(user._id),
    };
    if (status) filters.status = status;

    return this.installmentService.getInstallments(filters, page, limit);
  }

  @Get('booking/:bookingId')
  @ProtectedEndpoint(
    'Get installments for booking',
    'Retrieve all payment installments for a specific booking',
  )
  async getInstallmentsByBooking(@Param('bookingId') bookingId: string) {
    return this.installmentService.getInstallmentsByBookingId(bookingId);
  }

  @Get(':installmentId')
  @ProtectedEndpoint(
    'Get installment by ID',
    'Retrieve detailed information about a specific payment installment',
  )
  async getInstallment(@Param('installmentId') installmentId: string) {
    return this.installmentService.getInstallmentById(installmentId);
  }

  @Post(':installmentId/pay')
  @ProtectedEndpoint(
    'Process installment payment',
    'Process payment for a specific installment using the provided payment method',
  )
  async processInstallmentPayment(
    @Param('installmentId') installmentId: string,
    @Body() body: ProcessInstallmentPaymentRequest,
  ) {
    return this.installmentService.processInstallmentPayment(installmentId, body.paymentMethodId);
  }
}
