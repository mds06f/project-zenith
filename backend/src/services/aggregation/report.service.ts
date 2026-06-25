/**
 * Aggregation endpoint backing the entire frontend dashboard.
 *
 * Composes REAL sources into the exact `CelestialReport` shape the frontend
 * already expects (see types/report.types.ts <-> frontend/src/types/index.ts):
 *   - Observation score  -> Open-Meteo + USNO moon + light pollution (hardened)
 *   - ISS object         -> CelesTrak TLE + satellite.js propagation (real
 *                           altitude/velocity) + N2YO next-pass window
 *   - Planets            -> NASA Horizons visual magnitudes (parallel)
 *   - Narration          -> Google Gemini over the real numbers above
 *   - Events             -> real ISS pass derived from N2YO
 *
 * Every upstream is timeout-bounded and individually falls back, so the endpoint
 * degrades gracefully instead of 500-ing, and the whole report is cached briefly
 * to keep repeated demo interactions instant.
 */
import {
    CelestialReport,
    CelestialObject,
    CelestialEvent,
    ObservationScore,
    ObservationCondition,
    ObservationFactor,
    TimelineKey,
    Location,
    VisibilityWindow
} from "../../types/report.types";

import { getObservation } from "./observation.service";
import { getISSTLE } from "../external/celestrak.service";
import { getISSPasses } from "../external/n2yo.service";
import { getCelestialRawData } from "../external/nasa-horizons.service";
import { propagateSatellite } from "../../engine/celestial/satellite-propagation.engine";
import { parseMagnitude } from "../../engine/celestial/magnitude.engine";
import { generateInsight } from "../external/gemini.service";
import { bodyMap } from "../../types/celestial.types";
import { withTimeout, safe } from "../../utils/async.util";
import { cached } from "../../utils/cache.util";

const clamp = (n: number, min: number, max: number) =>
    Math.min(Math.max(n, min), max);

// Bright planets surfaced in "Visible Tonight", with sane fallback magnitudes
// used only if Horizons is slow/unavailable for that body.
const PLANETS: { name: string; fallbackMag: number }[] = [
    { name: "Venus", fallbackMag: -4.0 },
    { name: "Jupiter", fallbackMag: -2.2 },
    { name: "Saturn", fallbackMag: 0.7 },
    { name: "Mars", fallbackMag: 0.5 }
];

function mapScore(
    raw: { score: number; condition: string; factors: { cloudCover: number; moonIllumination: number; bortleClass: number; visibility: number } }
): ObservationScore {
    const f = raw.factors;
    const factors: ObservationFactor[] = [
        { key: "clouds", label: "Clouds", value: clamp(100 - f.cloudCover, 0, 100), detail: `${Math.round(f.cloudCover)}% cover` },
        { key: "lightPollution", label: "Light Pollution", value: clamp(100 - (f.bortleClass - 1) * 12.5, 0, 100), detail: `Bortle ${f.bortleClass}` },
        { key: "moonBrightness", label: "Moon Brightness", value: clamp(100 - f.moonIllumination, 0, 100), detail: `${Math.round(f.moonIllumination)}% illuminated` },
        { key: "atmosphericVisibility", label: "Atmospheric Visibility", value: clamp((f.visibility / 20) * 100, 0, 100), detail: `${f.visibility.toFixed(0)} km` }
    ];

    const condition: ObservationCondition =
        raw.condition === "Excellent" ? "Excellent" :
        raw.condition === "Good" ? "Good" :
        raw.condition === "Fair" ? "Fair" : "Poor";

    return { score: raw.score, condition, factors };
}

async function buildIss(lat: number, lon: number): Promise<CelestialObject> {
    // Real altitude + velocity from TLE propagation.
    let altitudeKm: number | null = 421;
    let velocityKmh: number | null = 27600;
    try {
        const tle = await withTimeout(getISSTLE(), 8000, "celestrak");
        const pos = propagateSatellite(tle.line1, tle.line2);
        altitudeKm = Math.round(pos.altitude);
        velocityKmh = Math.round(pos.velocity * 3600); // km/s -> km/h
    } catch (e) {
        console.error("[report] ISS propagation failed, using nominal values:", (e as Error).message);
    }

    // Real next visible pass from N2YO (key-gated; falls back to no window).
    let visibility: VisibilityWindow | null = null;
    let visibleNow = false;
    try {
        const passes: any = await withTimeout(getISSPasses(lat, lon), 8000, "n2yo");
        const first = passes?.passes?.[0];
        if (first?.startUTC) {
            const start = new Date(first.startUTC * 1000);
            const end = new Date((first.endUTC ?? first.startUTC + 360) * 1000);
            visibility = {
                start: start.toISOString(),
                end: end.toISOString(),
                maxElevationDeg: Math.round(first.maxEl ?? 0)
            };
            const now = Date.now();
            visibleNow = now >= start.getTime() && now <= end.getTime();
        }
    } catch (e) {
        console.error("[report] N2YO passes failed:", (e as Error).message);
    }

    return {
        id: "iss",
        name: "ISS",
        kind: "iss",
        magnitude: -3.5,
        orbital: { altitudeKm, velocityKmh, inclinationDeg: 51.6, periodMin: 92 },
        visibility,
        visibleNow
    };
}

