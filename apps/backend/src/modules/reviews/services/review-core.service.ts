import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../../common/utils/database.utils';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { ReviewType } from '../../../common/enums/property.enums';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { ReviewValidationUtils } from '../utils/review-validation.utils';
import { REVIEW_MESSAGES } from '../constants/review.constants';
import {
  ReviewNotFoundException,
  ReviewAlreadyExistsException,
  BookingNotReviewableException,
  ReviewValidationException,
} from '../exceptions/review.exceptions';
import {
  ReviewRatings,
  PaginatedReviewResult,
  PopulatedReviewDocument,
  LeanPopulatedReview,
} from '../types/review.types';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';
import { ReviewVerificationService } from './review-verification.service';
import { ReviewSentimentService } from './review-sentiment.service';

/**
 * Review Core Service
 * Handles CRUD operations and basic business logic for reviews
 */
@Injectable()
export class ReviewCoreService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Property.name) private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly reviewVerificationService: ReviewVerificationService,
    private readonly reviewSentimentService: ReviewSentimentService,
  ) {}

  /**
   * Create a new review with full validation
   */
  async createReview(dto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument> {
    try {
      // 1. Validate booking exists and get details
      const booking = await this.validateAndGetBooking(dto.bookingId);

      // 2. Validate property exists and matches booking
      await this.validateAndGetProperty(dto.propertyId);
      ReviewValidationUtils.validatePropertyConsistency(
        booking.propertyId.toString(),
        dto.propertyId,
      );

      // 3. Validate review permissions
      ReviewValidationUtils.validateReviewPermission(
        booking.guestId.toString(),
        booking.hostId.toString(),
        reviewerId,
        dto.reviewType,
      );

      // 4. Validate booking is reviewable
      ReviewValidationUtils.validateBookingStatus(booking.status, BookingStatus.CHECKED_OUT);
      ReviewValidationUtils.validateReviewDeadline(booking.checkOut);

      // 5. Check for existing review
      await this.validateNoExistingReview(dto.bookingId, reviewerId, dto.reviewType);

      // 6. Validate reviewee ID consistency
      const expectedRevieweeId = ReviewValidationUtils.getExpectedRevieweeId(
        booking.guestId.toString(),
        booking.hostId.toString(),
        reviewerId,
      );
      ReviewValidationUtils.validateRevieweeConsistency(expectedRevieweeId, dto.revieweeId);

      // 7. Validate content and ratings
      ReviewValidationUtils.validatePublicReview(dto.publicReview);
      ReviewValidationUtils.validatePrivateFeedback(dto.privateFeedback);

      const ratings = {
        overallRating: dto.overallRating,
        accuracy: dto.accuracy,
        communication: dto.communication,
        cleanliness: dto.cleanliness,
        location: dto.location,
        checkIn: dto.checkIn,
        value: dto.value,
      };
      ReviewValidationUtils.validateRatings(ratings);

      // 8. Calculate overall rating if not provided (for guest-to-host reviews)
      let overallRating = dto.overallRating;
      if (!overallRating && dto.reviewType === ReviewType.GUEST_TO_HOST) {
        overallRating = ReviewValidationUtils.calculateOverallRating({
          accuracy: dto.accuracy,
          communication: dto.communication,
          cleanliness: dto.cleanliness,
          location: dto.location,
          checkIn: dto.checkIn,
          value: dto.value,
        });
      }

      // 9. Determine moderation status
      const isFlagged = ReviewValidationUtils.shouldAutoFlag(overallRating);
      const isApproved = ReviewValidationUtils.shouldAutoApprove(overallRating);

      // 10. Create review
      const review = new this.reviewModel({
        propertyId: new Types.ObjectId(dto.propertyId),
        bookingId: new Types.ObjectId(dto.bookingId),
        reviewerId: new Types.ObjectId(reviewerId),
        revieweeId: new Types.ObjectId(dto.revieweeId),
        reviewType: dto.reviewType,
        overallRating,
        accuracy: dto.accuracy,
        communication: dto.communication,
        cleanliness: dto.cleanliness,
        location: dto.location,
        checkIn: dto.checkIn,
        value: dto.value,
        publicReview: dto.publicReview.trim(),
        privateFeedback: dto.privateFeedback?.trim(),
        isFlagged,
        isApproved,
        isHidden: false,
      });

      const savedReview = await review.save();

      // 11. Update booking review flags
      await this.updateBookingReviewFlags(
        dto.bookingId,
        reviewerId,
        savedReview._id as Types.ObjectId,
      );

      // 12. Trigger automatic enhancements in background (non-blocking)
      // Note: In production, consider using a message queue (e.g., Bull, RabbitMQ) for better reliability
      this.triggerBackgroundEnhancements(String(savedReview._id));

      LoggingUtil.log(
        `Review created: ${String(savedReview._id)} for booking: ${dto.bookingId}`,
        'ReviewCoreService',
      );

      return savedReview;
    } catch (error) {
      LoggingUtil.errorWithException(`Error creating review:`, error, 'ReviewCoreService');
      throw error;
    }
  }

  /**
   * Find review by ID with optional population
   */
  async findById(id: string, populate: boolean = true): Promise<PopulatedReviewDocument> {
    ValidationUtils.validateObjectId(id, 'reviewId', {
      context: 'ReviewCoreService',
      customMessage: 'Invalid review ID format',
    });

    let query = this.reviewModel.findById(id);

    if (populate) {
      query = query
        .populate('reviewer', 'firstName lastName avatarUrl')
        .populate('reviewee', 'firstName lastName avatarUrl')
        .populate('property', 'name images');
    }

    const review = await query.exec();
    ValidationUtils.validateEntityExists(review, id, {
      entityName: 'Review',
      context: 'ReviewCoreService',
    });

    if (!review) {
      throw new ReviewNotFoundException(id);
    }

    return review;
  }

  /**
   * Update review by owner
   */
  async updateByOwner(
    id: string,
    updateDto: UpdateReviewDto,
    ownerId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findOne({
        _id: id,
        reviewerId: new Types.ObjectId(ownerId),
      })
      .exec();

    if (!review) {
      throw new ReviewNotFoundException(id);
    }

    // Validate updated content if provided
    if (updateDto.publicReview !== undefined) {
      ReviewValidationUtils.validatePublicReview(updateDto.publicReview);
    }
    if (updateDto.privateFeedback !== undefined) {
      ReviewValidationUtils.validatePrivateFeedback(updateDto.privateFeedback);
    }

    // Validate ratings if provided
    const ratings = {
      overallRating: updateDto.overallRating,
      accuracy: updateDto.accuracy,
      communication: updateDto.communication,
      cleanliness: updateDto.cleanliness,
      location: updateDto.location,
      checkIn: updateDto.checkIn,
      value: updateDto.value,
    };
    ReviewValidationUtils.validateRatings(ratings);

    // Apply updates
    Object.keys(updateDto).forEach((key) => {
      const updateKey = key as keyof UpdateReviewDto;
      if (updateDto[updateKey] !== undefined) {
        (review as unknown as Record<string, unknown>)[key] = updateDto[updateKey];
      }
    });

    // Recalculate overall rating for guest-to-host reviews if category ratings changed
    if (
      review.reviewType === ReviewType.GUEST_TO_HOST &&
      (updateDto.accuracy !== undefined ||
        updateDto.communication !== undefined ||
        updateDto.cleanliness !== undefined ||
        updateDto.location !== undefined ||
        updateDto.checkIn !== undefined ||
        updateDto.value !== undefined)
    ) {
      const newOverallRating = ReviewValidationUtils.calculateOverallRating({
        accuracy: review.accuracy,
        communication: review.communication,
        cleanliness: review.cleanliness,
        location: review.location,
        checkIn: review.checkIn,
        value: review.value,
      });
      if (newOverallRating !== undefined) {
        review.overallRating = newOverallRating;
      }
    }

    // Re-evaluate moderation status
    review.isFlagged = ReviewValidationUtils.shouldAutoFlag(review.overallRating);
    review.isApproved = ReviewValidationUtils.shouldAutoApprove(review.overallRating);
    review.updatedAt = DateUtils.now();

    const updatedReview = await review.save();
    LoggingUtil.log(`Review updated: ${id} by user: ${ownerId}`, 'ReviewCoreService');

    return updatedReview;
  }

  /**
   * Delete review by owner
   */
  async deleteByOwner(id: string, ownerId: string): Promise<void> {
    const result = await this.reviewModel
      .deleteOne({
        _id: id,
        reviewerId: new Types.ObjectId(ownerId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new ReviewNotFoundException(id);
    }

    LoggingUtil.log(`Review deleted: ${id} by user: ${ownerId}`, 'ReviewCoreService');
  }

  /**
   * Find reviews for a property with pagination
   */
  async findByPropertyId(
    propertyId: string,
    page: number = 1,
    limit: number = 20,
    onlyApproved: boolean = true,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview>> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewCoreService',
    });

    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addObjectIdFilter('propertyId', propertyId)
      .addEnumFilter('reviewType', ReviewType.GUEST_TO_HOST);

    if (onlyApproved) {
      queryBuilder.addBooleanFilter('isApproved', true).addCustomFilter('isHidden', { $ne: true });
    }

    const query = queryBuilder.build();

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .populate('reviewer', 'firstName lastName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(reviews, total, validPage, validLimit);

    return {
      items: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      limit: paginationResult.limit,
      totalPages: paginationResult.totalPages,
      hasNextPage: paginationResult.hasNextPage,
      hasPrevPage: paginationResult.hasPrevPage,
    };
  }

  /**
   * Calculate property review averages
   */
  async calculatePropertyAverages(propertyId: string) {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewCoreService',
    });

    const reviews = await this.reviewModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        reviewType: ReviewType.GUEST_TO_HOST,
        isApproved: true,
        isHidden: { $ne: true },
      })
      .select('overallRating accuracy communication cleanliness location checkIn value')
      .lean()
      .exec();

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        averageAccuracy: 0,
        averageCommunication: 0,
        averageCleanliness: 0,
        averageLocation: 0,
        averageCheckIn: 0,
        averageValue: 0,
      };
    }

    const averages = this.calculateAverages(reviews);
    return {
      totalReviews: reviews.length,
      ...averages,
    };
  }

  /**
   * Private helper methods
   */
  private async validateAndGetBooking(bookingId: string): Promise<BookingDocument> {
    ValidationUtils.validateObjectId(bookingId, 'bookingId', {
      context: 'ReviewCoreService',
      customMessage: 'Invalid booking ID format',
    });

    const booking = await this.bookingModel.findById(bookingId).exec();
    ValidationUtils.validateEntityExists(booking, bookingId, {
      entityName: 'Booking',
      context: 'ReviewCoreService',
    });

    if (!booking) {
      throw new BookingNotReviewableException(REVIEW_MESSAGES.BOOKING_NOT_FOUND);
    }

    return booking;
  }

  private async validateAndGetProperty(propertyId: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewCoreService',
      customMessage: 'Invalid property ID format',
    });

    const property = await this.propertyModel.findById(propertyId).exec();
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'ReviewCoreService',
    });

    if (!property) {
      throw new ReviewValidationException(REVIEW_MESSAGES.PROPERTY_NOT_FOUND, 'propertyId');
    }

    return property;
  }

  private async validateNoExistingReview(
    bookingId: string,
    reviewerId: string,
    reviewType: ReviewType,
  ): Promise<void> {
    const existingReview = await this.reviewModel
      .findOne({
        bookingId: new Types.ObjectId(bookingId),
        reviewerId: new Types.ObjectId(reviewerId),
        reviewType,
      })
      .exec();

    if (existingReview) {
      throw new ReviewAlreadyExistsException(bookingId, reviewType);
    }
  }

  private async updateBookingReviewFlags(
    bookingId: string,
    reviewerId: string,
    reviewId: Types.ObjectId,
  ): Promise<void> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) return;

    const isGuest = booking.guestId.toString() === reviewerId;
    const updateField = isGuest ? 'guestReviewed' : 'hostReviewed';
    const reviewIdField = isGuest ? 'guestReviewId' : 'hostReviewId';

    await this.bookingModel
      .findByIdAndUpdate(bookingId, {
        [updateField]: true,
        [reviewIdField]: reviewId,
      })
      .exec();
  }

  /**
   * Find reviews by reviewer (user's reviews they've written)
   */
  async findByReviewerId(
    reviewerId: string,
    page: number = 1,
    limit: number = 20,
    onlyApproved: boolean = false,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview>> {
    ValidationUtils.validateObjectId(reviewerId, 'reviewerId', {
      context: 'ReviewCoreService',
    });

    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create().addObjectIdFilter('reviewerId', reviewerId);

    if (onlyApproved) {
      queryBuilder.addBooleanFilter('isApproved', true).addCustomFilter('isHidden', { $ne: true });
    }

    const query = queryBuilder.build();

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .populate('reviewee', 'firstName lastName avatarUrl')
        .populate('property', 'name images address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(
      reviews as LeanPopulatedReview[],
      total,
      validPage,
      validLimit,
    );

    return {
      items: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      limit: paginationResult.limit,
      totalPages: paginationResult.totalPages,
      hasNextPage: paginationResult.hasNextPage,
      hasPrevPage: paginationResult.hasPrevPage,
    };
  }

  /**
   * Find reviews by reviewee (reviews received by user)
   */
  async findByRevieweeId(
    revieweeId: string,
    page: number = 1,
    limit: number = 20,
    onlyApproved: boolean = false,
  ): Promise<PaginatedReviewResult<LeanPopulatedReview>> {
    ValidationUtils.validateObjectId(revieweeId, 'revieweeId', {
      context: 'ReviewCoreService',
    });

    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create().addObjectIdFilter('revieweeId', revieweeId);

    if (onlyApproved) {
      queryBuilder.addBooleanFilter('isApproved', true).addCustomFilter('isHidden', { $ne: true });
    }

    const query = queryBuilder.build();

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .populate('reviewer', 'firstName lastName avatarUrl')
        .populate('property', 'name images address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(
      reviews as LeanPopulatedReview[],
      total,
      validPage,
      validLimit,
    );

    return {
      items: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      limit: paginationResult.limit,
      totalPages: paginationResult.totalPages,
      hasNextPage: paginationResult.hasNextPage,
      hasPrevPage: paginationResult.hasPrevPage,
    };
  }

  private calculateAverages(reviews: ReviewRatings[]): Record<string, number> {
    const fields = [
      'overallRating',
      'accuracy',
      'communication',
      'cleanliness',
      'location',
      'checkIn',
      'value',
    ] as const;

    const averages: Record<string, number> = {};

    fields.forEach((field) => {
      const validValues = reviews
        .map((review) => review[field])
        .filter((value): value is number => value !== undefined && value !== null);

      if (validValues.length > 0) {
        const sum = validValues.reduce((acc, val) => acc + val, 0);
        averages[`average${field.charAt(0).toUpperCase() + field.slice(1)}`] =
          Math.round((sum / validValues.length) * 10) / 10;
      } else {
        averages[`average${field.charAt(0).toUpperCase() + field.slice(1)}`] = 0;
      }
    });

    return averages;
  }

  /**
   * Trigger automatic enhancements in background (non-blocking)
   * This includes verification and sentiment analysis
   */
  private triggerBackgroundEnhancements(reviewId: string): void {
    // Run verification and sentiment analysis in parallel, non-blocking
    Promise.all([
      this.reviewVerificationService
        .autoVerifyReview(reviewId)
        .catch((error) => {
          LoggingUtil.errorWithException(
            `Background auto-verification failed for review ${reviewId}:`,
            error,
            'ReviewCoreService',
          );
        }),
      this.reviewSentimentService
        .analyzeSentiment(reviewId)
        .catch((error) => {
          LoggingUtil.errorWithException(
            `Background sentiment analysis failed for review ${reviewId}:`,
            error,
            'ReviewCoreService',
          );
        }),
    ])
      .then(() => {
        LoggingUtil.log(
          `Background enhancements completed for review ${reviewId}`,
          'ReviewCoreService',
        );
      })
      .catch((error) => {
        // This catch is for Promise.all rejection, though individual promises already have .catch()
        LoggingUtil.errorWithException(
          `Unexpected error in background enhancements for review ${reviewId}:`,
          error,
          'ReviewCoreService',
        );
      });
  }
}
