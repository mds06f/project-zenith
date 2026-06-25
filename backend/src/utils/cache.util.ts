/**
 * Minimal in-process TTL cache.
 *
 * NOTE: This is a pragmatic stand-in for the Redis layer described in the
 * blueprint (Redis is a dependency but was never wired up). It is single-process
 * and resets on restart, but it gives the demo three real benefits the project
 * previously lacked entirely:
 *   - repeated location clicks are instant (cache hit),
 *   - external rate-limited APIs (N2YO, Horizons, Gemini) are hit far less,
 *   - upstream latency/flakiness is hidden behind a recent good value.
 * Swapping this for ioredis later is a drop-in (same get/set signature).
 */
interface Entry {
    value: unknown;
    expires: number;
}

const store = new Map<string, Entry>();

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

/** Cache-aside wrapper: return cached value or compute, store, and return it. */
export async function cached<T>(
    key: string,
    ttlMs: number,
    producer: () => Promise<T>
): Promise<T> {
    const hit = cacheGet<T>(key);
    if (hit !== null) return hit;
    const value = await producer();
    cacheSet(key, value, ttlMs);
    return value;
}
