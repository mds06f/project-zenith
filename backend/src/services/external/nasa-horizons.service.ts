import axios from "axios";

export async function getCelestialRawData(
    command: string,
    startDate: string,
    stopDate: string
): Promise<string> {

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

                STEP_SIZE: "'1 d'",

                QUANTITIES: "'1'"
            }
        }
    );

    return response.data.result;
}