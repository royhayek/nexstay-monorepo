'use client';

import type { AppContextValue, AppProviderProps } from './types';

import { useMemo, useCallback } from 'react';

import { useEnumDisplaysAdminControllerFindAll } from 'src/api/queries/admin/enum-displays-management/enum-displays-management';
import { useI18nPublicControllerGetSupportedLanguages } from 'src/api/queries/public/internationalization-public/internationalization-public';

import { useAuthContext } from 'src/auth/hooks';

import { AppContext } from './app-context';

// ----------------------------------------------------------------------

export function AppProvider({ children }: AppProviderProps) {
  const { authenticated } = useAuthContext();

  const {
    data: enumDisplaysResponse,
    isLoading: isLoadingEnumDisplays,
    error: isErrorEnumDisplays,
    refetch: refetchEnumDisplays,
  } = useEnumDisplaysAdminControllerFindAll({
    query: {
      enabled: authenticated,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  });

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

  const handleRefetch = useCallback(() => {
    refetchEnumDisplays();
    refetchLanguages();
  }, [refetchEnumDisplays, refetchLanguages]);

  const enumDisplaysObject = useMemo(
    () => enumDisplaysResponse?.data || {},
    [enumDisplaysResponse?.data]
  );

  const currentLanguage = useMemo(
    () => supportedLanguages?.data?.current || 'en',
    [supportedLanguages]
  );

  const supportedLanguagesList = useMemo(
    () => supportedLanguages?.data?.supported || [],
    [supportedLanguages]
  );

  const memoizedValue = useMemo<AppContextValue>(
    () => ({
      enumDisplays: {
        data: enumDisplaysObject,
        isLoading: isLoadingEnumDisplays,
        error: isErrorEnumDisplays,
        refetch: refetchEnumDisplays,
      },
      currentLanguage,
      supportedLanguages: {
        data: supportedLanguagesList,
        isLoading: isLoadingLanguages,
        error: isErrorLanguages,
        refetch: refetchLanguages,
      },
      handleRefetch,
    }),
    [
      enumDisplaysObject,
      isLoadingEnumDisplays,
      isErrorEnumDisplays,
      refetchEnumDisplays,
      currentLanguage,
      supportedLanguagesList,
      isLoadingLanguages,
      isErrorLanguages,
      refetchLanguages,
      handleRefetch,
    ]
  );

  return <AppContext.Provider value={memoizedValue}>{children}</AppContext.Provider>;
}
