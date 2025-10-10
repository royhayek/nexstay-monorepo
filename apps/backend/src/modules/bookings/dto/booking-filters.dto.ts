import {
  IsPageField,
  IsLimitField,
  IsSearchField,
  IsUuidField,
  IsDateField,
  IsPriceField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { BookingStatus } from '../../../common/enums/booking.enums';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';

enum BookingSortField {
  CREATED_AT = 'createdAt',
  CHECK_IN = 'checkIn',
  CHECK_OUT = 'checkOut',
  TOTAL_AMOUNT = 'totalAmount',
  STATUS = 'status',
}

export class BookingTableFilterDto {
  @IsPageField({ required: false })
  page?: number;

  @IsLimitField({ required: false })
  limit?: number;

  @IsSearchField({ required: false })
  search?: string;

  @IsEnumField(BookingStatus, { required: false, example: BookingStatus.CONFIRMED })
  status?: BookingStatus;

  @IsUuidField({ required: false })
  propertyId?: string;

  @IsUuidField({ required: false })
  guestId?: string;

  @IsUuidField({ required: false })
  hostId?: string;

  @IsDateField({ required: false })
  checkInFrom?: Date;

  @IsDateField({ required: false })
  checkInTo?: Date;

  @IsDateField({ required: false })
  checkOutFrom?: Date;

  @IsDateField({ required: false })
  checkOutTo?: Date;

  @IsPriceField({ required: false, example: 100.0 })
  minAmount?: number;

  @IsPriceField({ required: false, example: 5000.0 })
  maxAmount?: number;

  @IsEnumField(BookingSortField, { required: false, example: BookingSortField.CHECK_IN })
  sortBy?: BookingSortField;

  @IsEnumField(SortDirectionEnum, { required: false, example: SortDirectionEnum.DESC })
  sortDirection?: SortDirectionEnum;
}

enum UserBookingSortField {
  CREATED_AT = 'createdAt',
  CHECK_IN = 'checkIn',
  CHECK_OUT = 'checkOut',
  TOTAL_AMOUNT = 'totalAmount',
}

export class UserBookingFilterDto {
  @IsPageField({ required: false })
  page?: number;

  @IsLimitField({ required: false })
  limit?: number;

  @IsEnumField(BookingStatus, { required: false, example: BookingStatus.CONFIRMED })
  status?: BookingStatus;

  @IsEnumField(UserBookingSortField, { required: false, example: UserBookingSortField.CREATED_AT })
  sortBy?: UserBookingSortField;

  @IsEnumField(SortDirectionEnum, { required: false, example: SortDirectionEnum.DESC })
  sortDirection?: SortDirectionEnum;
}
