import { ReviewType } from '../../../common/enums/property.enums';
import {
  REVIEW_VALIDATION_CONSTANTS,
  REVIEW_BUSINESS_CONSTANTS,
} from '../constants/review.constants';
import {
  ReviewValidationException,
  BookingNotReviewableException,
  ReviewDeadlineExceededException,
  InvalidReviewPermissionException,
} from '../exceptions/review.exceptions';
import { DateUtils } from '../../../common/utils/date.utils';

export class ReviewValidationUtils {
  /**
   * Validate if user can create a review for the booking
   */
  static validateReviewPermission(
    bookingGuestId: string,
    bookingHostId: string,
    reviewerId: string,
    reviewType: ReviewType,
  ): void {
    const isGuest = bookingGuestId === reviewerId;
    const isHost = bookingHostId === reviewerId;

    if (!isGuest && !isHost) {
      throw new InvalidReviewPermissionException(
        'You can only review bookings you were involved in',
      );
    }

    // Validate review type matches reviewer role
    if (isGuest && reviewType !== ReviewType.GUEST_TO_HOST) {
      throw new ReviewValidationException(
        'Guests can only create guest-to-host reviews',
        'reviewType',
      );
    }

    if (isHost && reviewType !== ReviewType.HOST_TO_GUEST) {
      throw new ReviewValidationException(
        'Hosts can only create host-to-guest reviews',
        'reviewType',
      );
    }
  }

  /**
   * Validate review deadline
   */
  static validateReviewDeadline(checkOutDate: Date): void {
    const deadline = DateUtils.addDays(
      checkOutDate,
      REVIEW_BUSINESS_CONSTANTS.REVIEW_DEADLINE_DAYS,
    );

    if (DateUtils.isPast(deadline)) {
      throw new ReviewDeadlineExceededException(REVIEW_BUSINESS_CONSTANTS.REVIEW_DEADLINE_DAYS);
    }
  }

  /**
   * Validate review ratings
   */
  static validateRatings(ratings: {
    overallRating?: number;
    accuracy?: number;
    communication?: number;
    cleanliness?: number;
    location?: number;
    checkIn?: number;
    value?: number;
  }): void {
    Object.entries(ratings).forEach(([field, rating]) => {
      if (rating !== undefined) {
        if (
          rating < REVIEW_VALIDATION_CONSTANTS.MIN_RATING ||
          rating > REVIEW_VALIDATION_CONSTANTS.MAX_RATING
        ) {
          throw new ReviewValidationException(
            `${field} must be between ${REVIEW_VALIDATION_CONSTANTS.MIN_RATING} and ${REVIEW_VALIDATION_CONSTANTS.MAX_RATING}`,
            field,
          );
        }
      }
    });
  }

  /**
   * Calculate overall rating from category ratings
   */
  static calculateOverallRating(ratings: {
    accuracy?: number;
    communication?: number;
    cleanliness?: number;
    location?: number;
    checkIn?: number;
    value?: number;
  }): number | undefined {
    const validRatings = Object.values(ratings).filter((rating) => rating !== undefined);

    if (validRatings.length === 0) {
      return undefined;
    }

    const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Determine expected reviewee ID based on reviewer role
   */
  static getExpectedRevieweeId(
    bookingGuestId: string,
    bookingHostId: string,
    reviewerId: string,
  ): string {
    const isGuest = bookingGuestId === reviewerId;
    return isGuest ? bookingHostId : bookingGuestId;
  }

  /**
   * Validate public review content
   */
  static validatePublicReview(publicReview: string): void {
    if (!publicReview || publicReview.trim().length === 0) {
      throw new ReviewValidationException('Public review is required', 'publicReview');
    }

    if (publicReview.trim().length < REVIEW_VALIDATION_CONSTANTS.MIN_PUBLIC_REVIEW_LENGTH) {
      throw new ReviewValidationException(
        `Public review must be at least ${REVIEW_VALIDATION_CONSTANTS.MIN_PUBLIC_REVIEW_LENGTH} characters`,
        'publicReview',
      );
    }

    if (publicReview.length > REVIEW_VALIDATION_CONSTANTS.MAX_PUBLIC_REVIEW_LENGTH) {
      throw new ReviewValidationException(
        `Public review cannot exceed ${REVIEW_VALIDATION_CONSTANTS.MAX_PUBLIC_REVIEW_LENGTH} characters`,
        'publicReview',
      );
    }
  }

  /**
   * Validate private feedback content
   */
  static validatePrivateFeedback(privateFeedback?: string): void {
    if (
      privateFeedback &&
      privateFeedback.length > REVIEW_VALIDATION_CONSTANTS.MAX_PRIVATE_FEEDBACK_LENGTH
    ) {
      throw new ReviewValidationException(
        `Private feedback cannot exceed ${REVIEW_VALIDATION_CONSTANTS.MAX_PRIVATE_FEEDBACK_LENGTH} characters`,
        'privateFeedback',
      );
    }
  }

  /**
   * Determine if review should be auto-flagged
   */
  static shouldAutoFlag(overallRating?: number): boolean {
    return overallRating !== undefined && overallRating < REVIEW_BUSINESS_CONSTANTS.FLAG_THRESHOLD;
  }

  /**
   * Determine if review should be auto-approved
   */
  static shouldAutoApprove(overallRating?: number): boolean {
    return (
      overallRating !== undefined &&
      overallRating >= REVIEW_BUSINESS_CONSTANTS.AUTO_APPROVE_THRESHOLD
    );
  }

  /**
   * Validate booking status for review creation
   */
  static validateBookingStatus(bookingStatus: string, expectedStatus: string): void {
    if (bookingStatus !== expectedStatus) {
      throw new BookingNotReviewableException(
        `Booking must be in ${expectedStatus} status to be reviewed`,
      );
    }
  }

  /**
   * Validate property and booking consistency
   */
  static validatePropertyConsistency(bookingPropertyId: string, reviewPropertyId: string): void {
    if (bookingPropertyId !== reviewPropertyId) {
      throw new ReviewValidationException(
        'Property ID does not match the booking property',
        'propertyId',
      );
    }
  }

  /**
   * Validate reviewee ID consistency
   */
  static validateRevieweeConsistency(expectedRevieweeId: string, providedRevieweeId: string): void {
    if (expectedRevieweeId !== providedRevieweeId) {
      throw new ReviewValidationException('Invalid reviewee ID for this booking', 'revieweeId');
    }
  }
}
