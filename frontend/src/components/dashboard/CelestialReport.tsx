/**
 * Report panel for the selected location.
 * Renders observation details, visible objects,
 * upcoming events, and sky narration.
 */
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import type { SkyNarration } from '@/types';
import { useCelestialReport } from '@/hooks/use-celestial-report';
import { useNarrate } from '@/hooks/use-narrate';
import { useObservationStore } from '@/store/observation.store';
import { useUiStore } from '@/store/ui.store';
import { ObservationScore } from './ObservationScore';
import { VisibleTonight } from './VisibleTonight';
import { UpcomingEvents } from './UpcomingEvents';
import { SkyNarrator } from './SkyNarrator';
import { Button } from '@/components/ui/button';


export function CelestialReport() {
  const { isFetching } = useCelestialReport();
  const report = useObservationStore((s) => s.report);
  const reportOpen = useUiStore((s) => s.reportOpen);
  const selectObject = useUiStore((s) => s.selectObject);
  const setReportOpen = useUiStore((s) => s.setReportOpen);

  // "Explain Tonight's Sky" — a dedicated, non-cancellable narration request.
  const [narration, setNarration] = useState<SkyNarration | null>(null);
  const explain = useNarrate(setNarration);
  // Drop the on-demand narration when the location/timeline changes so the card
  // returns to that report's own narration.
  useEffect(() => {
    setNarration(null);
  }, [report?.location.id, report?.timeline]);

  return (
    <AnimatePresence>
      {reportOpen && report && (
        <motion.section
          key="report"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // Bound the report to the viewport and let it scroll. The desktop
          // layout column is `md:overflow-visible`, so without this the stacked
          // cards (and the CTA below them) overflowed off-screen with no way to
          // reach them — which is what made "Visible Tonight" appear unscrollable.
          className="pointer-events-auto w-full max-w-md space-y-3 overflow-y-auto pr-1 max-h-[calc(100dvh-11rem)]"
          aria-live="polite"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-aurora">
                Celestial Intelligence Report
              </p>
              <h1 className="font-display text-lg font-semibold text-frost">
                {report.location.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {isFetching && (
                <span
                  className="h-2 w-2 animate-ping rounded-full bg-aurora"
                  aria-label="Updating"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportOpen(false)}
                aria-label="Close Report"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <ObservationScore {...report.score} />
          <SkyNarrator
            narration={narration ?? report.narration}
            loading={isFetching || explain.isPending}
          />
          <VisibleTonight objects={report.visibleTonight} onSelect={selectObject} />
          <UpcomingEvents events={report.events} />

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => explain.narrate()}
            disabled={explain.isPending}
          >
            <Sparkles size={16} /> {explain.isPending ? 'Reading the sky…' : "Explain Tonight's Sky"}
          </Button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
