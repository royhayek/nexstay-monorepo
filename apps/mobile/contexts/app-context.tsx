import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useCatalogPublicControllerGetCatalogs } from "@/api/queries/public/catalogs-public/catalogs-public";
import type { CatalogFilterOptionDto } from "@/api/models/public";

// ====================================================================================
// Types
// ====================================================================================

export interface AppContextValue {
  currentLanguage: string;
  catalogs: {
    data: CatalogFilterOptionDto[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  handleRefetch: () => void;
}

export interface AppProviderProps {
  children: ReactNode;
}

interface CatalogOption {
  label: string;
  value: string;
  description?: string;
  icon?: string;
  group?: string;
  catalogType: string;
}

// ====================================================================================
// Context
// ====================================================================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ====================================================================================
// Provider Component
// ====================================================================================

export function AppProvider({ children }: AppProviderProps) {
  // Fetch all catalog types at once
  const {
    data: catalogResponse,
    isLoading: catalogsLoading,
    error: catalogsError,
    refetch: refetchCatalogs,
  } = useCatalogPublicControllerGetCatalogs({
    include: "PropertyType,RoomType,BedType,CancellationPolicy,Amenity",
    locale: "en",
  });

  // Extract catalog data as flat array from grouped response
  // Response structure: { "Amenity": [...], "BedType": [...], etc. }
  const catalogData = useMemo(() => {
    if (!catalogResponse?.data) return [];

    // Flatten the grouped object into a single array
    // The public endpoint returns catalogs grouped by type
    const grouped = catalogResponse.data as unknown as Record<string, CatalogFilterOptionDto[]>;
    return Object.values(grouped).flat();
  }, [catalogResponse]);

  const currentLanguage = "en";

  const handleRefetch = () => {
    refetchCatalogs();
  };

  const value: AppContextValue = {
    currentLanguage,
    catalogs: {
      data: catalogData,
      isLoading: catalogsLoading,
      error: catalogsError as Error | null,
      refetch: refetchCatalogs,
    },
    handleRefetch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ====================================================================================
// Hooks
// ====================================================================================

/**
 * Hook to access app context
 */
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}

/**
 * Hook to get all catalog data with loading and error states
 */
export function useCatalogs() {
  const { catalogs } = useAppContext();
  return catalogs;
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
 * ```
 */
export function useCatalogOptions(catalogTypes: string | string[]): CatalogOption[] {
  const { catalogs, currentLanguage } = useAppContext();

  return useMemo(() => {
    const types = Array.isArray(catalogTypes) ? catalogTypes : [catalogTypes];
    const items: CatalogFilterOptionDto[] = catalogs.data || [];

    return items
      .filter((item) => types.includes(item.catalogType))
      .filter((item) => item.isVisible)
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
        catalogType: item.catalogType,
      }));
  }, [catalogs.data, catalogTypes, currentLanguage]);
}
