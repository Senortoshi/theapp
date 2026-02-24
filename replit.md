# BSV Fairness Engine — Contribution Attribution Economy

## Overview

Real-time simulation of a next-generation contribution attribution economy powered by BSV (Bitcoin SV). Demonstrates a "Fairness Engine" that tracks contributor value, scores contributions by type and novelty, applies time-based decay, handles reference-based boosts, and distributes simulated revenue (in satoshis) proportionally based on live contribution scores.

Designed as an investor-ready demo showcasing fair value distribution through transparent, deterministic mathematics.

## User Preferences

- Preferred communication style: Simple, everyday language
- Build exactly what is specified, no additions
- Bring any issues or suggestions to the user for decision

## System Architecture

### Frontend (React SPA)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter — single Dashboard page at /
- **State**: TanStack React Query for server state, local state for UI
- **Real-time**: Custom `useWebSocket` hook at `/ws` for live data streaming
- **UI**: shadcn/ui components, Tailwind CSS, dark mode by default
- **Charts**: Recharts sparklines for share history
- **Theme**: Gold/amber primary (BSV branding), dark background

### Backend (Express + WebSocket)
- **Express** on Node.js with TypeScript (tsx)
- **WebSocket** (ws library) on same HTTP server at `/ws`
- **In-memory storage** — no database. `SimulationStore` in `server/storage.ts`
- **FairnessEngine** (`server/fairness-engine.ts`): scoring, decay, boost, share calculation, revenue distribution
- **Simulation** (`server/simulation.ts`): 3-phase narrative arc with 20 simulated usernames

### API Endpoints
- POST /api/contribute — Submit contribution
- GET /api/shares — Current share breakdown
- POST /api/revenue — Inject revenue (sats)
- GET /api/payouts — Full payout history
- GET /api/leaderboard — Top contributors
- GET /api/simulate/run — Start simulation
- GET /api/simulate/stop — Stop simulation
- GET /api/state — Full state snapshot
- GET /api/audit/:contribution_id — Contribution audit trail

### WebSocket Events
contribution_added, shares_updated, revenue_distributed, score_decayed, boost_applied, status_changed, simulation_phase

### Shared Layer
- `shared/schema.ts`: TypeScript interfaces + Zod validation schemas
- Key types: Contributor, Contribution, RevenueEvent, AppState

### Key Files
- `server/fairness-engine.ts` — Core scoring/decay/boost/distribution engine
- `server/simulation.ts` — Multi-phase simulation with pre-scripted contributions
- `server/storage.ts` — In-memory SimulationStore
- `server/routes.ts` — All API routes + WebSocket setup
- `client/src/pages/dashboard.tsx` — Main dashboard UI
- `client/src/hooks/use-websocket.ts` — WebSocket connection hook
