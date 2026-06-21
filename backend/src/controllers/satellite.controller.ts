import { Request, Response } from "express";
import { getISSPosition } from "../services/external/open-notify.service";
import { getISSTLE } from "../services/external/celestrak.service";
import { propagateSatellite } from "../engine/celestial/satellite-propagation.engine";

export async function satelliteController(
    req: Request,
    res: Response
) {

    try {

        const iss = await getISSPosition();

        res.status(200).json(iss);

    } catch (error) {

        res.status(500).json({
            error: "Failed to fetch ISS position"
        });

    }

}

export async function satellitePositionController(
    req: Request,
    res: Response
) {

    try {

        const tle = await getISSTLE();

        const position = propagateSatellite(
            tle.line1,
            tle.line2
        );

        res.status(200).json({
            name: tle.name,
            ...position
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to compute satellite position"
        });

    }

}