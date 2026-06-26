/**
 * Minimal in-process TTL cache with hit/miss logging.
 *
 * NOTE: This is a pragmatic stand-in for the Redis layer described in the
 * blueprint (ioredis is a dependency but was never wired up). It is single-process
 * and resets on restart, but it gives the demo three real benefits the project
 * previously lacked entirely:
 *   - repeated location clicks / searches are instant (cache hit),
 *   - external rate-limited APIs (N2YO, Horizons, Gemini) are hit far less,
 *   - upstream latency/flakiness is hidden behind a recent good value.
 * Swapping this for ioredis later is a drop-in (same get/set signature).
 */
interface Entry {
    value: unknown;
    expires: number;
}

const store = new Map<string, Entry>();

/** Common TTLs (ms) so every cache site reads from one place. */
export const TTL = {
    LOCATION_SEARCH: 24 * 60 * 60 * 1000, // 24h
    REVERSE_GEOCODE: 24 * 60 * 60 * 1000, // 24h
    WEATHER: 10 * 60 * 1000,              // 10m
    ISS_TLE: 6 * 60 * 60 * 1000,          // 6h
    HORIZONS: 60 * 60 * 1000,             // 1h
    MOON: 60 * 60 * 1000,                 // 1h (USNO one-day figure is per-date)
    LIGHT_POLLUTION: 24 * 60 * 60 * 1000, // 24h (effectively static per coordinate)
    REPORT: 5 * 60 * 1000,                // 5m
    NARRATION: 30 * 60 * 1000             // 30m
} as const;

export function cacheGet<T>(key: string): T | null {
    const hit = store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expires) {
        store.delete(key);
        return null;
    }
    return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number): void {
    store.set(key, { value, expires: Date.now() + ttlMs });
}

/**
 * Cache-aside wrapper: return cached value or compute, store, and return it.
 * Logs a one-line [CACHE HIT]/[CACHE MISS] for each lookup so the speed-up from
 * repeated searches is visible in the server logs.
 */
export async function cached<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>
): Promise<T> {
    const hit = cacheGet<T>(key);
    if (hit !== null) {
        console.log(`[CACHE HIT]  ${key}`);
        return hit;
    }
    console.log(`[CACHE MISS] ${key}`);
    const value = await producer();
    cacheSet(key, value, ttlMs);
    return value;
}
