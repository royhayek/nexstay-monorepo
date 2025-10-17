import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { Booking, BookingDocument } from '../../../database/schemas/booking.schema';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from '../../../database/schemas/payment-transaction.schema';
import { VerificationDto, ReviewVerificationDataDto } from '../dto/review-enhancements.dto';
import { ReviewNotFoundException } from '../exceptions/review.exceptions';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { PaymentTransactionStatus } from '../../../common/enums/payment.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Review Verification Service
 * Handles verified stay badge logic for reviews
 */
@Injectable()
export class ReviewVerificationService {
  private readonly REVIEW_WINDOW_DAYS = 14; // Reviews must be created within 14 days of checkout

  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(PaymentTransaction.name)
    private readonly paymentTransactionModel: Model<PaymentTransactionDocument>,
  ) {}

  /**
   * Verify a review automatically based on booking and payment data
   */
  async autoVerifyReview(reviewId: string): Promise<ReviewVerificationDataDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewVerificationService',
      });

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      // Get booking details
      const booking = await this.bookingModel.findById(review.bookingId).exec();

      if (!booking) {
        LoggingUtil.log(
          `Cannot verify review ${reviewId}: Booking not found`,
          'ReviewVerificationService',
        );
        return this.buildVerificationResponse(review);
      }

      // Perform verification checks
      const bookingVerified = await this.verifyBooking(booking);
      const paymentVerified = await this.verifyPayment(booking._id as Types.ObjectId);
      const stayCompleted = await this.verifyStayCompleted(booking);
      const withinReviewWindow = this.verifyReviewWindow(booking.checkOut, review.createdAt);

      const isVerified =
        bookingVerified && paymentVerified && stayCompleted && withinReviewWindow;

      // Update review with verification status
      review.isVerifiedStay = isVerified;
      review.verification = {
        bookingVerified,
        paymentVerified,
        stayCompleted,
        verifiedAt: DateUtils.now(),
        verificationMethod: 'auto',
      };
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `Auto-verified review ${reviewId}: ${isVerified ? 'VERIFIED' : 'NOT VERIFIED'}`,
        'ReviewVerificationService',
      );

      return this.buildVerificationResponse(review);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error auto-verifying review:`,
        error,
        'ReviewVerificationService',
      );
      throw error;
    }
  }

  /**
   * Manually verify or unverify a review (admin only)
   */
  async manualVerifyReview(
    reviewId: string,
    isVerified: boolean,
    adminId: string,
    reason?: string,
  ): Promise<ReviewVerificationDataDto> {
    try {
      ValidationUtils.validateObjectId(reviewId, 'reviewId', {
        context: 'ReviewVerificationService',
      });

      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review) {
        throw new ReviewNotFoundException(reviewId);
      }

      // Update review with manual verification
      review.isVerifiedStay = isVerified;
      review.verification = {
        bookingVerified: isVerified,
        paymentVerified: isVerified,
        stayCompleted: isVerified,
        verifiedAt: DateUtils.now(),
        verificationMethod: 'manual',
      };

      // Add moderation info if unverifying
      if (!isVerified) {
        review.moderatedBy = new Types.ObjectId(adminId);
        review.moderatedAt = DateUtils.now();
        review.moderationReason = reason || 'Manual verification review';
      }

      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `Manually ${isVerified ? 'verified' : 'unverified'} review ${reviewId} by admin ${adminId}`,
        'ReviewVerificationService',
      );

      return this.buildVerificationResponse(review);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error manually verifying review:`,
        error,
        'ReviewVerificationService',
      );
      throw error;
    }
  }

  /**
   * Get verification status for a review
   */
  async getVerificationStatus(reviewId: string): Promise<ReviewVerificationDataDto> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewVerificationService',
    });

    const review = await this.reviewModel
      .findById(reviewId)
      .select('isVerifiedStay verification')
      .exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    return this.buildVerificationResponse(review);
  }

  /**
   * Get all verified reviews for a property
   */
  async getVerifiedReviews(propertyId: string, limit: number = 20): Promise<ReviewDocument[]> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewVerificationService',
    });

    return this.reviewModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        isVerifiedStay: true,
        isApproved: true,
        isHidden: { $ne: true },
      })
      .populate('reviewer', 'firstName lastName avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get verification statistics for a property
   */
  async getPropertyVerificationStats(propertyId: string): Promise<{
    totalReviews: number;
    verifiedReviews: number;
    verificationRate: number;
  }> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'ReviewVerificationService',
    });

    const [totalReviews, verifiedReviews] = await Promise.all([
      this.reviewModel.countDocuments({
        propertyId: new Types.ObjectId(propertyId),
        isApproved: true,
        isHidden: { $ne: true },
      }),
      this.reviewModel.countDocuments({
        propertyId: new Types.ObjectId(propertyId),
        isVerifiedStay: true,
        isApproved: true,
        isHidden: { $ne: true },
      }),
    ]);

    const verificationRate = totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0;

    return {
      totalReviews,
      verifiedReviews,
      verificationRate: Math.round(verificationRate * 10) / 10,
    };
  }

  /**
   * Private helper methods
   */

  /**
   * Verify booking exists and is valid
   */
  private async verifyBooking(booking: BookingDocument): Promise<boolean> {
    if (!booking) {
      return false;
    }

    // Booking must be checked out
    if (booking.status !== BookingStatus.CHECKED_OUT) {
      return false;
    }

    // Check-out date must be in the past
    const checkOutDate = new Date(booking.checkOut);
    const now = DateUtils.now();

    if (checkOutDate > now) {
      return false;
    }

    return true;
  }

  /**
   * Verify payment was successful
   */
  private async verifyPayment(bookingId: Types.ObjectId): Promise<boolean> {
    const payment = await this.paymentTransactionModel
      .findOne({
        bookingId,
        status: PaymentTransactionStatus.SUCCESS,
      })
      .exec();

    return !!payment;
  }

  /**
   * Verify stay was completed
   */
  private async verifyStayCompleted(booking: BookingDocument): Promise<boolean> {
    // Stay is completed if checkout date has passed
    const checkOutDate = new Date(booking.checkOut);
    const now = DateUtils.now();

    return checkOutDate <= now;
  }

  /**
   * Verify review was created within acceptable window
   */
  private verifyReviewWindow(checkOutDate: Date, reviewCreatedAt: Date): boolean {
    const checkOut = new Date(checkOutDate);
    const reviewDate = new Date(reviewCreatedAt);

    const daysDifference = Math.floor(
      (reviewDate.getTime() - checkOut.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Review must be created after checkout but within window
    return daysDifference >= 0 && daysDifference <= this.REVIEW_WINDOW_DAYS;
  }

  /**
   * Build verification response DTO
   */
  private buildVerificationResponse(
    review: ReviewDocument | { isVerifiedStay?: boolean; verification?: VerificationDto; _id?: Types.ObjectId },
  ): ReviewVerificationDataDto {
    const defaultVerification: VerificationDto = {
      bookingVerified: false,
      paymentVerified: false,
      stayCompleted: false,
      verifiedAt: DateUtils.now(),
      verificationMethod: 'auto',
    };

    return {
      reviewId: review._id?.toString() || '',
      isVerifiedStay: review.isVerifiedStay || false,
      verification: review.verification || defaultVerification,
    };
  }
}
