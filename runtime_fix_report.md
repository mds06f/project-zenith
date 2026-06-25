# Project Zenith — Runtime Fix Report

Mode: runtime stability + frontend integration. No architecture changes, no new
features. Backend treated as correct (verified: `/api/report` returns a valid,
non-zero score). Only code that directly improves runtime behaviour was touched.

---

## Summary of bugs fixed

| # | Bug | Severity | Area |
|---|-----|----------|------|
| 1 | Observation Score always renders `0` | High | Frontend render |
| 2 | Globe click race — older response overwrites newer selection | High | Frontend state |
| 3 | Superseded report/object fetches not cancelled | Medium | Frontend data |
| 4 | Intentional aborts fell back to mock + logged console noise | Medium | Frontend data |
| 5 | Satellite polling overlapped & cascaded on unstable network | Medium | Frontend polling |
| 6 | "Visible Tonight" / report column could not scroll | Medium | CSS/layout |

---

## Bug 1 — Observation Score displays `0` despite a correct backend value

**Symptom.** Search Kolkata → report loads (HTTP 200), the radar arc fills to the
right level, the condition badge and factor list are correct — but the big number
in the centre stays `0`.

**Data is correct end-to-end.** Live verification:

```
GET /api/report/22.57/88.36?t=now&name=Kolkata&tz=Asia/Kolkata
→ "score": { "score": 23, "condition": "Poor", "factors": [ ... ] }
```

`report.score.score = 23` flows correctly: `reportService.get` → React Query →
`cacheReport` (Zustand) → `CelestialReport` → `<ObservationScore {...report.score} />`.
The `score` prop arriving at the component **is 23**. So the bug is purely in how
the component renders that number.

**Root cause (exact line).**
`frontend/src/components/dashboard/ObservationScore.tsx` rendered the number as a
framer-motion **MotionValue used as a text child**:

```tsx
const count = useMotionValue(0);
const rounded = useTransform(count, v => Math.round(v));
useEffect(() => { animate(count, score, { duration: 1.1, ease: 'easeOut' }); }, [score, count]);
...
<motion.span>{rounded}</motion.span>   // ← stuck at its initial 0
```

How framer-motion renders a motion-value child (verified in its source):

1. `render/dom/use-render.mjs:24` renders the child once via
   `useMemo(() => children.get(), [children])`. `children` is the **stable**
   `rounded` reference, so React renders the **initial value `0` and never
   recomputes it**.
2. Live updates come only from an imperative `textContent` subscription set up in
   `DOMVisualElement.handleChildMotionValue()`.
3. That method is called **only from `VisualElement.update()`** (`VisualElement.mjs:315`).
4. `update()` is **explicitly skipped on the initial mount**
   (`motion/utils/use-visual-element.mjs:48-56` — *"This ensures we skip the initial update"*).

So the subscription is established only on the **first re-render after mount**. In
this app, `ObservationScore` mounts once (when the report arrives) and **does not
re-render during the 1.1 s count-up** — motion values intentionally bypass React,
and nothing else changes its props in that window. The animation's change events
are fired into the void; the DOM text stays frozen at the initial `0`.

The radar arc was unaffected because it uses the standard **declarative**
`animate={{ strokeDashoffset }}` prop (not a motion-value child) — which is exactly
why users saw a correctly-filled arc with a `0` in the middle.

**Fix.** Drive the displayed number through React state so it re-renders every
frame, and guard against a non-finite/out-of-range score:

```tsx
const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(score, 100)) : 0;
const [display, setDisplay] = useState(0);
const latest = useRef(0);
useEffect(() => {
  const controls = animate(latest.current, safeScore, {
    duration: 1.1, ease: 'easeOut',
    onUpdate: v => { latest.current = v; setDisplay(Math.round(v)); },
  });
  return () => controls.stop();
}, [safeScore]);
...
<span ...>{display}</span>
```

`animate(from, to, { onUpdate })` is framer-motion's standard imperative API and
does not depend on the motion-value-child subscription, so the number now always
tracks the value (counting up from the previous score on each change).

**Files changed:** `frontend/src/components/dashboard/ObservationScore.tsx`

---

## Bug 2 — Globe click race: a slow earlier response overwrites a newer selection

**Symptom.** Click location A then B quickly → the report sometimes ends up showing
A (the older click), and/or a request appears to "time out" and fall back to mock.

**Root cause.** Every globe click did:

```tsx
void locationService.reverseGeocode(coords).then(setLocation);
```

with **no cancellation and no ordering guard**. Two rapid clicks issue two
independent reverse-geocode requests; whichever resolves **last** wins the final
`setLocation`. If A's response arrives after B's, `setLocation(A)` overwrites B —
stale state. The requests were also never aborted, so both ran to completion.

