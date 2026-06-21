import { Request, Response } from "express";

import {
    getCelestialRawData
} from "../services/external/nasa-horizons.service";

import {
    bodyMap
} from "../types/celestial.types";

import {
    computeCelestialData
} from "../engine/celestial/celestial-computation.engine";

export async function celestialController(
    req: Request,
    res: Response
) {

    try {

        const body =
            req.query.body as string;

        const startDate =
            req.query.startDate as string;

        const stopDate =
            req.query.stopDate as string;

        if (
            !body ||
            !startDate ||
            !stopDate
        ) {

            return res.status(400).json({
                error: "Missing parameters"
            });

        }

        const command = bodyMap[body];

        if (!command) {

            return res.status(400).json({
                error: "Unknown celestial body"
            });

        }

        const raw =
            await getCelestialRawData(
                command,
                startDate,
                stopDate
            );

        const data =
            computeCelestialData(
                raw,
                body
            );

        res.status(200).json(
            data
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error:
                "Failed to compute celestial data"
        });

    }

}