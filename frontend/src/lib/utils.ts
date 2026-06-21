/**
 * File: src/lib/utils.ts
 * Purpose: Tiny, dependency-light helpers shared across the app.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — merge conditional class names while de-duplicating conflicting Tailwind
 * utilities (e.g. `p-2` + `p-4` → `p-4`).
 * @param inputs any mix of strings / objects / arrays accepted by clsx
 * @returns a single, conflict-resolved className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * clamp — constrain n to the inclusive [min, max] range.
 * Edge cases: returns min when min > max is passed by mistake (fails safe low).
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * formatLocalTime — format an ISO timestamp in a given IANA timezone.
 * @returns e.g. "9:13 PM". Falls back to the raw string if Intl throws.
 */
export function formatLocalTime(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Deterministic pseudo-random in [0,1) seeded by a string — keeps mock data
 *  stable per (location, timeline) instead of flickering on every render. */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Map to [0,1)
  return ((h >>> 0) % 100000) / 100000;
}
