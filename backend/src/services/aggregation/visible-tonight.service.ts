import { bodyMap } from "../../types/celestial.types";
import { VisibleTonightDto } from "../../dto/visible-tonight.dto";

import {
    getCelestialRawData
} from "../external/nasa-horizons.service";

import {
    parseMagnitude
} from "../../engine/celestial/magnitude.engine";

export async function getVisibleTonight():
Promise<VisibleTonightDto[]> {

    const today = new Date()
        .toISOString()
        .split("T")[0]!;

    const visibleObjects: VisibleTonightDto[] = [];

    for (const [body, command] of Object.entries(bodyMap)) {

        try {

            const raw = await getCelestialRawData(
                command,
                today,
                today
            );


            visibleObjects.push({

                body,

                magnitude:
                    parseMagnitude(raw)

            });

        }

        catch (error) {

            console.error(
                `${body} failed`,
                error
            );

        }

    }

    return visibleObjects.sort(
        (a, b) =>
            a.magnitude - b.magnitude
    );

}