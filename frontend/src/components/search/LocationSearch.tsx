/**
 * File: src/components/search/LocationSearch.tsx
 * Purpose: Floating search bar — city / country / coordinate search with
 *          suggestions, full keyboard navigation, and recent-search history.
 * Responsibilities: debounce input, query locationService, render a listbox,
 *   commit a selection to the store (which flies the camera + loads the report).
 * Data flow: input → locationService.search → suggestions → setLocation.
 * Edge cases: ↑/↓ wrap; Enter selects highlighted; Esc clears; empty query
 *   shows history instead of suggestions.
 * Future enhancement: server-backed autocomplete + "search this map area".
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Clock } from 'lucide-react';
import type { Location } from '@/types';
import { locationService } from '@/services/api/location.service';
import { useLocationStore } from '@/store/location.store';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

export function LocationSearch() {
  const setLocation = useLocationStore((s) => s.setLocation);
  const history = useLocationStore((s) => s.history);
  const setReportOpen = useUiStore((s) => s.setReportOpen);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounced search. Each keystroke aborts the previous in-flight request so a
  // slow earlier search can't overwrite newer suggestions (superseded-search
  // cancellation — the one place we DO cancel).
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(() => {
      void locationService
        .search(query, controller.signal)
        .then((r) => {
          if (controller.signal.aborted) return;
          setResults(r);
          setActive(0);
        })
        .catch(() => {
          /* superseded/aborted keystroke — ignore */
        });
    }, 220);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  // What the listbox shows: live results, or history when the field is empty.
  const items = useMemo(() => (query.trim() ? results : history), [query, results, history]);

  const commit = (loc: Location) => {
    setLocation(loc);
    setReportOpen(true);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const sel = items[active];
      if (sel) commit(sel);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-full border border-hairline/70 bg-nebula/60 px-3.5 py-2 backdrop-blur-xl focus-within:border-aurora/50 focus-within:shadow-glow">
        <Search size={15} className="shrink-0 text-haze" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Search a city, country, or coordinates"
          className="w-full bg-transparent text-sm text-frost placeholder:text-haze/70 focus:outline-none"
          role="combobox"
          aria-expanded={open}
          aria-controls="location-listbox"
        />
      </div>

      {open && items.length > 0 && (
        <ul
          id="location-listbox"
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-hairline/70 bg-abyss/95 p-1 shadow-panel backdrop-blur-xl"
        >
          {items.map((loc, i) => (
            <li key={loc.id} role="option" aria-selected={i === active}>
              <button
                onMouseDown={() => commit(loc)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm',
                  i === active ? 'bg-frost/10 text-frost' : 'text-haze'
                )}
              >
                {!query.trim() && <Clock size={13} className="text-haze/70" />}
                <span className="text-frost">{loc.name}</span>
                {loc.country && <span className="text-xs text-haze">{loc.country}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
