import { plainToInstance } from 'class-transformer';
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { PaymentsService } from '../payments.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { PaymentIntentResponseDto } from '../dto/payment-intent.dto';
import { RefundPaymentDto, PaymentTransactionResponseDto } from '../dto/payment-transaction.dto';
import {
  AdminPaymentFiltersDto,
  AdminPaymentIntentListResponseDto,
  AdminPaymentTransactionListResponseDto,
  PaymentProvidersConfigResponseDto,
} from '../dto/admin-payment.dto';

/**
 * Admin Controller for Payments
 * Handles administrative payment operations
 */
@Controller('admin/payments')
@ApiTags('Payments Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsAdminController extends BaseController {
  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  @Get('intents')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint(
    'Get all payment intents',
    'Retrieve all payment intents with filters for administrative management',
    AdminPaymentIntentListResponseDto,
  )
  async getAllPaymentIntents(@Query() filters: AdminPaymentFiltersDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.paymentsService.getAllPaymentIntentsForAdmin(filters);

        return {
          intents: result.data.map((intent) =>
            plainToInstance(PaymentIntentResponseDto, intent.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        };
      },
      'Get admin payment intents',
      'Payment Management',
      'Payment intents retrieved successfully',
      'Failed to get payment intents',
    );
  }

  @Get('intents/:id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint(
    'Get payment intent by ID',
    'Retrieve a specific payment intent by ID for administrative review',
    PaymentIntentResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async getPaymentIntentById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const intent = await this.paymentsService.getPaymentIntentById(id);
        if (!intent) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(PaymentIntentResponseDto, intent.toObject());
      },
      'Get payment intent by ID',
      'Payment Intent Details',
      'Payment intent retrieved successfully',
      'Failed to get payment intent',
    );
  }

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint(
    'Get all transactions',
    'Retrieve all payment transactions with filters for administrative oversight',
    AdminPaymentTransactionListResponseDto,
  )
  async getAllTransactions(@Query() filters: AdminPaymentFiltersDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.paymentsService.getAllTransactionsForAdmin(filters);

        return {
          transactions: result.data.map((transaction) =>
            plainToInstance(PaymentTransactionResponseDto, transaction.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        };
      },
      'Get admin transactions',
      'Transaction Management',
      'Transactions retrieved successfully',
      'Failed to get transactions',
    );
  }

  @Get('transactions/:id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint(
    'Get transaction by ID',
    'Retrieve a specific transaction by ID for administrative analysis',
    PaymentTransactionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async getTransactionById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.paymentsService.getTransactionById(id);
        if (!transaction) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(PaymentTransactionResponseDto, transaction.toObject());
      },
      'Get transaction by ID',
      'Transaction Details',
      'Transaction retrieved successfully',
      'Failed to get transaction',
    );
  }

  @Post('transactions/:id/refund')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Process refund',
    'Process refund for payment transaction (Admin only)',
    PaymentTransactionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async processRefund(
    @Param('id') id: string,
    @Body() refundDto: RefundPaymentDto,
    @CurrentUser() adminUser: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const refundRequest = {
          transactionId: id,
          amount: refundDto.amount,
          reason: refundDto.reason,
          metadata: {
            ...refundDto.metadata,
            processedByAdmin: String(adminUser._id),
            processedByEmail: adminUser.email,
          },
        };

        const transaction = await this.paymentsService.refundPayment(refundRequest);
        return plainToInstance(PaymentTransactionResponseDto, transaction.toObject());
      },
      'Process payment refund',
      'Refund Processed',
      'Refund processed successfully',
      'Failed to process refund',
    );
  }

  @Get('providers')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Get payment providers configuration',
    'Retrieve payment provider settings and configuration (Admin only)',
    PaymentProvidersConfigResponseDto,
  )
  async getPaymentProvidersConfig() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.paymentsService.getPaymentProvidersConfig();
      },
      'Get payment providers configuration',
      'Payment Providers Config',
      'Payment providers configuration retrieved successfully',
      'Failed to get payment providers configuration',
    );
  }
}
