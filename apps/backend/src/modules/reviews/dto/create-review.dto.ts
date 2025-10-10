import {
  IsUuidField,
  IsEnumField,
  IsTextAreaField,
  IsRatingField,
} from '../../../common/validators/standardized-validators';
import { ReviewType } from '../../../common/enums/property.enums';

export class CreateReviewDto {
  @IsUuidField({
    required: true,
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId: string;

  @IsUuidField({
    required: true,
    description: 'Booking ID',
    example: '507f1f77bcf86cd799439012',
  })
  bookingId: string;

  @IsEnumField(ReviewType, {
    required: true,
    description: 'Type of review',
    example: ReviewType.GUEST_TO_HOST,
  })
  reviewType: ReviewType;

  @IsUuidField({
    required: true,
    description: 'Reviewee ID (person being reviewed)',
    example: '507f1f77bcf86cd799439014',
  })
  revieweeId: string;

  @IsRatingField({
    description: 'Overall rating',
    example: 4.5,
    required: false,
  })
  overallRating?: number;

  @IsRatingField({
    description: 'Accuracy rating',
    example: 5,
    required: false,
  })
  accuracy?: number;

  @IsRatingField({
    description: 'Communication rating',
    example: 4,
    required: false,
  })
  communication?: number;

  @IsRatingField({
    description: 'Cleanliness rating',
    example: 5,
    required: false,
  })
  cleanliness?: number;

  @IsRatingField({
    description: 'Location rating',
    example: 4,
    required: false,
  })
  location?: number;

  @IsRatingField({
    description: 'Check-in experience rating',
    example: 5,
    required: false,
  })
  checkIn?: number;

  @IsRatingField({
    description: 'Value for money rating',
    example: 4,
    required: false,
  })
  value?: number;

  @IsTextAreaField({
    required: true,
    description: 'Public review comments',
    example: 'Great place to stay! Clean, comfortable, and excellent location. Highly recommended.',
    maxLength: 1000,
  })
  publicReview: string;

  @IsTextAreaField({
    description: 'Private feedback to the host/guest',
    example: 'The Wi-Fi was a bit slow in the evenings, but everything else was perfect.',
    maxLength: 500,
  })
  privateFeedback?: string;
}
