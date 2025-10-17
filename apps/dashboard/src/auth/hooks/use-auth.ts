'use client';

import type { UserDataDtoRolesItem } from 'src/api/models/admin';

import { useMemo } from 'react';

import { useAuthContext } from './use-auth-context';

// ----------------------------------------------------------------------

/**
 * Enhanced auth hook with role checking utilities
 * Provides convenient methods for role-based access control
 */
export function useAuth() {
  const auth = useAuthContext();

  /**
   * Check if user has a specific role
   * Note: system_admin has superuser access and passes all role checks
   */
  const hasRole = useMemo(
    () => (role: UserDataDtoRolesItem | UserDataDtoRolesItem[]) => {
      if (!auth.user?.roles) return false;

      // system_admin has access to everything (superuser privilege)
      if (auth.user.roles.includes('system_admin')) return true;

      const rolesToCheck = Array.isArray(role) ? role : [role];
      return rolesToCheck.some((r) => auth.user?.roles.includes(r));
    },
    [auth.user?.roles]
  );

  /**
   * Check if user has ALL specified roles
   * Note: system_admin has superuser access and passes all role checks
   */
  const hasAllRoles = useMemo(
    () => (roles: UserDataDtoRolesItem[]) => {
      if (!auth.user?.roles) return false;

      // system_admin has access to everything (superuser privilege)
      if (auth.user.roles.includes('system_admin')) return true;

      return roles.every((r) => auth.user?.roles.includes(r));
    },
    [auth.user?.roles]
  );

  /**
   * Check if user is an admin (admin or system_admin)
   */
  const isAdmin = useMemo(() => hasRole(['admin', 'system_admin']), [hasRole]);

  /**
   * Check if user is a system admin (highest privilege)
   */
  const isSystemAdmin = useMemo(() => hasRole('system_admin'), [hasRole]);

  /**
   * Check if user is a host
   */
  const isHost = useMemo(() => hasRole('host'), [hasRole]);

  /**
   * Check if user is a guest
   */
  const isGuest = useMemo(() => hasRole('guest'), [hasRole]);

  /**
   * Check if user has moderator role
   */
  const isModerator = useMemo(() => hasRole('moderator'), [hasRole]);

  /**
   * Check if user has support role
   */
  const isSupport = useMemo(() => hasRole('support'), [hasRole]);

  /**
   * Check if user has compliance role
   */
  const isCompliance = useMemo(() => hasRole('compliance'), [hasRole]);

  /**
   * Check if user can access admin features
   * (admin, system_admin, moderator, or compliance)
   */
  const canAccessAdmin = useMemo(
    () => hasRole(['admin', 'system_admin', 'moderator', 'compliance']),
    [hasRole]
  );

  /**
   * Get user's primary role (first role in the array)
   */
  const primaryRole = useMemo(() => auth.user?.roles?.[0] || null, [auth.user?.roles]);

  return {
    ...auth,
    // Role checking methods
    hasRole,
    hasAllRoles,
    // Convenience role checks
    isAdmin,
    isSystemAdmin,
    isHost,
    isGuest,
    isModerator,
    isSupport,
    isCompliance,
    canAccessAdmin,
    // User role info
    primaryRole,
    roles: auth.user?.roles || [],
  };
}
