/**
 * File: src/components/object/ObjectDetailPanel.tsx
 * Purpose: Floating right-side panel for a selected celestial object
 *          (Wireframe 2). Slides in/out; shows metrics, visibility window,
 *          orbital data, and a reserved orbit-visualization area.
 * Responsibilities: presentation + open/close animation. Detail comes from
 *   useObjectDetail; selection state from uiStore.
 * Data flow: uiStore.selectedObjectId → useObjectDetail → render.
 * Edge cases: shows a skeleton while loading; "—" for null orbital fields.
 * Future enhancement: live Three.js orbit render in the visualization slot.
 */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useObjectDetail } from '@/hooks/use-object-detail';
import { useUiStore } from '@/store/ui.store';
import { useLocationStore } from '@/store/location.store';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/card';
import { formatLocalTime } from '@/lib/utils';

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="space-y-1">
      <Eyebrow>{label}</Eyebrow>
      <p className="font-mono text-lg text-frost">
        {value}
        {unit && <span className="ml-1 text-xs text-haze">{unit}</span>}
      </p>
    </div>
  );
}

export function ObjectDetailPanel() {
  const selectedId = useUiStore((s) => s.selectedObjectId);
  const selectObject = useUiStore((s) => s.selectObject);
  const timezone = useLocationStore((s) => s.location.timezone);
  const { data: obj, isLoading } = useObjectDetail();

  return (
    <AnimatePresence>
      {selectedId && (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="pointer-events-auto fixed right-4 top-20 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-panel border border-hairline/70 bg-abyss/90 p-5 shadow-panel backdrop-blur-2xl"
          role="dialog"
          aria-label="Object details"
        >
          <div className="flex items-start justify-between">
            <div>
              <Eyebrow>{obj?.kind === 'iss' ? 'Live' : 'Object'}</Eyebrow>
              <h2 className="font-display text-xl font-semibold text-frost">
                {isLoading || !obj ? 'Loading…' : obj.name}
              </h2>
            </div>
            <Button size="sm" variant="ghost" aria-label="Close" onClick={() => selectObject(null)}>
              <X size={16} />
            </Button>
          </div>

          {obj && (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-hairline/50 bg-nebula/40 p-4">
                <Metric label="Type" value={obj.kind} />
                <Metric label="Altitude" value={obj.orbital.altitudeKm?.toString() ?? '—'} unit="km" />
                <Metric
                  label="Velocity"
                  value={obj.orbital.velocityKmh ? `${(obj.orbital.velocityKmh / 1000).toFixed(1)}k` : '—'}
                  unit="km/h"
                />
              </div>

              {/* Reserved orbit-visualization area (future Three.js render). */}
              <div className="relative mt-3 grid h-40 place-items-center overflow-hidden rounded-2xl border border-hairline/50 bg-nebula/30">
                <div className="absolute h-28 w-28 rounded-full border border-signal/40" />
                <div className="absolute h-28 w-28 animate-radar-sweep rounded-full border-t-2 border-aurora/60" />
                <div className="h-8 w-8 rounded-full bg-signal/80 shadow-glow" />
                <span className="absolute bottom-2 font-mono text-[10px] uppercase tracking-eyebrow text-haze">
                  Orbit Path Visualization
                </span>
              </div>

              {obj.visibility && (
                <div className="mt-3 space-y-2 rounded-2xl border border-hairline/50 bg-nebula/40 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-haze">Next pass</span>
                    <span className="font-mono text-frost">{formatLocalTime(obj.visibility.start, timezone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-haze">Max elevation</span>
                    <span className="font-mono text-frost">{obj.visibility.maxElevationDeg}°</span>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
