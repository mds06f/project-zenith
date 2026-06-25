/**
 * File: src/services/api/satellite.service.ts
 * Endpoint purpose: Objects visible from a location (ISS, planets, bright stars)
 *                   plus single-object detail for the right-side panel.
 * Expected request:  GET /api/visible/{lat}/{lng}?t={timelineKey}
 *                    GET /api/object/{id}?lat={lat}&lng={lng}
 * Expected response: CelestialObject[] | CelestialObject
 * Error handling:    unknown id rejects with ApiError(404) in live mode.
 */
import type { Location, TimelineKey, CelestialObject } from '@/types';
import { buildReport } from '@/services/mock/mock-data';
import { liveOrMock } from './client';

/** Find an object in the deterministic report, defaulting to the first entry so
 *  the panel never throws for an id the mock doesn't know. */
function mockObject(id: string, location: Location, timeline: TimelineKey): CelestialObject {
  const objs = buildReport(location, timeline).visibleTonight;
  return objs.find((o) => o.id === id) ?? objs[0]!;
}

export const satelliteService = {
  async visible(location: Location, timeline: TimelineKey): Promise<CelestialObject[]> {
    return liveOrMock<CelestialObject[]>(
      `/api/report/${location.lat}/${location.lng}?t=${timeline}`,
      () => buildReport(location, timeline).visibleTonight
    );
  },

  async detail(id: string, location: Location, timeline: TimelineKey, signal?: AbortSignal): Promise<CelestialObject> {
    return liveOrMock<CelestialObject>(
      `/api/object/${id}?lat=${location.lat}&lng=${location.lng}`,
      () => mockObject(id, location, timeline),
      (x) => x,
      signal
    );
  },
};
