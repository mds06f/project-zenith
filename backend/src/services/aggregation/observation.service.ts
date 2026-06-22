import { getWeather } from "../external/openmeteo.service";
import { calculateObservationScore } from "../../engine/observational/observation-score.engine";

export async function getObservation(
    lat: number,
    lon: number
) {

    const weather = await getWeather(lat, lon);

    return calculateObservationScore(
        weather.cloudCover,
        weather.humidity,
        weather.windSpeed
    );
}