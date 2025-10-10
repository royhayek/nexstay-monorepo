import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { BaseController } from '../../../common/controllers/base.controller';
import { ReviewFacadeService } from '../services/review-facade.service';
import {
  PropertyReviewsResponseDto,
  ReviewAveragesResponseDto,
  PropertyReviewsResponse,
  ReviewAveragesResponse,
  ReviewSummaryDto,
} from '../dto/review-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';

/**
 * Public Controller for Reviews
 * Handles publicly accessible review operations
 */
@Controller('public/reviews')
@ApiTags('Reviews')
export class ReviewsPublicController extends BaseController {
  constructor(private readonly reviewFacadeService: ReviewFacadeService) {
    super();
  }

  @Public()
  @Get('property/:propertyId')
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
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
    description: 'Items per page (default: 10, max: 50)',
  })
  @ApiEndpoint({
    summary: 'Get property reviews',
    description: 'Get paginated list of approved reviews for a specific property with averages',
    responses: {
      success: {
        description: 'Property reviews retrieved successfully',
        type: PropertyReviewsResponseDto,
      },
      errors: {
        notFound: 'Property not found',
        badRequest: 'Invalid property ID format',
      },
    },
  })
  async getPropertyReviews(
    @Param('propertyId') propertyId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PropertyReviewsResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getPropertyReviews(
          propertyId,
          page,
          Math.min(limit, 50), // Max 50 for public API
        );

        return {
          items: result.items.map((review) => plainToInstance(ReviewSummaryDto, review)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          averages: {
            averageRating: result.averages.averageRating,
            averageAccuracy: result.averages.averageAccuracy,
            averageCommunication: result.averages.averageCommunication,
            averageCleanliness: result.averages.averageCleanliness,
            averageLocation: result.averages.averageLocation,
            averageCheckIn: result.averages.averageCheckIn,
            averageValue: result.averages.averageValue,
            totalReviews: result.averages.totalReviews,
          },
        };
      },
      'Get Property Reviews',
      'Property Reviews Retrieved',
      'Reviews retrieved successfully',
      'Failed to retrieve property reviews',
    );
  }

  @Public()
  @Get('property/:propertyId/averages')
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiEndpoint({
    summary: 'Get property review averages',
    description: 'Get average ratings and statistics for a property',
    responses: {
      success: {
        description: 'Property averages retrieved successfully',
        type: ReviewAveragesResponseDto,
      },
      errors: {
        notFound: 'Property not found',
        badRequest: 'Invalid property ID format',
      },
    },
  })
  async getPropertyAverages(
    @Param('propertyId') propertyId: string,
  ): Promise<ReviewAveragesResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.reviewFacadeService.getPropertyReviews(propertyId, 1, 0);
        return (
          result.averages || {
            totalReviews: 0,
            averageRating: 0,
            averageAccuracy: 0,
            averageCommunication: 0,
            averageCleanliness: 0,
            averageLocation: 0,
            averageCheckIn: 0,
            averageValue: 0,
          }
        );
      },
      'Get Property Averages',
      'Property Averages Retrieved',
      'Property averages retrieved successfully',
      'Failed to retrieve property averages',
    );
  }
}
