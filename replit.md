# BSV Fairness Engine — Contribution Attribution Economy

## Overview

Real-time contribution attribution economy powered by BSV (Bitcoin SV). The system tracks contributor value through on-chain 1Sat Ordinal inscriptions, scores contributions by type and novelty, applies time-based decay, handles reference-based boosts, and distributes simulated revenue (in satoshis) proportionally based on live contribution scores.

Designed as an investor-ready demo with Yours Wallet integration for BSV mainnet inscriptions.

## User Preferences

- Preferred communication style: Simple, everyday language
- Build exactly what is specified, no additions
- Bring any issues or suggestions to the user for decision

## System Architecture

### Frontend (React SPA)
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter — single Dashboard page at /
- **State**: Zustand store (`useSimStore`) for real-time state, TanStack React Query for API data
- **Real-time**: `useChainFeed` hook with WebSocket at `/ws` for live data streaming; `useWebSocketEngine` + `useRAFFlush` for batched frame updates
- **BSV Integration**: `useBsvWallet` hook for Yours Wallet connection + inscription
- **UI**: shadcn/ui components, Tailwind CSS, dark mode
- **Charts**: Recharts for attribution ring visualization
- **3D**: Three.js installed for torus attribution ring

### Backend (Express + WebSocket)
- **Express** on Node.js with TypeScript (tsx)
- **WebSocket** (ws library) on same HTTP server at `/ws`
- **In-memory storage** — `SimulationStore` in `server/storage.ts` using Maps/arrays
- **PostgreSQL** via Drizzle ORM — used for on-chain contribution persistence (`contributions` and `projects` tables)
- **FairnessEngine** (`server/fairness-engine.ts`): scoring, decay, boost, share calculation, revenue distribution
- **BSV packages**: `@bsv/sdk`, `js-1sat-ord` for on-chain interaction

### API Endpoints
- POST /api/contribute — Submit contribution (in-memory)
- GET /api/shares — Current share breakdown
- POST /api/revenue — Inject revenue (sats)
- GET /api/payouts — Full payout history
- GET /api/leaderboard — Top contributors
- GET /api/simulate/run — Start simulation (currently stubbed)
- GET /api/simulate/stop — Stop simulation (currently stubbed)
- GET /api/state — Full state snapshot
- GET /api/audit/:id — Contribution audit trail
- GET /api/projects/:projectId/contributions — On-chain contributions for project
- GET /api/projects/:projectId/shares — Computed shares for project
- POST /api/projects — Create project record

### WebSocket Events
contribution_added, shares_updated, revenue_distributed, score_decayed, boost_applied, status_changed, simulation_phase

### Shared Layer
- `shared/schema.ts`: TypeScript interfaces + Zod validation schemas + Drizzle table definitions
- Key types: Contributor, Contribution, RevenueEvent, AppState
- Drizzle tables: contributions, projects

### Key Files
- `server/fairness-engine.ts` — Core scoring/decay/boost/distribution engine + `computeShares()`
- `server/storage.ts` — In-memory SimulationStore + Drizzle db export
- `server/routes.ts` — All API routes + WebSocket setup
- `client/src/pages/Dashboard.tsx` — Main dashboard with BSV wallet integration
- `client/src/hooks/useBsvWallet.ts` — Yours Wallet connection + inscription
- `client/src/hooks/useChainFeed.ts` — Fetch contributions/shares + WebSocket listener
- `client/src/store/useSimStore.ts` — Zustand store for real-time state
- `client/src/lib/inscription.ts` — Build/encode contribution payloads for BSV

### Environment Variables
- `VITE_PROJECT_ID` — Project ID for frontend (set after genesis inscription)
- `PROJECT_ID` — Same value, for server-side indexer
- `DATABASE_URL` — PostgreSQL connection (auto-configured by Replit)
