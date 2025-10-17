import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';

// ========================================
// ENHANCEMENT 1: Photo Upload Support
// ========================================

export class ReviewPhotoDto {
  @ApiProperty({
    description: 'Photo URL in S3',
    example: 'https://s3.amazonaws.com/bucket/reviews/photo1.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Thumbnail URL',
    example: 'https://s3.amazonaws.com/bucket/reviews/photo1_thumb.jpg',
  })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'beautiful-property.jpg',
  })
  originalFilename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2025-10-12T10:30:00Z',
  })
  uploadedAt: Date;
}

export class UploadReviewPhotosDto {
  @ApiProperty({
    description: 'Review ID to attach photos to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsString()
  reviewId: string;
}

export class DeleteReviewPhotoDto {
  @ApiProperty({
    description: 'Photo URL to delete',
    example: 'https://s3.amazonaws.com/bucket/reviews/photo1.jpg',
  })
  @IsNotEmpty()
  @IsString()
  photoUrl: string;
}

// ========================================
// ENHANCEMENT 2: Review Translation
// ========================================

export class TranslationDto {
  @ApiProperty({
    description: 'Translated review text',
    example: 'Belle propriété avec vue magnifique',
  })
  publicReview: string;

  @ApiProperty({
    description: 'Translation timestamp',
    example: '2025-10-12T10:30:00Z',
  })
  translatedAt: Date;

  @ApiProperty({
    description: 'Whether translation was automated',
    example: true,
  })
  autoTranslated: boolean;
}

export class TranslateReviewDto {
  @ApiProperty({
    description: 'Target language code',
    enum: ['en', 'fr', 'ar'],
    example: 'fr',
  })
  @IsNotEmpty()
  @IsEnum(['en', 'fr', 'ar'])
  targetLanguage: string;
}

export class ReviewTranslationDataDto {
  @ApiProperty({
    description: 'Original language',
    example: 'en',
  })
  originalLanguage: string;

  @ApiProperty({
    description: 'Target language',
    example: 'fr',
  })
  targetLanguage: string;

  @ApiProperty({
    description: 'Translated text',
    example: 'Belle propriété avec vue magnifique',
  })
  translatedText: string;

  @ApiProperty({
    description: 'Whether translation is from cache',
    example: false,
  })
  fromCache: boolean;
}

export const ReviewTranslationResponseDto = createResponseDto(ReviewTranslationDataDto);
export type ReviewTranslationResponse = BaseResponseDto<ReviewTranslationDataDto>;

// ========================================
// ENHANCEMENT 3: Sentiment Analysis
// ========================================

export class SentimentDto {
  @ApiProperty({
    description: 'Sentiment score (-1 to 1)',
    example: 0.85,
    minimum: -1,
    maximum: 1,
  })
  score: number;

  @ApiProperty({
    description: 'Sentiment label',
    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'],
    example: 'POSITIVE',
  })
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

  @ApiProperty({
    description: 'Confidence score (0 to 1)',
    example: 0.92,
    minimum: 0,
    maximum: 1,
  })
  confidence: number;

  @ApiProperty({
    description: 'Analysis timestamp',
    example: '2025-10-12T10:30:00Z',
  })
  analyzedAt: Date;
}

export class AnalyzeSentimentDto {
  @ApiProperty({
    description: 'Review text to analyze',
    example: 'This property was absolutely amazing! Clean, beautiful, and perfect location.',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  text: string;

  @ApiPropertyOptional({
    description: 'Language code',
    enum: ['en', 'fr', 'ar'],
    example: 'en',
  })
  @IsOptional()
  @IsEnum(['en', 'fr', 'ar'])
  language?: string;
}

// ========================================
// ENHANCEMENT 4: Helpful Voting System
// ========================================

export class VoteDto {
  @ApiProperty({
    description: 'User ID who voted',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Vote type',
    enum: ['helpful', 'not_helpful'],
    example: 'helpful',
  })
  vote: 'helpful' | 'not_helpful';

  @ApiProperty({
    description: 'Vote timestamp',
    example: '2025-10-12T10:30:00Z',
  })
  votedAt: Date;
}

export class CastVoteDto {
  @ApiProperty({
    description: 'Vote type',
    enum: ['helpful', 'not_helpful'],
    example: 'helpful',
  })
  @IsNotEmpty()
  @IsEnum(['helpful', 'not_helpful'])
  vote: 'helpful' | 'not_helpful';
}

export class ReviewVotingDataDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  reviewId: string;

  @ApiProperty({
    description: 'User vote (if any)',
    enum: ['helpful', 'not_helpful', null],
    example: 'helpful',
    nullable: true,
  })
  userVote: 'helpful' | 'not_helpful' | null;

  @ApiProperty({
    description: 'Total helpful votes',
    example: 42,
  })
  helpfulCount: number;

  @ApiProperty({
    description: 'Total not helpful votes',
    example: 3,
  })
  notHelpfulCount: number;

  @ApiProperty({
    description: 'Helpfulness score',
    example: 39,
  })
  helpfulnessScore: number;
}

export const ReviewVotingResponseDto = createResponseDto(ReviewVotingDataDto);
export type ReviewVotingResponse = BaseResponseDto<ReviewVotingDataDto>;

// ========================================
// ENHANCEMENT 5: Verified Stay Badges
// ========================================

export class VerificationDto {
  @ApiProperty({
    description: 'Booking verified',
    example: true,
  })
  bookingVerified: boolean;

  @ApiProperty({
    description: 'Payment verified',
    example: true,
  })
  paymentVerified: boolean;

  @ApiProperty({
    description: 'Stay completed',
    example: true,
  })
  stayCompleted: boolean;

  @ApiProperty({
    description: 'Verification timestamp',
    example: '2025-10-12T10:30:00Z',
  })
  verifiedAt: Date;

  @ApiProperty({
    description: 'Verification method',
    enum: ['auto', 'manual'],
    example: 'auto',
  })
  verificationMethod: 'auto' | 'manual';
}

export class ManualVerificationDto {
  @ApiProperty({
    description: 'Set verified status',
    example: true,
  })
  @IsNotEmpty()
  isVerified: boolean;

  @ApiPropertyOptional({
    description: 'Verification reason/notes',
    example: 'Manual verification after review',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReviewVerificationDataDto {
  @ApiProperty({
    description: 'Review ID',
    example: '507f1f77bcf86cd799439011',
  })
  reviewId: string;

  @ApiProperty({
    description: 'Is verified stay',
    example: true,
  })
  isVerifiedStay: boolean;

  @ApiProperty({
    description: 'Verification details',
    type: VerificationDto,
  })
  verification: VerificationDto;
}

export const ReviewVerificationResponseDto = createResponseDto(ReviewVerificationDataDto);
export type ReviewVerificationResponse = BaseResponseDto<ReviewVerificationDataDto>;

// ========================================
// Combined Enhancement Response DTO
// ========================================

export class ReviewEnhancementsDataDto {
  @ApiPropertyOptional({
    description: 'Review photos',
    type: [ReviewPhotoDto],
  })
  photos?: ReviewPhotoDto[];

  @ApiPropertyOptional({
    description: 'Photo count',
    example: 3,
  })
  photoCount?: number;

  @ApiPropertyOptional({
    description: 'Original language',
    example: 'en',
  })
  originalLanguage?: string;

  @ApiPropertyOptional({
    description: 'Available translations',
    example: { fr: { publicReview: 'Belle propriété...', translatedAt: '2025-10-12T10:30:00Z' } },
  })
  translations?: Record<string, TranslationDto>;

  @ApiPropertyOptional({
    description: 'Sentiment analysis',
    type: SentimentDto,
  })
  sentiment?: SentimentDto;

  @ApiPropertyOptional({
    description: 'Helpful votes count',
    example: 42,
  })
  helpfulCount?: number;

  @ApiPropertyOptional({
    description: 'Not helpful votes count',
    example: 3,
  })
  notHelpfulCount?: number;

  @ApiPropertyOptional({
    description: 'Helpfulness score',
    example: 39,
  })
  helpfulnessScore?: number;

  @ApiPropertyOptional({
    description: 'User vote (if any)',
    enum: ['helpful', 'not_helpful', null],
    nullable: true,
  })
  userVote?: 'helpful' | 'not_helpful' | null;

  @ApiPropertyOptional({
    description: 'Is verified stay',
    example: true,
  })
  isVerifiedStay?: boolean;

  @ApiPropertyOptional({
    description: 'Verification details',
    type: VerificationDto,
  })
  verification?: VerificationDto;
}
