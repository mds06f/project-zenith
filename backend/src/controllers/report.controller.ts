import { Request, Response } from "express";
import { getReport } from "../services/aggregation/report.service";
import { Location, TimelineKey } from "../types/report.types";

const TIMELINE_KEYS: TimelineKey[] = ["now", "plus_1h", "plus_3h", "tonight", "tomorrow", "next_week"];

/**
 * GET /api/report/:lat/:lng?t=now&name=&tz=
 * The single aggregated payload that powers the whole dashboard.
 */
export async function reportController(req: Request, res: Response) {
    try {
        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Invalid lat/lng" });
        }

        const t = String(req.query.t ?? "now") as TimelineKey;
        const timeline: TimelineKey = TIMELINE_KEYS.includes(t) ? t : "now";

        const location: Location = {
            id: `coord-${lat.toFixed(3)},${lng.toFixed(3)}`,
            name: (req.query.name as string) || `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
            timezone: (req.query.tz as string) || "UTC",
            lat,
            lng
        };

        const report = await getReport(location, timeline);
        return res.status(200).json(report);
    } catch (error) {
        console.error("Report generation failed:", error);
        return res.status(500).json({ error: "Failed to generate report" });
    }
}
