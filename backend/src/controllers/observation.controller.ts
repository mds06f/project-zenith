import { Request, Response } from "express";
import { getObservation } from "../services/aggregation/observation.service";

export async function observationController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        if (isNaN(lat) || isNaN(lon)) {

            return res.status(400).json({
                error: "Please provide valid lat and lon query parameters"
            });

        }

        const observation = await getObservation(
            lat,
            lon
        );

        return res.status(200).json(
            observation
        );

    } catch (error) {

        console.error(
            "Observation generation failed:",
            error
        );

        return res.status(500).json({
            error: "Failed to generate observation score"
        });

    }

}