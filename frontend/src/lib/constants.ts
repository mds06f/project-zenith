/**
 * File: src/lib/constants.ts
 * Purpose: App-wide constants with no business logic. Keeping these out of
 *          components avoids the "hardcoded values" anti-pattern called out in
 *          the brief.
 */
import type { TimelineOption, ObservationCondition } from '@/types';

/** Ordered timeline scrub points. Order here == order in the UI control. */
export const TIMELINE_OPTIONS: readonly TimelineOption[] = [
  { key: 'now', label: 'Now', offsetMinutes: 0 },
  { key: 'plus_1h', label: '+1 Hour', offsetMinutes: 60 },
  { key: 'plus_3h', label: '+3 Hours', offsetMinutes: 180 },
  { key: 'tonight', label: 'Tonight', offsetMinutes: 600 },
  { key: 'tomorrow', label: 'Tomorrow', offsetMinutes: 1440 },
  { key: 'next_week', label: 'Next Week', offsetMinutes: 10080 },
] as const;

/** Score → condition thresholds (inclusive lower bound). */
export const CONDITION_THRESHOLDS: ReadonlyArray<{
  min: number;
  condition: ObservationCondition;
}> = [
  { min: 80, condition: 'Excellent' },
  { min: 60, condition: 'Good' },
  { min: 40, condition: 'Fair' },
  { min: 0, condition: 'Poor' },
];

/** Default camera target when the app first loads, before a user picks a place.
 *  Chosen to frame a striking day/night terminator over Asia/Europe. */
export const DEFAULT_LOCATION = {
  id: 'default-kolkata',
  name: 'Kolkata',
  region: 'West Bengal',
  country: 'India',
  timezone: 'Asia/Kolkata',
  lat: 22.5726,
  lng: 88.3639,
} as const;

/** Simulated network latency (ms) for the mock service layer. */
export const MOCK_LATENCY_MS = 420;
