import { Request, Response } from "express";

import {
    getAstronomyRawData
} from "../services/external/astronomyapi.service";

export async function astronomyController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);

        const lon = Number(req.query.lon);

        const data =
            await getAstronomyRawData(
                lat,
                lon
            );

        res.status(200).json(
            data
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Failed to fetch moon data"
        });

    }

}