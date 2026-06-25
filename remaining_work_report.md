# Remaining Work Report
**Project Zenith — what is still missing after the execution pass**
Companion: [implementation_report.md](implementation_report.md) · [integration_report.md](integration_report.md) · [final_sanity_report.md](final_sanity_report.md)

Effort scale: `30 min` · `1 hour` · `4 hours` · `1 day` · `Multiple days`

---

## Blueprint Features — FULLY Addressed (real, end-to-end)

| Feature | Notes |
|---|---|
| Location search | Real worldwide geocoding (`/api/location/search`). |
| GPS / "Use My Location" | Real geolocation → real reverse geocode. |
| 3D Celestial Globe | Real Cesium render. |
| Click-to-select location | Real reverse geocode → real report. |
| ISS tracking (position) | Real CelesTrak TLE + satellite.js; globe marker tracks the real ISS. |
| Observation Quality Score | Real cloud (Open-Meteo) + moon (USNO) + light pollution + visibility. |
| Weather / cloud cover | Real Open-Meteo. |
| Planet magnitudes (Visible Tonight) | Real NASA Horizons (with fallback). |
| AI Sky Narrator | Real Gemini over real readings (template fallback). |
| Object detail (ISS) | Real altitude/velocity/inclination/period. |

---

## Blueprint Features — PARTIALLY Addressed

| Feature | What works now | What's missing | Effort to finish |
|---|---|---|---|
| ISS pass prediction / events | Real pass derived from N2YO **when a valid key is set** | Bundled N2YO key is invalid → window/events empty; needs a valid key (or swap to a propagation-based pass calculator) | `30 min` (valid key) / `4 hours` (self-computed passes) |
| Upcoming Events feed | Real ISS pass event | Meteor showers, moonrise/moonset, planetary alignments not computed | `4 hours` (moon rise/set from USNO; static meteor-shower calendar) |
| Timeline simulation | Scrub refetches; backend returns real **current** conditions | No true forward propagation (future ISS passes, moon-phase progression, planet motion per scrub point) | `1 day` |
| Moon data | Real illumination % feeds the score | No phase **name** ("Waxing Crescent"), no moonrise time surfaced | `1 hour` |
| Light pollution | Wired with Bortle fallback | Source endpoint (`lightpollutionmap.info`) is unreliable; often falls back to default Bortle | `4 hours` (integrate a reliable light-pollution dataset/API) |
| Planet visibility (above horizon) | Real magnitudes; `visibleNow` is a magnitude heuristic | No topocentric altitude/azimuth per location/time | `4 hours` (compute alt/az from Horizons OBSERVER ephemeris) |
| Atmospheric visibility factor | Now contributes (metres→km fix) | Simple linear scaling; not a true seeing model | `1 hour` |

---

## Blueprint Features — NOT Addressed

| Feature | Why / Note | Effort |
|---|---|---|
| Constellations currently observable | No source wired; AstronomyAPI never integrated (the `astronomy-computation.engine.ts` parser is still dead code) | `1 day` |
| General satellite tracking (beyond ISS) | Only NORAD 25544 is modeled; CelesTrak group / N2YO catalog not surfaced | `1 day` |
| Real-time WebSocket updates | Globe ISS uses 5 s HTTP polling; Socket.IO server still only logs connect/disconnect, emits nothing; no `socket.io-client` on the frontend | `4 hours` (emit propagated ISS every N s + FE subscribe) |
| Scheduled telemetry updates | No scheduler/cron pushing telemetry | `4 hours` |
| Redis caching layer | Replaced with a 60 s in-process cache (`cache.util.ts`); `ioredis` still unused | `4 hours` (drop-in swap, same get/set) |
| Set Alert / notifications | Button present, no handler | `4 hours` |
| Voice narration (TTS) | Placeholder button | `4 hours` |
| Settings panel | Gear toggles a flag with no panel | `1 hour` (hide) / `4 hours` (build) |

---

## Mocked Components Still Remaining

| Component / path | Reality after this pass |
|---|---|
| `mock-data.ts` builders | Still present **by design** as the `liveOrMock` safety net (and `mock` mode). Not deleted. |
| `narratorService`, `observationService`, `timelineService`, `satelliteService.visible` | Unused by any component; still contain mock branches. Harmless; can be deleted or pointed at real paths. `30 min` |
| `UpcomingEvents` when N2YO key invalid | Falls back to empty list (not fake data, but sparse). |
| Globe ISS in **mock mode** | Decorative static marker (only when no gateway). |
| `ObjectDetailPanel` "Orbit Path Visualization" | Still a CSS radar animation, not a real 3D orbit. `1 day` |

---

## Technical Debt Remaining

| Item | Effort |
|---|---|
| Rotate the **invalid/exposed** keys; the N2YO key in `.env` is rejected, Gemini key works | `30 min` |
| Rename `astronomyapi.service.ts` → `usno.service.ts` (it calls USNO, not AstronomyAPI) | `30 min` |
| Delete dead `astronomy-computation.engine.ts` (or wire real AstronomyAPI) | `30 min` |
| Two lockfiles (`package-lock.json` + `pnpm-lock.yaml`) and two WS libs (`socket.io` + `ws`) — pick one each | `1 hour` |
| Centralize all `process.env` reads + validation in `config/env.ts` | `1 hour` |
| Remove leftover `console.log`s (`n2yo.service.ts`, `celestial-computation.engine.ts`) | `30 min` |
| Backend has no linter/formatter; inconsistent whitespace | `1 hour` |
| Backend `tsconfig` `types: []` means `tsc` can't typecheck (runs via `tsx` only) | `1 hour` (add `@types/node`, `types:["node"]`) |
| No tests anywhere (front or back) | `Multiple days` |

---

## Production Concerns Remaining

| Concern | Effort |
|---|---|
| No real Redis / shared cache (single-process only) | `4 hours` |
| No rate limiting / auth on the paid Gemini endpoint | `4 hours` |
| No global Express error handler / 404 handler | `1 hour` |
| External calls: timeouts added in the **new** aggregation path, but legacy services (`nasa-horizons`, `open-notify`, `usno`) still have no per-call axios timeout | `1 hour` |
| No structured logging / request IDs (only `console`) | `4 hours` |
| `cors()` + socket `origin:'*'` are wide open | `30 min` |
| `/api/visible-tonight` still 8 sequential Horizons calls, lat/lon-blind (superseded by `/api/report` but still exposed) | `1 hour` (deprecate or parallelize) |
| No CI / deploy pipeline | `1 day` |
| Mobile perf (two WebGL contexts + blur) unverified on devices | `4 hours` |

---

## Suggested next 1-day plan (highest remaining ROI)

1. Set a **valid N2YO key** → instantly lights up ISS pass windows + events. `30 min`
2. Add **moon phase name + moonrise** from USNO → fills the Moon story. `1 hour`
3. **Emit ISS over Socket.IO** + subscribe on the frontend → delivers the "real-time" blueprint pillar (replaces polling). `4 hours`
4. **Hide the dead controls** (settings, Set Alert, voice) → removes judge-facing "fake feature" risk. `1 hour`
5. **Swap the in-process cache for ioredis** → checks the Redis box with a drop-in. `4 hours`

Everything above is incremental on top of a now-working, integrated base — no rewrites required.
