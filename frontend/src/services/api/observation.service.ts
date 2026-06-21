/**
 * File: src/services/api/observation.service.ts
 * Endpoint purpose: Return the Observation Quality Score for a location+timeline.
 * Expected request:  GET /api/observation/{lat}/{lng}?t={timelineKey}
 * Expected response: ObservationScore
 * Error handling:    bubbles ApiError; React Query handles retry/backoff.
 */
import type { Location, TimelineKey, ObservationScore } from '@/types';
import { buildReport } from '@/services/mock/mock-data';
import { isMock, mockResolve, request } from './client';

export const observationService = {
  async get(location: Location, timeline: TimelineKey): Promise<ObservationScore> {
    if (isMock()) return mockResolve(() => buildReport(location, timeline).score);
    return request<ObservationScore>(`/api/observation/${location.lat}/${location.lng}?t=${timeline}`);
  },
};
