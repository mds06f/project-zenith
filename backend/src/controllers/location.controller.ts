import { Request, Response } from "express";
import { searchLocations, reverseGeocode } from "../services/external/geocoding.service";

/** GET /api/location/search?q=tokyo  -> Location[] (real worldwide geocoding) */
export async function locationSearchController(req: Request, res: Response) {
    try {
        const q = String(req.query.q ?? "").trim();
        if (!q) return res.status(200).json([]);
        const results = await searchLocations(q);
        return res.status(200).json(results);
    } catch (error) {
        console.error("Location search failed:", error);
        return res.status(500).json({ error: "Failed to search locations" });
    }
}

/** GET /api/location/:lat/:lng  -> Location (reverse geocode) */
export async function reverseGeocodeController(req: Request, res: Response) {
    try {
        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Invalid lat/lng" });
        }
        const location = await reverseGeocode(lat, lng);
        return res.status(200).json(location);
    } catch (error) {
        console.error("Reverse geocode failed:", error);
        return res.status(500).json({ error: "Failed to reverse geocode" });
    }
}
