import { Request, Response } from "express";
import { getISSPasses } from "../services/external/n2yo.service";

export async function n2yoController(
    req: Request,
    res: Response
) {

    try {

        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);

        const passes = await getISSPasses(
            lat,
            lon
        );

        res.status(200).json(
            passes
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch passes"
        });

    }

}