import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ReviewType } from '../../../common/enums/property.enums';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import type { LeanPopulatedAdminReview } from '../types/review.types';
import {
  ReviewPhotoDto,
  TranslationDto,
  SentimentDto,
  VerificationDto,
} from './review-enhancements.dto';

/**
 * Base Review DTO with common fields
 */
export abstract class BaseReviewDto {
  @ApiProperty({ description: 'Review ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Property ID', example: '507f1f77bcf86cd799439012' })
  propertyId: string;

  @ApiProperty({ description: 'Booking ID', example: '507f1f77bcf86cd799439013' })
  bookingId: string;

  @ApiProperty({ description: 'Reviewer ID', example: '507f1f77bcf86cd799439014' })
  reviewerId: string;

  @ApiProperty({ description: 'Reviewee ID', example: '507f1f77bcf86cd799439015' })
  revieweeId: string;

  @ApiProperty({ description: 'Review type', enum: ReviewType })
  reviewType: ReviewType;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

/**
 * Summary review DTO for listings
 */
export class ReviewSummaryDto extends BaseReviewDto {
  @ApiPropertyOptional({ description: 'Overall rating', example: 4.5 })
  overallRating?: number;

  @ApiProperty({
    description: 'Public review excerpt',
    example: 'Great place to stay! Clean and comfortable...',
  })
  publicReview: string;

  @ApiPropertyOptional({ description: 'Reviewer first name', example: 'John' })
  reviewerName?: string;

  @ApiPropertyOptional({
    description: 'Reviewer avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  reviewerAvatar?: string;
}

/**
 * Complete review data DTO
 */
export class ReviewDataDto extends BaseReviewDto {
  @ApiPropertyOptional({ description: 'Overall rating', example: 4.5 })
  overallRating?: number;

  @ApiPropertyOptional({ description: 'Accuracy rating', example: 5 })
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Communication rating', example: 4 })
  communication?: number;

  @ApiPropertyOptional({ description: 'Cleanliness rating', example: 5 })
  cleanliness?: number;

  @ApiPropertyOptional({ description: 'Location rating', example: 4 })
  location?: number;

  @ApiPropertyOptional({ description: 'Check-in rating', example: 5 })
  checkIn?: number;

  @ApiPropertyOptional({ description: 'Value rating', example: 4 })
  value?: number;

  @ApiProperty({
    description: 'Public review',
    example: 'Great place to stay! Clean, comfortable, and excellent location. Highly recommended.',
  })
  publicReview: string;

  @ApiPropertyOptional({
    description: 'Private feedback',
    example: 'The Wi-Fi was a bit slow in the evenings, but everything else was perfect.',
  })
  privateFeedback?: string;

  @ApiPropertyOptional({ description: 'Is flagged for moderation', example: false })
  isFlagged?: boolean;

  @ApiPropertyOptional({ description: 'Is approved by admin', example: true })
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'Is hidden from public view', example: false })
  isHidden?: boolean;

  @ApiPropertyOptional({
    description: 'Moderated by admin ID',
    example: '507f1f77bcf86cd799439016',
  })
  moderatedBy?: string;

  @ApiPropertyOptional({ description: 'Moderated at timestamp', example: '2024-01-15T10:30:00Z' })
  moderatedAt?: Date;

  @ApiPropertyOptional({ description: 'Moderation reason', example: 'Content review requested' })
  moderationReason?: string;

