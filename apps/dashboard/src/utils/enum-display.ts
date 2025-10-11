import type { EnumDisplayDataDto } from 'src/api/models/admin';

// ----------------------------------------------------------------------

export interface EnumOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Converts enum display data to option items for dropdowns/selects
 * @param enumDisplays - Array of enum display data
 * @param currentLanguage - Current language code (e.g., 'en', 'fr')
 * @param options - Additional options for customization
 * @returns Array of option items with value and label
 */
export function getEnumDisplayOptions(
  enumDisplays: EnumDisplayDataDto[] = [],
  currentLanguage = 'en',
  options: {
    includeHidden?: boolean;
    sortBy?: 'label' | 'sortOrder' | 'key';
    sortDirection?: 'asc' | 'desc';
  } = {}
): EnumOptionItem[] {
  const { includeHidden = false, sortBy = 'sortOrder', sortDirection = 'asc' } = options;

  // Filter out hidden items if needed
  let filteredDisplays = includeHidden
    ? enumDisplays
    : enumDisplays.filter((item) => item.isVisible !== false);

  // Sort the displays
  filteredDisplays = [...filteredDisplays].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'label':
        aValue = (a.label as Record<string, string>)?.[currentLanguage] || a.key;
        bValue = (b.label as Record<string, string>)?.[currentLanguage] || b.key;
        break;
      case 'sortOrder':
        aValue = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        bValue = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        break;
      case 'key':
      default:
        aValue = a.key;
        bValue = b.key;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'desc' ? -comparison : comparison;
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  return filteredDisplays.map((item) => ({
    value: item.key,
    label: (item.label as Record<string, string>)?.[currentLanguage] || item.key,
    disabled: item.isVisible === false,
  }));
}

/**
 * Get enum display options for a specific enum group
 * @param enumDisplaysData - The complete enum displays data object
 * @param enumName - Name of the enum group (e.g., 'UserStatus', 'UserRole')
 * @param currentLanguage - Current language code
 * @param options - Additional options for customization
 * @returns Array of option items
 */
export function getEnumOptionsFromGroup(
  enumDisplaysData: Record<string, EnumDisplayDataDto[]> = {},
  enumName: string,
  currentLanguage = 'en',
  options?: Parameters<typeof getEnumDisplayOptions>[2]
): EnumOptionItem[] {
  const enumDisplays = enumDisplaysData[enumName] || [];
  return getEnumDisplayOptions(enumDisplays, currentLanguage, options);
}

/**
 * Get a single enum display label by key
 * @param enumDisplays - Array of enum display data
 * @param key - The enum key to find
 * @param currentLanguage - Current language code
 * @returns The label for the key or the key itself if not found
 */
export function getEnumDisplayLabel(
  enumDisplays: EnumDisplayDataDto[] = [],
  key: string,
  currentLanguage = 'en'
): string {
  const item = enumDisplays.find((display) => display.key === key);
  return (item?.label as Record<string, string>)?.[currentLanguage] || key;
}

/**
 * Get a single enum display label from a group by key
 * @param enumDisplaysData - The complete enum displays data object
 * @param enumName - Name of the enum group
 * @param key - The enum key to find
 * @param currentLanguage - Current language code
 * @returns The label for the key or the key itself if not found
 */
export function getEnumLabelFromGroup(
  enumDisplaysData: Record<string, EnumDisplayDataDto[]> = {},
  enumName: string,
  key: string,
  currentLanguage = 'en'
): string {
  const enumDisplays = enumDisplaysData[enumName] || [];
  return getEnumDisplayLabel(enumDisplays, key, currentLanguage);
}
