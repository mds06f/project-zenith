import { AltitudeSample }
from "./altitude-parser.engine";

export interface ForecastData {

    altitude: number;

    nextPass: string;

    maxElevation: number;

}

export function computeForecast(
    samples: AltitudeSample[]
): ForecastData {

    const altitude =
        samples[0]?.altitude ?? 0;

    const maxElevation =
        Math.max(
            ...samples.map(
                sample =>
                    sample.altitude
            )
        );

    let nextPass =
        "Not visible";

    for (const sample of samples) {

        if (
            sample.altitude > 10
        ) {

            nextPass =
                sample.time;

            break;

        }

    }

    return {

        altitude,

        nextPass,

        maxElevation

    };

}