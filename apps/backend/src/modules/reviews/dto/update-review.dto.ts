import { PartialType } from '@nestjs/swagger';
import { IsRatingField, IsTextAreaField } from '../../../common/validators/standardized-validators';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
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
    description: 'Public review comments',
    example: 'Updated review: Great place to stay! Clean, comfortable, and excellent location.',
    maxLength: 1000,
    required: false,
  })
  publicReview?: string;

  @IsTextAreaField({
    description: 'Private feedback to the host/guest',
    example: 'Updated feedback: The Wi-Fi improved during our stay.',
    maxLength: 500,
    required: false,
  })
  privateFeedback?: string;
}
