import { IsUuidArrayField } from '../../../common/validators/standardized-validators';

export class AdminBulkDeleteUsersDto {
  @IsUuidArrayField({
    required: true,
    description: 'Array of user IDs to delete',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    minItems: 1,
    maxItems: 50,
  })
  userIds!: string[];
}
