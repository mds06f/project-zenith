import { bodyMap }
from "../../types/celestial.types";

import { PlanetDetailsDto }
from "../../dto/planet-details.dto";

import {
    getCelestialRawData
}
from "../external/nasa-horizons.service";

import {
    parseAltitudes
}
from "../../engine/celestial/altitude-parser.engine";

import {
    computeForecast
}
from "../../engine/celestial/forecast.engine";

import {
    parseVelocity
}
from "../../engine/celestial/velocity.engine";


export async function getPlanetDetails(
    body: string
): Promise<PlanetDetailsDto> {

    const command =
        bodyMap[body];

    if (!command) {

        throw new Error(
            "Invalid body"
        );

    }

    const now =
        new Date();

    const startDate =
        now
            .toISOString();

    const tomorrow =
        new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    const stopDate =
        tomorrow
            .toISOString();

    const raw =
        await getCelestialRawData(
            command,
            startDate,
            stopDate
        );
    
    const velocity =
    parseVelocity(
        raw
    );

    const samples =
        parseAltitudes(
            raw
        );

    const forecast =
        computeForecast(
            samples
        );

    return {

        body,

        altitude:
            forecast.altitude,

        velocity: velocity,

        nextPass:
            forecast.nextPass,

        maxElevation:
            forecast.maxElevation

    };

}