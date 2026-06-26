/**
 * File: src/app/page.tsx
 * Purpose: The single experience surface. The globe is the hero and never
 *          unmounts; the report and object panel animate in over it so the user
 *          never loses spatial context (per the brief's "Transition Rule").
 *
 * Layer order (back → front):
 *   1. StarField (Three.js ambient particles)        — fixed, behind everything
 *   2. CesiumGlobe (the living Earth)                  — fills the viewport
 *   3. Vignette + gradient for legibility
 *   4. TopNav (brand + "Use My Location")
 *   5. LocationSearch (floating)
 *   6. CelestialReport overlay (left column on desktop, bottom sheet on mobile)
 *   7. TimelineControl (bottom)
 *   8. ObjectDetailPanel (right, conditional)
 *
 * Cesium is dynamically imported with ssr:false because it touches `window`.
 */
'use client';

import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { LocationSearch } from '@/components/search/LocationSearch';
import { CelestialReport } from '@/components/dashboard/CelestialReport';
import { TimelineControl } from '@/components/timeline/TimelineControl';
import { ObjectDetailPanel } from '@/components/object/ObjectDetailPanel';

// Globe + star layers are client-only (WebGL / window access).
const CesiumGlobe = dynamic(() => import('@/components/globe/CesiumGlobe'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-haze">Initialising globe…</div>,
});
const StarField = dynamic(() => import('@/components/globe/StarField'), { ssr: false });

export default function HomePage() {
  return (
    <main id="top" className="relative h-dvh w-full overflow-hidden">
      {/* 1. ambient particles */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <StarField />
      </div>

      {/* 2. hero globe */}
      <CesiumGlobe />

      {/* 3. legibility vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_30%,transparent_40%,hsl(var(--void)/0.85)_100%)]" />

      {/* 4–8. chrome on top of the globe */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <TopNav />

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-4 md:flex-row md:items-start md:justify-between md:overflow-visible">
          {/* Left: search + the report overlay */}
          <div className="flex w-full flex-col gap-4 md:max-w-md">
            <div className="pointer-events-auto">
              <LocationSearch />
            </div>
            <CelestialReport />
          </div>
        </div>

        {/* bottom timeline — its own flex row, so it stays pinned and visible
            no matter how tall the report or how the search dropdown expands. */}
        <div className="pointer-events-auto px-6 pb-5">
          <div className="mx-auto max-w-xl">
            <TimelineControl />
          </div>
        </div>
      </div>

      {/* right-side object detail */}
      <ObjectDetailPanel />
    </main>
  );
}
