/**
 * File: src/store/timeline.store.ts
 * Purpose: Owns the active timeline scrub point (Now … Next Week).
 * Responsibilities: single source of truth for "when"; every report query keys
 *   off this so changing it transparently refetches with smooth transitions.
 * Data flow: TimelineControl → setTimeline → report query key changes → refetch.
 * Future enhancement: free-scrubbing continuous time instead of discrete steps.
 */
import { create } from 'zustand';
import type { TimelineKey } from '@/types';

interface TimelineState {
  timeline: TimelineKey;
  setTimeline: (timeline: TimelineKey) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  timeline: 'now',
  setTimeline: (timeline) => set({ timeline }),
}));
