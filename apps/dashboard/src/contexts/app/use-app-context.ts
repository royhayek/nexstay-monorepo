'use client';

import type { AppContextValue } from './types';

import { useContext } from 'react';

import { AppContext } from './app-context';

// ----------------------------------------------------------------------

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return context;
}
