/**
 * File: src/services/mock/mock-data.ts
 * Purpose: Deterministically synthesize a CelestialReport for any
 *          (location, timeline) pair so the entire UI is fully interactive with
 *          zero backend. Replaced wholesale by the live gateway later.
 *
 * Why deterministic? A given location+timeline always yields the same numbers,
 * so the dashboard doesn't flicker on re-render and demos are reproducible.
 *
 * Data flow: services/api/* call these builders; nothing else imports this file.
 */
import {
  type CelestialReport,
  type Location,
  type TimelineKey,
  type ObservationScore,
  type ObservationFactor,
  type CelestialObject,
  type CelestialEvent,
  type SkyNarration,
  type ObservationCondition,
} from '@/types';
import { CONDITION_THRESHOLDS, TIMELINE_OPTIONS } from '@/lib/constants';
import { clamp, formatLocalTime, seededRandom } from '@/lib/utils';

/** Derive a condition band from a numeric score. */
function conditionFor(score: number): ObservationCondition {
  return (
    CONDITION_THRESHOLDS.find((t) => score >= t.min)?.condition ?? 'Poor'
  );
}

/** Build the 4 weighted factors and the composite score. */
function buildScore(seed: string): ObservationScore {
  const r = (salt: string) => Math.round(seededRandom(seed + salt) * 100);

  const factors: ObservationFactor[] = [
    { key: 'clouds', label: 'Clouds', value: clamp(100 - r('cloud') * 0.6, 0, 100), detail: '' },
    { key: 'lightPollution', label: 'Light Pollution', value: clamp(r('lp'), 0, 100), detail: '' },
    { key: 'moonBrightness', label: 'Moon Brightness', value: clamp(r('moon'), 0, 100), detail: '' },
    { key: 'atmosphericVisibility', label: 'Atmospheric Visibility', value: clamp(60 + r('atmo') * 0.4, 0, 100), detail: '' },
  ];

  factors[0]!.detail = `${Math.round((100 - factors[0]!.value) * 0.6)}% cover`;
  factors[1]!.detail = `Bortle ${Math.max(1, Math.round((100 - factors[1]!.value) / 12))}`;
  factors[2]!.detail = `${Math.round(100 - factors[2]!.value)}% illuminated`;
  factors[3]!.detail = `${(2 + (factors[3]!.value / 100) * 8).toFixed(1)} mag seeing`;

  // Composite is a weighted mean — clouds and light pollution dominate.
  const weights = { clouds: 0.35, lightPollution: 0.3, moonBrightness: 0.15, atmosphericVisibility: 0.2 };
  const score = Math.round(
    factors.reduce((sum, f) => sum + f.value * weights[f.key], 0)
  );

  return { score, condition: conditionFor(score), factors };
}

/** Build the "visible tonight" object list. ISS always leads when present. */
function buildObjects(seed: string, location: Location): CelestialObject[] {
  const base = Date.now();
  const window = (offsetMin: number, durMin: number, elev: number) => ({
    start: new Date(base + offsetMin * 60_000).toISOString(),
    end: new Date(base + (offsetMin + durMin) * 60_000).toISOString(),
    maxElevationDeg: elev,
  });

  return [
    {
      id: 'iss', name: 'ISS', kind: 'iss', magnitude: -3.5,
      orbital: { altitudeKm: 421, velocityKmh: 27600, inclinationDeg: 51.6, periodMin: 92 },
      visibility: window(14, 5, 67), visibleNow: seededRandom(seed + 'iss') > 0.5,
    },
    {
      id: 'saturn', name: 'Saturn', kind: 'planet', magnitude: 0.7,
      orbital: { altitudeKm: null, velocityKmh: null },
      visibility: window(180, 240, 41), visibleNow: false,
    },
    {
      id: 'jupiter', name: 'Jupiter', kind: 'planet', magnitude: -2.2,
      orbital: { altitudeKm: null, velocityKmh: null },
      visibility: window(0, 300, 58), visibleNow: true,
    },
    {
      id: 'vega', name: 'Vega', kind: 'star', magnitude: 0.03,
      orbital: { altitudeKm: null, velocityKmh: null },
      visibility: window(30, 360, 72), visibleNow: true,
    },
  ];
}

/** Build the upcoming-events feed. */
function buildEvents(seed: string): CelestialEvent[] {
  const base = Date.now();
  const iso = (min: number) => new Date(base + min * 60_000).toISOString();
  return [
    { id: 'e-iss', kind: 'iss_pass', title: 'ISS Pass', at: iso(14), relativeLabel: '14 min' },
    { id: 'e-meteor', kind: 'meteor_shower', title: 'Meteor Shower', at: iso(540), relativeLabel: 'Tonight' },
    { id: 'e-moon', kind: 'moonrise', title: 'Moonrise', at: iso(167), relativeLabel: '8:47 PM' },
    { id: 'e-align', kind: 'planetary_alignment', title: 'Planetary Alignment', at: iso(2880), relativeLabel: 'In 2 days' },
  ];
}

/** Compose an AI-style narration string (template stands in for an LLM call). */
function buildNarration(
  location: Location,
  score: ObservationScore,
  objects: CelestialObject[]
): SkyNarration {
  const iss = objects.find((o) => o.id === 'iss');
  const saturn = objects.find((o) => o.id === 'saturn');
  const issMins = iss?.visibility
    ? Math.max(0, Math.round((new Date(iss.visibility.start).getTime() - Date.now()) / 60000))
    : null;
  const saturnTime = saturn?.visibility ? formatLocalTime(saturn.visibility.start, location.timezone) : null;

  const opener =
    score.condition === 'Excellent'
      ? `Tonight offers excellent visibility conditions over ${location.name}.`
      : `Conditions over ${location.name} are ${score.condition.toLowerCase()} tonight.`;

  const text =
    `${opener} ` +
    (saturnTime ? `Saturn becomes visible in the southwest after ${saturnTime}. ` : '') +
    (issMins !== null ? `The ISS is expected to pass overhead in approximately ${issMins} minutes. ` : '') +
    `Jupiter remains visible for most of the evening.`;

  return { text, generatedAt: new Date().toISOString() };
}

/**
 * buildReport — the public builder. Assembles a full CelestialReport.
 * @param location resolved place the user selected
 * @param timeline which scrub point to simulate
 * @returns a deterministic CelestialReport for that pair
 */
export function buildReport(location: Location, timeline: TimelineKey): CelestialReport {
  const offset = TIMELINE_OPTIONS.find((t) => t.key === timeline)?.offsetMinutes ?? 0;
  const seed = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}@${offset}`;

  const score = buildScore(seed);
  const visibleTonight = buildObjects(seed, location);
  const events = buildEvents(seed);
  const narration = buildNarration(location, score, visibleTonight);

  return { location, timeline, score, visibleTonight, events, narration };
}
