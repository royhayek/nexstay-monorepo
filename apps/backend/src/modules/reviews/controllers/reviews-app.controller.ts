import { ApiTags, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import {
  ReviewResponseDto,
  ReviewListResponseDto,
  ReviewResponse,
  ReviewListResponse,
  ReviewDataDto,
} from '../dto/review-response.dto';
import {
  ReviewDeletionResponseDto,
  ReviewDeletionResponse,
} from '../dto/review-operation-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

/**
 * App Controller for Reviews
 * Handles review operations for mobile app and website users
 */
@Controller('app/reviews')
@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReviewsAppController extends BaseController {
  constructor(private readonly reviewFacadeService: ReviewFacadeService) {
    super();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.GUEST, UserRole.HOST)
  @ApiEndpoint({
    summary: 'Create a new review',
    description:
      'Create a review for a completed booking. Guests can review properties/hosts, hosts can review guests.',
    responses: {
      success: { description: 'Review created successfully', type: ReviewResponseDto },
      errors: {
        badRequest: 'Validation error, review already exists, or booking not eligible for review',
        forbidden: 'You can only review bookings you were involved in',
        notFound: 'Booking or property not found',
      },
    },
  })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const review = await this.reviewFacadeService.createReview(
          createReviewDto,
          String(user._id),
        );
        return plainToInstance(ReviewDataDto, review.toObject());
      },
      'Create Review',
      'Review Creation',
      'Review created successfully',
      'Failed to create review',
    );
  }

  @Get('my-reviews')
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
    summary: 'Get my reviews',
    description: 'Get paginated list of reviews created by the current user',
    responses: {
      success: { description: 'Reviews retrieved successfully', type: ReviewListResponseDto },
    },
  })
  async getMyReviews(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<ReviewListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getUserReviewsAsReviewer(
          String(user._id),
          page,
          Math.min(limit, 50),
        );

        const data: PaginatedDto<ReviewDataDto> = {
          items: result.items.map((review) => plainToInstance(ReviewDataDto, review)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Get My Reviews',
      'My Reviews Retrieved',
      'Reviews retrieved successfully',
      'Failed to retrieve reviews',
    );
  }

  @Get('received')
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
    summary: 'Get received reviews',
    description: 'Get paginated list of reviews received by the current user (as reviewee)',
    responses: {
      success: {
        description: 'Received reviews retrieved successfully',
        type: ReviewListResponseDto,
      },
    },
  })
  async getReceivedReviews(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<ReviewListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getUserReviewsAsReviewee(
          String(user._id),
          page,
          Math.min(limit, 50),
        );

        const data: PaginatedDto<ReviewDataDto> = {
          items: result.items.map((review) => plainToInstance(ReviewDataDto, review)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Get Received Reviews',
      'Received Reviews Retrieved',
      'Reviews retrieved successfully',
      'Failed to retrieve reviews',
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Get review by ID',
    description:
      'Get a specific review by ID. Users can only access their own reviews or reviews they are involved in.',
    responses: {
      success: { description: 'Review retrieved successfully', type: ReviewResponseDto },
      errors: {
        forbidden: 'Access denied to view this review',
        notFound: 'Review not found',
      },
    },
  })
  async getReviewById(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const review = await this.reviewFacadeService.getReviewById(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(ReviewDataDto, review.toObject());
      },
      'Get Review',
      'Review Retrieved',
      'Review retrieved successfully',
      'Failed to retrieve review',
    );
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Update review',
    description: 'Update an existing review. Users can only update their own reviews.',
    responses: {
      success: { description: 'Review updated successfully', type: ReviewResponseDto },
      errors: {
        forbidden: 'You can only update your own reviews',
        notFound: 'Review not found',
      },
    },
  })
  async updateReview(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const review = await this.reviewFacadeService.updateReview(
          id,
          updateReviewDto,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(ReviewDataDto, review.toObject());
      },
      'Update Review',
      'Review Updated',
      'Review updated successfully',
      'Failed to update review',
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Delete review',
    description: 'Delete an existing review. Users can only delete their own reviews.',
    responses: {
      success: { description: 'Review deleted successfully', type: ReviewDeletionResponseDto },
      errors: {
        forbidden: 'You can only delete your own reviews',
        notFound: 'Review not found',
      },
    },
  })
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewDeletionResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.reviewFacadeService.deleteReview(id, String(user._id), user.roles[0]);
        return {
          deleted: true,
          reviewId: id,
        };
      },
      'Delete Review',
      'Review Deleted',
      'Review deleted successfully',
      'Failed to delete review',
    );
  }
}