**Fix.** A monotonic click id + a per-click `AbortController` in `CesiumGlobe`:

```tsx
const seq = ++clickSeqRef.current;
reverseGeocodeAbortRef.current?.abort();          // cancel the previous click
const controller = new AbortController();
reverseGeocodeAbortRef.current = controller;
void locationService.reverseGeocode(coords, controller.signal)
  .then(loc => { if (seq === clickSeqRef.current) setLocation(loc); })  // newest only
  .catch(() => { /* superseded/aborted — ignore */ });
```

Only the newest click can commit; older ones are aborted and their results
discarded. The `AbortSignal` is threaded `reverseGeocode → liveOrMock → request`.

**Files changed:** `frontend/src/components/globe/CesiumGlobe.tsx`,
`frontend/src/services/api/location.service.ts`,
`frontend/src/services/api/client.ts`

---

## Bug 3 — Superseded report / object fetches were not cancelled

**Root cause.** React Query passes an `AbortSignal` to `queryFn`, but the query
functions ignored it. When the active location/timeline changed, the in-flight
report fetch for the **previous** location kept running to completion (and could
trigger a mock fallback), adding needless concurrent load — a contributor to the
"many failed requests on refresh" cascade.

**Fix.** Thread React Query's `signal` through to the transport so a key change
cancels the now-superseded request:

```tsx
queryFn: ({ signal }) => reportService.get(location, timeline, signal)   // report
queryFn: ({ signal }) => satelliteService.detail(id, location, timeline, signal) // object
```

`reportService.get` / `satelliteService.detail` pass `signal` into `liveOrMock` →
`request`.

**Files changed:** `frontend/src/hooks/use-celestial-report.ts`,
`frontend/src/services/api/report.service.ts`,
`frontend/src/hooks/use-object-detail.ts`,
`frontend/src/services/api/satellite.service.ts`,
`frontend/src/services/api/client.ts`

---

## Bug 4 — Intentional aborts produced console noise and mock fallback

**Root cause.** `liveOrMock` treated every error identically: `console.warn(...)` +
fall back to mock. Once requests became cancellable (Bugs 2 & 3), an **intentional**
cancellation would have logged a warning and replaced live state with mock data.

**Fix.** Distinguish a caller-initiated abort from a real failure:

```ts
catch (err) {
  if (signal?.aborted || (isAbortError(err) && signal)) throw err; // quiet, no fallback
  console.warn(`[api] live ${path} failed — falling back to mock`, err);
  return mock();
}
```

- **Intentional abort** (newer click / key change) → re-thrown quietly; the caller's
  `.catch` ignores it. No warning, no mock overwrite.
- **Real failure** (15 s timeout, network error, non-2xx) → unchanged: warn once and
  fall back to mock (the demo-reliability behaviour).

Added an `isAbortError` helper. The internal timeout and any external signal are
linked manually inside `request()` (broad browser support; no `AbortSignal.any`).

**Files changed:** `frontend/src/services/api/client.ts`

---

## Bug 5 — Satellite polling overlapped and cascaded under an unstable network

