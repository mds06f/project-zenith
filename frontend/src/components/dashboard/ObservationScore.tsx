/**
 * File: src/components/dashboard/ObservationScore.tsx
 * Purpose: Displays the computed observation quality score — the product's
 *          signature visual.
 *
 * Inputs:  score (0–100), condition, factors[]
 * Outputs: a luminous circular gauge with a sweeping radar arc, an animated
 *          count-up number, a condition badge, and a factor breakdown.
 *
 * Responsibilities: pure presentation; all numbers arrive via props.
 * Data flow: CelestialReport.score → here.
 * Edge cases: clamps the arc to [0,100]; condition colour falls back to haze.
 * Future enhancement: tap a factor to expand its source + historical trend.
 */
'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import type { ObservationScore as Score, ObservationCondition } from '@/types';
import { Eyebrow, Panel } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const CONDITION_COLOR: Record<ObservationCondition, string> = {
  Excellent: 'text-aurora',
  Good: 'text-signal',
  Fair: 'text-ember',
  Poor: 'text-haze',
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ObservationScore({ score, condition, factors }: Score) {
  // Animate the number from 0 → score whenever it changes.
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(count, score, { duration: 1.1, ease: 'easeOut' });
    return controls.stop;
  }, [score, count]);

  const dashOffset = CIRCUMFERENCE * (1 - Math.max(0, Math.min(score, 100)) / 100);

  return (
    <Panel className="flex flex-col gap-4">
      <Eyebrow>Observation Score</Eyebrow>

      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          {/* radar sweep */}
          <div className="absolute inset-2 overflow-hidden rounded-full">
            <div className="absolute inset-0 animate-radar-sweep bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--aurora)/0.25)_60deg,transparent_120deg)]" />
          </div>
          <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="hsl(var(--hairline))" strokeWidth="6" />
            <motion.circle
              cx="64" cy="64" r={RADIUS} fill="none"
              stroke="hsl(var(--aurora))" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              style={{ filter: 'drop-shadow(0 0 6px hsl(var(--aurora)/0.6))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span className="font-mono text-3xl font-semibold text-frost">{rounded}</motion.span>
            <span className="font-mono text-[10px] text-haze">/ 100</span>
          </div>
        </div>

        <div className="space-y-2">
          <span
            className={cn(
              'inline-flex rounded-full border border-current px-3 py-1 text-xs font-medium',
              CONDITION_COLOR[condition]
            )}
          >
            {condition}
          </span>
          <ul className="space-y-1.5">
            {factors.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-haze">{f.label}</span>
                <span className="font-mono text-frost/80">{f.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
