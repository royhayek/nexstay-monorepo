'use client';

import type { AppContextValue, AppProviderProps } from './types';

import { useMemo, useCallback } from 'react';

import { useI18nPublicControllerGetSupportedLanguages } from 'src/api/queries/public/internationalization-public/internationalization-public';
import { useCatalogAdminControllerFindAll } from 'src/api/queries/admin/catalogs-admin/catalogs-admin';

import { AppContext } from './app-context';

// ----------------------------------------------------------------------

export function AppProvider({ children }: AppProviderProps) {
  const {
    data: supportedLanguages,
    isLoading: isLoadingLanguages,
    error: isErrorLanguages,
    refetch: refetchLanguages,
  } = useI18nPublicControllerGetSupportedLanguages({
    query: {
      staleTime: 30 * 60 * 1000, // 30 minutes (languages don't change often)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  });

  // Fetch catalog data for property-related options
  const {
    data: catalogResponse,
    isLoading: isLoadingCatalogs,
    error: catalogError,
    refetch: refetchCatalogs,
  } = useCatalogAdminControllerFindAll(
    {
      // Fetch common catalog types used in forms
      catalogType: 'PropertyType,RoomType,BedType,CancellationPolicy,Amenity',
      page: 1,
      limit: 1000, // Get all items (catalogs are typically small)
      search: '',
      group: '',
      isActive: true,
      includeDeleted: false,
    },
    {
      query: {
        staleTime: 30 * 60 * 1000, // 30 minutes (catalogs don't change often)
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    }
  );

  const handleRefetch = useCallback(() => {
    refetchLanguages();
    refetchCatalogs();
  }, [refetchLanguages, refetchCatalogs]);

  const currentLanguage = useMemo(
    () => (supportedLanguages as any)?.data?.current || 'en',
    [supportedLanguages]
  );

  const supportedLanguagesList = useMemo(
    () => ((supportedLanguages as any)?.data?.supported as any[]) || [],
    [supportedLanguages]
  );

  // Get catalog items array (no pre-filtering - components will filter what they need)
  const catalogData = useMemo(() => catalogResponse?.data?.items || [], [catalogResponse]);

  const memoizedValue = useMemo<AppContextValue>(
    () => ({
      currentLanguage,
      supportedLanguages: {
        data: supportedLanguagesList,
        isLoading: isLoadingLanguages,
        error: isErrorLanguages as Error | null,
        refetch: refetchLanguages,
      },
      catalogs: {
        data: catalogData,
        isLoading: isLoadingCatalogs,
        error: catalogError as Error | null,
        refetch: refetchCatalogs,
      },
      handleRefetch,
    }),
    [
      currentLanguage,
      supportedLanguagesList,
      isLoadingLanguages,
      isErrorLanguages,
      refetchLanguages,
      catalogData,
      isLoadingCatalogs,
      catalogError,
      refetchCatalogs,
      handleRefetch,
    ]
  );

  return <AppContext.Provider value={memoizedValue}>{children}</AppContext.Provider>;
}
