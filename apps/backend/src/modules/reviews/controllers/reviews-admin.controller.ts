import { ApiTags, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { BaseController } from '../../../common/controllers/base.controller';
import { ReviewFacadeService } from '../services/review-facade.service';
import {
  ReviewAdminListResponseDto,
  ReviewStatsResponseDto,
  ReviewAdminListResponse,
  ReviewStatsResponse,
  ReviewAdminDto,
} from '../dto/review-response.dto';
import {
  ReviewModerationResponseDto,
  ReviewDeletionResponseDto,
  ReviewModerationResponse,
  ReviewDeletionResponse,
} from '../dto/review-operation-response.dto';
import { ReviewTableFilterDto } from '../dto/review-filters.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import type { BulkModerateReviewsRequest } from '../interfaces/reviews-controller.interfaces';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Admin Controller for Reviews
 * Handles administrative review operations
 */
@Controller('admin/reviews')
@ApiTags('Reviews Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
export class ReviewsAdminController extends BaseController {
  constructor(private readonly reviewFacadeService: ReviewFacadeService) {
    super();
  }

  @Get()
  @ApiEndpoint({
    summary: 'Get all reviews with filters',
    description:
      'Get paginated list of all reviews with advanced filtering options for admin management',
    responses: {
      success: { description: 'Reviews retrieved successfully', type: ReviewAdminListResponseDto },
    },
  })
  async getAllReviews(@Query() filters: ReviewTableFilterDto): Promise<ReviewAdminListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getAdminReviews(filters);

        const data: PaginatedDto<ReviewAdminDto> = {
          items: result.items.map((review) => plainToInstance(ReviewAdminDto, review)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Get All Reviews',
      'Admin Reviews Retrieved',
      'Reviews retrieved successfully',
      'Failed to retrieve reviews',
    );
  }

  @Get('flagged')
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
  @ApiEndpoint({
    summary: 'Get flagged reviews',
    description: 'Get paginated list of reviews flagged for moderation',
    responses: {
      success: {
        description: 'Flagged reviews retrieved successfully',
        type: ReviewAdminListResponseDto,
      },
    },
  })
  async getFlaggedReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<ReviewAdminListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getFlaggedReviews(page, Math.min(limit, 50));

        const data: PaginatedDto<ReviewAdminDto> = {
          items: result.items.map((review) => plainToInstance(ReviewAdminDto, review)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Get Flagged Reviews',
      'Flagged Reviews Retrieved',
      'Flagged reviews retrieved successfully',
      'Failed to retrieve flagged reviews',
    );
  }

  @Get('statistics')
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiEndpoint({
    summary: 'Get review statistics',
    description: 'Get comprehensive review statistics for admin dashboard',
    responses: {
      success: { description: 'Statistics retrieved successfully', type: ReviewStatsResponseDto },
    },
  })
  async getReviewStatistics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ReviewStatsResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = { from, to };
        return await this.reviewFacadeService.getReviewStatistics(filters);
      },
      'Get Review Statistics',
      'Statistics Retrieved',
      'Statistics retrieved successfully',
      'Failed to retrieve statistics',
    );
  }

  @Put(':id/moderate')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiBody({
    description: 'Moderation action details',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['approve', 'reject', 'flag', 'unflag', 'hide', 'show'],
          description: 'Moderation action to take',
        },
        reason: {
          type: 'string',
          description: 'Reason for moderation action',
          maxLength: 250,
        },
      },
      required: ['action'],
    },
  })
  @ApiEndpoint({
    summary: 'Moderate review',
    description: 'Take moderation action on a review (approve, reject, flag, etc.)',
    responses: {
      success: { description: 'Review moderated successfully', type: ReviewModerationResponseDto },
      errors: {
        badRequest: 'Invalid moderation action',
        notFound: 'Review not found',
      },
    },
  })
  async moderateReview(
    @Param('id') reviewId: string,
    @Body()
    body: {
      action: 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show';
      reason?: string;
    },
    @CurrentUser() admin: UserDocument,
  ): Promise<ReviewModerationResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const moderatedReview = await this.reviewFacadeService.moderateReview(
          reviewId,
          body.action,
          String(admin._id),
          admin.roles[0],
          body.reason,
        );

        return {
          reviewId,
          action: body.action,
          moderatedAt: DateUtils.now(),
          moderatedBy: String(admin._id),
          moderationReason: body.reason,
          isApproved: moderatedReview.isApproved || false,
          isFlagged: moderatedReview.isFlagged || false,
          isHidden: moderatedReview.isHidden || false,
        };
      },
      'Moderate Review',
      'Review Moderated',
      'Review moderated successfully',
      'Failed to moderate review',
    );
  }

  @Post('moderate/bulk')
  @ApiBody({
    description: 'Bulk moderation details',
    schema: {
      type: 'object',
      properties: {
        reviewIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of review IDs to moderate',
        },
        action: {
          type: 'string',
          enum: ['approve', 'reject', 'flag', 'unflag', 'hide', 'show'],
          description: 'Moderation action to apply to all reviews',
        },
        reason: {
          type: 'string',
          description: 'Reason for moderation action',
          maxLength: 250,
        },
      },
      required: ['reviewIds', 'action'],
    },
  })
  @ApiEndpoint({
    summary: 'Bulk moderate reviews',
    description: 'Apply moderation action to multiple reviews at once',
    responses: {
      success: { description: 'Bulk moderation completed successfully' },
      errors: {
        badRequest: 'Invalid request data',
      },
    },
  })
  async bulkModerateReviews(
    @Body() body: BulkModerateReviewsRequest,
    @CurrentUser() admin: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.reviewFacadeService.bulkModerateReviews(
          body.reviewIds,
          body.action,
          String(admin._id),
          admin.roles[0],
          body.reason,
        );
      },
      'Bulk Moderate Reviews',
      'Bulk Moderation Completed',
      'Reviews moderated successfully',
      'Failed to moderate reviews',
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Delete review',
    description: 'Permanently delete a review (admin only)',
    responses: {
      success: { description: 'Review deleted successfully', type: ReviewDeletionResponseDto },
      errors: {
        notFound: 'Review not found',
      },
    },
  })
  async deleteReview(
    @Param('id') reviewId: string,
    @CurrentUser() admin: UserDocument,
  ): Promise<ReviewDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.reviewFacadeService.deleteReview(reviewId, String(admin._id), admin.roles[0]);

        return {
          deleted: true,
          reviewId,
        };
      },
      'Delete Review',
      'Review Deleted',
      'Review deleted successfully',
      'Failed to delete review',
    );
  }
}
