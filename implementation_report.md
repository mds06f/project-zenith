# Implementation Report
**Project Zenith — Staff-Engineer Execution Pass**
Goal: maximize demo readiness, real data, and end-to-end functionality with the **smallest possible change set**. No architecture rewrite.
Companion docs: [integration_report.md](integration_report.md) · [remaining_work_report.md](remaining_work_report.md) · [final_sanity_report.md](final_sanity_report.md)

---

## Strategy (Phase 1–2 ranking)

**Implemented — High impact / Low–Medium effort:**
1. Fix backend startup (it served nothing).
2. Build ONE real aggregation endpoint (`/api/report`) → makes the whole dashboard real.
3. De-hardcode the two fake endpoints (`/api/ai`, `/api/timeline`).
4. Real ISS on the globe (live propagation).
5. Real geocoding (search + reverse) replacing the 6-city gazetteer.
6. Wire the frontend to live data **with automatic mock fallback** for demo reliability.
7. Harden the observation score; add a small cache; add `.env.example`.

**Deliberately NOT done (low impact / out of scope per brief):** settings panel, voice narration/TTS, "Set Alert" wiring, extra animations, constellations, general (non-ISS) satellite catalog, true future-time simulation, Redis swap, WebSocket push, auth/rate-limit. These are catalogued in [remaining_work_report.md](remaining_work_report.md).

**Fastest real end-to-end flow chosen:** `globe/search → backend → real APIs (Open-Meteo, USNO, CelesTrak+satellite.js, NASA Horizons, Gemini) → CelestialReport → dashboard updates`. Highest credibility per line changed, because the frontend already expected this exact contract — so the backend was built to match the paths the frontend already calls.

---

# Changes Made

## A. Backend startup — it wasn't actually serving

**Problem:** `npm run dev` ran `tsx watch src/app.ts`, and `app.ts` only `export default app` — it never called `.listen()`. The HTTP/WebSocket server in `server.ts` was referenced by no script. The backend bound no port.
**Files changed:** [backend/package.json](backend/package.json)
**Reason:** point the run scripts at the entrypoint that actually listens and initializes Socket.IO.
**Impact:** `npm run dev` now starts a listening server on `:8000` (verified: `GET /api/health` → 200). Added a `start` script too.

---

## B. `/api/ai` ran without CORS or body parsing

**Problem:** `app.use("/api/ai", aiRoute)` was registered **above** `app.use(cors())` and `app.use(express.json())`, so the AI route had no CORS headers and no parsed body.
**Files changed:** [backend/src/app.ts](backend/src/app.ts)
**Reason:** global middleware must run before any route.
**Impact:** every route (incl. `/api/ai`) now gets CORS + JSON. Verified `Access-Control-Allow-Origin: *` on GET and OPTIONS preflight.

---

## C. New real aggregation endpoint `GET /api/report/:lat/:lng`

**Problem:** the frontend dashboard expected a single `CelestialReport` payload that no backend route produced; the whole UI therefore ran on mock data.
**Files added:**
- [backend/src/types/report.types.ts](backend/src/types/report.types.ts) — server mirror of the frontend contract.
- [backend/src/services/aggregation/report.service.ts](backend/src/services/aggregation/report.service.ts) — composes real sources.
- [backend/src/controllers/report.controller.ts](backend/src/controllers/report.controller.ts), [backend/src/routes/report.routes.ts](backend/src/routes/report.routes.ts)
- [backend/src/utils/async.util.ts](backend/src/utils/async.util.ts) (`withTimeout`, `safe`), [backend/src/utils/cache.util.ts](backend/src/utils/cache.util.ts) (TTL cache).
**Reason:** deliver the exact shape the frontend already consumes, sourced from real APIs, without a frontend rewrite.
**What's real in the response:**
- **Observation score** ← Open-Meteo (cloud, visibility) + USNO (moon illumination) + light pollution.
- **ISS object** ← CelesTrak TLE + `satellite.js` propagation → **real altitude/velocity**; N2YO next-pass window (key-gated).
- **Planets** ← NASA Horizons visual magnitudes (parallel, per-body fallback).
- **Narration** ← Google Gemini over the real numbers (templated fallback).
- **Events** ← real ISS pass derived from N2YO.
- Every upstream is `withTimeout`-bounded + `safe`-wrapped, and the whole report is cached 60s.
**Impact (verified):** Kolkata → score 6 / "Poor" (73 % cloud, Bortle 9, moon 75 % illuminated, 9 km visibility), ISS 420 km / 27 579 km/h, Venus −4.4 & Saturn 0.67 (real Horizons). NYC → score 43, 4 % cloud (location-aware). Cold ≈ 4.5 s; cached ≈ 0.07 s.

