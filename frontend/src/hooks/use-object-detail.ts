/**
 * File: src/hooks/use-object-detail.ts
 * Purpose: Fetch detail for the currently-selected celestial object (right panel).
 * Returns: React Query result of CelestialObject; disabled when nothing selected.
 * Edge cases: query is `enabled` only when an id is present, so closing the panel
 *   doesn't fire a request.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { satelliteService } from '@/services/api/satellite.service';
import { useLocationStore } from '@/store/location.store';
import { useTimelineStore } from '@/store/timeline.store';
import { useUiStore } from '@/store/ui.store';

export function useObjectDetail() {
  const id = useUiStore((s) => s.selectedObjectId);
  const location = useLocationStore((s) => s.location);
  const timeline = useTimelineStore((s) => s.timeline);

  return useQuery({
    queryKey: ['object', id, location.id, timeline],
    // Not cancellable: opening an object's detail should always complete.
    queryFn: () => satelliteService.detail(id as string, location, timeline),
    enabled: Boolean(id),
  });
}
