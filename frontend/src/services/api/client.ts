/**
 * File: src/services/api/client.ts
 * Purpose: A thin transport seam. Every service goes through `request()` so that
 *          flipping NEXT_PUBLIC_DATA_SOURCE from "mock" → "live" swaps the entire
 *          app onto the real gateway without touching any component.
 *
 * Error handling notes:
 *  - Mock branch resolves a deterministic value after MOCK_LATENCY_MS.
 *  - Live branch throws `ApiError` (with status) on non-2xx; callers/React Query
 *    surface this through the standard error state.
 */
import { MOCK_LATENCY_MS } from '@/lib/constants';

const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** True when the app should serve from the in-repo mock layer. */
export const isMock = (): boolean => DATA_SOURCE !== 'live' || BASE_URL === '';

/** Resolve a mock value after a simulated round-trip (keeps loading states real). */
export function mockResolve<T>(producer: () => T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(producer()), MOCK_LATENCY_MS)
  );
}

/**
 * request — typed fetch against the live gateway.
 * @param path endpoint path beginning with "/", e.g. "/observation/22.5/88.3"
 * @returns parsed JSON typed as T
 * @throws ApiError on network failure or non-2xx response
 */
export async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new ApiError(`Request failed: ${path}`, res.status);
  }
  return (await res.json()) as T;
}
