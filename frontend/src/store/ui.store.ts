/**
 * File: src/store/ui.store.ts
 * Purpose: Ephemeral interface state that isn't server data: which object panel
 *          is open, whether the report overlay is expanded, settings visibility.
 * Responsibilities: keep transient UI flags out of data stores and components.
 * Data flow: any component → setters → globe overlay / panels react.
 * Future enhancement: persist `reducedMotion` + theme to localStorage.
 */
import { create } from 'zustand';

interface UiState {
  /** id of the celestial object whose detail panel is open, or null. */
  selectedObjectId: string | null;
  /** Whether the contextual report overlay is shown over the globe. */
  reportOpen: boolean;
  settingsOpen: boolean;
  selectObject: (id: string | null) => void;
  setReportOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedObjectId: null,
  reportOpen: false,
  settingsOpen: false,
  selectObject: (selectedObjectId) => set({ selectedObjectId }),
  setReportOpen: (reportOpen) => set({ reportOpen }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
