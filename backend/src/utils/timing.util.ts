/**
 * Tiny profiling helper. Wraps a promise, logs how long it took, and (crucially)
 * still resolves/rejects with the original result so it can be dropped in around
 * any existing await without changing behaviour.
 *
 *   const weather = await timed("open-meteo", getWeather(lat, lon));
 *   → [TIMING] open-meteo            142ms
 *
 * Used to profile the cold-report bottleneck (Priority 4). Timings are also
 * collected per-stage in the report aggregator via `mark()`.
 */
export async function timed<T>(label: string, promise: Promise<T>): Promise<T> {
    const start = Date.now();
    try {
        return await promise;
    } finally {
        const ms = Date.now() - start;
        console.log(`[TIMING] ${label.padEnd(22)} ${ms}ms`);
    }
}

/** Returns a stopwatch that prints `label … Nms` when `.end()` is called. */
export function stopwatch(label: string) {
    const start = Date.now();
    return {
        end(extra = "") {
            const ms = Date.now() - start;
            console.log(`[TIMING] ${label.padEnd(22)} ${ms}ms${extra ? "  " + extra : ""}`);
            return ms;
        }
    };
}
