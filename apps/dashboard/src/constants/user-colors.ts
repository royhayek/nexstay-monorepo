// User role color mappings for consistent UI across the application
export const USER_ROLE_COLORS: Record<string, any> = {
  system_admin: 'error', // Red for system admin (highest privilege)
  admin: 'error', // Red for admin (high privilege)
  host: 'primary', // Blue for host (property owner)
  guest: 'success', // Green for guest (regular user)
  moderator: 'warning', // Orange for moderator
  support: 'info', // Cyan for support staff
};

// User status color mappings for consistent UI across the application
export const USER_STATUS_COLORS: Record<string, any> = {
  active: 'success', // Green for active users
  inactive: 'default', // Gray for inactive
  suspended: 'error', // Red for suspended
  pending_verification: 'warning', // Orange for pending verification
  banned: 'error', // Red for banned
  verified: 'info', // Cyan for verified
};

// Helper function to get role color
export const getUserRoleColor = (role: string): any => USER_ROLE_COLORS[role] || 'default';

// Helper function to get status color
export const getUserStatusColor = (status: string): any => USER_STATUS_COLORS[status] || 'default';