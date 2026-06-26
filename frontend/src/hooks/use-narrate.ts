/**
 * File: src/hooks/use-narrate.ts
 * Purpose: Drives the "Explain Tonight's Sky" button. A React Query *mutation*
 *          (not a keyed query) so it is triggered explicitly and is NEVER
 *          cancelled by a location/timeline change — clicking the button always
 *          runs to completion and produces narration.
 * Returns: { narrate(), data, isPending, isError }.
 */
'use client';

import { useMutation } from '@tanstack/react-query';
import type { SkyNarration } from '@/types';
import { narratorService } from '@/services/api/narrator.service';
import { useLocationStore } from '@/store/location.store';
import { useTimelineStore } from '@/store/timeline.store';

export function useNarrate(onSuccess?: (n: SkyNarration) => void) {
  const location = useLocationStore((s) => s.location);
  const timeline = useTimelineStore((s) => s.timeline);

  const mutation = useMutation({
    mutationFn: () => narratorService.narrate(location, timeline),
    onSuccess,
  });

  return {
    narrate: () => mutation.mutate(),
    data: mutation.data ?? null,
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
