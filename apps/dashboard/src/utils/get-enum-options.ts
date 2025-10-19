/**
 * Static enum options for system enums
 * Replaces deprecated enum-displays system
 */

export interface EnumOption {
  value: string;
  label: string;
}

const ENUM_OPTIONS: Record<string, EnumOption[]> = {
  BookingStatus: [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  PaymentStatus: [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'failed', label: 'Failed' },
  ],
  UserRole: [
    { value: 'guest', label: 'Guest' },
    { value: 'host', label: 'Host' },
    { value: 'admin', label: 'Admin' },
  ],
  UserStatus: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' },
  ],
};

export interface GetEnumOptionsConfig {
  prependOptions?: EnumOption[];
  appendOptions?: EnumOption[];
}

/**
 * Get static enum options for system enums
 * @param enumName - Name of the enum
 * @param config - Configuration options
 * @returns Array of enum options
 */
export function getEnumOptions(
  enumName: string,
  config?: GetEnumOptionsConfig
): EnumOption[] {
  const baseOptions = ENUM_OPTIONS[enumName] || [];
  const prependOptions = config?.prependOptions || [];
  const appendOptions = config?.appendOptions || [];

  return [...prependOptions, ...baseOptions, ...appendOptions];
}

/**
 * Get multiple enum options at once
 * @param enumNames - Array of enum names
 * @returns Record of enum names to their options
 */
export function getMultipleEnumOptions(
  enumNames: string[]
): Record<string, EnumOption[]> {
  const result: Record<string, EnumOption[]> = {};

  enumNames.forEach((enumName) => {
    result[enumName] = getEnumOptions(enumName);
  });

  return result;
}
