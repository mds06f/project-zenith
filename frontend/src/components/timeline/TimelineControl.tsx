/**
 * File: src/components/timeline/TimelineControl.tsx
 * Purpose: Horizontal timeline scrubber (Now → Next Week). Changing the point
 *          refetches the report with smooth transitions, no page reload.
 * Responsibilities: render the discrete options; show a sliding active indicator
 *   that animates between segments via Framer Motion's layout animations.
 * Data flow: click → timelineStore.setTimeline → report query key changes.
 * Future enhancement: continuous drag scrubbing across a real time axis.
 */
'use client';

import { motion } from 'framer-motion';
import { TIMELINE_OPTIONS } from '@/lib/constants';
import { useTimelineStore } from '@/store/timeline.store';
import { Eyebrow, Panel } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function TimelineControl() {
  const timeline = useTimelineStore((s) => s.timeline);
  const setTimeline = useTimelineStore((s) => s.setTimeline);

  return (
    <Panel className="flex flex-col gap-2.5 px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>Timeline Simulation</Eyebrow>
        <span className="text-[11px] text-haze/80">Preview the sky at a future moment</span>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {TIMELINE_OPTIONS.map((opt) => {
          const activeOpt = opt.key === timeline;
          return (
            <button
              key={opt.key}
              onClick={() => setTimeline(opt.key)}
              className={cn(
                'relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora/60',
                activeOpt ? 'text-void' : 'text-haze hover:text-frost'
              )}
            >
              {activeOpt && (
                <motion.span
                  layoutId="timeline-active"
                  className="absolute inset-0 rounded-full bg-aurora"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
