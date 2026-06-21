/**
 * File: src/app/providers.tsx
 * Purpose: Client-side provider boundary. Hosts the React Query client so the
 *          whole tree shares one cache. Kept separate from layout.tsx so the
 *          layout can stay a server component.
 * Future enhancement: add a theme provider + reduced-motion context here.
 */
'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session; created lazily so it isn't shared across
  // requests on the server.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
