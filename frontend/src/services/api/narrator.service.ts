/**
 * File: src/services/api/narrator.service.ts
 * Endpoint purpose: AI-generated plain-language sky summary for the narrator card.
 * Expected request:  POST /api/narrate  { lat, lng, timeline }
 * Expected response: SkyNarration
 * Error handling:    bubbles ApiError; the card shows a retry affordance on fail.
 *
 * Future backend notes: the live endpoint will call an LLM with the structured
 * report as context. The mock returns a templated summary (see mock-data.ts).
 */
import type { Location, TimelineKey, SkyNarration } from '@/types';
import { buildReport } from '@/services/mock/mock-data';
import { isMock, mockResolve, request } from './client';

export const narratorService = {
  async narrate(location: Location, timeline: TimelineKey): Promise<SkyNarration> {
    if (isMock()) return mockResolve(() => buildReport(location, timeline).narration);
    return request<SkyNarration>(`/api/narrate?lat=${location.lat}&lng=${location.lng}&t=${timeline}`);
  },
};
