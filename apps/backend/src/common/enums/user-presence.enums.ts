import { DateUtils } from '../utils/date.utils';

export enum UserPresenceStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline',
}

export interface UserPresenceInfo {
  status: UserPresenceStatus;
  canReceiveMessages: boolean;
  isActiveForSupport: boolean;
  displayName: string;
  description: string;
  color: string;
}

export const USER_PRESENCE_CONFIG: Record<UserPresenceStatus, UserPresenceInfo> = {
  [UserPresenceStatus.AVAILABLE]: {
    status: UserPresenceStatus.AVAILABLE,
    canReceiveMessages: true,
    isActiveForSupport: true,
    displayName: 'Available',
    description: 'User is online and available',
    color: '#22c55e', // green
  },
  [UserPresenceStatus.BUSY]: {
    status: UserPresenceStatus.BUSY,
    canReceiveMessages: true,
    isActiveForSupport: false,
    displayName: 'Busy',
    description: 'User is online but busy',
    color: '#f59e0b', // amber
  },
  [UserPresenceStatus.AWAY]: {
    status: UserPresenceStatus.AWAY,
    canReceiveMessages: true,
    isActiveForSupport: false,
    displayName: 'Away',
    description: 'User is away from keyboard',
    color: '#6b7280', // gray
  },
  [UserPresenceStatus.OFFLINE]: {
    status: UserPresenceStatus.OFFLINE,
    canReceiveMessages: false,
    isActiveForSupport: false,
    displayName: 'Offline',
    description: 'User is offline',
    color: '#ef4444', // red
  },
};

export function getUserPresenceInfo(status: UserPresenceStatus): UserPresenceInfo {
  return USER_PRESENCE_CONFIG[status];
}

export function canUserReceiveMessages(presenceStatus: UserPresenceStatus): boolean {
  return USER_PRESENCE_CONFIG[presenceStatus].canReceiveMessages;
}

export function isUserActiveForSupport(presenceStatus: UserPresenceStatus): boolean {
  return USER_PRESENCE_CONFIG[presenceStatus].isActiveForSupport;
}

export function getActiveSupportStatuses(): UserPresenceStatus[] {
  return Object.values(UserPresenceStatus).filter(
    (status) => USER_PRESENCE_CONFIG[status].isActiveForSupport,
  );
}

/**
 * Determine presence status based on last activity
 * @param lastActiveAt - User's last activity timestamp
 * @param currentPresence - User's current presence status (if manually set)
 * @returns Calculated presence status
 */
export function calculatePresenceFromActivity(
  lastActiveAt: Date,
  currentPresence?: UserPresenceStatus,
): UserPresenceStatus {
  const now = DateUtils.now();
  const timeDiff = now.getTime() - lastActiveAt.getTime();
  const minutesInactive = Math.floor(timeDiff / (1000 * 60));

  // If user manually set their status to busy, respect that unless they've been offline too long
  if (currentPresence === UserPresenceStatus.BUSY && minutesInactive < 30) {
    return UserPresenceStatus.BUSY;
  }

  // Auto-calculate based on activity
  if (minutesInactive < 5) {
    return UserPresenceStatus.AVAILABLE;
  } else if (minutesInactive < 15) {
    return UserPresenceStatus.AWAY;
  } else {
    return UserPresenceStatus.OFFLINE;
  }
}
