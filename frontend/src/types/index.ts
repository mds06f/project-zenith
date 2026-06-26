/**
 * File: src/types/index.ts
 * Purpose: Single source of truth for every domain shape in Project Zenith.
 *          Services, stores, hooks and components all import from here so the
 *          frontend↔backend contract is enforced by the compiler.
 *
 * Data flow: backend gateway → services/api (validated) → stores/hooks → UI.
 *
 * Future enhancement notes:
 *  - When the live gateway lands, generate these from the OpenAPI schema
 *    (see API_CONTRACTS.md) and delete the hand-written duplicates.
 */

// ─── Geography ───────────────────────────────────────────────────────────────

/** A point on Earth. Longitude/latitude in decimal degrees (WGS84). */
export interface GeoCoordinate {
  lat: number;
  lng: number;
}

/** A resolved, human-meaningful place the camera can fly to. */
export interface Location extends GeoCoordinate {
  id: string;
  name: string;
  region?: string;
  country?: string;
  /** IANA timezone, e.g. "Asia/Kolkata". Drives all local-time labels. */
  timezone: string;
}

// ─── Timeline ────────────────────────────────────────────────────────────────

/** Discrete points the user can scrub the sky to. Ordered, never free-form. */
export type TimelineKey =
  | 'now'
  | 'plus_1h'
  | 'plus_3h'
  | 'tonight'
  | 'tomorrow'
  | 'next_week';

export interface TimelineOption {
  key: TimelineKey;
  label: string;
  /** Offset from "now" in minutes; used for both labels and mock simulation. */
  offsetMinutes: number;
}

// ─── Observation quality ─────────────────────────────────────────────────────

export type ObservationFactorKey =
  | 'clouds'
  | 'lightPollution'
  | 'moonBrightness'
  | 'atmosphericVisibility';

/**
 * A single contributor to the Observation Quality Score.
 * `value` is normalized 0–100 where 100 is "best possible for observing".
 */
export interface ObservationFactor {
  key: ObservationFactorKey;
  label: string;
  /** 0–100, already inverted so higher is always better for the observer. */
  value: number;
  /** Raw human-readable measurement, e.g. "12% cover" or "Bortle 4". */
  detail: string;
}

export type ObservationCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface ObservationScore {
  /** 0–100 composite. */
  score: number;
  condition: ObservationCondition;
  factors: ObservationFactor[];
}

// ─── Celestial objects ───────────────────────────────────────────────────────

export type CelestialObjectKind =
  | 'satellite'
  | 'iss'
  | 'planet'
  | 'star'
  | 'moon';

export interface OrbitalData {
  /** Kilometres above mean sea level. Null for deep-sky objects. */
  altitudeKm: number | null;
  /** Kilometres per hour. Null where not applicable. */
  velocityKmh: number | null;
  /** Orbital inclination in degrees, when known. */
  inclinationDeg?: number;
  /** Period in minutes, when known. */
  periodMin?: number;
}

export interface VisibilityWindow {
  /** ISO timestamp the object becomes observable from the location. */
  start: string;
  /** ISO timestamp it drops below the horizon / becomes unobservable. */
  end: string;
  /** Peak elevation above the horizon during the window, in degrees. */
  maxElevationDeg: number;
}

export interface CelestialObject {
  id: string;
  name: string;
  kind: CelestialObjectKind;
  /** Apparent magnitude (lower = brighter). Drives marker prominence. */
  magnitude: number;
  orbital: OrbitalData;
  /** Next/active window the object is visible from the active location. */
  visibility: VisibilityWindow | null;
  /** True when the object is above the horizon at the active timeline point. */
  visibleNow: boolean;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type CelestialEventKind =
  | 'iss_pass'
  | 'meteor_shower'
  | 'moonrise'
  | 'moonset'
  | 'moon_phase'
  | 'sunset'
  | 'twilight'
  | 'planetary_alignment'
  | 'eclipse';

export interface CelestialEvent {
  id: string;
  kind: CelestialEventKind;
  title: string;
  /** ISO timestamp the event peaks / occurs. */
  at: string;
  /** Short relative label the UI can show without recomputing, e.g. "14 min". */
  relativeLabel: string;
}

// ─── Narration ───────────────────────────────────────────────────────────────

export interface SkyNarration {
  /** Full prose summary streamed into the typewriter card. */
  text: string;
  /** When the narration was generated (ISO). */
  generatedAt: string;
}

// ─── Aggregate report ────────────────────────────────────────────────────────

/**
 * The complete payload the backend aggregation service returns for a
 * (location, timeline) pair. The whole dashboard renders from this one object.
 */
export interface CelestialReport {
  location: Location;
  timeline: TimelineKey;
  score: ObservationScore;
  visibleTonight: CelestialObject[];
  events: CelestialEvent[];
  narration: SkyNarration;
}

// ─── Generic async envelope ──────────────────────────────────────────────────

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';