**Audit result (Task 3).** There is exactly **one** network polling loop in the
frontend: the ISS sub-satellite point in `CesiumGlobe`. Its interval was **5 s**
(not 1 s — there is no 1-second network poll anywhere; `grep` for
`setInterval`/`refetchInterval`/`1000` confirms only this poller and local,
non-network timers in `SkyNarrator`'s typewriter and the search debounce).

**Root cause.** It used `setInterval(updateIss, 5000)`, which fires every 5 s
**regardless of whether the previous request finished**, and the `fetch` had **no
timeout/abort**. On a slow or unstable connection, requests overlapped and piled up
into concurrent in-flight fetches that never resolved — which is what cascaded into
the backend's repeated upstream-timeout logs and the "many failed requests" on
refresh.

**Fix.** A self-scheduling, non-overlapping loop with a per-request timeout that
pauses while the tab is hidden:

```tsx
const pollIss = async () => {
  if (disposed) return;
  if (document.hidden) { issTimer = setTimeout(pollIss, POLL_MS); return; } // skip hidden tab
  issAbort = new AbortController();
  const to = setTimeout(() => issAbort?.abort(), POLL_TIMEOUT_MS);          // 8 s ceiling
  try { /* fetch + move marker */ }
  catch { /* aborts + transient failures: keep last good position, silent */ }
  finally { clearTimeout(to); issAbort = null; if (!disposed) issTimer = setTimeout(pollIss, POLL_MS); }
};
```

Guarantees: **one** in-flight request at a time, a fixed 5 s gap *between completed*
polls (never overlapping), a stalled request dropped after 8 s instead of stacking,
no polling while the tab is hidden, and in-flight abort on unmount. The interval
stays at 5 s (within the requested 5–10 s); the real defect was the overlap, now
removed.

**Files changed:** `frontend/src/components/globe/CesiumGlobe.tsx`

---

## Bug 6 — "Visible Tonight" / report panel could not scroll

**Root cause.** The report overlay (`CelestialReport`'s `motion.section`) had **no
bounded height**, and the desktop layout container in `page.tsx` is
`md:overflow-visible`. So the stacked cards (Observation Score, Sky Narrator,
Visible Tonight, Upcoming Events) plus the CTA grew past the viewport with **no
scroll** — the lower content (including Visible Tonight) was simply unreachable. The
Visible Tonight list also had no internal height cap.

**Fix.**

- `CelestialReport`: bound the section to the viewport and let it scroll —
  `max-h-[calc(100dvh-11rem)] overflow-y-auto pr-1` (11rem accounts for the top nav,
  search bar, and bottom timeline).
- `VisibleTonight`: cap the list with `max-h-60 overflow-y-auto pr-1` so a long
  object list scrolls inside its card while the rest of the report stays visible.

**Files changed:** `frontend/src/components/dashboard/CelestialReport.tsx`,
`frontend/src/components/dashboard/VisibleTonight.tsx`

---

## Request lifecycle audit (Task 2)

- **Search:** one debounced (220 ms) `GET /api/location/search` per settled
  keystroke; on selection, one React-Query-keyed `GET /api/report`. No duplicates.
- **Globe click:** one `GET /api/location/:lat/:lng` (reverse-geocode) + one
  `GET /api/report`. Both now cancellation-guarded; rapid clicks no longer race.
- **Polling:** exactly one loop (ISS position), now non-overlapping at 5 s.

No duplicate request paths were found beyond the uncancelled reverse-geocode, which
is now fixed.

---

## Validation performed

- **Backend live payload:** `curl /api/report/22.57/88.36` → `score.score = 23`,
  correctly nested as `{ score, condition, factors[] }` — proves the score bug was
  render-only and the contract matches the frontend types.
- **Poller endpoint:** `curl /api/satellite/position` → HTTP 200 with valid
  `{ latitude, longitude, altitude, velocity }`.
- **Type safety:** `npx tsc --noEmit` (frontend) → exit 0.
- **Build/serve:** `next dev` compiled all 4370 modules including every changed
  file; `GET / 200`; no errors or warnings in the dev log.
- **Code-path review:** traced API → service → React Query → Zustand → component for
  the score; traced click/poll lifecycles for cancellation and ordering.

> Visual confirmation of the animated count-up requires a real browser (Cesium/WebGL;
> no headless browser is available in this environment). The fix is verified by:
> (a) proof the data is correct at the component boundary, (b) the framer-motion
> source-level root cause, and (c) replacing the fragile motion-value-child render
> with framer-motion's standard state-driven `animate({ onUpdate })` pattern.

---

## Known issues / non-blockers (unchanged, by design)

- **Gemini 429**, **N2YO invalid key**, **NASA Horizons 503** — expected upstream
  conditions; backend fallbacks already handle them (per brief). Not touched.
- **Hydration warning (`fdprocessedid`)** — injected by browser extensions
  (password managers / autofill) onto `<input>`/`<button>` elements; not emitted by
  application code. Left untouched per instructions (no proof it is ours; it is not).
- **`next lint` not configured** — the repo has no ESLint flat config (ESLint v9
  prompts for interactive setup). Pre-existing and unrelated; `tsc` is the gate used
  here.
- **15 s client request timeout** still warns + falls back to mock on a genuinely
  slow report (e.g. a Gemini cold start). That is intentional demo-reliability
  behaviour, distinct from the now-silenced intentional cancellations.
- **TopNav "Use My Location"** uses the same `reverseGeocode` but as a single
  deliberate action, not part of the rapid-click race; left as-is (it works through
  the new optional-signal API).

---

## Files changed (complete list)

```
frontend/src/components/dashboard/ObservationScore.tsx   (Bug 1)
frontend/src/components/globe/CesiumGlobe.tsx            (Bugs 2, 5)
frontend/src/services/api/client.ts                     (Bugs 2, 3, 4)
frontend/src/services/api/location.service.ts           (Bug 2)
frontend/src/services/api/report.service.ts             (Bug 3)
frontend/src/services/api/satellite.service.ts          (Bug 3)
frontend/src/hooks/use-celestial-report.ts              (Bug 3)
frontend/src/hooks/use-object-detail.ts                 (Bug 3)
frontend/src/components/dashboard/CelestialReport.tsx    (Bug 6)
frontend/src/components/dashboard/VisibleTonight.tsx     (Bug 6)
```

No backend files were modified.
