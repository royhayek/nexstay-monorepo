import type { UserDataDtoRolesItem } from 'src/api/models/admin';

/**
 * Role-based utility functions for navigation and access control
 */

/**
 * Determine the primary role for a user
 * Returns the highest priority role the user has
 */
export function getPrimaryRole(roles: UserDataDtoRolesItem[]): UserDataDtoRolesItem | null {
  if (!roles || roles.length === 0) return null;

  // Priority order (highest to lowest)
  const rolePriority: Record<string, number> = {
    system_admin: 7,
    admin: 6,
    compliance: 5,
    moderator: 4,
    support: 3,
    host: 2,
    guest: 1,
  };

  // Sort by priority and return the highest
  const sortedRoles = [...roles].sort(
    (a, b) => (rolePriority[b] || 0) - (rolePriority[a] || 0)
  );

  return sortedRoles[0] || null;
}

/**
 * Get the default dashboard path based on user roles
 */
export function getRoleBasedDashboard(roles: UserDataDtoRolesItem[]): string {
  if (!roles || roles.length === 0) {
    return '/dashboard'; // Default fallback
  }

  // System admin and admin get admin dashboard
  if (roles.includes('system_admin') || roles.includes('admin')) {
    return '/dashboard/admin';
  }

  // Compliance, moderator, support get admin dashboard (read-only access)
  if (
    roles.includes('compliance') ||
    roles.includes('moderator') ||
    roles.includes('support')
  ) {
    return '/dashboard/admin';
  }

  // Host gets host dashboard
  if (roles.includes('host')) {
    return '/dashboard/host';
  }

  // Guest gets guest dashboard (or default)
  return '/dashboard';
}

/**
 * Check if user is an admin-type role
 */
export function isAdminRole(roles: UserDataDtoRolesItem[]): boolean {
  if (!roles) return false;
  return roles.some((role) =>
    ['admin', 'system_admin', 'moderator', 'compliance', 'support'].includes(role)
  );
}

/**
 * Check if user is a host
 */
export function isHostRole(roles: UserDataDtoRolesItem[]): boolean {
  if (!roles) return false;
  return roles.includes('host');
}

/**
 * Check if user is a guest
 */
export function isGuestRole(roles: UserDataDtoRolesItem[]): boolean {
  if (!roles) return false;
  return roles.includes('guest');
}

/**
 * Get navigation config key based on roles
 * Returns which navigation config to use
 */
export function getNavigationConfigKey(
  roles: UserDataDtoRolesItem[]
): 'admin' | 'host' | 'guest' {
  if (isAdminRole(roles)) {
    return 'admin';
  }
  if (isHostRole(roles)) {
    return 'host';
  }
  return 'guest';
}
