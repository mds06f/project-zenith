/**
 * File: src/components/layout/TopNav.tsx
 * Purpose: Persistent top navigation — brand + the single primary action
 *   ("Use My Location"). Kept deliberately minimal: Project Zenith is a
 *   single-screen experience, so the globe, report and timeline are always on
 *   screen — section nav links would be redundant (and previously pointed at
 *   anchors that didn't exist).
 * Data flow: geolocation → reverseGeocode → locationStore.setLocation.
 */
'use client';

import { Telescope, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/location.store';
import { useUiStore } from '@/store/ui.store';
import { locationService } from '@/services/api/location.service';

export function TopNav() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPending = useLocationStore((s) => s.setPending);
  const setReportOpen = useUiStore((s) => s.setReportOpen);

  /** Resolve the browser's geolocation into the active Location. */
  const useMyLocation = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const c = { lat: coords.latitude, lng: coords.longitude };
      setPending(c);
      setReportOpen(true);
      void locationService.reverseGeocode(c).then(setLocation);
    });
  };

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-6 py-3">
      <a href="#top" className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-aurora/40 bg-aurora/10 text-aurora">
          <Telescope size={16} strokeWidth={1.75} />
        </span>
        <span className="font-display text-sm font-semibold tracking-tight text-frost">
          Project Zenith - The Celestial Eye
        </span>
      </a>

      <Button variant="primary" size="sm" onClick={useMyLocation}>
        <MapPin size={14} /> Use My Location
      </Button>
    </header>
  );
}
