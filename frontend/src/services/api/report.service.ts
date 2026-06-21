/**
 * File: src/services/api/report.service.ts
 * Endpoint purpose: Single aggregated fetch powering the whole Celestial
 *                   Intelligence Report. Preferred over N calls for the initial
 *                   load; the granular services above remain for partial refresh.
 * Expected request:  GET /api/report/{lat}/{lng}?t={timelineKey}
 * Expected response: CelestialReport
 */
import type { Location, TimelineKey, CelestialReport } from '@/types';
import { buildReport } from '@/services/mock/mock-data';
import { isMock, mockResolve, request } from './client';

export const reportService = {
  async get(location: Location, timeline: TimelineKey): Promise<CelestialReport> {
    if (isMock()) return mockResolve(() => buildReport(location, timeline));
    return request<CelestialReport>(`/api/report/${location.lat}/${location.lng}?t=${timeline}`);
  },
};
