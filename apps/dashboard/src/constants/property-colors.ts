// Property status color mappings for consistent UI across the application
export const PROPERTY_STATUS_COLORS: Record<string, string> = {
  published: 'success', // Green for published properties
  draft: 'warning', // Orange/Yellow for draft properties
  active: 'success', // Green for active properties
  inactive: 'default', // Gray for inactive properties
  suspended: 'error', // Red for suspended properties
  deleted: 'error', // Red for deleted properties
  pending: 'info', // Cyan for pending approval
};

// Property type color mappings
export const PROPERTY_TYPE_COLORS: Record<string, string> = {
  apartment: 'info',
  house: 'primary',
  villa: 'warning',
  condo: 'secondary',
  townhouse: 'default',
  loft: 'info',
  studio: 'success',
};

// Room type color mappings
export const ROOM_TYPE_COLORS: Record<string, string> = {
  entire_home: 'primary',
  private_room: 'info',
  shared_room: 'warning',
  hotel_room: 'secondary',
};

// Helper function to get property status color
export const getPropertyStatusColor = (status: string): any => PROPERTY_STATUS_COLORS[status];

// Helper function to get property type color
export const getPropertyTypeColor = (type: string): any =>
  PROPERTY_TYPE_COLORS[type.toLowerCase()] || 'info';

// Helper function to get room type color
export const getRoomTypeColor = (type: string): any =>
  ROOM_TYPE_COLORS[type.toLowerCase()] || 'default';
