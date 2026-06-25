/**
 * Small async helpers used by the aggregation layer to keep a single slow or
 * failing upstream from hanging / crashing an entire aggregated response.
 */

/** Reject if `promise` doesn't settle within `ms`. Bounds bare axios calls that
 *  have no timeout of their own. */
export function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label = "operation"
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms}ms`)),
            ms
        );
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}

/** Resolve to `fallback` instead of throwing. Lets us compose partial results
 *  with Promise.all and never fail the whole aggregation on one bad source. */
export async function safe<T>(
    promise: Promise<T>,
    fallback: T,
    label = "source"
): Promise<T> {
    try {
        return await promise;
    } catch (error) {
        console.error(`[aggregation] ${label} failed, using fallback:`, (error as Error).message);
        return fallback;
    }
}
