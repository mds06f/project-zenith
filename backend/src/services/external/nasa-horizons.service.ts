import axios from "axios";
import { cached, TTL } from "../../utils/cache.util";

export async function getCelestialRawData(
    command: string,
    startDate: string,
    stopDate: string
): Promise<string> {

    // Horizons ephemerides for a given body+date are effectively static for the
    // day; cache 1h to spare the (slow) JPL endpoint on repeated/timeline fetches.
    const key = `horizons:${command}:${startDate}`;
    return cached<string>(key, TTL.HORIZONS, async () => {
        const response = await axios.get(
            "https://ssd.jpl.nasa.gov/api/horizons.api",
            {
                params: {

                    format: "json",

                    COMMAND: `'${command}'`,

                    EPHEM_TYPE: "OBSERVER",

                    CENTER: "'500@399'",

                    START_TIME: startDate,

                    STOP_TIME: stopDate,

                    STEP_SIZE: "'15 min'",

                    QUANTITIES: "'1'"
                },
                timeout: 8000
            }
        );

        return response.data.result;
    });
}