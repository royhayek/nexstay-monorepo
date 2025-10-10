/**
 * Common filter values
 */
export enum FilterValueEnum {
  ALL = 'all',
  NONE = 'none',
  TRUE = 'true',
  FALSE = 'false',
}

/**
 * Database field mappings
 */
export enum DatabaseFieldEnum {
  ID = '_id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * User role filter for admin operations
 */
export enum UserRoleFilterEnum {
  ALL = 'all',
  GUEST = 'guest',
  HOST = 'host',
  ADMIN = 'admin',
}
