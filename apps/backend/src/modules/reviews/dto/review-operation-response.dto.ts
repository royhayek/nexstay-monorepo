import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';

/**
 * Review deletion result DTO
 */
export class ReviewDeletionDataDto {
  @ApiProperty({ description: 'Indicates if review was deleted', example: true })
  deleted: boolean;

  @ApiProperty({ description: 'Deleted review ID', example: '507f1f77bcf86cd799439011' })
  reviewId: string;
}

/**
 * Review moderation result DTO
 */
export class ReviewModerationDataDto {
  @ApiProperty({ description: 'Review ID', example: '507f1f77bcf86cd799439011' })
  reviewId: string;

  @ApiProperty({ description: 'Moderation action taken', example: 'approved' })
  action: string;

  @ApiProperty({ description: 'Moderated at timestamp', example: '2024-01-15T10:30:00Z' })
  moderatedAt: Date;

  @ApiProperty({ description: 'Moderated by admin ID', example: '507f1f77bcf86cd799439016' })
  moderatedBy: string;

  @ApiPropertyOptional({
    description: 'Moderation reason',
    example: 'Content reviewed and approved',
  })
  moderationReason?: string;

  @ApiProperty({ description: 'New moderation status', example: true })
  isApproved: boolean;

  @ApiProperty({ description: 'Is flagged status', example: false })
  isFlagged: boolean;

  @ApiProperty({ description: 'Is hidden status', example: false })
  isHidden: boolean;
}

/**
 * Property review statistics DTO
 */
export class PropertyReviewStatsDataDto {
  @ApiProperty({ description: 'Property ID', example: '507f1f77bcf86cd799439012' })
  propertyId: string;

  @ApiProperty({ description: 'Total reviews count', example: 45 })
  totalReviews: number;

  @ApiProperty({ description: 'Average overall rating', example: 4.3 })
  averageRating: number;

  @ApiProperty({
    description: 'Rating breakdown by stars',
    example: { 1: 2, 2: 3, 3: 5, 4: 15, 5: 20 },
  })
  ratingBreakdown: Record<number, number>;

  @ApiProperty({ description: 'Most recent reviews count (last 30 days)', example: 8 })
  recentReviewsCount: number;
}

/**
 * User review summary DTO
 */
export class UserReviewSummaryDataDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439014' })
  userId: string;

  @ApiProperty({ description: 'Total reviews written', example: 23 })
  reviewsWritten: number;

  @ApiProperty({ description: 'Total reviews received', example: 18 })
  reviewsReceived: number;

  @ApiProperty({ description: 'Average rating given', example: 4.2 })
  averageRatingGiven: number;

  @ApiProperty({ description: 'Average rating received', example: 4.5 })
  averageRatingReceived: number;

  @ApiProperty({ description: 'Last review date', example: '2024-01-15T10:30:00Z' })
  lastReviewDate?: Date;
}

// Create typed response DTOs using the factory
export const ReviewDeletionResponseDto = createResponseDto(ReviewDeletionDataDto);
export const ReviewModerationResponseDto = createResponseDto(ReviewModerationDataDto);
export const PropertyReviewStatsResponseDto = createResponseDto(PropertyReviewStatsDataDto);
export const UserReviewSummaryResponseDto = createResponseDto(UserReviewSummaryDataDto);

// Type aliases for return types
export type ReviewDeletionResponse = BaseResponseDto<ReviewDeletionDataDto>;
export type ReviewModerationResponse = BaseResponseDto<ReviewModerationDataDto>;
export type PropertyReviewStatsResponse = BaseResponseDto<PropertyReviewStatsDataDto>;
export type UserReviewSummaryResponse = BaseResponseDto<UserReviewSummaryDataDto>;
