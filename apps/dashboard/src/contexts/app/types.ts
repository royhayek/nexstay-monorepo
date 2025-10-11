'use client';

import type { EnumDisplayGroupsResponseDtoData } from 'src/api/models/admin';
import type { SupportedLanguagesDataDtoSupportedItem } from 'src/api/models/public';

// ----------------------------------------------------------------------

export interface AppContextValue {
  enumDisplays: {
    data: EnumDisplayGroupsResponseDtoData;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  currentLanguage: string;
  supportedLanguages: {
    data: SupportedLanguagesDataDtoSupportedItem[] | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  handleRefetch: () => void;
}

export interface AppProviderProps {
  children: React.ReactNode;
}
