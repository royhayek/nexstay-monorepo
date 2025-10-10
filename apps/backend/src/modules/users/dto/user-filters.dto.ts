import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { UserRole } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';
import {
  UserTableSortFieldEnum,
  PublicUserSortFieldEnum,
} from '../../../common/enums/user-sort-fields.enums';
import { SortDirectionEnum } from '../../../common/enums/sort.enums';
import {
  IsSearchField,
  IsDateField,
  IsEnumField,
  IsPageField,
  IsLimitField,
  IsBooleanField,
} from '../../../common/validators/standardized-validators';
import { USER_PAGINATION_CONSTANTS, USER_ADMIN_CONSTANTS } from '../constants/user.constants';

@ValidatorConstraint({ name: 'isValidStatusList', async: false })
export class IsValidStatusList implements ValidatorConstraintInterface {
  validate(statusString: unknown) {
    if (!statusString || typeof statusString !== 'string') return true; // Allow empty/undefined (handled by @IsOptional)

    const statuses = statusString.split(',').map((s: string) => s.trim());
    const validStatuses = Object.values(UserStatus);

    return statuses.every((status) => validStatuses.includes(status as UserStatus));
  }

  defaultMessage() {
    return (
      'Status must be a comma-separated list of valid user statuses: ' +
      (Object.values(UserStatus) as string[]).join(', ')
    );
  }
}

@ValidatorConstraint({ name: 'isValidRoleList', async: false })
export class IsValidRoleList implements ValidatorConstraintInterface {
  validate(roleString: unknown) {
    if (!roleString || typeof roleString !== 'string') return true; // Allow empty/undefined (handled by @IsOptional)

    const roles = roleString.split(',').map((s: string) => s.trim());
    const validRoles = Object.values(UserRole);

    return roles.every((role) => validRoles.includes(role as UserRole));
  }

  defaultMessage() {
    return (
      'Role must be a comma-separated list of valid user roles: ' +
      Object.values(UserRole).join(', ')
    );
  }
}

export class UserTableFilterDto {
  @IsPageField({
    description: 'Page number for pagination',
    example: USER_PAGINATION_CONSTANTS.MIN_PAGE,
  })
  page?: number = USER_PAGINATION_CONSTANTS.MIN_PAGE;

  @IsLimitField({
    description: 'Items per page',
    maxValue: USER_PAGINATION_CONSTANTS.MAX_LIMIT,
    example: USER_PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  })
  limit?: number = USER_PAGINATION_CONSTANTS.DEFAULT_LIMIT;

  @IsSearchField({
    description: 'Search by name, email, or phone',
    example: 'john',
  })
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by user role (comma-separated for multiple roles). Valid values: ' +
      Object.values(UserRole).join(', ') +
      '. Examples: "guest" or "guest,host" or "guest,host,admin"',
    type: 'string',
    example: 'guest,host',
    examples: {
      single: {
        summary: 'Single role',
        value: 'guest',
        description: 'Filter by single role',
      },
      multiple: {
        summary: 'Multiple roles',
        value: 'guest,host,admin',
        description: 'Filter by multiple roles (comma-separated)',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Validate(IsValidRoleList)
  role?: string;

  @ApiPropertyOptional({
    description:
      'Filter by user status (comma-separated for multiple statuses). Valid values: ' +
      (Object.values(UserStatus) as string[]).join(', ') +
      '. Examples: "active" or "active,inactive" or "active,inactive,suspended"',
    type: 'string',
    example: 'active,inactive',
    examples: {
      single: {
        summary: 'Single status',
        value: 'active',
        description: 'Filter by single status',
      },
      multiple: {
        summary: 'Multiple statuses',
        value: 'active,inactive,suspended',
        description: 'Filter by multiple statuses (comma-separated)',
      },
    },
  })
  @IsOptional()
  @IsString()
  @Validate(IsValidStatusList)
  status?: string;

  @IsBooleanField({
    description:
      'Filter by verification status. true: user has either email OR phone verified. false: user has BOTH email AND phone unverified',
    example: true,
  })
  verified?: boolean;

  @IsBooleanField({
    description: 'Filter by email verification status',
    example: true,
  })
  isEmailVerified?: boolean;

  @IsBooleanField({
    description: 'Filter by phone verification status',
    example: false,
  })
  isPhoneVerified?: boolean;

  @IsDateField({
    description: 'Filter by creation date from',
    example: '2024-01-01',
  })
  createdFrom?: string;

  @IsDateField({
    description: 'Filter by creation date to',
    example: '2024-12-31',
  })
  createdTo?: string;

  @IsEnumField(UserTableSortFieldEnum, {
    description: 'Sort by field',
    example: UserTableSortFieldEnum.CREATED_AT,
  })
  sortBy?: UserTableSortFieldEnum = UserTableSortFieldEnum.CREATED_AT;

  @IsEnumField(SortDirectionEnum, {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
  })
  sortDirection?: SortDirectionEnum = SortDirectionEnum.DESC;
}

export class PublicUserFilterDto {
  @IsPageField({
    description: 'Page number for pagination',
    example: USER_PAGINATION_CONSTANTS.MIN_PAGE,
  })
  page?: number = USER_PAGINATION_CONSTANTS.MIN_PAGE;

  @IsLimitField({
    description: 'Items per page',
    maxValue: USER_ADMIN_CONSTANTS.PUBLIC_MAX_LIMIT,
    example: 10,
  })
  limit?: number = 10;

  @IsSearchField({
    description: 'Search by name',
    example: 'john',
  })
  search?: string;

  @IsEnumField(
    { HOST: UserRole.HOST },
    {
      description: 'Filter by user role',
      example: UserRole.HOST,
    },
  )
  role?: UserRole.HOST;

  @IsEnumField(PublicUserSortFieldEnum, {
    description: 'Sort by field',
    example: PublicUserSortFieldEnum.CREATED_AT,
  })
  sortBy?: PublicUserSortFieldEnum = PublicUserSortFieldEnum.CREATED_AT;

  @IsEnumField(SortDirectionEnum, {
    description: 'Sort direction',
    example: SortDirectionEnum.DESC,
  })
  sortDirection?: SortDirectionEnum = SortDirectionEnum.DESC;
}
