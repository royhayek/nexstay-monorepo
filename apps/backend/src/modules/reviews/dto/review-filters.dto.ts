import {
  IsSearchField,
  IsUuidField,
  IsRatingField,
  IsDateField,
  IsPageField,
  IsLimitField,
  IsBooleanField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

export class ReviewTableFilterDto {
  @IsPageField({
    description: 'Page number',
    example: 1,
  })
  page?: number = 1;

  @IsLimitField({
    description: 'Items per page',
    example: 20,
    maxValue: 100,
  })
  limit?: number = 20;

  @IsSearchField({
    example: 'excellent location clean',
    description: 'Search in review text and feedback',
  })
  search?: string;

  @IsUuidField({
    description: 'Filter by property ID',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId?: string;

  @IsUuidField({
    description: 'Filter by reviewer ID',
    example: '507f1f77bcf86cd799439011',
  })
  reviewerId?: string;

  @IsUuidField({
    description: 'Filter by reviewee (host) ID',
    example: '507f1f77bcf86cd799439011',
  })
  revieweeId?: string;

  @IsRatingField({
    description: 'Minimum rating filter',
    example: 3,
  })
  minRating?: number;

  @IsRatingField({
    description: 'Maximum rating filter',
    example: 5,
  })
  maxRating?: number;

  @IsBooleanField({
    description: 'Filter by flagged reviews',
    example: false,
  })
  flagged?: boolean;

  @IsBooleanField({
    description: 'Filter by verified reviews',
    example: true,
  })
  verified?: boolean;

  @IsDateField({
    description: 'Filter reviews created from this date',
    example: '2024-01-01',
  })
  createdFrom?: string;

  @IsDateField({
    description: 'Filter reviews created until this date',
    example: '2024-12-31',
  })
  createdTo?: string;

  @IsEnumField(['createdAt', 'rating', 'helpful'], {
    description: 'Sort by field',
    example: 'rating',
  })
  sortBy?: string = 'createdAt';

  @IsEnumField(['asc', 'desc'], {
    description: 'Sort direction',
    example: 'desc',
  })
  sortDirection?: 'asc' | 'desc' = 'desc';
}

export class PublicReviewFilterDto {
  @IsPageField({
    description: 'Page number',
    example: 1,
  })
  page?: number = 1;

  @IsLimitField({
    description: 'Items per page',
    example: 10,
    maxValue: 50,
  })
  limit?: number = 10;

  @IsRatingField({
    description: 'Minimum rating filter',
    example: 3,
  })
  minRating?: number;

  @IsEnumField(['createdAt', 'rating', 'helpful'], {
    description: 'Sort by field',
    example: 'createdAt',
  })
  sortBy?: string = 'createdAt';

  @IsEnumField(['asc', 'desc'], {
    description: 'Sort direction',
    example: 'desc',
  })
  sortDirection?: 'asc' | 'desc' = 'desc';
}
