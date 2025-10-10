import { Injectable, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewType } from '../../../common/enums/property.enums';
import { ReviewCoreService } from './review-core.service';
import { ReviewAdminService } from './review-admin.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewTableFilterDto } from '../dto/review-filters.dto';
import { UserRole } from '../../../database/schemas/user.schema';
import { ReviewDocument } from '../../../database/schemas/review.schema';
import { PropertiesFacadeService } from '../../properties/services/properties-facade.service';
import { NotificationHelperService } from '../../notifications/helpers/notification-helper.service';
import {
  PaginatedReviewResult,
  ReviewAverages,
  LeanPopulatedReview,
  LeanPopulatedAdminReview,
} from '../types/review.types';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Review Facade Service
 * Coordinates all review operations and provides unified interface
 */
@Injectable()
export class ReviewFacadeService {
  constructor(
    private readonly reviewCoreService: ReviewCoreService,
    private readonly reviewAdminService: ReviewAdminService,
    private readonly propertiesFacadeService: PropertiesFacadeService,
    private readonly notificationHelperService: NotificationHelperService,
  ) {}

  /**
   * Create a review with business logic coordination
   */
  async createReview(dto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument> {
    try {
      // Create review using core service
      const review = await this.reviewCoreService.createReview(dto, reviewerId);

      // Update property rating if guest-to-host review
      if (dto.reviewType === ReviewType.GUEST_TO_HOST) {
        await this.propertiesFacadeService.updateRating(dto.propertyId);
      }

      // Send notification asynchronously
      this.sendReviewNotification(review).catch((error) =>
        LoggingUtil.errorWithException(
          'Failed to send review notification:',
          error,
          'ReviewFacadeService',
        ),
      );

      return review;
    } catch (error) {
      LoggingUtil.errorWithException('Error in createReview facade:', error, 'ReviewFacadeService');
      throw error;
    }
  }

  /**
   * Get review by ID with access control
   */
  async getReviewById(
    reviewId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<ReviewDocument> {
    const review = await this.reviewCoreService.findById(reviewId, true);

    // Validate access permissions
    this.validateReviewAccess(review, userId, userRole);

    return review;
  }

  /**
   * Update review with ownership validation
   */
  async updateReview(
    reviewId: string,
    updateDto: UpdateReviewDto,
    userId: string,
    userRole: UserRole,
  ): Promise<ReviewDocument> {
    // Admin can update any review, users can only update their own
    if (userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM_ADMIN) {
      // For admin updates, we might want different logic
      throw new Error('Admin review updates not yet implemented');
    }

    const updatedReview = await this.reviewCoreService.updateByOwner(reviewId, updateDto, userId);

    // Update property rating if this was a guest-to-host review
    if (updatedReview.reviewType === ReviewType.GUEST_TO_HOST) {
      await this.propertiesFacadeService.updateRating(updatedReview.propertyId.toString());
    }

    return updatedReview;
  }

  /**
   * Delete review with authorization
   */
  async deleteReview(reviewId: string, userId: string, userRole: UserRole): Promise<void> {
    if (userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM_ADMIN) {
      await this.reviewAdminService.deleteReviewByAdmin(reviewId, userId);
    } else {
      // Verify ownership before deletion
      const review = await this.reviewCoreService.findById(reviewId, false);
      if (review.reviewerId.toString() !== userId) {
        throw new ForbiddenException('You can only delete your own reviews');
      }

      await this.reviewCoreService.deleteByOwner(reviewId, userId);

      // Update property rating if this was a guest-to-host review
      if (review.reviewType === ReviewType.GUEST_TO_HOST) {
        await this.propertiesFacadeService.updateRating(review.propertyId.toString());
      }
    }
  }

  /**
   * Get property reviews with averages
   */
  async getPropertyReviews(
    propertyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview> & { averages: ReviewAverages }> {
    const [reviewsData, averages] = await Promise.all([
      this.reviewCoreService.findByPropertyId(propertyId, page, limit, true),
      this.reviewCoreService.calculatePropertyAverages(propertyId),
    ]);

    return {
      ...reviewsData,
      averages,
    };
  }

  /**
   * Get user's reviews (as reviewer) - reviews they've written
   */
  async getUserReviewsAsReviewer(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview>> {
    return this.reviewCoreService.findByReviewerId(userId, page, limit, false);
  }

  /**
   * Get user's reviews (as reviewee) - reviews they've received
   */
  async getUserReviewsAsReviewee(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview>> {
    return this.reviewCoreService.findByRevieweeId(userId, page, limit, false);
  }

  /**
   * Get all reviews for admin with filters
   */
  async getAdminReviews(
    filters: ReviewTableFilterDto,
  ): Promise<PaginatedReviewResult<LeanPopulatedAdminReview>> {
    return this.reviewAdminService.findAllWithFilters(filters);
  }

  /**
   * Get flagged reviews for moderation
   */
  async getFlaggedReviews(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewResult<LeanPopulatedAdminReview>> {
    return this.reviewAdminService.findFlaggedReviews(page, limit);
  }

  /**
   * Moderate review (admin only)
   */
  async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show',
    adminId: string,
    userRole: UserRole,
    reason?: string,
  ): Promise<ReviewDocument> {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only admins can moderate reviews');
    }

    const moderatedReview = await this.reviewAdminService.moderateReview(
      reviewId,
      action,
      adminId,
      reason,
    );

    // If review was approved/rejected and it's a property review, update property rating
    if (
      (action === 'approve' || action === 'reject') &&
      moderatedReview.reviewType === ReviewType.GUEST_TO_HOST
    ) {
      await this.propertiesFacadeService.updateRating(moderatedReview.propertyId.toString());
    }

    return moderatedReview;
  }

  /**
   * Get review statistics (admin only)
   */
  async getReviewStatistics(filters?: { from?: string; to?: string }) {
    return this.reviewAdminService.getReviewStatistics(filters);
  }

  /**
   * Bulk moderate reviews (admin only)
   */
  async bulkModerateReviews(
    reviewIds: string[],
    action: 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show',
    adminId: string,
    userRole: UserRole,
    reason?: string,
  ) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Only admins can bulk moderate reviews');
    }

    const result = await this.reviewAdminService.bulkModerateReviews(
      reviewIds,
      action,
      adminId,
      reason,
    );

    // Update property ratings for any guest-to-host reviews that were affected
    // This is a simplified approach - in production you might want to batch these updates
    if (action === 'approve' || action === 'reject') {
      const affectedPropertyIds = new Set<string>();

      for (const reviewId of reviewIds) {
        try {
          const review = await this.reviewCoreService.findById(reviewId, false);
          if (review.reviewType === ReviewType.GUEST_TO_HOST) {
            affectedPropertyIds.add(review.propertyId.toString());
          }
        } catch (error) {
          LoggingUtil.warn(
            `Could not update rating for review ${reviewId}: ${(error as Error).message}`,
            'ReviewFacadeService',
          );
        }
      }

      // Update ratings for all affected properties
      for (const propertyId of affectedPropertyIds) {
        try {
          await this.propertiesFacadeService.updateRating(propertyId);
        } catch (error) {
          LoggingUtil.errorWithException(
            `Failed to update rating for property ${propertyId}:`,
            error,
            'ReviewFacadeService',
          );
        }
      }
    }

    return result;
  }

  /**
   * Private helper methods
   */
  private validateReviewAccess(review: ReviewDocument, userId: string, userRole: UserRole): void {
    // Admin has access to everything
    if (userRole === UserRole.ADMIN || userRole === UserRole.SYSTEM_ADMIN) {
      return;
    }

    const userObjectId = new Types.ObjectId(userId);
    const isReviewer = review.reviewerId.equals(userObjectId);
    const isReviewee = review.revieweeId.equals(userObjectId);

    if (!isReviewer && !isReviewee) {
      // For public reviews, allow access if review is approved and not hidden
      if (review.isApproved && !review.isHidden) {
        return;
      }
      throw new ForbiddenException('Access denied to view this review');
    }
  }

  private async sendReviewNotification(review: ReviewDocument): Promise<void> {
    try {
      // Get property and reviewer details for notification
      const reviewId =
        review._id instanceof Types.ObjectId ? review._id.toString() : String(review._id);

      const populatedReview = await this.reviewCoreService.findById(reviewId, true);

      if (populatedReview.property && populatedReview.reviewer) {
        await this.notificationHelperService.sendReviewReceivedNotification(
          populatedReview,
          populatedReview.property,
          populatedReview.reviewer,
        );
      } else {
        LoggingUtil.warn(
          'Review not properly populated - cannot send notification',
          'ReviewFacadeService',
        );
      }
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error sending review notification:',
        error,
        'ReviewFacadeService',
      );
    }
  }
}