---

## D. New `GET /api/object/:id` (object detail)

**Problem:** the right-side panel's live path (`/api/object/:id`) had no backend; ISS detail was static mock (always 421 km).
**Files added:** [backend/src/controllers/object.controller.ts](backend/src/controllers/object.controller.ts), [backend/src/routes/object.routes.ts](backend/src/routes/object.routes.ts)
**Reason:** reuse the cached aggregated report and return the matching object → real ISS detail with zero extra upstream cost.
**Impact (verified):** `GET /api/object/iss?lat=&lng=` → real `{ altitudeKm:420, velocityKmh:27579, inclinationDeg:51.6, periodMin:92 }`.

---

## E. New `GET /api/location/*` (real geocoding)

**Problem:** the frontend's only "search" was a hardcoded 6-city offline gazetteer; no reverse geocoding existed.
**Files added:** [backend/src/services/external/geocoding.service.ts](backend/src/services/external/geocoding.service.ts), [backend/src/controllers/location.controller.ts](backend/src/controllers/location.controller.ts), [backend/src/routes/location.routes.ts](backend/src/routes/location.routes.ts)
**Reason:** real worldwide search (Open-Meteo geocoding) + reverse (BigDataCloud) — both keyless — with a coordinate-label fallback.
**Impact (verified):** `search?q=tokyo` → real Tokyo, Japan (`Asia/Tokyo`); reverse `22.57/88.36` → "Kolkata, West Bengal, India".

---

## F. De-hardcoded the AI Narrator endpoint

**Problem:** [ai.controller.ts](backend/src/controllers/ai.controller.ts) fed Gemini a block of fixed constants (score 91, "Taurus", hardcoded RA/Dec) → identical answer for all of Earth.
**Files changed:** [backend/src/controllers/ai.controller.ts](backend/src/controllers/ai.controller.ts)
**Reason:** accept `lat/lon`, run the real aggregation pipeline, return Gemini narration over actual readings.
**Impact (verified):** London → real Gemini LLM output *"…exceptionally clear skies with 0% cloud cover… Venus shining at magnitude -4… the ISS, orbiting at 421 km and a speedy 27 577 km/h!"*. Falls back to a real-data template when Gemini 503s.

---

## G. De-hardcoded the Timeline endpoint

**Problem:** [timeline.controller.ts](backend/src/controllers/timeline.controller.ts) fed the engine fixed constants (score 85, cloud 20…) → identical prediction every time.
**Files changed:** [backend/src/controllers/timeline.controller.ts](backend/src/controllers/timeline.controller.ts)
**Reason:** pull live observation data (real score, cloud cover, light pollution) into the engine.
**Impact (verified):** NYC → score 28 / "Poor" (was a constant 85 before), driven by real conditions.

---

## H. Hardened the Observation Score service

**Problem:** [observation.service.ts](backend/src/services/aggregation/observation.service.ts) (a) called `getWeather` twice, (b) `Promise.all` 500'd the whole score if one source (esp. light pollution) failed, (c) passed visibility in **metres** so the engine's `10 - visibility` term was always ≤ 0 → the atmospheric-visibility factor never affected the score.
**Files changed:** [backend/src/services/aggregation/observation.service.ts](backend/src/services/aggregation/observation.service.ts)
**Reason:** one weather call; `withTimeout`+`safe` per source with sane fallbacks; convert metres→km so visibility actually scores.
**Impact:** `/api/observation` and the report no longer crash when an upstream dies; visibility now contributes. Verified the report survives live Horizons 503s and an invalid N2YO key by degrading gracefully.

---

## I. App wiring + env template

**Files changed/added:** [backend/src/app.ts](backend/src/app.ts) (registered `/api/report`, `/api/object`, `/api/location`), [backend/.env.example](backend/.env.example) (new).
**Reason:** mount the new routes; document exactly which external keys are needed and which sources are keyless.
**Impact:** a fresh clone now has a clear key checklist (`N2YO_API_KEY`, `GEMINI_API_KEY`; everything else keyless).

