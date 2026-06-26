/**
 * File: src/components/dashboard/UpcomingEvents.tsx
 * Purpose: Event feed (ISS pass, meteor shower, moonrise, alignment).
 * Inputs:  events[] (CelestialEvent)
 * Outputs: iconified rows with a relative time label.
 * Data flow: CelestialReport.events → here.
 * Future enhancement: "Set alert" per row wiring to a notifications service.
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
      <Eyebrow>Upcoming Events</Eyebrow>
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
