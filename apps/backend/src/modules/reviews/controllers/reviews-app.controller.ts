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
import {
  ReviewTranslationResponseDto,
  ReviewTranslationResponse,
  TranslateReviewDto,
  CastVoteDto,
  ReviewVotingResponseDto,
  ReviewVotingResponse,
  DeleteReviewPhotoDto,
} from '../dto/review-enhancements.dto';
import { ReviewPhotoService } from '../services/review-photo.service';
import { ReviewTranslationService } from '../services/review-translation.service';
import { ReviewVotingService } from '../services/review-voting.service';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

/**
 * App Controller for Reviews
 * Handles review operations for mobile app and website users
 */
@Controller('app/reviews')
@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReviewsAppController extends BaseController {
  constructor(
    private readonly reviewFacadeService: ReviewFacadeService,
    private readonly reviewPhotoService: ReviewPhotoService,
    private readonly reviewTranslationService: ReviewTranslationService,
    private readonly reviewVotingService: ReviewVotingService,
  ) {
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

  // ========================================
  // ENHANCEMENT ENDPOINTS
  // ========================================

  /**
   * Upload photos to a review
   */
  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('photos', 5))
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Upload review photos',
    description: 'Upload up to 5 photos to a review. Only review owner can upload photos.',
    responses: {
      success: { description: 'Photos uploaded successfully', type: ReviewResponseDto },
      errors: {
        badRequest: 'Invalid files, max 5 photos, max 10MB per photo',
        forbidden: 'You can only upload photos to your own reviews',
        notFound: 'Review not found',
      },
    },
  })
  async uploadReviewPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const photos = await this.reviewPhotoService.uploadPhotos(id, String(user._id), files);
        const review = await this.reviewFacadeService.getReviewById(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(ReviewDataDto, review.toObject());
      },
      'Upload Review Photos',
      'Photos Uploaded',
      'Photos uploaded successfully',
      'Failed to upload photos',
    );
  }

  /**
   * Delete a photo from a review
   */
  @Delete(':id/photos')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Delete review photo',
    description: 'Delete a specific photo from a review. Only review owner can delete photos.',
    responses: {
      success: { description: 'Photo deleted successfully', type: ReviewResponseDto },
      errors: {
        forbidden: 'You can only delete photos from your own reviews',
        notFound: 'Review or photo not found',
      },
    },
  })
  async deleteReviewPhoto(
    @Param('id') id: string,
    @Body() deletePhotoDto: DeleteReviewPhotoDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.reviewPhotoService.deletePhoto(id, String(user._id), deletePhotoDto.photoUrl);
        const review = await this.reviewFacadeService.getReviewById(
          id,
          String(user._id),
          user.roles[0],
        );
        return plainToInstance(ReviewDataDto, review.toObject());
      },
      'Delete Review Photo',
      'Photo Deleted',
      'Photo deleted successfully',
      'Failed to delete photo',
    );
  }

  /**
   * Translate a review
   */
  @Post(':id/translate')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Translate review',
    description: 'Translate a review to a target language (en, fr, ar). Translations are cached.',
    responses: {
      success: {
        description: 'Review translated successfully',
        type: ReviewTranslationResponseDto,
      },
      errors: {
        badRequest: 'Invalid target language',
        notFound: 'Review not found',
      },
    },
  })
  async translateReview(
    @Param('id') id: string,
    @Body() translateDto: TranslateReviewDto,
  ): Promise<ReviewTranslationResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const translation = await this.reviewTranslationService.translateReview(
          id,
          translateDto.targetLanguage,
        );
        return translation;
      },
      'Translate Review',
      'Review Translated',
      'Review translated successfully',
      'Failed to translate review',
    );
  }

  /**
   * Cast a vote on a review
   */
  @Post(':id/vote')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Vote on review',
    description: 'Vote a review as helpful or not helpful. Users can vote once per review.',
    responses: {
      success: { description: 'Vote cast successfully', type: ReviewVotingResponseDto },
      errors: {
        forbidden: 'You cannot vote on your own review',
        notFound: 'Review not found',
      },
    },
  })
  async castVote(
    @Param('id') id: string,
    @Body() voteDto: CastVoteDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewVotingResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const votingData = await this.reviewVotingService.castVote(
          id,
          String(user._id),
          voteDto.vote,
        );
        return votingData;
      },
      'Cast Vote',
      'Vote Cast',
      'Vote cast successfully',
      'Failed to cast vote',
    );
  }

  /**
   * Remove vote from a review
   */
  @Delete(':id/vote')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Remove vote from review',
    description: 'Remove your vote from a review.',
    responses: {
      success: { description: 'Vote removed successfully', type: ReviewVotingResponseDto },
      errors: {
        badRequest: 'You have not voted on this review',
        notFound: 'Review not found',
      },
    },
  })
  async removeVote(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewVotingResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const votingData = await this.reviewVotingService.removeVote(id, String(user._id));
        return votingData;
      },
      'Remove Vote',
      'Vote Removed',
      'Vote removed successfully',
      'Failed to remove vote',
    );
  }

  /**
   * Get voting information for a review
   */
  @Get(':id/voting')
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiEndpoint({
    summary: 'Get review voting info',
    description: 'Get voting statistics and current user vote for a review.',
    responses: {
      success: { description: 'Voting info retrieved successfully', type: ReviewVotingResponseDto },
      errors: {
        notFound: 'Review not found',
      },
    },
  })
  async getVotingInfo(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ReviewVotingResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const votingData = await this.reviewVotingService.getVotingInfo(id, String(user._id));
        return votingData;
      },
      'Get Voting Info',
      'Voting Info Retrieved',
      'Voting info retrieved successfully',
      'Failed to retrieve voting info',
    );
  }
}
