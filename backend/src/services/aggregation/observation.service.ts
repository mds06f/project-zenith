import { ObservationDto } from "../../dto/observation.dto";
import { ObservationFactorsDto } from "../../dto/observation-factors.dto";

import { getWeather } from "../external/openmeteo.service";
import { getLightPollution } from "../external/lightpollution.service";
import { getMoonIllumination } from "../../engine/astronomy/suncalc.engine";

import {
    computeObservationScore
} from "../../engine/observational/observation-score.engine";

import { withTimeout, safe } from "../../utils/async.util";
import { timed } from "../../utils/timing.util";

/**
 * Aggregate the Observation Quality Score from real sources, for a target time.
 *
 * Hardened / time-aware:
 *  - one cached weather call; the hourly forecast is sampled at `when`, so the
 *    score genuinely differs across the timeline (Now / +1h / Tonight / …),
 *  - moon illumination is computed locally (SunCalc) for `when` — accurate, free,
 *    instant, and date-sensitive (no more flaky USNO round-trip),
 *  - every remaining upstream is timeout-bounded and falls back instead of
 *    500-ing the whole score when one source (esp. light pollution) dies,
 *  - visibility is converted metres -> km before scoring.
 */
export async function getObservation(
    lat: number,
    lon: number,
    when: Date = new Date()
): Promise<ObservationDto> {

    const [weather, lightPollution] = await Promise.all([
        safe(withTimeout(timed("open-meteo", getWeather(lat, lon, when)), 8000, "open-meteo"),
            { cloudCover: 0, visibility: 20000 }, "open-meteo"),
        safe(withTimeout(timed("light-pollution", getLightPollution(lat, lon)), 8000, "light-pollution"),
            { bortleClass: 5 }, "light-pollution")
    ]);

    const moonIllumination = Math.round(getMoonIllumination(when).fraction * 100);
    const visibilityKm = (weather.visibility ?? 20000) / 1000;

    const factors: ObservationFactorsDto = {
        cloudCover: weather.cloudCover ?? 0,
        moonIllumination,
        bortleClass: lightPollution.bortleClass,
        visibility: visibilityKm
    };

    const observation = computeObservationScore(factors);

    return {
        score: observation.score,
        condition: observation.condition,
        factors
    };
}
