'use client';

import type { AppContextValue } from './types';

import { createContext } from 'react';

// ----------------------------------------------------------------------

export const AppContext = createContext<AppContextValue | undefined>(undefined);