  // ========================================
  // ENHANCEMENT FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Review photos',
    type: [ReviewPhotoDto],
    example: [
      {
        url: 'https://s3.amazonaws.com/bucket/reviews/photo1.jpg',
        thumbnailUrl: 'https://s3.amazonaws.com/bucket/reviews/photo1_thumb.jpg',
        originalFilename: 'beautiful-property.jpg',
        size: 2048576,
        mimeType: 'image/jpeg',
        uploadedAt: '2025-10-12T10:30:00Z',
      },
    ],
  })
  photos?: ReviewPhotoDto[];

  @ApiPropertyOptional({ description: 'Number of photos', example: 3 })
  photoCount?: number;

  @ApiPropertyOptional({ description: 'Original language', example: 'en' })
  originalLanguage?: string;

  @ApiPropertyOptional({
    description: 'Available translations',
    example: {
      fr: { publicReview: 'Belle propriété...', translatedAt: '2025-10-12T10:30:00Z' },
    },
  })
  translations?: Record<string, TranslationDto>;

  @ApiPropertyOptional({
    description: 'Sentiment analysis',
    type: SentimentDto,
    example: {
      score: 0.85,
      label: 'POSITIVE',
      confidence: 0.92,
      analyzedAt: '2025-10-12T10:30:00Z',
    },
  })
  sentiment?: SentimentDto;

  @ApiPropertyOptional({ description: 'Requires manual review flag', example: false })
  requiresManualReview?: boolean;

  @ApiPropertyOptional({ description: 'Helpful votes count', example: 42 })
  helpfulCount?: number;

  @ApiPropertyOptional({ description: 'Not helpful votes count', example: 3 })
  notHelpfulCount?: number;

  @ApiPropertyOptional({ description: 'Helpfulness score', example: 39 })
  helpfulnessScore?: number;

  @ApiPropertyOptional({
    description: 'Current user vote (if any)',
    enum: ['helpful', 'not_helpful'],
    nullable: true,
  })
  userVote?: 'helpful' | 'not_helpful' | null;

  @ApiPropertyOptional({ description: 'Is verified stay', example: true })
  isVerifiedStay?: boolean;

  @ApiPropertyOptional({
    description: 'Verification details',
    type: VerificationDto,
    example: {
      bookingVerified: true,
      paymentVerified: true,
      stayCompleted: true,
      verifiedAt: '2025-10-12T10:30:00Z',
      verificationMethod: 'auto',
    },
  })
  verification?: VerificationDto;
}

/**
 * Admin-specific review data DTO
 */
export class ReviewAdminDto extends ReviewDataDto {
  @ApiPropertyOptional({ description: 'Reviewer email', example: 'guest@example.com' })
  @Transform(({ obj }: { obj: LeanPopulatedAdminReview }) => obj.reviewer?.email)
  reviewerEmail?: string;

  @ApiPropertyOptional({ description: 'Reviewee email', example: 'host@example.com' })
  @Transform(({ obj }: { obj: LeanPopulatedAdminReview }) => obj.reviewee?.email)
  revieweeEmail?: string;

  @ApiPropertyOptional({ description: 'Property name', example: 'Beautiful Downtown Apartment' })
  @Transform(({ obj }: { obj: LeanPopulatedAdminReview }) => obj.property?.name)
  propertyName?: string;

  @ApiPropertyOptional({ description: 'Property address', example: '123 Main St, New York' })
  @Transform(({ obj }: { obj: LeanPopulatedAdminReview }) => obj.property?.address)
  propertyAddress?: string;

  @ApiPropertyOptional({ description: 'Booking confirmation code', example: 'BK-123456' })
  @Transform(({ obj }: { obj: LeanPopulatedAdminReview }) => obj.booking?.confirmationCode)
  bookingConfirmationCode?: string;
}

/**
 * Review averages DTO
 */
export class ReviewAveragesDto {
  @ApiPropertyOptional({ description: 'Average overall rating', example: 4.3 })
  averageRating?: number;

  @ApiPropertyOptional({ description: 'Average accuracy rating', example: 4.5 })
  averageAccuracy?: number;

  @ApiPropertyOptional({ description: 'Average communication rating', example: 4.2 })
  averageCommunication?: number;

  @ApiPropertyOptional({ description: 'Average cleanliness rating', example: 4.4 })
  averageCleanliness?: number;

  @ApiPropertyOptional({ description: 'Average location rating', example: 4.1 })
  averageLocation?: number;

  @ApiPropertyOptional({ description: 'Average check-in rating', example: 4.3 })
  averageCheckIn?: number;

