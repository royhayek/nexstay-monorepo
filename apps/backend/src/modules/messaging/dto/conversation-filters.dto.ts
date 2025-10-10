import {
  IsPageField,
  IsLimitField,
  IsSearchField,
  IsNameField,
  IsUuidField,
  IsDateField,
} from '../../../common/validators/standardized-validators';

export class ConversationFiltersDto {
  @IsPageField({ required: true })
  page: number;

  @IsLimitField({ required: true })
  limit: number;

  @IsSearchField({ required: false })
  search?: string;

  @IsNameField({ required: false, example: 'support_guest' })
  type?: string;

  @IsUuidField({ required: false })
  userId?: string;

  @IsNameField({ required: false, example: 'open' })
  status?: string;

  @IsDateField({ required: false })
  from?: Date;

  @IsDateField({ required: false })
  to?: Date;
}
