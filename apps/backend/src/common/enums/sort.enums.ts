/**
 * Sort direction options
 */
export enum SortDirectionEnum {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Common sort fields for various entities
 */
export enum CommonSortFieldsEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ID = '_id',
  NAME = 'name',
  TITLE = 'title',
}

/**
 * User-specific sort fields
 */
export enum UserSortFieldsEnum {
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  PHONE = 'phone',
  ROLE = 'role',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_ACTIVE_AT = 'lastActiveAt',
  ID = '_id',
}
