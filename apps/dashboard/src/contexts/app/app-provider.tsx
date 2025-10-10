'use client';

import type { AppContextValue, AppProviderProps } from './types';

import { useMemo, useCallback } from 'react';

import { AppContext } from './app-context';
import { useCatalogsControllerGetCatalogsV1 } from '../../api/queries/catalogs/catalogs';
import { useI18nControllerGetSupportedLanguagesV1 } from '../../api/queries/internationalization/internationalization';

// ----------------------------------------------------------------------

export function AppProvider({ children }: AppProviderProps) {
  const {
    data: catalog,
    isLoading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useCatalogsControllerGetCatalogsV1(
    {
      include:
        'currencies,enumDisplays,amenityCategories,amenities,bedTypes,propertyTypes,roomTypes,cancellationPolicies,currencies,notificationTypes,paymentProviders',
      locale: 'en',
    },
    {
      query: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
    }
  );

  const {
    data: supportedLanguages,
    isLoading: languagesLoading,
    error: languagesError,
    refetch: refetchLanguages,
  } = useI18nControllerGetSupportedLanguagesV1({
    query: {
      staleTime: 30 * 60 * 1000, // 30 minutes (languages don't change often)
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  });

  const handleRefetch = useCallback(() => {
    refetchCatalog();
    refetchLanguages();
  }, [refetchCatalog, refetchLanguages]);

  const memoizedValue = useMemo<AppContextValue>(
    () => ({
      catalog: catalog?.data || null,
      supportedLanguages:
        (supportedLanguages as any)?.data?.supported || supportedLanguages || null,
      isLoading: catalogLoading || languagesLoading,
      error: (catalogError as Error | null) || (languagesError as Error | null) || null,
      refetch: handleRefetch,
    }),
    [
      catalog,
      supportedLanguages,
      catalogLoading,
      languagesLoading,
      catalogError,
      languagesError,
      handleRefetch,
    ]
  );

  return <AppContext.Provider value={memoizedValue}>{children}</AppContext.Provider>;
}
