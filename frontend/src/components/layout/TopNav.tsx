/**
 * File: src/components/layout/TopNav.tsx
 * Purpose: Persistent top navigation — brand, primary nav, location + settings.
 * Responsibilities: brand identity; "Use My Location" geolocation trigger;
 *   open settings. Nav links are anchors to in-page sections (single-page shell).
 * Data flow: geolocation → reverseGeocode → locationStore.setLocation.
 * Future enhancement: real routing for Timeline/Explore/About sub-experiences.
 */
'use client';

import { Telescope, MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/store/location.store';
import { useUiStore } from '@/store/ui.store';
import { locationService } from '@/services/api/location.service';

const NAV_ITEMS = ['Dashboard', 'Timeline', 'Explore', 'About'] as const;

export function TopNav() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPending = useLocationStore((s) => s.setPending);
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen);
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
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-aurora/40 bg-aurora/10 text-aurora">
            <Telescope size={16} strokeWidth={1.75} />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-frost">
            Project Zenith
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="rounded-full px-3 py-1.5 text-sm text-haze transition-colors hover:bg-frost/5 hover:text-frost"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={useMyLocation}>
          <MapPin size={14} /> Use My Location
        </Button>
        <Button variant="ghost" size="sm" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <Settings size={16} />
        </Button>
      </div>
    </header>
  );
}
