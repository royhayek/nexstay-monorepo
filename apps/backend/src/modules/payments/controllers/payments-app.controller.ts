import { plainToInstance } from 'class-transformer';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { PaymentsService } from '../payments.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentIntentDto,
  PaymentIntentResponseDto,
  PaymentIntentListResponseDto,
  EnabledProvidersResponseDto,
} from '../dto/payment-intent.dto';
import {
  RefundPaymentDto,
  PaymentTransactionResponseDto,
  PaymentTransactionListResponseDto,
} from '../dto/payment-transaction.dto';
import { CreatePaymentIntentMetadata } from '../interfaces/payment-metadata.interface';

/**
 * App Controller for Payments
 * Handles payment operations for mobile app and website users
 */
@Controller('app/payments')
@ApiTags('Payments')
export class PaymentsAppController extends BaseController {
  constructor(private readonly paymentsService: PaymentsService) {
    super();
  }

  @Get('providers')
  @ProtectedEndpoint(
    'Get enabled payment providers',
    'Retrieve list of enabled payment providers for the platform',
    EnabledProvidersResponseDto,
  )
  async getEnabledProviders() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.paymentsService.getEnabledProviders();
      },
      'Get enabled payment providers',
      'Payment Providers',
      'Payment providers retrieved successfully',
      'Failed to get payment providers',
    );
  }

  @Post('intents')
  @ProtectedEndpoint(
    'Create payment intent',
    'Create a new payment intent for processing payments',
    PaymentIntentResponseDto,
  )
  async createPaymentIntent(
    @Body() createDto: CreatePaymentIntentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const requestWithUser = {
          ...createDto,
          customerId: String(user._id),
          metadata: {
            ...createDto.metadata,
            userId: String(user._id),
            userEmail: user.email,
          } as CreatePaymentIntentMetadata,
        };

        const intent = await this.paymentsService.createPaymentIntent(requestWithUser);
        return plainToInstance(PaymentIntentResponseDto, intent.toObject());
      },
      'Create payment intent',
      'Payment Intent Created',
      'Payment intent created successfully',
      'Failed to create payment intent',
    );
  }

  @Put('intents/:id/confirm')
  @ProtectedEndpoint(
    'Confirm payment intent',
    'Confirm a payment intent with payment method',
    PaymentIntentResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async confirmPaymentIntent(@Param('id') id: string, @Body() confirmDto: ConfirmPaymentIntentDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const intent = await this.paymentsService.confirmPaymentIntent(
          id,
          confirmDto.paymentMethodId,
        );
        return plainToInstance(PaymentIntentResponseDto, intent.toObject());
      },
      'Confirm payment intent',
      'Payment Confirmed',
      'Payment intent confirmed successfully',
      'Failed to confirm payment intent',
    );
  }

  @Put('intents/:id/cancel')
  @ProtectedEndpoint(
    'Cancel payment intent',
    'Cancel a payment intent before processing',
    PaymentIntentResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async cancelPaymentIntent(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const intent = await this.paymentsService.cancelPaymentIntent(id);
        return plainToInstance(PaymentIntentResponseDto, intent.toObject());
      },
      'Cancel payment intent',
      'Payment Cancelled',
      'Payment intent cancelled successfully',
      'Failed to cancel payment intent',
    );
  }

  @Get('intents/:id')
  @ProtectedEndpoint(
    'Get payment intent by ID',
    'Retrieve details of a specific payment intent',
    PaymentIntentResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async getPaymentIntent(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const intent = await this.paymentsService.getPaymentIntentById(id);
        if (!intent) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(PaymentIntentResponseDto, intent.toObject());
      },
      'Get payment intent',
      'Payment Intent Details',
      'Payment intent retrieved successfully',
      'Failed to get payment intent',
    );
  }

  @Get('intents')
  @ProtectedEndpoint(
    'Get payment intents',
    'Retrieve paginated list of payment intents for current user',
    PaymentIntentListResponseDto,
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
    description: 'Items per page (default: 20)',
  })
  async getPaymentIntents(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const customerId = String(user._id);
        const result = await this.paymentsService.getPaymentIntentsByCustomer(
          customerId,
          page,
          limit,
        );

        return {
          intents: result.intents.map((intent) =>
            plainToInstance(PaymentIntentResponseDto, intent.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
        };
      },
      'Get payment intents',
      'Payment Intents',
      'Payment intents retrieved successfully',
      'Failed to get payment intents',
    );
  }

  @Post('transactions/:id/refund')
  @ProtectedEndpoint(
    'Request refund',
    'Submit a refund request for a payment transaction',
    PaymentTransactionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async refundPayment(@Param('id') id: string, @Body() refundDto: RefundPaymentDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const refundRequest = {
          transactionId: id,
          amount: refundDto.amount,
          reason: refundDto.reason,
          metadata: refundDto.metadata,
        };

        const transaction = await this.paymentsService.refundPayment(refundRequest);
        return plainToInstance(PaymentTransactionResponseDto, transaction.toObject());
      },
      'Request payment refund',
      'Refund Requested',
      'Refund request submitted successfully',
      'Failed to submit refund request',
    );
  }

  @Get('transactions/:id')
  @ProtectedEndpoint(
    'Get transaction by ID',
    'Retrieve details of a specific payment transaction',
    PaymentTransactionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  async getTransaction(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const transaction = await this.paymentsService.getTransactionById(id);
        if (!transaction) {
          throw new Error('NOT_FOUND');
        }
        return plainToInstance(PaymentTransactionResponseDto, transaction.toObject());
      },
      'Get transaction',
      'Transaction Details',
      'Transaction retrieved successfully',
      'Failed to get transaction',
    );
  }

  @Get('transactions')
  @ProtectedEndpoint(
    'Get transactions',
    'Retrieve paginated list of payment transactions for current user',
    PaymentTransactionListResponseDto,
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
    description: 'Items per page (default: 20)',
  })
  async getTransactions(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const customerId = String(user._id);
        const result = await this.paymentsService.getTransactionsByCustomer(
          customerId,
          page,
          limit,
        );

        return {
          transactions: result.transactions.map((transaction) =>
            plainToInstance(PaymentTransactionResponseDto, transaction.toObject()),
          ),
          total: result.total,
          page: result.page,
          pages: result.pages,
        };
      },
      'Get user transactions',
      'Payment History',
      'Transactions retrieved successfully',
      'Failed to get transactions',
    );
  }
}
