/**
 * File: src/services/api/timeline.service.ts
 * Endpoint purpose: Upcoming celestial events for a location across the horizon
 *                   implied by the active timeline scrub point.
 * Expected request:  GET /api/events/{lat}/{lng}?t={timelineKey}
 * Expected response: CelestialEvent[]
 * Error handling:    bubbles ApiError.
 */
import type { Location, TimelineKey, CelestialEvent } from '@/types';
import { buildReport } from '@/services/mock/mock-data';
import { isMock, mockResolve, request } from './client';

export const timelineService = {
  async events(location: Location, timeline: TimelineKey): Promise<CelestialEvent[]> {
    if (isMock()) return mockResolve(() => buildReport(location, timeline).events);
    return request<CelestialEvent[]>(`/api/events/${location.lat}/${location.lng}?t=${timeline}`);
  },
};
