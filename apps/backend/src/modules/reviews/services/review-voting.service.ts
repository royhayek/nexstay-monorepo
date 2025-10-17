import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { ReviewVotingDataDto, VoteDto } from '../dto/review-enhancements.dto';
import { ReviewNotFoundException } from '../exceptions/review.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Review Voting Service
 * Handles helpful/not_helpful voting system for reviews
 */
@Injectable()
export class ReviewVotingService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  /**
   * Cast a vote on a review
   */
  async castVote(
    reviewId: string,
    userId: string,
    vote: 'helpful' | 'not_helpful',
  ): Promise<ReviewVotingDataDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewVotingService',
      });

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      // Prevent review author from voting on their own review
      if (review.reviewerId.toString() === userId) {
        throw new ForbiddenException('You cannot vote on your own review');
      }

      // Initialize votes array if needed
      if (!review.votes) {
        review.votes = [];
      }

      // Check if user has already voted
      const existingVoteIndex = review.votes.findIndex(
        (v) => v.userId.toString() === userId,
      );

      const userObjectId = new Types.ObjectId(userId);

      if (existingVoteIndex !== -1) {
        const existingVote = review.votes[existingVoteIndex];

        // If same vote, do nothing
        if (existingVote.vote === vote) {
          LoggingUtil.log(
            `User ${userId} already voted ${vote} on review ${reviewId}`,
            'ReviewVotingService',
          );

          return this.buildVotingResponse(review, userId);
        }

        // Update vote counts for old vote
        if (existingVote.vote === 'helpful') {
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
          review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
        }

        // Update the vote
        review.votes[existingVoteIndex] = {
          userId: userObjectId,
          vote,
          votedAt: DateUtils.now(),
        };
      } else {
        // Add new vote
        review.votes.push({
          userId: userObjectId,
          vote,
          votedAt: DateUtils.now(),
        });
      }

      // Update vote counts for new vote
      if (vote === 'helpful') {
        review.helpfulCount += 1;
      } else {
        review.notHelpfulCount += 1;
      }

      // Update helpfulness score
      review.helpfulnessScore = review.helpfulCount - review.notHelpfulCount;
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `User ${userId} voted ${vote} on review ${reviewId}`,
        'ReviewVotingService',
      );

      return this.buildVotingResponse(review, userId);
    } catch (error) {
      LoggingUtil.errorWithException(`Error casting vote:`, error, 'ReviewVotingService');
      throw error;
    }
  }

  /**
   * Remove a vote from a review
   */
  async removeVote(reviewId: string, userId: string): Promise<ReviewVotingDataDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewVotingService',
      });

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      if (!review.votes || review.votes.length === 0) {
        throw new BadRequestException('No votes to remove');
      }

      // Find user's vote
      const voteIndex = review.votes.findIndex((v) => v.userId.toString() === userId);

      if (voteIndex === -1) {
        throw new BadRequestException('You have not voted on this review');
      }

      const vote = review.votes[voteIndex];

      // Update vote counts
      if (vote.vote === 'helpful') {
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        review.notHelpfulCount = Math.max(0, review.notHelpfulCount - 1);
      }

      // Remove vote
      review.votes.splice(voteIndex, 1);

      // Update helpfulness score
      review.helpfulnessScore = review.helpfulCount - review.notHelpfulCount;
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `User ${userId} removed vote from review ${reviewId}`,
        'ReviewVotingService',
      );

      return this.buildVotingResponse(review, userId);
    } catch (error) {
      LoggingUtil.errorWithException(`Error removing vote:`, error, 'ReviewVotingService');
      throw error;
    }
  }

  /**
   * Get voting information for a review
   */
  async getVotingInfo(reviewId: string, userId?: string): Promise<ReviewVotingDataDto> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewVotingService',
    });

    const review = await this.reviewModel
      .findById(reviewId)
      .select('votes helpfulCount notHelpfulCount helpfulnessScore')
      .exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    return this.buildVotingResponse(review, userId);
  }

  /**
   * Get user's vote on a review
   */
  async getUserVote(reviewId: string, userId: string): Promise<'helpful' | 'not_helpful' | null> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewVotingService',
    });

    const review = await this.reviewModel
      .findById(reviewId)
      .select('votes')
      .lean()
      .exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    const userVote = review.votes?.find((v) => v.userId.toString() === userId);
    return userVote?.vote || null;
  }

  /**
   * Get most helpful reviews for a property
   */
  async getMostHelpfulReviews(propertyId: string, limit: number = 10): Promise<ReviewDocument[]> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewVotingService',
    });

    return this.reviewModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        isApproved: true,
        isHidden: { $ne: true },
      })
      .populate('reviewer', 'firstName lastName avatarUrl')
      .sort({ helpfulnessScore: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get voting statistics for a property
   */
  async getPropertyVotingStats(propertyId: string): Promise<{
    totalVotes: number;
    totalHelpful: number;
    totalNotHelpful: number;
    averageHelpfulnessScore: number;
  }> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewVotingService',
    });

    const reviews = await this.reviewModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        isApproved: true,
        isHidden: { $ne: true },
      })
      .select('helpfulCount notHelpfulCount helpfulnessScore')
      .lean()
      .exec();

    const totalHelpful = reviews.reduce((sum, review) => sum + (review.helpfulCount || 0), 0);
    const totalNotHelpful = reviews.reduce(
      (sum, review) => sum + (review.notHelpfulCount || 0),
      0,
    );
    const totalVotes = totalHelpful + totalNotHelpful;

    const averageHelpfulnessScore =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + (review.helpfulnessScore || 0), 0) /
          reviews.length
        : 0;

    return {
      totalVotes,
      totalHelpful,
      totalNotHelpful,
      averageHelpfulnessScore: Math.round(averageHelpfulnessScore * 10) / 10,
    };
  }

  /**
   * Private helper methods
   */
  private buildVotingResponse(
    review: ReviewDocument | { votes?: VoteDto[]; helpfulCount?: number; notHelpfulCount?: number; helpfulnessScore?: number; _id?: Types.ObjectId },
    userId?: string,
  ): ReviewVotingDataDto {
    let userVote: 'helpful' | 'not_helpful' | null = null;

    if (userId && review.votes) {
      const vote = review.votes.find((v) => v.userId.toString() === userId);
      userVote = vote?.vote || null;
    }

    return {
      reviewId: review._id?.toString() || '',
      userVote,
      helpfulCount: review.helpfulCount || 0,
      notHelpfulCount: review.notHelpfulCount || 0,
      helpfulnessScore: review.helpfulnessScore || 0,
    };
  }
}
