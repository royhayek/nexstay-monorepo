import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { DateUtils } from '../../../common/utils/date.utils';

import { PayoutsFacadeService } from '../services/payouts-facade.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';

import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import {
  UpdatePayoutPreferencesDto,
  PayoutPreferencesResponseDto,
} from '../dto/payout-preferences.dto';
import { PayoutMethodResponseDto } from '../dto/payout-method-response.dto';
import { PayoutResponseDto } from '../dto/payout-response.dto';
import { EligibleEarningsResponseDto } from '../dto/payout-response.dto';
import { PaginatedPayoutsResponseDto } from '../dto/paginated-payouts-response.dto';
import { PayoutStatus } from '../../../common/enums/payout.enums';

@ApiTags('Payouts')
@Controller('app/payouts')
export class PayoutsHostController extends BaseController {
  constructor(private readonly payoutsService: PayoutsFacadeService) {
    super();
  }

  @Post('methods')
  @ApiEndpoint({
    summary: 'Create a new payout method',
    description: 'Allows hosts to add a new payout method (bank account, wallet, etc.)',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        status: 201,
        description: 'Payout method created successfully',
        type: PayoutMethodResponseDto,
      },
      errors: {
        badRequest: 'Invalid payout method data provided',
        forbidden: 'Only hosts can create payout methods',
      },
    },
  })
  async createPayoutMethod(
    @CurrentUser() user: UserDocument,
    @Body() createPayoutMethodDto: CreatePayoutMethodDto,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payoutMethod = await this.payoutsService.createPayoutMethod(
          String(user._id),
          createPayoutMethodDto,
        );
        return plainToInstance(PayoutMethodResponseDto, payoutMethod.toObject());
      },
      'Create payout method',
      'Payout Method Created',
      'Your payout method has been successfully added.',
      'Failed to create payout method',
    );
  }

  @Get('methods')
  @ApiEndpoint({
    summary: 'Get all payout methods',
    description: 'Retrieves all payout methods for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout methods retrieved successfully',
        type: PayoutMethodResponseDto,
      },
      errors: {
        forbidden: 'Only hosts can view payout methods',
      },
    },
  })
  async getPayoutMethods(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payoutMethods = await this.payoutsService.getPayoutMethods(String(user._id));
        return payoutMethods.map((method) =>
          plainToInstance(PayoutMethodResponseDto, method.toObject()),
        );
      },
      'Get payout methods',
      'Payout Methods Retrieved',
      'Your payout methods have been retrieved successfully.',
      'Failed to retrieve payout methods',
    );
  }

  @Put('methods/:methodId')
  @ApiEndpoint({
    summary: 'Update a payout method',
    description: 'Updates an existing payout method for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout method updated successfully',
        type: PayoutMethodResponseDto,
      },
      errors: {
        badRequest: 'Invalid update data provided',
        forbidden: 'Only hosts can update their payout methods',
        notFound: 'Payout method not found',
      },
    },
  })
  @ApiParam({ name: 'methodId', description: 'Payout method ID' })
  async updatePayoutMethod(
    @CurrentUser() user: UserDocument,
    @Param('methodId') methodId: string,
    @Body() updatePayoutMethodDto: UpdatePayoutMethodDto,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updatedMethod = await this.payoutsService.updatePayoutMethod(
          String(user._id),
          methodId,
          updatePayoutMethodDto,
        );
        return plainToInstance(PayoutMethodResponseDto, updatedMethod.toObject());
      },
      'Update payout method',
      'Payout Method Updated',
      'Your payout method has been updated successfully.',
      'Failed to update payout method',
    );
  }

  @Delete('methods/:methodId')
  @ApiEndpoint({
    summary: 'Delete a payout method',
    description: 'Deletes a payout method for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout method deleted successfully',
      },
      errors: {
        forbidden: 'Only hosts can delete their payout methods',
        notFound: 'Payout method not found',
        badRequest: 'Cannot delete payout method with pending payouts',
      },
    },
  })
  @ApiParam({ name: 'methodId', description: 'Payout method ID' })
  async deletePayoutMethod(@CurrentUser() user: UserDocument, @Param('methodId') methodId: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.payoutsService.deletePayoutMethod(String(user._id), methodId);
        return { message: 'Payout method deleted successfully' };
      },
      'Delete payout method',
      'Payout Method Deleted',
      'Your payout method has been deleted successfully.',
      'Failed to delete payout method',
    );
  }

  @Put('preferences')
  @ApiEndpoint({
    summary: 'Update payout preferences',
    description: 'Updates automatic payout preferences for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout preferences updated successfully',
        type: PayoutPreferencesResponseDto,
      },
      errors: {
        badRequest: 'Invalid preference values provided',
        forbidden: 'Only hosts can update payout preferences',
      },
    },
  })
  async updatePayoutPreferences(
    @CurrentUser() user: UserDocument,
    @Body() updatePreferencesDto: UpdatePayoutPreferencesDto,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const preferences = await this.payoutsService.updatePayoutPreferences(
          String(user._id),
          updatePreferencesDto,
        );
        return plainToInstance(PayoutPreferencesResponseDto, preferences);
      },
      'Update payout preferences',
      'Preferences Updated',
      'Your payout preferences have been updated successfully.',
      'Failed to update payout preferences',
    );
  }

  @Get('preferences')
  @ApiEndpoint({
    summary: 'Get payout preferences',
    description: 'Retrieves current payout preferences for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout preferences retrieved successfully',
        type: PayoutPreferencesResponseDto,
      },
      errors: {
        forbidden: 'Only hosts can view payout preferences',
      },
    },
  })
  async getPayoutPreferences(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const preferences = await this.payoutsService.getPayoutPreferences(String(user._id));
        return plainToInstance(PayoutPreferencesResponseDto, preferences);
      },
      'Get payout preferences',
      'Preferences Retrieved',
      'Your payout preferences have been retrieved successfully.',
      'Failed to retrieve payout preferences',
    );
  }

  @Get('eligible-earnings')
  @ApiEndpoint({
    summary: 'Get eligible earnings',
    description: 'Calculates and returns the total eligible earnings available for payout',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Eligible earnings calculated successfully',
        type: EligibleEarningsResponseDto,
      },
      errors: {
        forbidden: 'Only hosts can view eligible earnings',
      },
    },
  })
  async getEligibleEarnings(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const eligibleEarnings = await this.payoutsService.getEligibleEarnings(String(user._id));
        return plainToInstance(EligibleEarningsResponseDto, eligibleEarnings);
      },
      'Get eligible earnings',
      'Earnings Calculated',
      'Your eligible earnings have been calculated successfully.',
      'Failed to calculate eligible earnings',
    );
  }

  @Post()
  @ApiEndpoint({
    summary: 'Request a payout',
    description: 'Requests a new payout for eligible earnings using specified payout method',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        status: 201,
        description: 'Payout requested successfully',
        type: PayoutResponseDto,
      },
      errors: {
        badRequest: 'Invalid payout request data or insufficient earnings',
        forbidden: 'Only hosts can request payouts',
        notFound: 'Payout method not found or not verified',
      },
    },
  })
  async requestPayout(@CurrentUser() user: UserDocument, @Body() createPayoutDto: CreatePayoutDto) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const payout = await this.payoutsService.createPayout(String(user._id), createPayoutDto);
        return plainToInstance(PayoutResponseDto, payout.toObject());
      },
      'Request payout',
      'Payout Requested',
      'Your payout has been requested and is being processed.',
      'Failed to request payout',
    );
  }

  @Get()
  @ApiEndpoint({
    summary: 'Get payout history',
    description: 'Retrieves paginated payout history for the authenticated host',
    auth: {
      required: true,
      roles: [UserRole.HOST],
    },
    responses: {
      success: {
        description: 'Payout history retrieved successfully',
        type: PaginatedPayoutsResponseDto,
      },
      errors: {
        badRequest: 'Invalid pagination or filter parameters',
        forbidden: 'Only hosts can view their payout history',
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
    description: 'Filter by payout status',
  })
  @ApiQuery({
    name: 'fromDate',
    required: false,
    type: String,
    description: 'Filter from date (ISO string)',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    type: String,
    description: 'Filter to date (ISO string)',
  })
  async getPayoutHistory(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: PayoutStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = {
          hostId: String(user._id),
          status,
          fromDate: fromDate ? DateUtils.create(fromDate) : undefined,
          toDate: toDate ? DateUtils.create(toDate) : undefined,
        };
        const pagination = { page, limit };
        const payoutHistory = await this.payoutsService.getPayouts(filters, pagination);
        return plainToInstance(PaginatedPayoutsResponseDto, payoutHistory);
      },
      'Get payout history',
      'History Retrieved',
      'Your payout history has been retrieved successfully.',
      'Failed to retrieve payout history',
    );
  }
}