async function buildPlanets(): Promise<CelestialObject[]> {
    const today = new Date().toISOString().split("T")[0]!;

    const planets = await Promise.all(
        PLANETS.map(async (p): Promise<CelestialObject> => {
            const command = bodyMap[p.name]!;
            const magnitude = await safe(
                withTimeout(
                    getCelestialRawData(command, today, today).then(parseMagnitude),
                    8000,
                    `horizons-${p.name}`
                ),
                p.fallbackMag,
                `horizons-${p.name}`
            );
            const mag = magnitude === 99 ? p.fallbackMag : magnitude;
            return {
                id: p.name.toLowerCase(),
                name: p.name,
                kind: "planet",
                magnitude: mag,
                orbital: { altitudeKm: null, velocityKmh: null },
                visibility: null,
                visibleNow: mag < 3
            };
        })
    );

    return planets.sort((a, b) => a.magnitude - b.magnitude);
}

async function buildNarration(
    location: Location,
    score: ObservationScore,
    objects: CelestialObject[]
): Promise<{ text: string; generatedAt: string }> {
    const iss = objects.find((o) => o.id === "iss");
    const brightest = objects.filter((o) => o.kind === "planet").sort((a, b) => a.magnitude - b.magnitude)[0];
    const clouds = score.factors.find((f) => f.key === "clouds")?.detail ?? "";
    const moon = score.factors.find((f) => f.key === "moonBrightness")?.detail ?? "";

    const issLine = iss?.visibility
        ? `The ISS next passes over with a maximum elevation of ${iss.visibility.maxElevationDeg}° (orbiting at ${iss.orbital.altitudeKm} km, ${iss.orbital.velocityKmh} km/h).`
        : `The ISS is orbiting at ${iss?.orbital.altitudeKm} km and ${iss?.orbital.velocityKmh} km/h.`;

    const prompt =
        `You are an astronomy assistant. In 2-3 concise, friendly sentences, summarise tonight's sky for an observer at ${location.name}. ` +
        `Use these REAL current readings: observation score ${score.score}/100 (${score.condition}); cloud cover ${clouds}; moon ${moon}; ` +
        `brightest visible planet ${brightest ? `${brightest.name} at magnitude ${brightest.magnitude}` : "none"}; ${issLine} ` +
        `Do not invent specific clock times you were not given.`;

    const fallback =
        `Conditions over ${location.name} are ${score.condition.toLowerCase()} tonight (score ${score.score}/100), with ${clouds} and the moon ${moon}. ` +
        (brightest ? `${brightest.name} is the brightest planet on view at magnitude ${brightest.magnitude}. ` : "") +
        issLine;

    const text = await safe(
        withTimeout(generateInsight(prompt), 12000, "gemini"),
        fallback,
        "gemini"
    );

    return { text: text.trim() || fallback, generatedAt: new Date().toISOString() };
}

function buildEvents(iss: CelestialObject): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    if (iss.visibility) {
        const start = new Date(iss.visibility.start).getTime();
        const mins = Math.max(0, Math.round((start - Date.now()) / 60000));
        events.push({
            id: "e-iss",
            kind: "iss_pass",
            title: "ISS Pass",
            at: iss.visibility.start,
            relativeLabel: mins > 0 ? `${mins} min` : "Now"
        });
    }
    return events;
}

export async function getReport(
    location: Location,
    timeline: TimelineKey
): Promise<CelestialReport> {
    const key = `report:${location.lat.toFixed(3)},${location.lng.toFixed(3)}:${timeline}`;

    return cached(key, 60_000, async () => {
        const [rawScore, iss, planets] = await Promise.all([
            safe(getObservation(location.lat, location.lng),
                { score: 50, condition: "Fair", factors: { cloudCover: 0, moonIllumination: 50, bortleClass: 5, visibility: 20 } },
                "observation"),
            buildIss(location.lat, location.lng),
            buildPlanets()
        ]);

        const score = mapScore(rawScore);
        const visibleTonight = [iss, ...planets];
        const narration = await buildNarration(location, score, visibleTonight);
        const events = buildEvents(iss);

        return { location, timeline, score, visibleTonight, events, narration };
    });
}
