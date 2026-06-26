/**
 * File: src/services/api/location.service.ts
 * Endpoint purpose: Resolve free-text / coordinate input into a Location, and
 *                   provide search suggestions for the floating search bar.
 *
 * Expected request:  GET /api/location/search?q={query}
 *                    GET /api/location/{lat}/{lng}        (reverse geocode)
 * Expected response: Location | Location[]
 * Error handling:    bubbles ApiError; empty query returns [] without a call.
 */
import type { Location, GeoCoordinate } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/constants';
import { liveOrMock } from './client';

/** Small offline gazetteer used by the mock branch. */
const GAZETTEER: Location[] = [
  DEFAULT_LOCATION,
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', lat: 35.6762, lng: 139.6503 },
  { id: 'nyc', name: 'New York', region: 'NY', country: 'USA', timezone: 'America/New_York', lat: 40.7128, lng: -74.006 },
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', timezone: 'Atlantic/Reykjavik', lat: 64.1466, lng: -21.9426 },
  { id: 'atacama', name: 'Atacama Desert', country: 'Chile', timezone: 'America/Santiago', lat: -24.5, lng: -69.25 },
  { id: 'sydney', name: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney', lat: -33.8688, lng: 151.2093 },
];

/** Detect a "lat,lng" style query and parse it into coordinates. */
function parseCoordinates(query: string): GeoCoordinate | null {
  const m = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export const locationService = {
  /**
   * search — suggestions for the search bar. Coordinate input short-circuits to
   * a single synthesized Location.
   */
  async search(query: string, signal?: AbortSignal): Promise<Location[]> {
    if (!query.trim()) return [];
    const coords = parseCoordinates(query);
    if (coords) {
      return [{ id: `coord-${coords.lat},${coords.lng}`, name: `${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)}`, timezone: 'UTC', ...coords }];
    }
    const q = query.toLowerCase();
    // Live: real worldwide geocoding via the gateway. Fallback: offline gazetteer.
    // `signal` lets the search bar cancel a superseded keystroke's request.
    return liveOrMock<Location[]>(
      `/api/location/search?q=${encodeURIComponent(query)}`,
      () => GAZETTEER.filter((l) => l.name.toLowerCase().includes(q) || l.country?.toLowerCase().includes(q)),
      (x) => x,
      signal
    );
  },

  /** reverseGeocode — resolve a raw map click into a named Location.
   *  Accepts an AbortSignal so a rapid second click can cancel the first,
   *  preventing an older (slower) response from overwriting newer state. */
  async reverseGeocode(coords: GeoCoordinate, signal?: AbortSignal): Promise<Location> {
    return liveOrMock<Location>(
      `/api/location/${coords.lat}/${coords.lng}`,
      () => ({
        id: `coord-${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`,
        name: `${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°`,
        timezone: 'UTC',
        ...coords,
      }),
      (x) => x,
      signal
    );
  },
};
