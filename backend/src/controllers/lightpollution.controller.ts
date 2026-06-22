import { Request, Response } from "express";
import { getLightPollution } from "../services/external/lightpollution.service";

export async function lightPollutionController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        const data = await getLightPollution(
            lat,
            lon
        );

        res.status(200).json(data);

    } catch {

        res.status(500).json({
            error: "Failed to fetch light pollution data"
        });

    }

}