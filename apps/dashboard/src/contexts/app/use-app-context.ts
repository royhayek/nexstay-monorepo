'use client';

import { useContext, useMemo } from 'react';

import type { CatalogItemDataDto } from 'src/api/models/admin';

import { AppContext } from './app-context';

// ----------------------------------------------------------------------

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}

/**
 * Hook to get all catalog data with loading and error states
 * Useful for checking catalog availability and managing loading/error states
 */
export function useCatalogs() {
  const { catalogs } = useAppContext();
  return catalogs;
}

/**
 * Hook to get supported languages data
 */
export function useSupportedLanguages() {
  const { supportedLanguages } = useAppContext();
  return supportedLanguages;
}

/**
 * Hook to get catalog options formatted for form select fields
 * Automatically uses the current language for labels
 *
 * @param catalogType - The type of catalog to fetch ('PropertyType', 'RoomType', 'BedType', 'CancellationPolicy', 'Amenity')
 * @returns Formatted options array with label, value, icon, and group
 *
 * @example
 * ```tsx
 * const propertyTypes = useCatalogOptions('PropertyType');
 * const amenities = useCatalogOptions('Amenity');
 *
 * <Select>
 *   {propertyTypes.map(option => (
 *     <MenuItem key={option.value} value={option.value}>
 *       {option.icon && <Icon name={option.icon} />}
 *       {option.label}
 *     </MenuItem>
 *   ))}
 * </Select>
 * ```
 */
export function useCatalogOptions(catalogType: string) {
  const { catalogs, currentLanguage } = useAppContext();

  return useMemo(() => {
    // Filter the flat array by catalogType
    const items: CatalogItemDataDto[] = catalogs.data.filter(
      (item) => item.catalogType === catalogType
    );

    return items
      .filter((item) => item.isActive && item.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        label: item.label[currentLanguage as keyof typeof item.label] || item.label.en || item.key,
        value: item.key,
        icon: item.icon,
        group: item.group,
      }));
  }, [catalogs.data, catalogType, currentLanguage]);
}
