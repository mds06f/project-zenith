/**
 * Report panel for the selected location.
 * Renders observation details, visible objects,
 * upcoming events, and sky narration.
 */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
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
  const setReportOpen = useUiStore((s) => s.setReportOpen);

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
