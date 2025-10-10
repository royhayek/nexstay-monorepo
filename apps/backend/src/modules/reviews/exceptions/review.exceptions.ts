import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Review not found exception
 */
export class ReviewNotFoundException extends NotFoundException {
  constructor(reviewId?: string) {
    super(reviewId ? `Review with ID ${reviewId} not found` : 'Review not found');
  }
}

/**
 * Review already exists exception
 */
export class ReviewAlreadyExistsException extends ConflictException {
  constructor(bookingId: string, reviewType: string) {
    super(`You have already created a ${reviewType} review for booking ${bookingId}`);
  }
}

/**
 * Invalid review permission exception
 */
export class InvalidReviewPermissionException extends ForbiddenException {
  constructor(message?: string) {
    super(message || 'You do not have permission to review this booking');
  }
}

/**
 * Review validation exception
 */
export class ReviewValidationException extends BadRequestException {
  constructor(message: string, field?: string) {
    super({
      message,
      field,
      error: 'REVIEW_VALIDATION_ERROR',
    });
  }
}

/**
 * Booking not reviewable exception
 */
export class BookingNotReviewableException extends BadRequestException {
  constructor(reason: string) {
    super(`Booking cannot be reviewed: ${reason}`);
  }
}

/**
 * Review deadline exceeded exception
 */
export class ReviewDeadlineExceededException extends BadRequestException {
  constructor(deadlineDays: number) {
    super(`Review deadline of ${deadlineDays} days has passed`);
  }
}

/**
 * Invalid moderation action exception
 */
export class InvalidModerationActionException extends BadRequestException {
  constructor(action: string) {
    super(`Invalid moderation action: ${action}`);
  }
}

/**
 * Review moderation exception
 */
export class ReviewModerationException extends BadRequestException {
  constructor(message: string, reviewId?: string) {
    super({
      message,
      reviewId,
      error: 'REVIEW_MODERATION_ERROR',
    });
  }
}
