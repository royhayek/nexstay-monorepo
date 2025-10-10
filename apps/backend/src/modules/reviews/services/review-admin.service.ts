import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { ReviewTableFilterDto } from '../dto/review-filters.dto';
import { REVIEW_MODERATION_ACTIONS, REVIEW_QUERY_LIMITS } from '../constants/review.constants';
import {
  ReviewNotFoundException,
  InvalidModerationActionException,
  ReviewModerationException,
} from '../exceptions/review.exceptions';
import {
  ReviewUpdateData,
  AggregationResult,
  LeanPopulatedAdminReview,
  PaginatedReviewResult,
} from '../types/review.types';
import { FilterQuery } from 'mongoose';
import { QueryBuilder, buildSortQuery } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * Review Admin Service
 * Handles administrative operations for reviews
 */
@Injectable()
export class ReviewAdminService {
  constructor(@InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>) {}

  /**
   * Find all reviews with advanced filtering for admin
   */
  async findAllWithFilters(
    filters: ReviewTableFilterDto,
  ): Promise<PaginatedReviewResult<LeanPopulatedAdminReview>> {
    const {
      page = 1,
      limit = REVIEW_QUERY_LIMITS.DEFAULT_PAGE_SIZE,
      search,
      propertyId,
      reviewerId,
      revieweeId,
      minRating,
      maxRating,
      flagged,
      verified,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      sortDirection = SortDirectionEnum.DESC,
    } = filters;

    // Validate pagination parameters
    const pagination = validatePagination({
      page,
      limit,
      maxLimit: REVIEW_QUERY_LIMITS.MAX_ADMIN_PAGE_SIZE,
    });

    // Build query using QueryBuilder utility
    const query = QueryBuilder.create()
      .addObjectIdFilters({
        propertyId,
        reviewerId,
        revieweeId,
      })
      .addNumberRangeFilter('overallRating', minRating, maxRating)
      .addBooleanFilter('isFlagged', flagged)
      .addBooleanFilter('isApproved', verified)
      .addDateRangeFilter('createdAt', createdFrom, createdTo)
      .addSearchFilter(search, {
        fields: ['publicReview', 'privateFeedback', 'moderationReason'],
        caseSensitive: false,
      })
      .build();

    // Build sort object with allowed fields validation
    const allowedSortFields = ['createdAt', 'overallRating', 'updatedAt'];
    const sort = buildSortQuery(sortBy, sortDirection, allowedSortFields, 'createdAt');

    try {
      const [reviews, total] = await Promise.all([
        this.reviewModel
          .find(query)
          .populate('reviewer', 'firstName lastName email avatarUrl')
          .populate('reviewee', 'firstName lastName email avatarUrl')
          .populate('property', 'name images address')
          .populate('booking', 'confirmationCode checkIn checkOut')
          .sort(sort)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean()
          .exec(),
        this.reviewModel.countDocuments(query).exec(),
      ]);

      // Use database utility to build paginated result
      const result = buildPaginatedResult(reviews, total, pagination.page, pagination.limit);

      return {
        items: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Error in findAllWithFilters:', error, 'ReviewAdminService');
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Find flagged reviews for moderation
   */
  async findFlaggedReviews(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewResult<LeanPopulatedAdminReview>> {
    // Validate pagination parameters
    const pagination = validatePagination({
      page,
      limit,
      maxLimit: REVIEW_QUERY_LIMITS.MAX_ADMIN_PAGE_SIZE,
    });

    // Build query using QueryBuilder
    const query = QueryBuilder.create()
      .addBooleanFilter('isFlagged', true)
      .addCustomFilter('isHidden', { $ne: true })
      .build();

    try {
      const [reviews, total] = await Promise.all([
        this.reviewModel
          .find(query)
          .populate('reviewer', 'firstName lastName email avatarUrl')
          .populate('reviewee', 'firstName lastName email avatarUrl')
          .populate('property', 'name images address')
          .populate('booking', 'confirmationCode checkIn checkOut')
          .sort({ createdAt: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean()
          .exec(),
        this.reviewModel.countDocuments(query).exec(),
      ]);

      // Use database utility to build paginated result
      const result = buildPaginatedResult(reviews, total, pagination.page, pagination.limit);

      return {
        items: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Error in findFlaggedReviews:', error, 'ReviewAdminService');
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Moderate a review (approve, reject, flag, etc.)
   */
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show',
    adminId: string,
    reason?: string,
  ): Promise<ReviewDocument> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewAdminService',
      customMessage: 'Invalid review ID format',
    });

    if (!Object.values(REVIEW_MODERATION_ACTIONS).includes(action)) {
      throw new InvalidModerationActionException(action);
    }

    const review = await this.reviewModel.findById(reviewId).exec();
    ValidationUtils.validateEntityExists(review, reviewId, {
      entityName: 'Review',
      context: 'ReviewAdminService',
    });

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    try {
      // Apply moderation action
      const updateData: ReviewUpdateData = {
        moderatedBy: new Types.ObjectId(adminId),
        moderatedAt: DateUtils.parseDate(Date.now()),
        moderationReason: reason,
        updatedAt: DateUtils.parseDate(Date.now()),
      };

      switch (action) {
        case REVIEW_MODERATION_ACTIONS.APPROVE:
          updateData.isApproved = true;
          updateData.isFlagged = false;
          updateData.isHidden = false;
          break;

        case REVIEW_MODERATION_ACTIONS.REJECT:
          updateData.isApproved = false;
          updateData.isFlagged = false;
          updateData.isHidden = true;
          break;

        case REVIEW_MODERATION_ACTIONS.FLAG:
          updateData.isFlagged = true;
          updateData.isApproved = false;
          break;

        case REVIEW_MODERATION_ACTIONS.UNFLAG:
          updateData.isFlagged = false;
          updateData.isApproved = true;
          break;

        case REVIEW_MODERATION_ACTIONS.HIDE:
          updateData.isHidden = true;
          break;

        case REVIEW_MODERATION_ACTIONS.SHOW:
          updateData.isHidden = false;
          break;

        default:
          throw new InvalidModerationActionException(action);
      }

      const updatedReview = await this.reviewModel
        .findByIdAndUpdate(reviewId, updateData, { new: true, runValidators: true })
        .exec();

      ValidationUtils.validateEntityExists(updatedReview, reviewId, {
        entityName: 'Review',
        context: 'ReviewAdminService',
      });

      if (!updatedReview) {
        throw new ReviewNotFoundException(reviewId);
      }

      LoggingUtil.log(`Review ${reviewId} ${action}ed by admin ${adminId}`, 'ReviewAdminService');

      return updatedReview;
    } catch (error) {
      if (
        error instanceof ReviewNotFoundException ||
        error instanceof InvalidModerationActionException
      ) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error moderating review ${reviewId}:`,
        error,
        'ReviewAdminService',
      );
      throw new ReviewModerationException(
        `Failed to moderate review: ${(error as Error).message}`,
        reviewId,
      );
    }
  }

  /**
   * Get review statistics for admin dashboard
   */
  async getReviewStatistics(filters?: { from?: string; to?: string }) {
    try {
      // Build base query using QueryBuilder
      const queryBuilder = QueryBuilder.create();

      if (filters?.from || filters?.to) {
        queryBuilder.addDateRangeFilter('createdAt', filters.from, filters.to);
      }

      const baseQuery = queryBuilder.build();

      // Build specific queries for different counts
      const flaggedQueryBuilder = QueryBuilder.create();
      if (filters?.from || filters?.to) {
        flaggedQueryBuilder.addDateRangeFilter('createdAt', filters.from, filters.to);
      }
      flaggedQueryBuilder.addBooleanFilter('isFlagged', true);
      const flaggedQuery = flaggedQueryBuilder.build();

      const pendingApprovalQueryBuilder = QueryBuilder.create();
      if (filters?.from || filters?.to) {
        pendingApprovalQueryBuilder.addDateRangeFilter('createdAt', filters.from, filters.to);
      }
      pendingApprovalQueryBuilder
        .addBooleanFilter('isApproved', false)
        .addBooleanFilter('isFlagged', false);
      const pendingApprovalQuery = pendingApprovalQueryBuilder.build();

      const [totalReviews, flaggedCount, pendingApprovalCount, averageRating, ratingDistribution] =
        await Promise.all([
          this.reviewModel.countDocuments(baseQuery),
          this.reviewModel.countDocuments(flaggedQuery),
          this.reviewModel.countDocuments(pendingApprovalQuery),
          this.calculateAverageRating(baseQuery),
          this.calculateRatingDistribution(baseQuery),
        ]);

      return {
        totalReviews,
        flaggedCount,
        pendingApprovalCount,
        averageRating,
        ratingDistribution,
      };
    } catch (error) {
      LoggingUtil.errorWithException('Error in getReviewStatistics:', error, 'ReviewAdminService');
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Bulk moderate reviews
   */
  async bulkModerateReviews(
    reviewIds: string[],
    action: 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show',
    adminId: string,
    reason?: string,
  ): Promise<{ processed: number; errors: string[] }> {
    const validIds: string[] = [];
    const errors: string[] = [];
    let processed = 0;

    // Validate all IDs first
    for (const id of reviewIds) {
      try {
        ValidationUtils.validateObjectId(id, 'reviewId', {
          context: 'ReviewAdminService',
        });
        validIds.push(id);
      } catch (error) {
        LoggingUtil.errorWithException(
          `Invalid reviewId skipped: ${id}`,
          error,
          'ReviewAdminService',
        );
        errors.push(`${id}: Invalid ID format`);
      }
    }

    for (const id of validIds) {
      try {
        await this.moderateReview(id, action, adminId, reason);
        processed++;
      } catch (error) {
        errors.push(`${id}: ${(error as Error).message}`);
        LoggingUtil.errorWithException(
          `Error in bulk moderation for review ${id}:`,
          error,
          'ReviewAdminService',
        );
      }
    }

    LoggingUtil.log(
      `Bulk moderation completed: ${processed} processed, ${errors.length} errors`,
      'ReviewAdminService',
    );

    return { processed, errors };
  }

  /**
   * Delete review by admin (hard delete)
   */
  async deleteReviewByAdmin(reviewId: string, adminId: string): Promise<void> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewAdminService',
      customMessage: 'Invalid review ID format',
    });

    const result = await this.reviewModel.deleteOne({ _id: reviewId }).exec();

    if (result.deletedCount === 0) {
      throw new ReviewNotFoundException(reviewId);
    }

    LoggingUtil.log(`Review ${reviewId} deleted by admin ${adminId}`, 'ReviewAdminService');
  }

  /**
   * Private helper methods
   */
  private mapSortField(sortBy: string): string {
    const fieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      rating: 'overallRating',
      helpful: 'helpfulCount',
    };
    return fieldMap[sortBy] || 'createdAt';
  }

  private async calculateAverageRating(query: FilterQuery<ReviewDocument>): Promise<number> {
    const result = await this.reviewModel
      .aggregate<AggregationResult>([
        { $match: { ...query, overallRating: { $exists: true, $ne: null } } },
        { $group: { _id: null, averageRating: { $avg: '$overallRating' } } },
      ])
      .exec();

    return result.length > 0 && result[0].averageRating
      ? Math.round(result[0].averageRating * 10) / 10
      : 0;
  }

  private async calculateRatingDistribution(
    query: FilterQuery<ReviewDocument>,
  ): Promise<Record<number, number>> {
    const result = await this.reviewModel
      .aggregate<AggregationResult>([
        { $match: { ...query, overallRating: { $exists: true, $ne: null } } },
        { $group: { _id: { $floor: '$overallRating' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .exec();

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    result.forEach((item) => {
      if (item._id !== null && item.count) {
        const rating = Math.max(1, Math.min(5, item._id));
        distribution[rating] = item.count;
      }
    });

    return distribution;
  }
}
