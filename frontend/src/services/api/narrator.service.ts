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
import { liveOrMock } from './client';

export const narratorService = {
  /**
   * Standalone narration for the "Explain Tonight's Sky" button. Uses liveOrMock
   * so a backend hiccup still yields templated narration — the card is never left
   * empty. Intentionally NOT cancellable (no signal): a deliberate user action.
   */
  async narrate(location: Location, timeline: TimelineKey): Promise<SkyNarration> {
    const qs = `lat=${location.lat}&lng=${location.lng}&t=${timeline}` +
      `&name=${encodeURIComponent(location.name)}&tz=${encodeURIComponent(location.timezone)}`;
    return liveOrMock<SkyNarration>(
      `/api/narrate?${qs}`,
      () => buildReport(location, timeline).narration
    );
  },
};
