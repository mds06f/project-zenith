/**
 * File: src/hooks/use-celestial-report.ts
 * Purpose: The one hook the dashboard depends on. Bridges Zustand (which
 *          location + when) to React Query (fetch + cache + loading/error) and
 *          mirrors the latest success into the observation store for flicker-free
 *          transitions.
 *
 * Returns: { report, isLoading, isFetching, isError, refetch }
 * Edge cases: keeps previous data visible while a new (location|timeline) loads.
 */
'use client';

import { useEffect } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/api/report.service';
import { useLocationStore } from '@/store/location.store';
import { useTimelineStore } from '@/store/timeline.store';
import { useObservationStore } from '@/store/observation.store';

export function useCelestialReport() {
  const location = useLocationStore((s) => s.location);
  const timeline = useTimelineStore((s) => s.timeline);
  const cacheReport = useObservationStore((s) => s.cacheReport);

  const query = useQuery({
    // Query key encodes everything the result depends on → automatic refetch.
    queryKey: ['report', location.id, location.lat, location.lng, timeline],
    // Deliberately NOT passing React Query's signal: a Timeline Simulation change
    // must always run to completion (and populate the cache), never be cancelled
    // mid-flight. Stale results are ignored by key; the backend is idempotent.
    queryFn: () => reportService.get(location, timeline),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) cacheReport(query.data);
  }, [query.data, cacheReport]);

  return {
    report: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
