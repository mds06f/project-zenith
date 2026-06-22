import { ObservationDto } from "../../dto/observation.dto";
import { ObservationFactorsDto } from "../../dto/observation-factors.dto";

import { getWeather } from "../external/openmeteo.service";
import { getAstronomyRawData } from "../external/astronomyapi.service";
import { getLightPollution } from "../external/lightpollution.service";

import {
    computeObservationScore
} from "../../engine/observational/observation-score.engine";

export async function getObservation(
    lat: number,
    lon: number
): Promise<ObservationDto> {

    const [
        weather,
        moon,
        lightPollution,
        visibility
    ] = await Promise.all([

        getWeather(
            lat,
            lon
        ),

        getAstronomyRawData(
            lat,
            lon
        ),

        getLightPollution(
            lat,
            lon
        ),
        getWeather(
            lat,
            lon
        )

    ]);

    const factors: ObservationFactorsDto = {

        cloudCover:
            weather.cloudCover,

        moonIllumination:
            moon.moonIllumination,

        bortleClass:
            lightPollution.bortleClass,

        visibility:
            visibility.visibility

    };

    const observation =
        computeObservationScore(
            factors
        );

    return {

        score:
            observation.score,

        condition:
            observation.condition,

        factors

    };

}