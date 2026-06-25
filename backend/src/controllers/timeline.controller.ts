import { Request, Response } from "express";

import { predictTimeline } from "../engine/timeline/timeline-prediction.engine";
import { getObservation } from "../services/aggregation/observation.service";

/**
 * GET /api/timeline?lat=&lon=
 * Timeline/observation prediction driven by REAL conditions.
 *
 * Previously every input (score, cloud cover, light pollution, moon) was a
 * hardcoded constant, so the prediction was identical for every request. It now
 * pulls live observation data and feeds the real numbers into the engine.
 */
export async function timelineController(req: Request, res: Response) {
    try {
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon ?? req.query.lng);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({
                error: "lat and lon query parameters are required"
            });
        }

        const obs = await getObservation(lat, lon);

        const prediction = predictTimeline({
            observationScore: obs.score,
            cloudCover: obs.factors.cloudCover,
            moonAltitude: 0, // topocentric moon altitude not yet computed
            moonPhase: "Unknown",
            lightPollution: obs.factors.bortleClass,
            satelliteVisible: false
        });

        return res.status(200).json(prediction);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to predict timeline" });
    }
}
