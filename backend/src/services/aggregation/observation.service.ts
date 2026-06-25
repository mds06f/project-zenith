import { ObservationDto } from "../../dto/observation.dto";
import { ObservationFactorsDto } from "../../dto/observation-factors.dto";

import { getWeather } from "../external/openmeteo.service";
import { getAstronomyRawData } from "../external/astronomyapi.service";
import { getLightPollution } from "../external/lightpollution.service";

import {
    computeObservationScore
} from "../../engine/observational/observation-score.engine";

import { withTimeout, safe } from "../../utils/async.util";

/**
 * Aggregate the Observation Quality Score from real sources.
 *
 * Hardened vs. the original:
 *  - one weather call instead of two (the old code fetched it twice),
 *  - every upstream is timeout-bounded and falls back instead of 500-ing the
 *    whole score when one source (esp. the flaky light-pollution endpoint) dies,
 *  - visibility is converted metres -> km before scoring. Open-Meteo returns
 *    metres (~24000), so the engine's `10 - visibility` term was always <= 0 and
 *    the "atmospheric visibility" factor never affected the score. Now it does.
 */
export async function getObservation(
    lat: number,
    lon: number
): Promise<ObservationDto> {

    const [weather, moon, lightPollution] = await Promise.all([
        safe(withTimeout(getWeather(lat, lon), 8000, "open-meteo"),
            { cloudCover: 0, visibility: 20000 }, "open-meteo"),
        safe(withTimeout(getAstronomyRawData(lat, lon), 8000, "usno-moon"),
            { moonIllumination: 50 }, "usno-moon"),
        safe(withTimeout(getLightPollution(lat, lon), 8000, "light-pollution"),
            { bortleClass: 5 }, "light-pollution")
    ]);

    const visibilityKm = (weather.visibility ?? 20000) / 1000;

    const factors: ObservationFactorsDto = {
        cloudCover: weather.cloudCover ?? 0,
        moonIllumination: moon.moonIllumination,
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
