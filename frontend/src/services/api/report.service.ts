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
import { liveOrMock } from './client';

export const reportService = {
  async get(location: Location, timeline: TimelineKey, signal?: AbortSignal): Promise<CelestialReport> {
    const qs = `t=${timeline}&name=${encodeURIComponent(location.name)}&tz=${encodeURIComponent(location.timezone)}`;
    return liveOrMock<CelestialReport>(
      `/api/report/${location.lat}/${location.lng}?${qs}`,
      () => buildReport(location, timeline),
      // Keep the frontend's richer Location (name/timezone/region) over the
      // gateway's coordinate-derived one.
      (live) => ({ ...live, location }),
      // React Query aborts this signal when the active location/timeline changes,
      // cancelling the now-superseded report fetch instead of letting it run to
      // completion and fall back to mock.
      signal
    );
  },
};
