<div align="center">

<!-- Project logo placeholder — drop your logo at assets/icons/logo.png -->
<img src="assets/icons/logo.png" alt="Project Zenith logo" width="140" onerror="this.style.display='none'"/>

# 🌌 Project Zenith: The Celestial Eye

**Point anywhere on Earth and instantly understand everything happening in the sky above it.**

[![Frontend: Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://nextjs.org/)
[![Backend: Express 5](https://img.shields.io/badge/Backend-Express%205-000000?logo=express)](https://expressjs.com/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![3D: CesiumJS](https://img.shields.io/badge/3D-CesiumJS-48B?logo=cesium)](https://cesium.com/platform/cesiumjs/)
[![AI: Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)
[![Status: Feature Complete](https://img.shields.io/badge/Status-Feature%20Complete-success.svg)](#known-limitations)

Built by **Team Juno** for **AstralWeb Innovate 2026**.

</div>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Key Features](#key-features)
- [Unique Features](#unique-features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [External APIs Used](#external-apis-used)
- [AI Components](#ai-components)
- [Caching Strategy](#caching-strategy)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Installation & Local Setup](#installation--local-setup)
- [Production Deployment](#production-deployment)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)
- [GitHub Repository](#github-repository)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Project Overview

**Project Zenith** is an interactive web platform that turns the abstract, fragmented world of
astronomical and satellite data into a single, intuitive experience. Spin an interactive 3D Earth,
click any point (or search any place on the planet), and Zenith assembles a **live celestial report**
for that exact location: how good the sky is for observing right now, what's visible tonight, where the
International Space Station is, what events are coming up, and a plain-English narration of the sky —
all computed from **real, live data sources**.

It was built for **AstralWeb Innovate 2026**, a national-level web-development challenge themed around
visualizing real-time celestial activity above any location on Earth.

## Problem Statement

Understanding what's in the sky above you is surprisingly hard. The data exists, but it is:

- **Fragmented** — orbital elements, ephemerides, weather, light pollution, and moon phase each live in
  a different API with a different format.
- **Raw and technical** — TLE sets, equatorial coordinates, and magnitudes mean nothing to a casual
  stargazer.
- **Static and non-spatial** — most tools give you a table for one city, not an explorable globe.
- **Disconnected from observing conditions** — knowing a planet is *up* is useless if it's cloudy or the
  sky is washed out by city lights or a full moon.

There is no single, beautiful place to ask *"what's happening in the sky right here, right now, and is it
worth looking up?"*

## Solution Overview

Zenith answers that question in one screen. A **CesiumJS 3D globe** is the entry point: select a location
and the backend **aggregation gateway** fans out to half a dozen real data sources in parallel, fuses
them through a set of pure computational engines, and returns a single **Celestial Report**. The frontend
renders that report as a live dashboard — an **Observation Quality Score**, a **Visible Tonight** list, a
scrubbable **Timeline** that re-simulates the sky for *Now → Next Week*, **Upcoming Events**, and an
AI-written **Sky Narration**.

Every upstream call is timeout-bounded with a graceful fallback, and every result is cached, so the
experience stays instant and **never breaks** even when an external API is slow, rate-limited, or down.

---

## Key Features

- 🌍 **Interactive 3D Earth** — CesiumJS globe with click-to-select, auto-rotation, and a live ISS marker.
- 🔭 **Observation Quality Score (0–100)** — a single number for "how good is the sky here?", computed
  from real cloud cover, visibility, moon illumination, and light pollution.
- ⏱️ **Timeline Simulation** — scrub *Now · +1h · +3h · Tonight · Tomorrow · Next Week* and watch the
  entire report (weather, moon, planet positions, events, narration) genuinely re-simulate.
- ✨ **Visible Tonight** — real planets and the ISS visible from your location, with magnitudes and
  visibility windows.
- 🛰️ **Live Satellite / ISS Tracking** — real TLE propagation via `satellite.js` plus live position,
  altitude, and velocity.
- 📅 **Upcoming Astronomical Events** — sunset, astronomical twilight, moonrise/moonset, moon phase, the
  next meteor shower, and ISS passes — ordered and localized to your timezone.
- 🗣️ **AI Sky Narration** — a Google Gemini-written, typewriter-rendered summary of your sky, regenerable
  on demand.
- 🔎 **Worldwide Location Search & Geolocation** — type any place or click the globe to reverse-geocode.
- 🧭 **Object Inspector** — per-object detail (altitude, velocity, visibility window).
- 📱 **Responsive Dashboard** — desktop, tablet, and mobile.

## Unique Features

What sets Zenith apart from a typical "astronomy lookup" app:

1. **A fused Observation Quality Score, not just raw data.** Zenith doesn't just tell you a planet is up —
   it weighs clouds, atmospheric visibility, moonlight, and light pollution into one honest "is it worth
   looking up?" score.
2. **Genuinely time-aware simulation.** The Timeline isn't cosmetic. Moving the scrubber re-queries weather
   for a *different real hour*, recomputes moon phase/illumination for that instant, fetches planet
   ephemerides for the target date, and rebuilds the event list — so *Tonight* and *Next Week* really
   differ.
3. **Resilience as a feature.** Every external dependency is wrapped in a timeout + deterministic fallback.
   No N2YO key? The ISS still shows real position; only the "next pass" window is omitted. Gemini quota
   exhausted? Narration falls back to a templated summary built from the *same real numbers*. The UI is
   never left empty.
4. **Dependency-free astronomy.** Sun/moon/twilight times and moon phase are computed locally from a
   compact SunCalc port — accurate to ~a minute, no API, no key, no rate limit.
5. **Instant by design.** A layered TTL cache (per-upstream → report → narration) turns a ~10–12s cold
   report into a **3 ms** warm one, and shares weather/TLE/light-pollution across every timeline step.

---

## Technology Stack

### Frontend
- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict mode)
- **CesiumJS** — 3D globe & geospatial rendering
- **Three.js** — ambient starfield
- **Tailwind CSS** — styling
- **Framer Motion** — animation
- **Zustand** — client state
- **TanStack Query** — server-state, caching, request lifecycle
- **lucide-react** — icons
- **class-variance-authority · clsx · tailwind-merge** — styling utilities

### Backend
- **Node.js** + **Express 5**
- **TypeScript**, run directly with **tsx**
- **Socket.IO** — real-time channel
- **axios** — upstream HTTP
- **satellite.js** — TLE/SGP4 orbital propagation
- **@google/genai** — Gemini AI narration
- In-process **TTL cache** (Redis-ready interface)

### Tooling
- Git & GitHub · Vercel (frontend) · Figma (design) · npm

---

## Architecture Overview

Zenith is a two-tier system. The **Next.js frontend** never talks to third-party APIs directly — it talks
only to the **Express aggregation gateway**, which is responsible for fanning out, fusing, caching, and
degrading gracefully. This keeps API keys server-side, normalizes wildly different payloads into one clean
contract, and makes the whole thing cacheable.

```text
                    ┌──────────────────────────────────────────────┐
                    │                 FRONTEND (Next.js 15)         │
   User ──────────► │  CesiumJS Globe · Dashboard · Timeline        │
                    │  Zustand (UI state) · TanStack Query (server) │
                    └───────────────────────┬──────────────────────┘
                                             │  GET /api/report/:lat/:lng?t=…
                                             ▼
                    ┌──────────────────────────────────────────────┐
                    │          BACKEND — Express Aggregation Gateway │
                    │  Controllers → Aggregation Services → Engines  │
                    │  Layered TTL Cache · timeout + fallback guards │
                    └───────────────────────┬──────────────────────┘
              parallel fan-out (timeout-bounded, individually cached)
        ┌───────────────┬───────────┬───────────┬───────────┬──────────────┐
        ▼               ▼           ▼           ▼           ▼              ▼
   NASA Horizons   Open-Meteo   CelesTrak    Open Notify   Light-      Google
   (ephemerides)   (weather +   (ISS TLE)    (live ISS     Pollution   Gemini
                    geocoding)               lat/lng)      dataset     (narration)
                                                              + SunCalc engine
                                                              (local sun/moon)
```

**Data flow for a report:**

1. Frontend requests `GET /api/report/:lat/:lng?t=<timeline>`.
2. The gateway converts the timeline key into a concrete instant (`when = now + offset`).
3. It fans out **in parallel** to weather, light pollution, planet ephemerides, and ISS sources — each
   call timeout-bounded and cached at its own TTL.
4. Pure **engines** fuse the raw data: the Observation Score engine, SunCalc (sun/moon/twilight), satellite
   propagation, magnitude/visibility, and the events builder.
5. The fused report (minus narration) is cached for 5 minutes; the AI narration is generated and cached
   separately for 30 minutes.
6. The frontend stores the report in Zustand and renders each dashboard card.

---

## Project Structure

```text
project-zenith/
├── frontend/                     # Next.js 15 application
│   ├── public/cesium/            # CesiumJS static assets (copied on postinstall)
│   ├── scripts/                  # copy-cesium-assets build helper
│   └── src/
│       ├── app/                  # App Router entry, layout, providers
│       ├── components/           # dashboard · globe · layout · object · search · timeline · ui
│       ├── hooks/                # React Query hooks (report, narrate, object detail)
│       ├── services/             # api/ (gateway clients) + mock/ (offline fallback layer)
│       ├── store/                # Zustand stores (location, observation, timeline, ui)
│       ├── lib/                  # constants & utilities
│       └── types/                # shared TypeScript types
│
├── backend/                      # Express 5 aggregation gateway
│   └── src/
│       ├── app.ts                # route mounting + middleware
│       ├── server.ts             # HTTP + Socket.IO bootstrap
│       ├── config/               # env loading
│       ├── controllers/          # thin request handlers
│       ├── routes/               # route definitions
│       ├── services/
│       │   ├── aggregation/      # report · observation · visible-tonight · planet-details
│       │   └── external/         # one client per upstream API
│       ├── engine/               # pure computation (astronomy · celestial · observational · timeline)
│       ├── dto/ · types/         # contracts
│       ├── utils/                # cache · async · timing helpers
│       └── websocket/            # Socket.IO manager
│
├── docs/                         # blueprint (PDF) · architecture diagram · wireframes
├── assets/                       # icons · screenshots
├── README.md
└── .gitignore
```

## Core Modules

| Module | Location | Responsibility |
|--------|----------|----------------|
| **Interactive Globe** | `frontend/src/components/globe/` | CesiumJS viewer, click-to-select, ISS marker, ambient starfield |
| **Celestial Dashboard** | `frontend/src/components/dashboard/` | Score, Visible Tonight, Events, Sky Narrator, report orchestration |
| **Timeline Simulation** | `frontend/src/components/timeline/` + `engine/timeline/` | Time-scrub control that re-simulates the whole report |
| **Observation Score Engine** | `backend/src/engine/observational/observation-score.engine.ts` | Fuses clouds, visibility, moon, light pollution into a 0–100 score |
| **Astronomy Engines** | `backend/src/engine/astronomy/` | SunCalc port + upcoming-events builder (no external API) |
| **Celestial Engines** | `backend/src/engine/celestial/` | Satellite propagation, magnitude, velocity, altitude parsing, forecast |
| **Aggregation Services** | `backend/src/services/aggregation/` | Fan-out, fuse, cache, and assemble the final report |
| **External Services** | `backend/src/services/external/` | One isolated client per upstream API |
| **Location & Object Inspector** | `frontend/src/components/search/` · `object/` | Worldwide search, reverse-geocode, per-object detail |

---

## External APIs Used

| Source | Purpose | Key required? |
|--------|---------|:-------------:|
| **NASA JPL Horizons** | Planetary ephemerides & magnitudes | No |
| **Open-Meteo** | Cloud cover & visibility (hourly forecast) | No |
| **Open-Meteo Geocoding** | Worldwide location search | No |
| **Open Notify** | Live ISS latitude/longitude | No |
| **CelesTrak** | ISS TLE (drives `satellite.js` propagation) | No |
| **Light Pollution dataset** | Sky brightness at a location | No |
| **BigDataCloud** | Reverse geocoding (globe click) | No |
| **N2YO** | Real ISS visible-pass windows | **Yes** (free) |
| **Google Gemini** | AI Sky Narration | **Yes** (free) |

> The platform runs fully on **keyless** sources out of the box. The two keyed sources (N2YO, Gemini) are
> *enhancements*, not requirements — without them the app degrades gracefully (see
> [Known Limitations](#known-limitations)).

## AI Components

### Observation Score Engine
A pure function that converts raw environmental data into a single, honest **0–100** quality score and a
`Poor → Fair → Good → Excellent` condition label. It weighs **cloud cover**, **atmospheric visibility**,
**moon illumination**, and **light pollution**, and returns the contributing factors so the UI can explain
*why* the sky scores the way it does.

### Sky Narration (Google Gemini)
The `GET /api/narrate` endpoint composes a context object (score, clouds, moon, brightest planet, ISS) and
asks **Gemini** to write a short, friendly description of the sky. It is wrapped in
`safe(withTimeout(generate, 6s), fallback)` — if Gemini is slow or quota-limited, a **deterministic
templated narration built from the same real numbers** is returned instead, so the card is never empty.
On the frontend it's a TanStack Query *mutation* (not a keyed query), so it's triggered explicitly,
typewriter-rendered, and never cancelled by a location/timeline change.

### Timeline Simulation
Each timeline key maps to a minute offset (`now 0 · +1h 60 · +3h 180 · tonight 600 · tomorrow 1440 ·
next_week 10080`). The gateway threads the resulting instant through **every** source — weather samples the
nearest forecast hour, the moon is recomputed locally, planet ephemerides are fetched for the target date,
and events/narration are rebuilt — so the report is genuinely time-aware rather than echoing the same data.

### Astronomical Events
`buildAstronomicalEvents()` assembles and time-orders the next **sunset, astronomical twilight,
moonrise/moonset, moon phase (name + % lit), next meteor shower** (from a real annual peak calendar), and
an **ISS pass** when N2YO supplies one — each labelled with a local clock time or calendar date via the
location's IANA timezone.

## Caching Strategy

A single in-process TTL cache (`backend/src/utils/cache.util.ts`) with a `cached(key, ttl, producer)`
cache-aside helper that logs every hit/miss. It is a **drop-in for Redis** (same `get`/`set` shape via
`ioredis` later). TanStack Query keeps a client-side cache on top.

| Cache | Key | TTL |
|-------|-----|-----|
| Location search | `geocode:<query>` | 24h |
| Reverse geocode | `revgeo:<lat>,<lng>` | 24h (success only) |
| Weather (hourly) | `weather:<lat>,<lng>` | 10m |
| ISS TLE | `tle:iss` | 6h |
| NASA Horizons | `horizons:<body>:<date>` | 1h |
| Light pollution | `lightpollution:<lat>,<lng>` | 24h |
| Report | `report:<lat>,<lng>:<timeline>` | 5m |
| AI narration | `narrate:<lat>,<lng>:<timeline>` | 30m |

**Effect:** cold report ~10–12 s → warm (same key) **~3 ms**; a new timeline for a known location reuses
warm weather/TLE/light-pollution and returns in ~1.2 s.

## Frontend Architecture

- **Next.js App Router** with a single product surface (`src/app/page.tsx`) layering a fixed Three.js
  starfield, the Cesium globe, and the dashboard.
- **State split:** *UI/selection state* lives in **Zustand** (`location`, `observation`, `timeline`, `ui`
  stores); *server state* lives in **TanStack Query** hooks (`use-celestial-report`, `use-narrate`,
  `use-object-detail`).
- **Service layer:** `services/api/*` are thin gateway clients; `services/mock/*` is a deterministic
  offline data layer. A `liveOrMock` wrapper means that if the backend is unreachable (or
  `NEXT_PUBLIC_DATA_SOURCE=mock`), the UI still renders real-shaped data.
- **Request lifecycle:** location-search autocomplete cancels superseded keystrokes (`AbortController`);
  the report and narration intentionally run to completion so a timeline change is never lost mid-flight.

## Backend Architecture

- **Layered:** `routes → controllers → aggregation services → engines → external services`, with `types`,
  `dto`, and `utils` shared across layers. Controllers stay thin; all fusion logic lives in pure engines
  that are trivial to test.
- **Aggregation gateway:** `report.service.ts` is the heart — it fans out in parallel, applies per-upstream
  timeouts, fuses via the engines, and caches the report and narration separately.
- **Resilience:** every upstream is `safe(withTimeout(...), fallback)`, so one slow/failed dependency never
  500s the endpoint.
- **Real-time:** Socket.IO is bootstrapped in `server.ts` for live updates.

---

## Installation & Local Setup

### Prerequisites
- **Node.js 18+** (Node 20 LTS recommended) and **npm**
- A modern browser (WebGL required for the Cesium globe)
- *(Optional)* free API keys: [N2YO](https://www.n2yo.com/api/),
  [Google Gemini](https://aistudio.google.com/apikey),
  [Cesium ion](https://ion.cesium.com/tokens)

### 1. Clone the repository
```bash
git clone https://github.com/<username>/<repository>.git
cd project-zenith
```

### 2. Install & configure the backend
```bash
cd backend
npm install
cp .env.example .env        # then fill in optional keys (N2YO_API_KEY, GEMINI_API_KEY)
```

**Backend environment variables** (`backend/.env`):

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | No | API port (default `8000`) |
| `N2YO_API_KEY` | Optional | Enables real ISS visible-pass windows |
| `GEMINI_API_KEY` | Optional | Enables live AI narration (falls back without it) |

### 3. Install & configure the frontend
```bash
cd ../frontend
npm install                 # postinstall copies Cesium assets into public/cesium
cp .env.local.example .env.local
```

**Frontend environment variables** (`frontend/.env.local`):

| Variable | Required | Description |
|----------|:--------:|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_DATA_SOURCE` | No | `live` (default) or `mock` for fully-offline demo |
| `NEXT_PUBLIC_CESIUM_ION_TOKEN` | Optional | Hi-res imagery/terrain; falls back to bundled imagery |

### 4. Run the backend
```bash
cd backend
npm run dev                 # tsx watch → http://localhost:8000
```

### 5. Run the frontend
```bash
cd frontend
npm run dev                 # Next.js → http://localhost:3000
```

Open **http://localhost:3000** and click anywhere on the globe (or search for a place).

> 💡 **Zero-setup demo:** set `NEXT_PUBLIC_DATA_SOURCE=mock` in `frontend/.env.local` and run only the
> frontend — the deterministic mock layer renders the full UI with no backend or keys.

## Production Deployment

- **Frontend (Vercel):** import the repo, set the **Root Directory** to `frontend`, add the
  `NEXT_PUBLIC_*` env vars, and deploy. `npm run build` produces an optimized App Router build; the Cesium
  assets are copied during `postinstall`.
- **Backend (Node host — Render / Railway / Fly.io / VM):** deploy the `backend` directory, set the env
  vars, and run `npm start` (`tsx src/server.ts`). Point the frontend's `NEXT_PUBLIC_API_BASE_URL` at the
  deployed gateway URL and enable CORS for that origin.
- **Scaling note:** the in-process cache is per-instance. For multi-instance deployments, swap it for the
  provided `ioredis`-compatible interface.

---

## API Endpoints

All endpoints are mounted under `/api`. The frontend primarily consumes the **aggregation** group.

### Aggregation (consumed by the frontend)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/report/:lat/:lng?t=<timeline>` | Full Celestial Report (score, objects, events, narration) |
| `GET` | `/api/object/:id?...` | Per-object detail (altitude, velocity, visibility window) |
| `GET` | `/api/location/search?q=<query>` | Worldwide location search |
| `GET` | `/api/location/:lat/:lng` | Reverse geocode (globe click) |
| `GET` | `/api/narrate?lat&lng&t` | AI Sky Narration only |
| `GET` | `/api/visible-tonight?...` | Planets + ISS visible from a location |

### Data & utility endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/weather` | Cloud cover & visibility |
| `GET` | `/api/observation` | Observation Quality Score |
| `GET` | `/api/lightpollution` | Sky brightness |
| `GET` | `/api/satellite/iss` · `/api/satellite/position` | ISS position |
| `GET` | `/api/tle` | ISS TLE set |
| `GET` | `/api/n2yo/passes` | ISS visible passes (needs N2YO key) |
| `GET` | `/api/planet-details/:body` | Planet ephemeris detail |
| `GET` | `/api/astronomy` · `/api/celestial` · `/api/timeline` · `/api/ai` | Supporting computation endpoints |

---

## Screenshots

> _Add captured screenshots to `assets/screenshots/` and reference them here._

| Globe & Dashboard | Timeline Simulation | Sky Narration |
|:---:|:---:|:---:|
| _placeholder_ | _placeholder_ | _placeholder_ |

---

## Known Limitations

- **ISS next-pass window** requires a valid **N2YO** key; without it the ISS still shows real
  position/altitude/velocity, only the pass window/event is omitted.
- **Live AI narration** requires **Gemini** quota; without it a deterministic templated narration (from the
  same real numbers) is served.
- **Voice playback (TTS)** for the Sky Narrator is a visual placeholder.
- **Caching is in-process** — a single instance; multi-instance deploys need the Redis swap.
- Secondary navigation routes (settings / about / explore) are intentionally minimal.

## Future Enhancements

- 🔁 **Redis-backed cache** for horizontal scaling (interface already in place).
- 🔊 **Text-to-speech** narration playback.
- 📡 **Live WebSocket push** of ISS position and event countdowns to the globe.
- 🛰️ **Multi-satellite tracking** beyond the ISS (Starlink, Hubble, custom TLE sets).
- 🌠 **Constellation & deep-sky overlays** on the globe and sky view.
- 👤 **Saved locations & observation history** with user accounts.
- 📈 **Best-time-tonight recommender** that scans the timeline for the peak observation window.
- 🌐 **AstronomyAPI integration** for planet visibility & constellation data.

---

## Contributors

**Team Name:** Juno

| Member | Role |
|--------|------|
| **Madhurima Das** | UI/UX Design, Frontend Development & User Experience |
| **Debanjan Sarkar** | Research, Data Analysis & Documentation |
| **Samman Das** | Backend Development, APIs & Real-Time Systems |

## GitHub Repository

```
https://github.com/<username>/<repository>
```

## License

Released under the **MIT License**. See [`LICENSE`](LICENSE) for details.

## Acknowledgements

- **NASA JPL Horizons** — planetary ephemerides
- **Open-Meteo** — weather & geocoding
- **CelesTrak** & **Open Notify** — ISS orbital & position data
- **N2YO** — satellite pass predictions
- **Google Gemini** — AI narration
- **CesiumJS** — 3D geospatial globe
- **[SunCalc](https://github.com/mourner/suncalc)** by Vladimir Agafonkin (MIT) — sun/moon computation
- **AstralWeb Innovate 2026** — for the challenge and theme

<div align="center">

**Project Zenith — The Celestial Eye** · Built with ☄️ by **Team Juno**

</div>
