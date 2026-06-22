import { Request, Response } from "express";
import { getObservation } from "../services/aggregation/observation.service";

export async function observationController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        const observation = await getObservation(
            lat,
            lon
        );

        res.status(200).json(observation);

    } catch (error) {

        res.status(500).json({
            error: "Failed to generate observation score"
        });

    }
}