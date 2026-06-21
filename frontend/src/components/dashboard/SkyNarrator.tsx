/**
 * File: src/components/dashboard/SkyNarrator.tsx
 * Purpose: AI narration card with a typewriter reveal and a (placeholder) voice
 *          playback control.
 * Inputs:  narration (SkyNarration), loading flag.
 * Outputs: premium-typeset prose that types itself out; play/pause affordance.
 * Data flow: CelestialReport.narration → here.
 * Edge cases: respects prefers-reduced-motion (shows full text instantly);
 *   re-runs the typewriter when the text changes (new location/timeline).
 * Future enhancement: stream tokens from the live LLM endpoint; real TTS.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import type { SkyNarration } from '@/types';
import { Eyebrow, Panel } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SkyNarrator({ narration, loading }: { narration: SkyNarration | null; loading: boolean }) {
  const [shown, setShown] = useState('');
  const full = narration?.text ?? '';
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!full) return setShown('');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setShown(full);

    let i = 0;
    setShown('');
    timer.current = setInterval(() => {
      i += 2;
      setShown(full.slice(0, i));
      if (i >= full.length && timer.current) clearInterval(timer.current);
    }, 18);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [full]);

  return (
    <Panel className="flex flex-col gap-3 bg-aurora-glow">
      <div className="flex items-center justify-between">
        <Eyebrow className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-aurora" /> Sky Narrator
        </Eyebrow>
        <Button size="sm" variant="ghost" aria-label="Play narration (voice playback coming soon)">
          <Volume2 size={15} />
        </Button>
      </div>
      <p className="font-display text-base leading-relaxed text-frost/90">
        {loading && !shown ? 'Reading the sky…' : shown}
        {shown.length < full.length && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-aurora align-middle" />}
      </p>
    </Panel>
  );
}
