import { Request, Response } from "express";
import { getWeather } from "../services/external/openmeteo.service";

export async function weatherController(req: Request, res: Response) {
    try {
        const latitude = Number(req.query.lat);
        const longitude = Number(req.query.lon);

        const data = await getWeather(latitude, longitude);

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch weather"
        });
    }
}