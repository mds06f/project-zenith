import {
    ObservationData,
    ObservationFactors
} from "../../types/observation.types";

/**
 * Observation Quality Score (0–100).
 *
 * MODEL: a normalised, weighted average of four bounded sub-scores.
 *
 * Each factor is first mapped to its own sub-score in [0,100] where 100 = ideal
 * and 0 = worst, then combined with fixed weights that sum to 1. Because every
 * sub-score is bounded and weighted, **no single factor can drive the result to
 * zero on its own** — a clear sky can no longer be cancelled out by city light
 * pollution alone, and a dark site is still penalised when it clouds over. This
 * is the deliberate fix for the previous model, which started at 100 and
 * subtracted independent penalties (up to −140 total) before clamping at 0, so a
 * large share of ordinary locations collapsed to exactly 0 with no
 * differentiation between them.
 *
 * Weights (rationale):
 *   cloud 0.45  — the dominant physical blocker; an overcast sky is the single
 *                 biggest obstacle, so it carries the most weight (but still
 *                 < 0.5, so it cannot solely determine the score).
 *   light 0.30  — sky darkness sets what is observable on a clear night.
 *   moon  0.15  — washes out faint objects, but the Moon, planets, ISS and
 *                 bright stars stay visible, so its influence is bounded.
 *   vis   0.10  — atmospheric transparency/haze; a secondary, noisier signal,
 *                 given the smallest weight.
 *
 * Condition bands follow an intuitive 20-point ladder:
 *   81–100 Excellent · 61–80 Good · 41–60 Fair · 21–40 Poor · 0–20 Very Poor
 */

const clamp = (n: number, lo: number, hi: number) =>
    Math.min(Math.max(n, lo), hi);

const WEIGHTS = {
    cloud: 0.45,
    light: 0.30,
    moon: 0.15,
    visibility: 0.10
} as const;

/**
 * Map each raw factor to a [0,100] sub-score (100 = best observing conditions).
 * Exported for testing / transparency; not part of the API response.
 */
export function observationSubScores(factors: ObservationFactors) {
    // Cloud cover 0–100 % → 100 (clear) … 0 (overcast). Linear and direct.
    const cloud = clamp(100 - factors.cloudCover, 0, 100);

    // Bortle 1 (pristine) → 100 … Bortle 9 (inner city) → 20. A city floor of
    // ~20 reflects that bright objects remain observable even under heavy light
    // pollution, instead of zeroing the contribution.
    const light = clamp(100 - (factors.bortleClass - 1) * 10, 0, 100);

    // Moon 0 % (new) → 100 … 100 % (full) → 30. Full moon hurts faint targets
    // but never blanks the sky, so the sub-score floors well above 0.
    const moon = clamp(100 - factors.moonIllumination * 0.7, 0, 100);

    // Visibility in km → 100 at ≥20 km, scaling down with haze/fog.
    const visibility = clamp((factors.visibility / 20) * 100, 0, 100);

    return { cloud, light, moon, visibility };
}

function conditionFor(score: number): string {
    if (score >= 81) return "Excellent";
    if (score >= 61) return "Good";
    if (score >= 41) return "Fair";
    if (score >= 21) return "Poor";
    return "Very Poor";
}

export function computeObservationScore(
    factors: ObservationFactors
): ObservationData {

    const s = observationSubScores(factors);

    const score = clamp(
        Math.round(
            WEIGHTS.cloud * s.cloud +
            WEIGHTS.light * s.light +
            WEIGHTS.moon * s.moon +
            WEIGHTS.visibility * s.visibility
        ),
        0,
        100
    );

    return {
        score,
        condition: conditionFor(score)
    };
}
