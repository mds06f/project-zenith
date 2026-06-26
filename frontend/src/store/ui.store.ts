/**
 * File: src/store/ui.store.ts
 * Purpose: Ephemeral interface state that isn't server data: which object panel
 *          is open and whether the report overlay is expanded.
 * Responsibilities: keep transient UI flags out of data stores and components.
 * Data flow: any component → setters → globe overlay / panels react.
 */
import { create } from 'zustand';

interface UiState {
  /** id of the celestial object whose detail panel is open, or null. */
  selectedObjectId: string | null;
  /** Whether the contextual report overlay is shown over the globe. */
  reportOpen: boolean;
  selectObject: (id: string | null) => void;
  setReportOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedObjectId: null,
  reportOpen: false,
  selectObject: (selectedObjectId) => set({ selectedObjectId }),
  setReportOpen: (reportOpen) => set({ reportOpen }),
}));
