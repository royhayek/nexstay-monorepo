import {
  IsPageField,
  IsLimitField,
  IsSearchField,
  IsNameField,
  IsUuidField,
  IsPriceField,
  IsDateField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { SortDirectionEnum, CommonSortFieldsEnum } from '../../../common/enums/sort.enums';

export class PaymentTableFilterDto {
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
    description: 'Search by transaction ID or reference',
    example: 'TXN-2024',
  })
  search?: string;

  @IsNameField({
    description: 'Filter by payment status',
    example: 'completed',
  })
  status?: string;

  @IsUuidField({
    description: 'Filter by booking ID',
    example: '507f1f77bcf86cd799439011',
  })
  bookingId?: string;

  @IsUuidField({
    description: 'Filter by user ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId?: string;

  @IsNameField({
    description: 'Filter by payment method',
    example: 'card',
  })
  paymentMethod?: string;

  @IsPriceField({
    description: 'Minimum payment amount',
    example: 10,
    minValue: 0,
  })
  minAmount?: number;

  @IsPriceField({
    description: 'Maximum payment amount',
    example: 10000,
    minValue: 0,
  })
  maxAmount?: number;

  @IsDateField({
    description: 'Payment date from',
    example: '2024-01-01',
  })
  createdFrom?: string;

  @IsDateField({
    description: 'Payment date to',
    example: '2024-12-31',
  })
  createdTo?: string;

  @IsEnumField(Object.values(CommonSortFieldsEnum), {
    description: 'Sort by field',
    example: CommonSortFieldsEnum.CREATED_AT,
  })
  sortBy?: string = CommonSortFieldsEnum.CREATED_AT;

  @IsEnumField(Object.values(SortDirectionEnum), {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
  })
  sortDirection?: SortDirectionEnum = SortDirectionEnum.DESC;
}
