'use client';

import type { CatalogDataDto, I18nControllerGetSupportedLanguagesV1200 } from '../../api/models';

// ----------------------------------------------------------------------

export interface AppContextValue {
  catalog: CatalogDataDto | null;
  supportedLanguages: I18nControllerGetSupportedLanguagesV1200 | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface AppProviderProps {
  children: React.ReactNode;
}
