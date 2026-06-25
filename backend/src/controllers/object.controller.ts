import { Request, Response } from "express";
import { getReport } from "../services/aggregation/report.service";
import { Location } from "../types/report.types";

/**
 * GET /api/object/:id?lat=&lng=
 * Detail for a single celestial object (right-side panel). Reuses the cached
 * aggregated report and returns the matching object so ISS detail is real.
 */
export async function objectController(req: Request, res: Response) {
    try {
        const id = String(req.params.id);
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "lat and lng query params are required" });
        }

        const location: Location = {
            id: `coord-${lat.toFixed(3)},${lng.toFixed(3)}`,
            name: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
            timezone: "UTC",
            lat,
            lng
        };

        const report = await getReport(location, "now");
        const object = report.visibleTonight.find((o) => o.id === id);

        if (!object) {
            return res.status(404).json({ error: `Unknown object: ${id}` });
        }

        return res.status(200).json(object);
    } catch (error) {
        console.error("Object detail failed:", error);
        return res.status(500).json({ error: "Failed to fetch object detail" });
    }
}
