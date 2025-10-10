import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BookingInstallmentService } from '../services/booking-installment.service';
import { InstallmentStatus } from '../../../common/enums/installment.enums';
import type {
  AdminInstallmentFilters,
  RescheduleInstallmentRequest,
  CancelInstallmentRequest,
} from '../interfaces/booking-installment-controller.interfaces';
import { DateUtils } from '../../../common/utils/date.utils';

@ApiTags('Booking Installments Management')
@Controller('admin/booking-installments')
export class BookingInstallmentAdminController {
  constructor(private readonly installmentService: BookingInstallmentService) {}

  @Get()
  @AdminEndpoint(
    'Get all installments',
    'Retrieve all payment installments with admin filtering options',
  )
  async getAllInstallments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: InstallmentStatus,
    @Query('isOverdue') isOverdue?: boolean,
  ) {
    const filters: AdminInstallmentFilters = {};
    if (status) filters.status = status;
    if (isOverdue !== undefined) filters.isOverdue = isOverdue;

    return this.installmentService.getInstallments(filters, page, limit);
  }

  @Patch(':installmentId/reschedule')
  @AdminEndpoint(
    'Reschedule installment',
    'Reschedule an installment payment to a new due date with admin override',
  )
  async rescheduleInstallment(
    @Param('installmentId') installmentId: string,
    @Body() body: RescheduleInstallmentRequest,
  ) {
    return this.installmentService.rescheduleInstallment(
      installmentId,
      DateUtils.create(body.newDueDate),
      body.reason,
    );
  }

  @Patch(':installmentId/cancel')
  @AdminEndpoint(
    'Cancel installment',
    'Cancel a scheduled installment payment with administrative authority',
  )
  async cancelInstallment(
    @Param('installmentId') installmentId: string,
    @Body() body: CancelInstallmentRequest,
  ) {
    return this.installmentService.cancelInstallment(installmentId, body.reason);
  }

  @Get('stats')
  @AdminEndpoint(
    'Get installment statistics',
    'Retrieve comprehensive statistics for installment payments management',
  )
  async getInstallmentStats() {
    return this.installmentService.getInstallmentStats();
  }

  @Get('due-today')
  @AdminEndpoint(
    'Get installments due today',
    'Retrieve all installment payments that are due today for administrative review',
  )
  async getInstallmentsDueToday() {
    return this.installmentService.getInstallmentsDueToday();
  }

  @Get('overdue')
  @AdminEndpoint(
    'Get overdue installments',
    'Retrieve all overdue installment payments requiring administrative action',
  )
  async getOverdueInstallments() {
    return this.installmentService.getOverdueInstallments();
  }
}
