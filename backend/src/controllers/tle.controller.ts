import { Request, Response } from "express";
import { getISSTLE } from "../services/external/celestrak.service";

export async function tleController(
    req: Request,
    res: Response
) {

    try {

        const tle = await getISSTLE();

        res.status(200).json(tle);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch TLE data"
        });

    }

}