import type { EnumOptionItem } from 'src/utils/enum-display';

import { useMemo } from 'react';

import { getEnumLabelFromGroup, getEnumOptionsFromGroup } from 'src/utils/enum-display';

import { useAppContext } from 'src/contexts/app';

// ----------------------------------------------------------------------

/**
 * Hook to get enum display options for a specific enum group
 * @param enumName - Name of the enum group (e.g., 'UserStatus', 'UserRole')
 * @param options - Additional options for customization
 * @returns Array of option items
 */
export function useEnumDisplayOptions(
  enumName: string,
  options?: {
    includeHidden?: boolean;
    sortBy?: 'label' | 'sortOrder' | 'key';
    sortDirection?: 'asc' | 'desc';
    prependOptions?: EnumOptionItem[];
  }
): EnumOptionItem[] {
  const { enumDisplays, currentLanguage } = useAppContext();

  return useMemo(() => {
    if (!enumDisplays.data || enumDisplays.isLoading) {
      return options?.prependOptions || [];
    }

    const enumOptions = getEnumOptionsFromGroup(enumDisplays.data, enumName, currentLanguage, options);
    return options?.prependOptions ? [...options.prependOptions, ...enumOptions] : enumOptions;
  }, [enumDisplays.data, enumDisplays.isLoading, enumName, currentLanguage, options]);
}

/**
 * Hook to get a single enum display label by key
 * @param enumName - Name of the enum group
 * @param key - The enum key to find
 * @returns The label for the key or the key itself if not found
 */
export function useEnumDisplayLabel(enumName: string, key: string): string {
  const { enumDisplays, currentLanguage } = useAppContext();

  return useMemo(() => {
    if (!enumDisplays.data || enumDisplays.isLoading) {
      return key;
    }

    return getEnumLabelFromGroup(enumDisplays.data, enumName, key, currentLanguage);
  }, [enumDisplays.data, enumDisplays.isLoading, enumName, key, currentLanguage]);
}

/**
 * Hook to get multiple enum display options at once
 * @param enumNames - Array of enum group names
 * @param options - Additional options for customization
 * @returns Object with enum names as keys and option arrays as values
 */
export function useMultipleEnumDisplayOptions(
  enumNames: string[],
  options?: {
    includeHidden?: boolean;
    sortBy?: 'label' | 'sortOrder' | 'key';
    sortDirection?: 'asc' | 'desc';
    prependOptions?: EnumOptionItem[];
  }
): Record<string, EnumOptionItem[]> {
  const { enumDisplays, currentLanguage } = useAppContext();

  return useMemo(() => {
    if (!enumDisplays.data || enumDisplays.isLoading) {
      return enumNames.reduce(
        (acc, enumName) => {
          acc[enumName] = options?.prependOptions || [];
          return acc;
        },
        {} as Record<string, EnumOptionItem[]>
      );
    }

    return enumNames.reduce(
      (acc, enumName) => {
        const enumOptions = getEnumOptionsFromGroup(
          enumDisplays.data,
          enumName,
          currentLanguage,
          options
        );
        acc[enumName] = options?.prependOptions ? [...options.prependOptions, ...enumOptions] : enumOptions;
        return acc;
      },
      {} as Record<string, EnumOptionItem[]>
    );
  }, [enumDisplays.data, enumDisplays.isLoading, enumNames, currentLanguage, options]);
}
