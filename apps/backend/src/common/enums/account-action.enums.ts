/**
 * Account action types for deactivation and deletion operations
 */
export enum AccountActionTypeEnum {
  DEACTIVATE = 'deactivate',
  DELETE = 'delete',
}

/**
 * Account action status for tracking operations
 */
export enum AccountActionStatusEnum {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
