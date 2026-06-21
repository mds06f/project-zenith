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
import { isMock, mockResolve, request } from './client';

export const satelliteService = {
  async visible(location: Location, timeline: TimelineKey): Promise<CelestialObject[]> {
    if (isMock()) return mockResolve(() => buildReport(location, timeline).visibleTonight);
    return request<CelestialObject[]>(`/api/visible/${location.lat}/${location.lng}?t=${timeline}`);
  },

  async detail(id: string, location: Location, timeline: TimelineKey): Promise<CelestialObject> {
    if (isMock()) {
      return mockResolve(() => {
        const obj = buildReport(location, timeline).visibleTonight.find((o) => o.id === id);
        if (!obj) throw new Error(`Unknown object: ${id}`);
        return obj;
      });
    }
    return request<CelestialObject>(`/api/object/${id}?lat=${location.lat}&lng=${location.lng}`);
  },
};
