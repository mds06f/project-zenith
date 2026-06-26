/**
 * Server-side mirror of the frontend's domain contract
 * (frontend/src/types/index.ts). The aggregation endpoints return exactly these
 * shapes so the frontend can consume them with zero transformation.
 */

export interface Location {
    id: string;
    name: string;
    region?: string;
    country?: string;
    timezone: string;
    lat: number;
    lng: number;
}

export type TimelineKey =
    | "now"
    | "plus_1h"
    | "plus_3h"
    | "tonight"
    | "tomorrow"
    | "next_week";

export type ObservationCondition = "Excellent" | "Good" | "Fair" | "Poor";

export type ObservationFactorKey =
    | "clouds"
    | "lightPollution"
    | "moonBrightness"
    | "atmosphericVisibility";

export interface ObservationFactor {
    key: ObservationFactorKey;
    label: string;
    value: number; // 0–100, higher = better for the observer
    detail: string;
}

export interface ObservationScore {
    score: number;
    condition: ObservationCondition;
    factors: ObservationFactor[];
}

export type CelestialObjectKind =
    | "satellite"
    | "iss"
    | "planet"
    | "star"
    | "moon";

export interface OrbitalData {
    altitudeKm: number | null;
    velocityKmh: number | null;
    inclinationDeg?: number;
    periodMin?: number;
}

export interface VisibilityWindow {
    start: string;
    end: string;
    maxElevationDeg: number;
}

export interface CelestialObject {
    id: string;
    name: string;
    kind: CelestialObjectKind;
    magnitude: number;
    orbital: OrbitalData;
    visibility: VisibilityWindow | null;
    visibleNow: boolean;
}

export type CelestialEventKind =
    | "iss_pass"
    | "meteor_shower"
    | "moonrise"
    | "moonset"
    | "moon_phase"
    | "sunset"
    | "twilight"
    | "planetary_alignment"
    | "eclipse";

export interface CelestialEvent {
    id: string;
    kind: CelestialEventKind;
    title: string;
    at: string;
    relativeLabel: string;
}

export interface SkyNarration {
    text: string;
    generatedAt: string;
}

export interface CelestialReport {
    location: Location;
    timeline: TimelineKey;
    score: ObservationScore;
    visibleTonight: CelestialObject[];
    events: CelestialEvent[];
    narration: SkyNarration;
}
