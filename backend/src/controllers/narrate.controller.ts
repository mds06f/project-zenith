import { Request, Response } from "express";
import { getReport } from "../services/aggregation/report.service";
import { Location, TimelineKey } from "../types/report.types";

const TIMELINE_KEYS: TimelineKey[] = ["now", "plus_1h", "plus_3h", "tonight", "tomorrow", "next_week"];

/**
 * GET /api/narrate?lat=&lng=&t=now
 * Standalone AI sky narration for the "Explain Tonight's Sky" button.
 *
 * Returns just the SkyNarration so the button has a lightweight, dedicated call
 * that is never tied to (and so never cancelled by) the keyed report query. The
 * narration always resolves: Gemini is wrapped in a timeout + deterministic
 * fallback upstream, so a 429/quota error still yields real narration text.
 */
export async function narrateController(req: Request, res: Response) {
    try {
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng ?? req.query.lon);

        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "lat and lng query parameters are required" });
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
        return res.status(200).json(report.narration);
    } catch (error) {
        console.error("Narration failed:", error);
        return res.status(500).json({ error: "Failed to generate narration" });
    }
}
