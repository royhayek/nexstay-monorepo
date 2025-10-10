import { Controller, Get, Post, Put, Param, Query, Body } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { PayoutsFacadeService } from '../services/payouts-facade.service';
import { PayoutsProcessingService } from '../services/payouts-processing.service';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint, ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { UserRole } from '../../../database/schemas/user.schema';

import { CreatePayoutDto } from '../dto/create-payout.dto';
import { PayoutResponseDto } from '../dto/payout-response.dto';
import { EligibleEarningsResponseDto } from '../dto/payout-response.dto';
import { PaginatedPayoutsResponseDto } from '../dto/paginated-payouts-response.dto';
import { PayoutStatus } from '../../../common/enums/payout.enums';
import type { PayoutStatItem, PayoutStatsResponse } from '../interfaces';
import { BatchPayoutResponse, PayoutRetryResponse } from '../dto/payout-operation-response.dto';

@ApiTags('Payouts Management')
@Controller('admin/payouts')
export class PayoutsAdminController extends BaseController {
  constructor(
    private readonly payoutsService: PayoutsFacadeService,
    private readonly processingService: PayoutsProcessingService,
  ) {
    super();
  }

  @Get()
  @ApiEndpoint({
    summary: 'Get all payouts (Admin)',
    description: 'Retrieves paginated list of all payouts in the system for admin management',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Payouts retrieved successfully',
        type: PaginatedPayoutsResponseDto,
      },
      errors: {
        badRequest: 'Invalid pagination or filter parameters',
        forbidden: 'Admin access required',
      },
    },
  })
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
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PayoutStatus,
    description: 'Filter by status',
  })
  @ApiQuery({ name: 'hostId', required: false, type: String, description: 'Filter by host ID' })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'From date (ISO string)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'To date (ISO string)',
  })
  async getAllPayouts(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: PayoutStatus,
    @Query('hostId') hostId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = {
          hostId,
          status,
          fromDate: fromDate ? DateUtils.create(fromDate) : undefined,
          toDate: toDate ? DateUtils.create(toDate) : undefined,
        };
        const pagination = { page, limit };
        const payouts = await this.payoutsService.getPayouts(filters, pagination);
        return plainToInstance(PaginatedPayoutsResponseDto, payouts);
      },
      'Get all payouts',
      'Payouts Retrieved',
      'System payouts have been retrieved successfully.',
      'Failed to retrieve payouts',
    );
  }

  @Get(':payoutId')
  @ApiEndpoint({
    summary: 'Get payout by ID (Admin)',
    description: 'Retrieves detailed information about a specific payout',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Payout details retrieved successfully',
        type: PayoutResponseDto,
      },
      errors: {
        forbidden: 'Admin access required',
        notFound: 'Payout not found',
      },
    },
  })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  async getPayoutById(@Param('payoutId') payoutId: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payout = await this.payoutsService.getPayoutById(payoutId);
        return plainToInstance(PayoutResponseDto, payout.toObject());
      },
      'Get payout details',
      'Payout Details Retrieved',
      'Payout details have been retrieved successfully.',
      'Failed to retrieve payout details',
    );
  }

  @Get('hosts/:hostId/eligible-earnings')
  @ApiEndpoint({
    summary: 'Get host eligible earnings (Admin)',
    description: 'Calculates eligible earnings for a specific host',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Host eligible earnings calculated successfully',
        type: EligibleEarningsResponseDto,
      },
      errors: {
        forbidden: 'Admin access required',
        notFound: 'Host not found',
      },
    },
  })
  @ApiParam({ name: 'hostId', description: 'Host ID' })
  async getHostEligibleEarnings(@Param('hostId') hostId: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const eligibleEarnings = await this.payoutsService.getEligibleEarnings(hostId);
        return plainToInstance(EligibleEarningsResponseDto, eligibleEarnings);
      },
      'Get host eligible earnings',
      'Earnings Calculated',
      'Host eligible earnings have been calculated successfully.',
      'Failed to calculate host eligible earnings',
    );
  }

  @Post('hosts/:hostId')
  @ApiEndpoint({
    summary: 'Create payout for host (Admin)',
    description: 'Admin-initiated payout creation for a specific host',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        status: 201,
        description: 'Admin payout created successfully',
        type: PayoutResponseDto,
      },
      errors: {
        badRequest: 'Invalid payout data or insufficient earnings',
        forbidden: 'Admin access required',
        notFound: 'Host or payout method not found',
      },
    },
  })
  @ApiParam({ name: 'hostId', description: 'Host ID' })
  async createPayoutForHost(
    @Param('hostId') hostId: string,
    @Body() createPayoutDto: CreatePayoutDto,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payout = await this.payoutsService.createPayout(hostId, createPayoutDto);
        return plainToInstance(PayoutResponseDto, payout.toObject());
      },
      'Create admin payout',
      'Admin Payout Created',
      'Payout has been created successfully by admin.',
      'Failed to create admin payout',
    );
  }

  @Put(':payoutId/retry')
  @ApiEndpoint({
    summary: 'Retry failed payout (Admin)',
    description: 'Retries a failed payout with updated processing',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Payout retry initiated successfully',
        type: PayoutRetryResponse,
      },
      errors: {
        badRequest: 'Payout is not in failed status or retry limit exceeded',
        forbidden: 'Admin access required',
        notFound: 'Payout not found',
      },
    },
  })
  @ApiParam({ name: 'payoutId', description: 'Payout ID' })
  async retryFailedPayout(@Param('payoutId') payoutId: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const retriedPayout = await this.processingService.retryFailedPayout(payoutId, 'admin');
        return {
          payoutId: String(retriedPayout._id),
          retryAttempt: retriedPayout.retryAttempts || 1,
          status: retriedPayout.status,
          nextRetryAt: retriedPayout.nextRetryAt,
          message: 'Payout retry initiated successfully',
        };
      },
      'Retry failed payout',
      'Payout Retry Initiated',
      'Failed payout has been queued for retry.',
      'Failed to retry payout',
    );
  }

  @Post('batch-process')
  @ApiEndpoint({
    summary: 'Process batch payouts (Admin)',
    description: 'Processes payouts for multiple hosts in a single operation',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        status: 201,
        description: 'Batch payout processing completed',
        type: BatchPayoutResponse,
      },
      errors: {
        badRequest: 'Invalid host IDs provided',
        forbidden: 'Admin access required',
      },
    },
  })
  async processBatchPayouts(@Body() hostIds: string[]) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.processingService.processBatchPayouts(hostIds, 'admin');
        return {
          totalProcessed: result.processed,
          successful: result.successful,
          failed: result.failed,
          skipped: 0, // For backward compatibility
          totalAmount: 0, // Would be calculated from actual results
          errors: result.errors,
          batchId: result.batchId,
          startedAt: DateUtils.now(),
          completedAt: DateUtils.now(),
        };
      },
      'Process batch payouts',
      'Batch Processing Complete',
      'Batch payout processing has been completed.',
      'Failed to process batch payouts',
    );
  }

  @Post('process-automatic')
  @AdminEndpoint(
    'Trigger automatic payouts',
    'Manually triggers the automatic payout processing for all eligible hosts',
  )
  async triggerAutomaticPayouts() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.processingService.processAutomaticPayouts();
        return {
          processed: result.processed,
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        };
      },
      'Trigger automatic payouts',
      'Automatic Payouts Triggered',
      'Automatic payout processing has been initiated.',
      'Failed to trigger automatic payouts',
    );
  }

  @Get('stats/summary')
  @AdminEndpoint('Get payout statistics', 'Retrieves comprehensive statistics about system payouts')
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'Time period (daily, weekly, monthly)',
    example: 'monthly',
  })
  async getPayoutStatistics(@Query('period') period = 'monthly') {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // This would be implemented with proper statistics calculation
        const now = DateUtils.now();
        const thirtyDaysAgo = DateUtils.create(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const filters = {
          fromDate: thirtyDaysAgo,
          toDate: now,
        };

        const allPayouts = await this.payoutsService.getPayouts(filters, { page: 1, limit: 1000 });

        const payoutItems = allPayouts.items as PayoutStatItem[];

        const stats: PayoutStatsResponse & { period: string } = {
          totalPayouts: allPayouts.pagination.total,
          totalAmount: payoutItems.reduce(
            (sum, payout) => sum + (payout.grossAmount?.amount || 0),
            0,
          ),
          completedPayouts: payoutItems.filter((p) => p.status === PayoutStatus.COMPLETED).length,
          failedPayouts: payoutItems.filter((p) => p.status === PayoutStatus.FAILED).length,
          pendingPayouts: payoutItems.filter((p) => p.status === PayoutStatus.PENDING).length,
          period,
        };

        return stats;
      },
      'Get payout statistics',
      'Statistics Retrieved',
      'Payout statistics have been calculated successfully.',
      'Failed to retrieve payout statistics',
    );
  }
}
