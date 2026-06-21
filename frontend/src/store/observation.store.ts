/**
 * File: src/store/observation.store.ts
 * Purpose: Holds the last successfully-loaded CelestialReport so the dashboard
 *          can keep rendering stale-but-valid data during a timeline transition
 *          (avoids layout collapse / flicker between fetches).
 * Responsibilities: cache the most recent report; expose it to all dashboard
 *   cards independent of the in-flight query state.
 * Data flow: useCelestialReport (on success) → cacheReport → dashboard cards.
 * Future enhancement: multi-location comparison (keep N reports keyed by id).
 */
import { create } from 'zustand';
import type { CelestialReport } from '@/types';

interface ObservationState {
  report: CelestialReport | null;
  cacheReport: (report: CelestialReport) => void;
}

export const useObservationStore = create<ObservationState>((set) => ({
  report: null,
  cacheReport: (report) => set({ report }),
}));
