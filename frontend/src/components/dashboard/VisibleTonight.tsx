/**
 * File: src/components/dashboard/VisibleTonight.tsx
 * Purpose: Animated, clickable list of objects observable from the location.
 * Inputs:  objects[] (CelestialObject), onSelect(id)
 * Outputs: staggered list; clicking an item opens its detail panel.
 * Data flow: CelestialReport.visibleTonight → here; click → uiStore.selectObject.
 * Edge cases: empty list renders a directive empty-state, not a blank box.
 * Future enhancement: live altitude readout per row, "rising/setting" arrows.
 */
'use client';

import { motion } from 'framer-motion';
import type { CelestialObject, CelestialObjectKind } from '@/types';
import { Eyebrow, Panel } from '@/components/ui/card';

const DOT: Record<CelestialObjectKind, string> = {
  iss: 'bg-aurora',
  satellite: 'bg-signal',
  planet: 'bg-ember',
  star: 'bg-frost',
  moon: 'bg-haze',
};

export function VisibleTonight({
  objects,
  onSelect,
}: {
  objects: CelestialObject[];
  onSelect: (id: string) => void;
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <Eyebrow>Visible Tonight</Eyebrow>
      {objects.length === 0 ? (
        <p className="text-sm text-haze">Nothing above the horizon right now. Try a later time on the timeline.</p>
      ) : (
        <ul className="max-h-60 space-y-1 overflow-y-auto pr-1">
          {objects.map((obj, i) => (
            <motion.li
              key={obj.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <button
                onClick={() => onSelect(obj.id)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-colors hover:bg-frost/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/60"
              >
                <span className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${DOT[obj.kind]} animate-twinkle`} />
                  <span className="text-sm text-frost">{obj.name}</span>
                </span>
                <span className="font-mono text-[11px] text-haze">mag {obj.magnitude.toFixed(1)}</span>
              </button>
            </motion.li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
