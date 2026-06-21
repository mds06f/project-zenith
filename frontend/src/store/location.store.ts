/**
 * File: src/store/location.store.ts
 * Purpose: Owns the currently selected Location and recent search history.
 * Responsibilities:
 *   - Hold the active location that drives every data fetch.
 *   - Maintain a de-duplicated, capped search history.
 *   - Expose a `pending` coordinate set the moment a user clicks the globe,
 *     before reverse-geocoding resolves a name (enables instant pin drop).
 * Data flow: globe/search → setLocation → React Query refetches the report.
 * Future enhancement: persist history to localStorage; sync to a user profile.
 */
import { create } from 'zustand';
import type { Location, GeoCoordinate } from '@/types';
import { DEFAULT_LOCATION } from '@/lib/constants';

const HISTORY_LIMIT = 6;

interface LocationState {
  location: Location;
  pendingCoords: GeoCoordinate | null;
  history: Location[];
  /** Commit a fully-resolved location and record it in history. */
  setLocation: (location: Location) => void;
  /** Mark a raw click before the name resolves (drives the optimistic pin). */
  setPending: (coords: GeoCoordinate | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: { ...DEFAULT_LOCATION },
  pendingCoords: null,
  history: [],
  setLocation: (location) =>
    set((state) => ({
      location,
      pendingCoords: null,
      history: [location, ...state.history.filter((h) => h.id !== location.id)].slice(0, HISTORY_LIMIT),
    })),
  setPending: (pendingCoords) => set({ pendingCoords }),
}));
