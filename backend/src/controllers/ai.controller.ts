import { Request, Response } from "express";

import { getReport } from "../services/aggregation/report.service";
import { Location } from "../types/report.types";

/**
 * GET /api/ai?lat=&lon=
 * Real, location-aware AI sky narration.
 *
 * Previously this endpoint fed Gemini a block of HARDCODED constants (fixed
 * score, cloud cover, constellation, RA/Dec) and so produced the same answer for
 * everywhere on Earth. It now runs the real aggregation pipeline (live weather,
 * moon, ISS, planets) and returns Gemini's narration over those actual numbers.
 */
export async function aiController(req: Request, res: Response) {
    try {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon ?? req.query.lng);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({
                error: "lat and lon query parameters are required"
            });
        }

        const location: Location = {
            id: `coord-${lat.toFixed(3)},${lon.toFixed(3)}`,
            name: `${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
            timezone: "UTC",
            lat,
            lng: lon
        };

        const report = await getReport(location, "now");

        return res.status(200).json({
            report: report.narration.text,
            score: report.score.score,
            condition: report.score.condition,
            generatedAt: report.narration.generatedAt
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to generate insight" });
    }
}
