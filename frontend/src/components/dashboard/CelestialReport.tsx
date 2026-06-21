/**
 * File: src/components/dashboard/CelestialReport.tsx
 * Purpose: The "Celestial Intelligence Report" — composes every dashboard card
 *          into a contextual overlay that animates in over the (persistent)
 *          globe. There is NO route change: spatial continuity is preserved.
 *
 * Responsibilities: orchestrate data (useCelestialReport), keep stale data
 *   visible during transitions (observation store), lay out the cards, and own
 *   the "Explain Tonight's Sky" affordance that re-runs narration.
 * Data flow: stores(location, timeline) → useCelestialReport → cards.
 * Edge cases: first paint before any fetch shows a gentle prompt, not a spinner
 *   wall; subsequent loads keep the previous report on screen.
 * Future enhancement: drag-to-dock the report as a left rail on wide screens.
 */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useCelestialReport } from '@/hooks/use-celestial-report';
import { useObservationStore } from '@/store/observation.store';
import { useUiStore } from '@/store/ui.store';
import { ObservationScore } from './ObservationScore';
import { VisibleTonight } from './VisibleTonight';
import { UpcomingEvents } from './UpcomingEvents';
import { SkyNarrator } from './SkyNarrator';
import { Button } from '@/components/ui/button';

export function CelestialReport() {
  const { isFetching, refetch } = useCelestialReport();
  const report = useObservationStore((s) => s.report);
  const reportOpen = useUiStore((s) => s.reportOpen);
  const selectObject = useUiStore((s) => s.selectObject);

  return (
    <AnimatePresence>
      {reportOpen && report && (
        <motion.section
          key="report"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto w-full max-w-md space-y-3"
          aria-live="polite"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-aurora">
                Celestial Intelligence Report
              </p>
              <h1 className="font-display text-lg font-semibold text-frost">{report.location.name}</h1>
            </div>
            {isFetching && <span className="h-2 w-2 animate-ping rounded-full bg-aurora" aria-label="Updating" />}
          </div>

          <ObservationScore {...report.score} />
          <SkyNarrator narration={report.narration} loading={isFetching} />
          <VisibleTonight objects={report.visibleTonight} onSelect={selectObject} />
          <UpcomingEvents events={report.events} />

          <Button variant="primary" size="lg" className="w-full" onClick={() => void refetch()}>
            <Sparkles size={16} /> Explain Tonight&apos;s Sky
          </Button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
