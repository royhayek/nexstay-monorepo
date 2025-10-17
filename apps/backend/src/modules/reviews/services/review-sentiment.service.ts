import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { SentimentDto } from '../dto/review-enhancements.dto';
import { ReviewNotFoundException } from '../exceptions/review.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Review Sentiment Service
 * Handles sentiment analysis for reviews
 *
 * NOTE: This is a mock implementation that simulates sentiment analysis.
 * In production, integrate with AWS Comprehend, Google Cloud Natural Language API,
 * or similar sentiment analysis service.
 */
@Injectable()
export class ReviewSentimentService {
  // Thresholds for auto-flagging
  private readonly NEGATIVE_THRESHOLD = -0.6; // Flag if sentiment < -0.6
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.5; // Flag if confidence < 0.5

  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  /**
   * Analyze sentiment for a review
   */
  async analyzeSentiment(reviewId: string): Promise<SentimentDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewSentimentService',
      });

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      if (!review.publicReview) {
        LoggingUtil.log(
          `Review ${reviewId} has no public content to analyze`,
          'ReviewSentimentService',
        );
        return this.createNeutralSentiment();
      }

      // Perform sentiment analysis
      const sentiment = await this.performSentimentAnalysis(
        review.publicReview,
        review.originalLanguage || 'en',
      );

      // Update review with sentiment
      review.sentiment = sentiment;
      review.requiresManualReview = this.shouldFlagForManualReview(sentiment, review.overallRating);
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `Analyzed sentiment for review ${reviewId}: ${sentiment.label} (${sentiment.score})`,
        'ReviewSentimentService',
      );

      return sentiment;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error analyzing sentiment:`,
        error,
        'ReviewSentimentService',
      );
      throw error;
    }
  }

  /**
   * Batch analyze sentiment for multiple reviews
   */
  async batchAnalyzeSentiment(reviewIds: string[]): Promise<Map<string, SentimentDto>> {
    const results = new Map<string, SentimentDto>();

    for (const reviewId of reviewIds) {
      try {
        const sentiment = await this.analyzeSentiment(reviewId);
        results.set(reviewId, sentiment);
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to analyze sentiment for review ${reviewId}:`,
          error,
          'ReviewSentimentService',
        );
        // Continue with other reviews
      }
    }

    return results;
  }

  /**
   * Get sentiment for a review
   */
  async getSentiment(reviewId: string): Promise<SentimentDto | null> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewSentimentService',
    });

    const review = await this.reviewModel.findById(reviewId).select('sentiment').lean().exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    return review.sentiment || null;
  }

  /**
   * Analyze sentiment for text without saving
   */
  async analyzeText(text: string, language: string = 'en'): Promise<SentimentDto> {
    return this.performSentimentAnalysis(text, language);
  }

  /**
   * Private helper methods
   */

  /**
   * Perform actual sentiment analysis using external service
   * This is a MOCK implementation - replace with real sentiment analysis service
   *
   * Production options:
   * - AWS Comprehend: https://aws.amazon.com/comprehend/
   * - Google Cloud Natural Language API: https://cloud.google.com/natural-language
   * - Microsoft Azure Text Analytics: https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/
   * - IBM Watson Natural Language Understanding: https://www.ibm.com/cloud/watson-natural-language-understanding
   */
  private async performSentimentAnalysis(text: string, language: string): Promise<SentimentDto> {
    LoggingUtil.log(
      `[MOCK] Analyzing sentiment for text (${language})`,
      'ReviewSentimentService',
    );

    // MOCK IMPLEMENTATION - Replace with actual sentiment analysis API
    // This is a simple keyword-based mock for demonstration

    const positiveKeywords = [
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'perfect',
      'beautiful',
      'clean',
      'fantastic',
      'love',
      'best',
      'awesome',
      'incredible',
      'outstanding',
    ];

    const negativeKeywords = [
      'bad',
      'terrible',
      'awful',
      'horrible',
      'dirty',
      'worst',
      'disappointing',
      'poor',
      'unacceptable',
      'disgusting',
      'broken',
      'rude',
    ];

    const lowerText = text.toLowerCase();

    // Count positive and negative keywords
    const positiveCount = positiveKeywords.filter((word) => lowerText.includes(word)).length;
    const negativeCount = negativeKeywords.filter((word) => lowerText.includes(word)).length;

    // Calculate sentiment score (-1 to 1)
    const totalWords = positiveCount + negativeCount;
    let score = 0;
    let label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' = 'NEUTRAL';
    let confidence = 0.7;

    if (totalWords === 0) {
      score = 0;
      label = 'NEUTRAL';
      confidence = 0.5;
    } else if (positiveCount > negativeCount) {
      score = Math.min(1, positiveCount / 10);
      label = positiveCount > negativeCount * 2 ? 'POSITIVE' : 'MIXED';
      confidence = 0.75;
    } else if (negativeCount > positiveCount) {
      score = Math.max(-1, -negativeCount / 10);
      label = negativeCount > positiveCount * 2 ? 'NEGATIVE' : 'MIXED';
      confidence = 0.75;
    } else {
      score = 0;
      label = 'MIXED';
      confidence = 0.6;
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      score: Math.round(score * 100) / 100,
      label,
      confidence: Math.round(confidence * 100) / 100,
      analyzedAt: DateUtils.now(),
    };

    /**
     * PRODUCTION IMPLEMENTATION EXAMPLE (AWS Comprehend):
     *
     * import { ComprehendClient, DetectSentimentCommand } from '@aws-sdk/client-comprehend';
     *
     * const comprehendClient = new ComprehendClient({ region: 'us-east-1' });
     *
     * const command = new DetectSentimentCommand({
     *   Text: text,
     *   LanguageCode: language,
     * });
     *
     * const response = await comprehendClient.send(command);
     *
     * // Map AWS sentiment to our format
     * const sentimentMap = {
     *   POSITIVE: 'POSITIVE',
     *   NEGATIVE: 'NEGATIVE',
     *   NEUTRAL: 'NEUTRAL',
     *   MIXED: 'MIXED',
     * };
     *
     * const sentiment = response.Sentiment;
     * const scores = response.SentimentScore;
     *
     * return {
     *   score: scores.Positive - scores.Negative,
     *   label: sentimentMap[sentiment],
     *   confidence: Math.max(
     *     scores.Positive,
     *     scores.Negative,
     *     scores.Neutral,
     *     scores.Mixed
     *   ),
     *   analyzedAt: DateUtils.now(),
     * };
     */
  }

  /**
   * Determine if review should be flagged for manual review
   */
  private shouldFlagForManualReview(sentiment: SentimentDto, rating?: number): boolean {
    // Flag if sentiment is very negative
    if (sentiment.score < this.NEGATIVE_THRESHOLD) {
      return true;
    }

    // Flag if confidence is too low
    if (sentiment.confidence < this.LOW_CONFIDENCE_THRESHOLD) {
      return true;
    }

    // Flag if sentiment doesn't match rating (if rating exists)
    if (rating !== undefined) {
      // High rating (4-5) but negative sentiment
      if (rating >= 4 && sentiment.label === 'NEGATIVE') {
        return true;
      }

      // Low rating (1-2) but positive sentiment
      if (rating <= 2 && sentiment.label === 'POSITIVE') {
        return true;
      }
    }

    return false;
  }

  /**
   * Create neutral sentiment (default)
   */
  private createNeutralSentiment(): SentimentDto {
    return {
      score: 0,
      label: 'NEUTRAL',
      confidence: 1.0,
      analyzedAt: DateUtils.now(),
    };
  }

  /**
   * Get reviews that require manual review
   */
  async getReviewsRequiringManualReview(limit: number = 50): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ requiresManualReview: true, isApproved: true })
      .populate('reviewer', 'firstName lastName avatarUrl')
      .populate('property', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
