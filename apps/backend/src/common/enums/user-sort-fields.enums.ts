/**
 * User table sort field options for admin views
 */
export enum UserTableSortFieldEnum {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_ACTIVE_AT = 'lastActiveAt',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  EMAIL = 'email',
  ID = 'id',
  MONGO_ID = '_id',
}

/**
 * Public user filter sort field options
 */
export enum PublicUserSortFieldEnum {
  CREATED_AT = 'createdAt',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  AVERAGE_RATING = 'averageRating',
}
