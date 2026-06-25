import axios from "axios";
import { Location } from "../../types/report.types";

/**
 * Forward geocode: free-text place name -> ranked Locations.
 * Uses Open-Meteo's geocoding API (keyless). This replaces the frontend's
 * hardcoded 6-city offline gazetteer with real, worldwide search.
 */
export async function searchLocations(query: string): Promise<Location[]> {
    const response = await axios.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        { params: { name: query, count: 6, language: "en", format: "json" }, timeout: 8000 }
    );

    const results = response.data?.results;
    if (!Array.isArray(results)) return [];

    return results.map((r: any): Location => {
        const loc: Location = {
            id: String(r.id ?? `${r.latitude},${r.longitude}`),
            name: r.name,
            timezone: r.timezone ?? "UTC",
            lat: r.latitude,
            lng: r.longitude
        };
        if (r.admin1) loc.region = r.admin1;
        if (r.country) loc.country = r.country;
        return loc;
    });
}

/**
 * Reverse geocode: coordinates -> a named Location.
 * Uses BigDataCloud's keyless reverse-geocode endpoint, falling back to a
 * coordinate label if it is unavailable (so a globe click always resolves).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<Location> {
    const fallback: Location = {
        id: `coord-${lat.toFixed(3)},${lng.toFixed(3)}`,
        name: `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`,
        timezone: "UTC",
        lat,
        lng
    };

    try {
        const response = await axios.get(
            "https://api.bigdatacloud.net/data/reverse-geocode-client",
            { params: { latitude: lat, longitude: lng, localityLanguage: "en" }, timeout: 8000 }
        );

        const d = response.data ?? {};
        const name: string =
            d.city || d.locality || d.principalSubdivision || fallback.name;

        const loc: Location = {
            id: `coord-${lat.toFixed(3)},${lng.toFixed(3)}`,
            name,
            timezone: "UTC",
            lat,
            lng
        };
        if (d.principalSubdivision) loc.region = d.principalSubdivision;
        if (d.countryName) loc.country = d.countryName;
        return loc;
    } catch {
        return fallback;
    }
}
