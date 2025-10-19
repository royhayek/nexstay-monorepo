'use client';

import type { CatalogItemDataDto } from 'src/api/models/admin';
import type { SupportedLanguagesDataDtoSupportedItem } from 'src/api/models/public';

// ----------------------------------------------------------------------

export interface AppContextValue {
  currentLanguage: string;
  supportedLanguages: {
    data: SupportedLanguagesDataDtoSupportedItem[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  catalogs: {
    data: CatalogItemDataDto[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  handleRefetch: () => void;
}

export interface AppProviderProps {
  children: React.ReactNode;
}
