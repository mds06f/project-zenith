# Project Zenith: The Celestial Eye

Project Zenith is an interactive web platform developed for **AstralWeb Innovate 2026**. The platform enables users to visualize real-time celestial activity above any location on Earth through satellite tracking, orbit visualization, geospatial mapping, and live astronomical data integration.

## Objective

To create a real-time celestial intelligence platform that transforms complex astronomical and satellite data into accessible, interactive, and visually engaging insights for users around the world.

---

## Key Features

* Real-time celestial activity visualization
* Interactive 3D Earth globe powered by CesiumJS
* Live satellite and ISS tracking
* Orbit path visualization
* Location-based sky analysis
* Celestial visibility insights
* Observation Quality Score
* Future celestial timeline simulation
* Coordinate-based celestial exploration
* Responsive dashboard across desktop, tablet, and mobile devices
* Educational sky insights and object information

---

## Planned Modules

### Core Modules

* Interactive Globe
* Celestial Dashboard
* Satellite Tracker
* Orbit Visualization
* Object Inspector
* Location Search & Geolocation
* Observation Quality Analyzer
* Future Timeline Simulation

### Advanced Modules

* Real-Time WebSocket Updates
* Coordinate Challenge Support
* Celestial Event Detection
* Educational Sky Insights

---

## Technology Stack

### Frontend

* Next.js 15 (App Router)
* TypeScript (Strict Mode)
* Tailwind CSS
* Framer Motion
* Zustand
* TanStack Query
* CesiumJS
* Three.js
* shadcn/ui
* Lucide React

### Backend

* Node.js
* Express.js
* socket.io
* WebSockets (Real-Time Updates)

### Development Tools

* Git & GitHub
* Vercel
* Figma

---

## APIs & Data Sources (Planned)

### Astronomical Data

* NASA APIs
* Astronomy APIs
* Satellite TLE Data

### Satellite Tracking

* Open Notify API
* N2YO API (Subject to Availability)

### Environmental Data

* Open-Meteo API
* Light Pollution Datasets

### Geospatial Services

* Geolocation Services
* Mapping & Coordinate Systems

> APIs and data sources may be refined during the architecture and implementation phase.

---

## System Overview

```text
User
 │
 ▼
React + CesiumJS Frontend
 │
 ▼
Socket.IO Client
 │
 ▼
Express API Gateway
 │
 ├── NASA APIs
 ├── Astronomy APIs
 ├── Satellite Data
 ├── Weather Data
 └── Geospatial Services
 │
 ▼
Data Processing Layer
 │
 ▼
Socket.IO Server
 │
 ▼
Real-Time Updates
```

---

## Repository Structure

```text
project-zenith/
│
├── frontend/
│
├── backend/
│
├── docs/
│   ├── blueprint/
│   ├── architecture/
│   ├── wireframes/
│   └── presentation/
│
├── assets/
│   ├── screenshots/
│   └── icons/
│
├── README.md
└── .gitignore
```

---

## Team

| Member          | Role                                                 |
| --------------- | ---------------------------------------------------- |
| Madhurima Das   | UI/UX Design, Frontend Development & User Experience |
| Samman Das      | Backend Development, APIs & Real-Time Systems        |
| Debanjan Sarkar | Research, Data Analysis & Documentation              |

---

## Competition

**AstralWeb Innovate 2026**

**Theme:** Project Zenith – The Celestial Eye

A national-level web development challenge focused on building innovative platforms capable of visualizing real-time celestial activity above any location on Earth through modern web technologies, geospatial mapping, satellite tracking, and astronomical data integration.

---

## Project Status

🚀 Actively under development for AstralWeb Innovate 2026.

### Current Phase

* Blueprint & Architecture Design
* API Research & Evaluation
* UI/UX Planning & Wireframing
* Technology Stack Finalization

### Upcoming Milestones

* Interactive Globe Integration
* Real-Time Data Pipeline
* WebSocket Infrastructure
* Dashboard Development
* Round 1 Blueprint Submission

```
