export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
  DEACTIVATED = 'deactivated',
  DELETED = 'deleted',
}

export interface UserStatusInfo {
  status: UserStatus;
  canLogin: boolean;
  canBook: boolean;
  canHost: boolean;
  canReceiveMessages: boolean;
  displayName: string;
  description: string;
}

export const USER_STATUS_CONFIG: Record<UserStatus, UserStatusInfo> = {
  [UserStatus.ACTIVE]: {
    status: UserStatus.ACTIVE,
    canLogin: true,
    canBook: true,
    canHost: true,
    canReceiveMessages: true,
    displayName: 'Active',
    description: 'User account is active and fully functional',
  },
  [UserStatus.INACTIVE]: {
    status: UserStatus.INACTIVE,
    canLogin: false,
    canBook: false,
    canHost: false,
    canReceiveMessages: false,
    displayName: 'Inactive',
    description: 'User account is temporarily inactive',
  },
  [UserStatus.SUSPENDED]: {
    status: UserStatus.SUSPENDED,
    canLogin: false,
    canBook: false,
    canHost: false,
    canReceiveMessages: true,
    displayName: 'Suspended',
    description: 'User account is suspended due to policy violations',
  },
  [UserStatus.BANNED]: {
    status: UserStatus.BANNED,
    canLogin: false,
    canBook: false,
    canHost: false,
    canReceiveMessages: false,
    displayName: 'Banned',
    description: 'User account is permanently banned',
  },
  [UserStatus.PENDING_VERIFICATION]: {
    status: UserStatus.PENDING_VERIFICATION,
    canLogin: true,
    canBook: false,
    canHost: false,
    canReceiveMessages: true,
    displayName: 'Pending Verification',
    description: 'User account is pending identity verification',
  },
  [UserStatus.DEACTIVATED]: {
    status: UserStatus.DEACTIVATED,
    canLogin: false,
    canBook: false,
    canHost: false,
    canReceiveMessages: false,
    displayName: 'Deactivated',
    description: 'User account has been deactivated by the user',
  },
  [UserStatus.DELETED]: {
    status: UserStatus.DELETED,
    canLogin: false,
    canBook: false,
    canHost: false,
    canReceiveMessages: false,
    displayName: 'Deleted',
    description: 'User account has been deleted (soft delete for data retention)',
  },
};

export function getUserStatusInfo(status: UserStatus): UserStatusInfo {
  return USER_STATUS_CONFIG[status];
}

export function canUserPerformAction(
  status: UserStatus,
  action: keyof Pick<UserStatusInfo, 'canLogin' | 'canBook' | 'canHost' | 'canReceiveMessages'>,
): boolean {
  return USER_STATUS_CONFIG[status][action];
}

export function getActiveStatuses(): UserStatus[] {
  return Object.values(UserStatus).filter(
    (status) => USER_STATUS_CONFIG[status].canLogin || status === UserStatus.PENDING_VERIFICATION,
  );
}

export function getInactiveStatuses(): UserStatus[] {
  return Object.values(UserStatus).filter(
    (status) => !USER_STATUS_CONFIG[status].canLogin && status !== UserStatus.PENDING_VERIFICATION,
  );
}
