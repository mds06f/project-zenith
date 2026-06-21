import { Request, Response } from "express";

import {
    getAstronomyRawData
} from "../services/external/astronomyapi.service";

import {
    computeAstronomyData
} from "../engine/celestial/astronomy-computation.engine";

export async function astronomyController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);

        const lon = Number(req.query.lon);

        const raw =
            await getAstronomyRawData(
                lat,
                lon
            );

        const data =
            computeAstronomyData(
                raw
            );

        res.status(200).json(
            data
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Failed to fetch astronomy data"
        });

    }

}