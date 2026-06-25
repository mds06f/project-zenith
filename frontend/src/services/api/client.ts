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

/** Hard ceiling on any single live request so a slow/dead gateway can't hang
 *  the UI — on timeout the caller falls back to the mock layer. */
const REQUEST_TIMEOUT_MS = 15_000;

/** True when an error is an AbortError (fetch was cancelled, not a real failure). */
export const isAbortError = (err: unknown): boolean =>
  err instanceof DOMException ? err.name === 'AbortError' : (err as { name?: string })?.name === 'AbortError';

/**
 * request — typed fetch against the live gateway.
 * @param path endpoint path beginning with "/", e.g. "/api/report/22.5/88.3"
 * @param externalSignal optional caller signal; aborting it cancels the request
 *        (used to drop superseded location/report fetches without a wasted round-trip)
 * @returns parsed JSON typed as T
 * @throws ApiError on network failure, timeout, or non-2xx response; AbortError
 *         when the timeout fires or the caller cancels via externalSignal.
 */
export async function request<T>(path: string, externalSignal?: AbortSignal): Promise<T> {
  // Internal controller enforces the timeout AND mirrors any external cancellation
  // so a single `signal` drives the fetch (broad browser support, no AbortSignal.any).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`Request failed: ${path}`, res.status);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

/**
 * liveOrMock — run a live request when configured, but transparently fall back
 * to the deterministic mock on ANY failure (gateway down, timeout, non-2xx).
 *
 * This is the heart of the demo-reliability strategy: with the backend running
 * the UI shows real data; if a single upstream (or the whole backend) is
 * unavailable, the user still sees a coherent dashboard instead of an error.
 *
 * @param path  live endpoint path
 * @param mock  deterministic producer used in mock mode or as the safety net
 * @param transform optional post-processor applied to the live payload only
 * @param signal optional caller signal; when the caller cancels (e.g. a newer
 *        globe click supersedes this one) we re-throw quietly instead of warning
 *        or falling back to mock — an intentional abort is not a failure.
 */
export async function liveOrMock<T>(
  path: string,
  mock: () => T,
  transform: (live: T) => T = (x) => x,
  signal?: AbortSignal
): Promise<T> {
  if (isMock()) return mockResolve(mock);
  try {
    const data = await request<T>(path, signal);
    return transform(data);
  } catch (err) {
    // Intentional cancellation by the caller: stay silent, don't fall back to
    // mock — the result is being discarded on purpose.
    if (signal?.aborted || (isAbortError(err) && signal)) throw err;
    if (typeof console !== 'undefined') {
      console.warn(`[api] live ${path} failed — falling back to mock`, err);
    }
    return mock();
  }
}
