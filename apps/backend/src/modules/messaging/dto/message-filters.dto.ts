import {
  IsPageField,
  IsLimitField,
  IsSearchField,
  IsUuidField,
  IsBooleanField,
  IsDateField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { SortDirectionEnum, CommonSortFieldsEnum } from '../../../common/enums/sort.enums';

export class MessageTableFilterDto {
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
    description: 'Search in message content',
    example: 'hello',
  })
  search?: string;

  @IsUuidField({
    description: 'Filter by conversation ID',
    example: '507f1f77bcf86cd799439011',
  })
  conversationId?: string;

  @IsUuidField({
    description: 'Filter by sender ID',
    example: '507f1f77bcf86cd799439011',
  })
  senderId?: string;

  @IsUuidField({
    description: 'Filter by recipient ID',
    example: '507f1f77bcf86cd799439011',
  })
  recipientId?: string;

  @IsBooleanField({
    description: 'Show only unread messages',
    example: true,
  })
  unreadOnly?: boolean;

  @IsBooleanField({
    description: 'Show only flagged messages',
    example: false,
  })
  flagged?: boolean;

  @IsDateField({
    description: 'Message date from',
    example: '2024-01-01',
  })
  createdFrom?: string;

  @IsDateField({
    description: 'Message date to',
    example: '2024-12-31',
  })
  createdTo?: string;

  @IsEnumField([CommonSortFieldsEnum.CREATED_AT, CommonSortFieldsEnum.UPDATED_AT], {
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

export class ConversationFilterDto {
  @IsPageField({
    description: 'Page number',
    example: 1,
  })
  page?: number = 1;

  @IsLimitField({
    description: 'Items per page',
    example: 20,
    maxValue: 50,
  })
  limit?: number = 20;

  @IsBooleanField({
    description: 'Show only unread conversations',
    example: false,
  })
  unreadOnly?: boolean;

  @IsEnumField(['lastMessageAt', CommonSortFieldsEnum.CREATED_AT], {
    description: 'Sort by field',
    example: 'lastMessageAt',
  })
  sortBy?: string = 'lastMessageAt';

  @IsEnumField(Object.values(SortDirectionEnum), {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
  })
  sortDirection?: SortDirectionEnum = SortDirectionEnum.DESC;
}
