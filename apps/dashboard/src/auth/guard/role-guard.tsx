'use client';

import type { UserDataDtoRolesItem } from 'src/api/models/admin';

import { useAuth } from '../hooks/use-auth';

// ----------------------------------------------------------------------

export type RoleGuardProps = {
  /**
   * Required role(s) to view the content
   * Can be a single role or array of roles
   */
  roles?: UserDataDtoRolesItem | UserDataDtoRolesItem[];
  /**
   * If true, user must have ALL specified roles
   * If false (default), user needs ANY of the specified roles
   */
  requireAll?: boolean;
  /**
   * Fallback content to show when user doesn't have permission
   * Default: null (renders nothing)
   */
  fallback?: React.ReactNode;
  /**
   * Children to render when user has permission
   */
  children: React.ReactNode;
};

/**
 * Role-based guard component for conditional rendering
 *
 * @example
 * // Show content only to admins
 * <RoleGuard roles="admin">
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Show content to multiple roles
 * <RoleGuard roles={['admin', 'moderator']}>
 *   <ModeratorTools />
 * </RoleGuard>
 *
 * @example
 * // Require all specified roles
 * <RoleGuard roles={['admin', 'compliance']} requireAll>
 *   <SensitiveData />
 * </RoleGuard>
 *
 * @example
 * // With fallback content
 * <RoleGuard roles="admin" fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RoleGuard>
 */
export function RoleGuard({
  roles,
  requireAll = false,
  fallback = null,
  children,
}: RoleGuardProps) {
  const { hasRole, hasAllRoles } = useAuth();

  if (!roles) {
    // No role restriction, render children
    return <>{children}</>;
  }

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];

  const hasPermission = requireAll ? hasAllRoles(rolesToCheck) : hasRole(rolesToCheck);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ----------------------------------------------------------------------

export type RequireRoleProps = {
  /**
   * Required role(s) to view the content
   */
  roles: UserDataDtoRolesItem | UserDataDtoRolesItem[];
  /**
   * If true, user must have ALL specified roles
   */
  requireAll?: boolean;
  /**
   * Children to render when user has permission
   */
  children: React.ReactNode;
};

/**
 * Stricter variant of RoleGuard - only renders children, never shows fallback
 * Useful for hiding UI elements completely when user doesn't have permission
 *
 * @example
 * // Hide delete button for non-admins
 * <RequireRole roles="admin">
 *   <Button color="error">Delete</Button>
 * </RequireRole>
 */
export function RequireRole({ roles, requireAll = false, children }: RequireRoleProps) {
  return (
    <RoleGuard roles={roles} requireAll={requireAll} fallback={null}>
      {children}
    </RoleGuard>
  );
}

// ----------------------------------------------------------------------

export type HideForRoleProps = {
  /**
   * Roles that should NOT see the content
   */
  roles: UserDataDtoRolesItem | UserDataDtoRolesItem[];
  /**
   * Children to render when user doesn't have the specified role(s)
   */
  children: React.ReactNode;
};

/**
 * Inverse of RequireRole - hides content from specified roles
 *
 * @example
 * // Hide from guests
 * <HideForRole roles="guest">
 *   <HostOnlyFeature />
 * </HideForRole>
 */
export function HideForRole({ roles, children }: HideForRoleProps) {
  const { hasRole } = useAuth();

  const rolesToCheck = Array.isArray(roles) ? roles : [roles];
  const shouldHide = hasRole(rolesToCheck);

  if (shouldHide) {
    return null;
  }

  return <>{children}</>;
}
