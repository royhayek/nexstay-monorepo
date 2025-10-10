import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import {
  BookingInstallment,
  BookingInstallmentDocument,
} from '../../../database/schemas/booking-installment.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import {
  InstallmentStatus,
  InstallmentRetryStrategy,
} from '../../../common/enums/installment.enums';
import { MultiCurrencyService } from '../../multi-currency/services/multi-currency.service';
import { BookingInstallmentSchedulingService } from './booking-installment-scheduling.service';
import { BookingInstallmentProcessingService } from './booking-installment-processing.service';
import {
  CreateInstallmentPlanRequest,
  InstallmentFilters,
  InstallmentStatsQuery,
  InstallmentStatsAggregationResult,
  InstallmentsPaginatedResponse,
} from '../interfaces/booking-installment.interfaces';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class BookingInstallmentService {
  constructor(
    @InjectModel(BookingInstallment.name)
    private readonly installmentModel: Model<BookingInstallmentDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly multiCurrencyService: MultiCurrencyService,
    private readonly schedulingService: BookingInstallmentSchedulingService,
    private readonly processingService: BookingInstallmentProcessingService,
  ) {}

  /**
   * Create installment plan for a booking
   */
  async createInstallmentPlan(
    request: CreateInstallmentPlanRequest,
  ): Promise<BookingInstallment[]> {
    const {
      bookingId,
      totalAmount,
      currency,
      scheduleType,
      numberOfInstallments = 3,
      checkInDate,
      customSchedule,
    } = request;

    // Verify booking exists
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if installments already exist
    const existing = await this.installmentModel.findOne({ bookingId }).exec();
    if (existing) {
      throw new BadRequestException('Installment plan already exists for this booking');
    }

    // Validate currency
    const isValidCurrency = await this.multiCurrencyService.validateCurrency(currency);
    if (!isValidCurrency) {
      throw new BadRequestException(`Unsupported currency: ${currency}`);
    }

    // Generate installment schedule
    let installmentSchedule: {
      installmentNumber: number;
      amount: number;
      currency: string;
      dueDate: Date;
      type: string;
      percentage: number;
    }[];
    if (customSchedule) {
      installmentSchedule = this.schedulingService.createCustomSchedule(
        totalAmount,
        currency,
        customSchedule,
      );
    } else {
      installmentSchedule = this.schedulingService.createSchedule(
        scheduleType,
        totalAmount,
        currency,
        numberOfInstallments,
        checkInDate,
      );
    }

    // Create installment records
    const installments: BookingInstallment[] = [];

    for (let i = 0; i < installmentSchedule.length; i++) {
      const scheduleItem = installmentSchedule[i];

      const installment = new this.installmentModel({
        bookingId: new Types.ObjectId(bookingId),
        propertyId: booking.propertyId,
        guestId: booking.guestId,
        hostId: booking.hostId,
        installmentNumber: i + 1,
        totalInstallments: installmentSchedule.length,
        type: scheduleItem.type,
        scheduledAmount: {
          amount: scheduleItem.amount,
          currency: scheduleItem.currency,
          originalAmount: scheduleItem.amount,
          originalCurrency: scheduleItem.currency,
        },
        status: InstallmentStatus.SCHEDULED,
        dueDate: scheduleItem.dueDate,
        attemptCount: 0,
        maxRetryAttempts: 3,
        checkInDate: booking.checkIn,
        checkOutDate: booking.checkOut,
        bookingTotalAmount: totalAmount,
        reminderSent: false,
        failureNotificationSent: false,
        isOverdue: false,
        lateFeeApplied: false,
        retryStrategy: InstallmentRetryStrategy.EXPONENTIAL,
      });

      installments.push(await installment.save());
    }

    LoggingUtil.log(
      `Created ${installments.length} installments for booking ${bookingId}, total amount: ${totalAmount} ${currency}`,
      'BookingInstallmentService',
    );

    return installments;
  }

  /**
   * Get installment by ID
   */
  async getInstallmentById(installmentId: string): Promise<BookingInstallmentDocument> {
    const installment = await this.installmentModel
      .findById(installmentId)
      .populate('booking')
      .populate('property')
      .populate('guest')
      .populate('host')
      .exec();

    if (!installment) {
      throw new NotFoundException('Installment not found');
    }

    return installment;
  }

  /**
   * Get installments for a booking
   */
  async getInstallmentsByBookingId(bookingId: string): Promise<BookingInstallment[]> {
    return this.installmentModel
      .find({ bookingId: new Types.ObjectId(bookingId) })
      .sort({ installmentNumber: 1 })
      .populate('booking')
      .populate('property')
      .populate('guest')
      .populate('host')
      .exec();
  }

  /**
   * Get installments with filters
   */
  async getInstallments(
    filters: InstallmentFilters = {},
    page = 1,
    limit = 20,
  ): Promise<InstallmentsPaginatedResponse> {
    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addObjectIdFilter('bookingId', filters.bookingId)
      .addObjectIdFilter('guestId', filters.guestId)
      .addObjectIdFilter('hostId', filters.hostId)
      .addEnumFilter('status', filters.status)
      .addEnumFilter('type', filters.type)
      .addBooleanFilter('isOverdue', filters.isOverdue);

    // Add custom filter for due date range
    if (filters.dueDateBefore || filters.dueDateAfter) {
      const dueDateQuery: { $lt?: Date; $gt?: Date } = {};
      if (filters.dueDateBefore) {
        dueDateQuery.$lt = filters.dueDateBefore;
      }
      if (filters.dueDateAfter) {
        dueDateQuery.$gt = filters.dueDateAfter;
      }
      queryBuilder.addCustomFilter('dueDate', dueDateQuery);
    }

    // Add custom filter for reminder not sent
    if (filters.reminderNotSent) {
      queryBuilder.addBooleanFilter('reminderSent', false);
    }

    const query = queryBuilder.build();

    const [installments, total] = await Promise.all([
      this.installmentModel
        .find(query)
        .populate('booking')
        .populate('property')
        .populate('guest')
        .populate('host')
        .sort({ dueDate: 1, installmentNumber: 1 })
        .skip(skip)
        .limit(validLimit)
        .exec(),
      this.installmentModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(installments, total, validPage, validLimit);

    return {
      installments: paginationResult.data,
      total: paginationResult.total,
      pages: paginationResult.totalPages,
    };
  }

  /**
   * Process installment payment
   */
  async processInstallmentPayment(
    installmentId: string,
    paymentMethodId: string,
  ): Promise<BookingInstallment> {
    const installment = await this.getInstallmentById(installmentId);

    if (installment.status !== InstallmentStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot process installment with status: ${installment.status}`,
      );
    }

    return this.processingService.processPayment(installment, paymentMethodId);
  }

  /**
   * Retry failed installment payment
   */
  async retryInstallmentPayment(installmentId: string): Promise<BookingInstallment> {
    const installment = await this.getInstallmentById(installmentId);

    if (installment.status !== InstallmentStatus.FAILED) {
      throw new BadRequestException(`Cannot retry installment with status: ${installment.status}`);
    }

    return this.processingService.retryPayment(installment);
  }

  /**
   * Reschedule installment
   */
  async rescheduleInstallment(
    installmentId: string,
    newDueDate: Date,
    reason?: string,
  ): Promise<BookingInstallment> {
    const installment = await this.getInstallmentById(installmentId);

    if (![InstallmentStatus.SCHEDULED, InstallmentStatus.FAILED].includes(installment.status)) {
      throw new BadRequestException(
        `Cannot reschedule installment with status: ${installment.status}`,
      );
    }

    installment.dueDate = newDueDate;
    installment.status = InstallmentStatus.RESCHEDULED;
    installment.retryAfter = newDueDate;
    installment.adminNotes = reason || 'Rescheduled by admin';

    const updated = await this.installmentModel
      .findByIdAndUpdate(String(installment._id), installment, {
        new: true,
      })
      .exec();

    LoggingUtil.log(
      `Rescheduled installment ${installmentId} to ${DateUtils.toISO(newDueDate)}`,
      'BookingInstallmentService',
    );

    return updated!;
  }

  /**
   * Cancel installment (when booking is cancelled)
   */
  async cancelInstallment(installmentId: string, reason?: string): Promise<BookingInstallment> {
    const installment = await this.getInstallmentById(installmentId);

    installment.status = InstallmentStatus.CANCELLED;
    installment.adminNotes = reason || 'Cancelled with booking';

    const updated = await this.installmentModel
      .findByIdAndUpdate(String(installment._id), installment, {
        new: true,
      })
      .exec();

    LoggingUtil.log(
      `Cancelled installment ${installmentId}: ${reason}`,
      'BookingInstallmentService',
    );

    return updated!;
  }

  /**
   * Cancel all installments for a booking
   */
  async cancelInstallmentsForBooking(bookingId: string, reason?: string): Promise<void> {
    await this.installmentModel.updateMany(
      {
        bookingId: new Types.ObjectId(bookingId),
        status: { $in: [InstallmentStatus.SCHEDULED, InstallmentStatus.FAILED] },
      },
      {
        status: InstallmentStatus.CANCELLED,
        adminNotes: reason || 'Cancelled with booking',
      },
    );

    LoggingUtil.log(
      `Cancelled all installments for booking ${bookingId}: ${reason}`,
      'BookingInstallmentService',
    );
  }

  /**
   * Get installments due today
   */
  async getInstallmentsDueToday(): Promise<BookingInstallmentDocument[]> {
    const today = DateUtils.now();
    const startOfDay = DateUtils.create(today.setHours(0, 0, 0, 0));
    const endOfDay = DateUtils.create(today.setHours(23, 59, 59, 999));

    return this.installmentModel
      .find({
        status: InstallmentStatus.SCHEDULED,
        dueDate: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();
  }

  /**
   * Get overdue installments
   */
  async getOverdueInstallments(): Promise<BookingInstallmentDocument[]> {
    const now = DateUtils.now();

    return this.installmentModel
      .find({
        status: InstallmentStatus.SCHEDULED,
        dueDate: { $lt: now },
        $or: [{ isOverdue: false }, { isOverdue: { $exists: false } }],
      })
      .exec();
  }

  /**
   * Scheduled job to process due payments
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processDuePayments(): Promise<void> {
    LoggingUtil.log('Starting due payments processing', 'BookingInstallmentService');

    try {
      const dueInstallments = await this.getInstallmentsDueToday();

      for (const installment of dueInstallments) {
        try {
          // This would trigger automated payment processing
          // In production, this should integrate with saved payment methods
          LoggingUtil.log(
            `Installment ${String(installment._id)} is due for processing`,
            'BookingInstallmentService',
          );
        } catch (error: unknown) {
          LoggingUtil.error(
            `Failed to process due installment ${String(installment._id)}:`,
            error instanceof Error ? error.message : 'Unknown error',
            'BookingInstallmentService',
          );
        }
      }

      LoggingUtil.log(
        `Due payments processing completed. Found ${dueInstallments.length} installments`,
        'BookingInstallmentService',
      );
    } catch (error: unknown) {
      LoggingUtil.error(
        'Due payments processing failed:',
        error instanceof Error ? error.message : 'Unknown error',
        'BookingInstallmentService',
      );
    }
  }

  /**
   * Scheduled job to mark overdue installments
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async markOverdueInstallments(): Promise<void> {
    LoggingUtil.log('Starting overdue installments check', 'BookingInstallmentService');

    try {
      const overdueInstallments = await this.getOverdueInstallments();

      for (const installment of overdueInstallments) {
        installment.isOverdue = true;
        installment.status = InstallmentStatus.OVERDUE;
        await this.installmentModel
          .findByIdAndUpdate(
            String(installment._id),
            { isOverdue: true, status: InstallmentStatus.OVERDUE },
            { new: true },
          )
          .exec();
      }

      LoggingUtil.log(
        `Marked ${overdueInstallments.length} installments as overdue`,
        'BookingInstallmentService',
      );
    } catch (error: unknown) {
      LoggingUtil.error(
        'Overdue check failed:',
        error instanceof Error ? error.message : 'Unknown error',
        'BookingInstallmentService',
      );
    }
  }

  /**
   * Get installment statistics
   */
  async getInstallmentStats(hostId?: string): Promise<{
    total: number;
    byStatus: { [status: string]: number };
    totalAmount: number;
    overdueCount: number;
    overdueAmount: number;
    successRate: number;
  }> {
    const matchQuery: InstallmentStatsQuery = {};
    if (hostId) {
      matchQuery.hostId = new Types.ObjectId(hostId);
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$scheduledAmount.amount' },
          statuses: { $push: '$status' },
          overdueCount: {
            $sum: { $cond: [{ $eq: ['$isOverdue', true] }, 1, 0] },
          },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$isOverdue', true] }, '$scheduledAmount.amount', 0],
            },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', InstallmentStatus.PAID] }, 1, 0] },
          },
        },
      },
    ];

    const result = await this.installmentModel.aggregate(pipeline);
    const stats: InstallmentStatsAggregationResult =
      (result[0] as InstallmentStatsAggregationResult) || {
        _id: null,
        total: 0,
        totalAmount: 0,
        statuses: [],
        overdueCount: 0,
        overdueAmount: 0,
        paidCount: 0,
      };

    // Calculate status distribution
    const byStatus: { [status: string]: number } = {};
    for (const status of Object.values(InstallmentStatus)) {
      byStatus[status] = 0;
    }
    stats.statuses.forEach((status: string) => {
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total: stats.total,
      byStatus,
      totalAmount: stats.totalAmount,
      overdueCount: stats.overdueCount,
      overdueAmount: stats.overdueAmount,
      successRate: stats.total > 0 ? (stats.paidCount / stats.total) * 100 : 0,
    };
  }
}
