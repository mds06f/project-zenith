/**
 * File: src/components/dashboard/UpcomingEvents.tsx
 * Purpose: "Astronomical Events" feed — the upcoming sun, moon, twilight, meteor
 *   and ISS-pass highlights for the selected location and time. Labelled
 *   honestly: in live mode these shift with larger timeline jumps (tomorrow /
 *   next week); they are NOT a per-minute timeline simulation, so the card name
 *   avoids implying one.
 * Inputs:  events[] (CelestialEvent)
 * Outputs: iconified rows with a relative time label.
 * Data flow: CelestialReport.events → here.
 */
'use client';

import { motion } from 'framer-motion';
import { Rocket, Sparkles, Moon, MoonStar, Sunset, Telescope, Orbit, type LucideIcon } from 'lucide-react';
import type { CelestialEvent, CelestialEventKind } from '@/types';
import { Eyebrow, Panel } from '@/components/ui/card';

const ICON: Record<CelestialEventKind, LucideIcon> = {
  iss_pass: Rocket,
  meteor_shower: Sparkles,
  moonrise: Moon,
  moonset: Moon,
  moon_phase: MoonStar,
  sunset: Sunset,
  twilight: Telescope,
  planetary_alignment: Orbit,
  eclipse: Orbit,
};

export function UpcomingEvents({ events }: { events: CelestialEvent[] }) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <Eyebrow>Astronomical Events</Eyebrow>
        <p className="text-[11px] text-haze/80">Sun, moon &amp; sky highlights from the selected time</p>
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-haze">No notable events in this window.</p>
      ) : (
      <ul className="divide-y divide-hairline/40">
        {events.map((ev, i) => {
          const Icon = ICON[ev.kind];
          return (
            <motion.li
              key={ev.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between py-2.5"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-frost/5 text-aurora">
                  <Icon size={15} strokeWidth={1.75} />
                </span>
                <span className="text-sm text-frost">{ev.title}</span>
              </span>
              <span className="font-mono text-xs text-haze">{ev.relativeLabel}</span>
            </motion.li>
          );
        })}
      </ul>
      )}
    </Panel>
  );
}
