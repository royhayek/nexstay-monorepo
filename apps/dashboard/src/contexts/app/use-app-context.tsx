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
 * Automatically uses the current language for labels and filters by catalog type(s)
 *
 * @param catalogTypes - Single catalog type or array of catalog types to fetch
 * @returns Formatted options array with label, value, icon, and group
 *
 * @example
 * ```tsx
 * // Single catalog type
 * const propertyTypes = useCatalogOptions('PropertyType');
 * const amenities = useCatalogOptions('Amenity');
 *
 * // Multiple catalog types
 * const housingOptions = useCatalogOptions(['PropertyType', 'RoomType']);
 *
 * // Use in a Select component
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
export function useCatalogOptions(catalogTypes: string | string[]) {
  const { catalogs, currentLanguage } = useAppContext();

  return useMemo(() => {
    const types = Array.isArray(catalogTypes) ? catalogTypes : [catalogTypes];
    const items: CatalogItemDataDto[] = catalogs.data || [];

    return items
      .filter((item) => types.includes(item.catalogType))
      .filter((item) => item.isActive && item.isVisible)
      .sort((a, b) => {
        // Sort by catalogType first, then sortOrder
        if (a.catalogType !== b.catalogType) {
          return a.catalogType.localeCompare(b.catalogType);
        }
        return a.sortOrder - b.sortOrder;
      })
      .map((item) => ({
        label: item.label[currentLanguage as keyof typeof item.label] || item.label.en || item.key,
        value: item.key,
        description: item.description?.[currentLanguage as keyof typeof item.description] || item.description?.en,
        icon: item.icon,
        group: item.group,
        catalogType: item.catalogType, // Include catalogType for grouping if needed
      }));
  }, [catalogs.data, catalogTypes, currentLanguage]);
}
