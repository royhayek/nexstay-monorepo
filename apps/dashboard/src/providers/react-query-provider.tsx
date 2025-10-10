'use client';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from 'src/lib/queryClient';

type Props = { children: React.ReactNode };

export default function ReactQueryProvider({ children }: Props) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