  @ApiPropertyOptional({ description: 'Average value rating', example: 4.2 })
  averageValue?: number;

  @ApiProperty({ description: 'Total reviews count', example: 45 })
  totalReviews: number;
}

/**
 * Review statistics DTO
 */
export class ReviewStatsDto {
  @ApiProperty({ description: 'Total reviews count', example: 127 })
  totalReviews: number;

  @ApiProperty({ description: 'Average rating across all reviews', example: 4.3 })
  averageRating: number;

  @ApiProperty({ description: 'Rating distribution', example: { 1: 2, 2: 3, 3: 8, 4: 45, 5: 69 } })
  ratingDistribution: Record<number, number>;

  @ApiProperty({ description: 'Flagged reviews count', example: 3 })
  flaggedCount: number;

  @ApiProperty({ description: 'Pending approval count', example: 5 })
  pendingApprovalCount: number;
}

/**
 * Paginated reviews with averages (for property reviews)
 */
export class PropertyReviewsDto extends PaginatedDto<ReviewSummaryDto> {
  @ApiProperty({ type: [ReviewSummaryDto], description: 'Array of review summary items' })
  @Transform(({ value }: { value: ReviewSummaryDto[] }): ReviewSummaryDto[] => value)
  declare items: ReviewSummaryDto[];

  @ApiProperty({ description: 'Review averages for the property', type: ReviewAveragesDto })
  averages: ReviewAveragesDto;
}

// Create concrete paginated DTOs to ensure proper Swagger generation
export class ReviewsPaginatedDto extends PaginatedDto<ReviewDataDto> {
  @ApiProperty({ type: [ReviewDataDto], description: 'Array of review items' })
  @Transform(({ value }: { value: ReviewDataDto[] }): ReviewDataDto[] => value)
  declare items: ReviewDataDto[];
}

export class ReviewAdminsPaginatedDto extends PaginatedDto<ReviewAdminDto> {
  @ApiProperty({ type: [ReviewAdminDto], description: 'Array of admin review items' })
  @Transform(({ value }: { value: ReviewAdminDto[] }): ReviewAdminDto[] => value)
  declare items: ReviewAdminDto[];
}

export class ReviewSummariesPaginatedDto extends PaginatedDto<ReviewSummaryDto> {
  @ApiProperty({ type: [ReviewSummaryDto], description: 'Array of review summary items' })
  @Transform(({ value }: { value: ReviewSummaryDto[] }): ReviewSummaryDto[] => value)
  declare items: ReviewSummaryDto[];
}

// Create typed response DTOs using the factory
export const ReviewResponseDto = createResponseDto(ReviewDataDto);
export const ReviewSummaryResponseDto = createResponseDto(ReviewSummaryDto);
export const ReviewListResponseDto = createResponseDto(ReviewsPaginatedDto);
export const ReviewAdminListResponseDto = createResponseDto(ReviewAdminsPaginatedDto);
export const ReviewSummaryListResponseDto = createResponseDto(ReviewSummariesPaginatedDto);
export const ReviewAveragesResponseDto = createResponseDto(ReviewAveragesDto);
export const ReviewStatsResponseDto = createResponseDto(ReviewStatsDto);
export const PropertyReviewsResponseDto = createResponseDto(PropertyReviewsDto);

// Type aliases for return types
export type ReviewResponse = BaseResponseDto<ReviewDataDto>;
export type ReviewSummaryResponse = BaseResponseDto<ReviewSummaryDto>;
export type ReviewListResponse = BaseResponseDto<ReviewsPaginatedDto>;
export type ReviewAdminListResponse = BaseResponseDto<ReviewAdminsPaginatedDto>;
export type ReviewSummaryListResponse = BaseResponseDto<ReviewSummariesPaginatedDto>;
export type ReviewAveragesResponse = BaseResponseDto<ReviewAveragesDto>;
export type ReviewStatsResponse = BaseResponseDto<ReviewStatsDto>;
export type PropertyReviewsResponse = BaseResponseDto<PropertyReviewsDto>;