---

## J. Frontend transport: live-with-mock fallback + timeout

**Problem:** the frontend was permanently in mock mode and, even in "live" mode, had no timeout and no resilience.
**Files changed:** [frontend/src/services/api/client.ts](frontend/src/services/api/client.ts)
**Reason:** add a 15 s `AbortController` timeout to `request()`, and a `liveOrMock()` helper that calls the gateway but **transparently falls back to the deterministic mock on any failure**.
**Impact:** with the backend up, the UI shows real data; if the backend (or one upstream) is unreachable, the user still sees a coherent dashboard instead of an error — critical demo insurance.

---

## K. Frontend services wired to the real gateway

**Problem:** the consumed services pointed at non-existent/ mismatched paths.
**Files changed:** [report.service.ts](frontend/src/services/api/report.service.ts), [satellite.service.ts](frontend/src/services/api/satellite.service.ts), [location.service.ts](frontend/src/services/api/location.service.ts)
**Reason:** route through `liveOrMock` against the new endpoints; the report service also merges the frontend's richer `Location` over the gateway's coordinate-derived one.
**Impact:** the dashboard, object-detail panel, and search now consume **real** backend data when live, mock when not. (Unused services — narrator/observation/timeline — left untouched.)

---

## L. Real ISS on the globe

**Problem:** the globe's ISS was a static marker on a fake `51.6·sin(2·lon)` curve.
**Files changed:** [frontend/src/components/globe/CesiumGlobe.tsx](frontend/src/components/globe/CesiumGlobe.tsx)
**Reason:** when a live gateway is configured, poll `/api/satellite/position` every 5 s and move the marker to the real sub-satellite point (interval cleaned up on unmount).
**Impact (verified):** endpoint returns real `lat −40.6, lon −91.75, alt 428.7 km`; the marker now tracks the actual ISS. Mock mode keeps the decorative marker.

---

## M. Frontend env

**Files added/changed:** [frontend/.env.local](frontend/.env.local) (new, gitignored), [frontend/.env.local.example](frontend/.env.local.example) (updated).
**Reason:** default the app to live (`http://localhost:8000`) so it shows real data out of the box, with mock fallback if the backend is down.
**Impact:** `npm run dev` in `frontend/` now talks to the backend automatically.

---

# Validation Results (Phase 4)

| Check | Result |
|---|---|
| Backend boots & listens (`server.ts`) | ✅ `GET /api/health` 200, uptime reported |
| `GET /api/report/:lat/:lng` real data | ✅ Kolkata 6/Poor, ISS 420 km/27 579 km/h, real Horizons mags |
| Location-awareness | ✅ NYC 43 vs Kolkata 6 vs Sydney 0 (real cloud cover differs) |
| `GET /api/object/iss` | ✅ real propagation |
| `GET /api/location/search?q=tokyo` | ✅ real worldwide results |
| `GET /api/location/:lat/:lng` reverse | ✅ "Kolkata, West Bengal, India" |
| `GET /api/satellite/position` (globe) | ✅ real lat/lon/alt |
| `GET /api/ai?lat&lon` | ✅ real Gemini LLM narration (London), template fallback on 503 |
| `GET /api/timeline?lat&lon` | ✅ real-driven (NYC 28) |
| Caching | ✅ cold 4.5 s → cached 0.07 s |
| Graceful degradation | ✅ survives Horizons 503, invalid N2YO key, Gemini 503 |
| CORS | ✅ `Access-Control-Allow-Origin: *` on GET + preflight |
| Frontend typecheck (`tsc --noEmit`) | ✅ exit 0 |
| Frontend production build (`next build`) | ✅ exit 0, "Compiled successfully", 4/4 static pages |

**Known data caveats (documented, not blockers):**
- The bundled **N2YO key is invalid** (`Invalid API Key!`) → ISS next-pass window/events omitted (graceful). Supply a valid key to enable them.
- **Gemini** (gemini-2.5-flash, free tier) intermittently returns 503 → real-data template fallback engages.
- **NASA Horizons** intermittently 503s individual bodies → per-body fallback magnitude used.
- Timeline scrub still returns *current* real conditions for every key (no true future propagation yet — see [remaining_work_report.md](remaining_work_report.md)).

**No files were deleted; no architecture was rewritten.** All original endpoints remain; the changes are additive plus five surgical edits.
