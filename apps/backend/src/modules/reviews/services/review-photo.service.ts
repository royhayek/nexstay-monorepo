import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../../../database/schemas/review.schema';
import { S3Service, FileCategory } from '../../storage/services/s3.service';
import { ReviewPhotoDto } from '../dto/review-enhancements.dto';
import { ReviewNotFoundException } from '../exceptions/review.exceptions';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Review Photo Service
 * Handles photo uploads and management for reviews
 */
@Injectable()
export class ReviewPhotoService {
  private readonly MAX_PHOTOS = 5;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Upload photos to a review
   */
  async uploadPhotos(
    reviewId: string,
    userId: string,
    files: Express.Multer.File[],
  ): Promise<ReviewPhotoDto[]> {
    try {
      // Validate review exists and user is owner
      const review = await this.validateReviewOwnership(reviewId, userId);

      // Validate photo count limit
      const currentPhotoCount = review.photos?.length || 0;
      const newPhotoCount = currentPhotoCount + files.length;

      if (newPhotoCount > this.MAX_PHOTOS) {
        throw new BadRequestException(
          `Cannot upload ${files.length} photos. Maximum ${this.MAX_PHOTOS} photos allowed per review. Current: ${currentPhotoCount}`,
        );
      }

      // Validate each file
      files.forEach((file, index) => {
        this.validatePhotoFile(file, index);
      });

      // Upload files to S3
      const uploadedPhotos: ReviewPhotoDto[] = [];

      for (const file of files) {
        try {
          const uploadResult = await this.s3Service.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            FileCategory.PROPERTY_IMAGES, // Reusing property images category
            userId,
            true, // Process images
          );

          // Get thumbnail URL
          const thumbnailUrl =
            uploadResult.variants?.find((v) => v.size === 'thumbnail')?.url || uploadResult.url;

          const photoDto: ReviewPhotoDto = {
            url: uploadResult.url,
            thumbnailUrl,
            originalFilename: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: DateUtils.now(),
          };

          uploadedPhotos.push(photoDto);
        } catch (error) {
          LoggingUtil.errorWithException(
            `Failed to upload photo ${file.originalname}:`,
            error,
            'ReviewPhotoService',
          );
          throw new BadRequestException(
            `Failed to upload photo ${file.originalname}. Please try again.`,
          );
        }
      }

      // Update review with new photos
      if (!review.photos) {
        review.photos = [];
      }
      review.photos.push(...uploadedPhotos);
      review.photoCount = review.photos.length;
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(
        `Uploaded ${uploadedPhotos.length} photos to review: ${reviewId}`,
        'ReviewPhotoService',
      );

      return uploadedPhotos;
    } catch (error) {
      LoggingUtil.errorWithException(`Error uploading photos:`, error, 'ReviewPhotoService');
      throw error;
    }
  }

  /**
   * Delete a photo from a review
   */
  async deletePhoto(reviewId: string, userId: string, photoUrl: string): Promise<void> {
    try {
      // Validate review exists and user is owner
      const review = await this.validateReviewOwnership(reviewId, userId);

      if (!review.photos || review.photos.length === 0) {
        throw new BadRequestException('Review has no photos to delete');
      }

      // Find photo index
      const photoIndex = review.photos.findIndex((photo) => photo.url === photoUrl);

      if (photoIndex === -1) {
        throw new BadRequestException('Photo not found in review');
      }

      const photo = review.photos[photoIndex];

      // Delete from S3 (extract key from URL)
      try {
        const photoKey = this.s3Service.extractKeyFromUrl(photo.url);
        if (photoKey) {
          await this.s3Service.deleteImageWithVariants(photoKey);
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          `Failed to delete photo from S3: ${photoUrl}`,
          error,
          'ReviewPhotoService',
        );
        // Continue with database deletion even if S3 deletion fails
      }

      // Remove photo from review
      review.photos.splice(photoIndex, 1);
      review.photoCount = review.photos.length;
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(`Deleted photo from review: ${reviewId}`, 'ReviewPhotoService');
    } catch (error) {
      LoggingUtil.errorWithException(`Error deleting photo:`, error, 'ReviewPhotoService');
      throw error;
    }
  }

  /**
   * Delete all photos from a review
   */
  async deleteAllPhotos(reviewId: string): Promise<void> {
    try {
      const review = await this.reviewModel.findById(reviewId).exec();

      if (!review || !review.photos || review.photos.length === 0) {
        return; // Nothing to delete
      }

      // Delete all photos from S3
      const deletionPromises = review.photos.map(async (photo) => {
        try {
          const photoKey = this.s3Service.extractKeyFromUrl(photo.url);
          if (photoKey) {
            await this.s3Service.deleteImageWithVariants(photoKey);
          }
        } catch (error) {
          LoggingUtil.errorWithException(
            `Failed to delete photo: ${photo.url}`,
            error,
            'ReviewPhotoService',
          );
          // Continue with other deletions
        }
      });

      await Promise.allSettled(deletionPromises);

      // Clear photos from review
      review.photos = [];
      review.photoCount = 0;
      review.updatedAt = DateUtils.now();

      await review.save();

      LoggingUtil.log(`Deleted all photos from review: ${reviewId}`, 'ReviewPhotoService');
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error deleting all photos:`,
        error,
        'ReviewPhotoService',
      );
      throw error;
    }
  }

  /**
   * Get all photos for a review
   */
  async getPhotos(reviewId: string): Promise<ReviewPhotoDto[]> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewPhotoService',
    });

    const review = await this.reviewModel.findById(reviewId).select('photos').lean().exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    return review.photos || [];
  }

  /**
   * Private helper methods
   */
  private async validateReviewOwnership(
    reviewId: string,
    userId: string,
  ): Promise<ReviewDocument> {
    ValidationUtils.validateObjectId(reviewId, 'reviewId', {
      context: 'ReviewPhotoService',
    });

    const review = await this.reviewModel
      .findOne({
        _id: reviewId,
        reviewerId: new Types.ObjectId(userId),
      })
      .exec();

    if (!review) {
      throw new ReviewNotFoundException(reviewId);
    }

    return review;
  }

  private validatePhotoFile(file: Express.Multer.File, index: number): void {
    if (!file) {
      throw new BadRequestException(`File at index ${index} is missing`);
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File "${file.originalname}" exceeds maximum size of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File "${file.originalname}" has invalid type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file has buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(`File "${file.originalname}" is empty`);
    }
  }
}
