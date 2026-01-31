# RideNDine

RideNDine is a multi-role delivery platform demo with live routing, dispatch, pricing, reliability scoring, and customer tracking. This repo contains the V2 live routing demo, a partial backend service split, and working customer app prototypes (web + mobile). This README and AGENTS.md are the operational sources of truth; planning docs are aspirational unless marked current.

---

## Table of Contents

- Overview
- Features
- Implementation Status
- Architecture
- Quick Start (Core Demo)
- Customer Web (React)
- Customer Mobile (Expo)
- Service Split (Scaffold)
- Ports & Services
- Configuration
- Demo Flows
- Troubleshooting
- Project Documentation
- Roadmap
- License

---

## Overview

RideNDine models a real-time delivery marketplace with three roles:

- **Dispatch**: routing, batching, assignment
- **Driver**: GPS + delivery execution
- **Customer**: live tracking + ETA + order status

The demo is intentionally production-shaped: auth scoping, GPS ingestion, routing providers, ETA, batching, pricing, reliability scoring, and alerts are already wired in the core server.

---

## Features

- Live driver GPS feed (WebSocket)
- Customer tracking (ETA + status timeline)
- Server-side batching + route ordering
- Dispatch engine + reliability scoring
- Pricing + density controls
- Alerts + summary metrics dashboard
- Customer web + mobile prototypes
- Service-split architecture (in progress)

## Implementation Status

| Component                            | Status                     | Port | Run Command                                                                          | Notes                                                                                                                              |
| ------------------------------------ | -------------------------- | ---- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Core demo server + UI                | Working                    | 8081 | `node ridendine_v2_live_routing/server.js`                                           | Single Node process handling auth, GPS ingestion, routing proxy, dispatch, pricing, reliability, and WebSocket telemetry.          |
| Customer web (React)                 | Working prototype          | 8010 | `python3 -m http.server 8010 --directory apps/customer-web-react`                    | Leaflet tracker with ETA/status polling; points to the core demo server.                                                           |
| Customer mobile (Expo)               | Working prototype          | 8082 | `cd apps/customer-mobile && npx expo start`                                          | Expo/React Native tracker that uses your LAN IP to reach the core demo and supports deep links like `ridendine://track?orderId=…`. |
| API service (NestJS WIP + demo stub) | Prototype                  | 9001 | `cd services/api && npm run start:dev` (WIP) or `node services/api/server.js` (stub) | Planned REST + auth surface; current server only responds to health checks.                                                        |
| Dispatch service                     | Prototype (not integrated) | 9002 | `node services/dispatch/server.js`                                                   | Haversine scoring, driver assignment, and batching prototype.                                                                      |
| Routing service                      | Prototype (not integrated) | 9003 | `node services/routing/server.js`                                                    | Provider abstraction for OSRM/Mapbox/Google routing + ETA calculations.                                                            |
| Realtime gateway                     | Prototype (not integrated) | 9004 | `node services/realtime/server.js`                                                   | HTTP/WS proxy designed to offload the core demo’s WebSocket traffic.                                                               |
| Database                             | Empty                      | 5432 | `docker-compose up`                                                                  | Containers are defined but no schema/fixtures are applied yet.                                                                     |
| API client SDK                       | Docs only                  | —    | Not implemented                                                                      | Documentation exists under `packages/api-client/`, but there is no runnable client yet.                                            |

---

## Architecture

There are two modes:

### 1) Single-Core Demo (Default)

All services in one Node server.

```
[ridendine_v2_live_routing/server.js]
   ├─ auth
   ├─ GPS ingestion
   ├─ routing proxy
   ├─ dispatch + batching
   ├─ pricing + reliability
   └─ websocket realtime
```

### 2) Split Services (In Progress)

Each domain can scale independently. Services are prototypes and not wired into the demo. The API folder contains a NestJS WIP plus a demo stub.

```
services/
  api/       core REST + auth (NestJS project + demo stub)
  dispatch/  assignment + batching
  routing/   routing providers + ETA
  realtime/  websocket gateway
```

---

## Quick Start (Core Demo)

Run the core demo server:

```
nohup node ridendine_v2_live_routing/server.js >/tmp/ridendine_core.log 2>&1 &
```

Open the demo UI:

- `ridendine_v2_live_routing/index.html`

Default server port: **8081** (see UI input fields).

---

## Customer Web (React)

Start a static server:

```
python3 -m http.server 8010 --directory apps/customer-web-react
```

Open:

- `http://localhost:8010`

Enter:

- Server URL: `http://localhost:8081`
- Order ID: copy from the dispatch demo dropdown

---

## Customer Mobile (Expo)

From `apps/customer-mobile`:

```
npm install
npx expo start
```

In Expo Go, use:

- Server URL: `http://<your-computer-ip>:8081`
- Order ID from the dispatch demo

Deep link example:

- `ridendine://track?orderId=YOUR_ORDER_ID`

## Other Demos

- Legacy static tracker: `apps/customer-web/index.html`
- Legacy demo: `ridendine_demo/index.html`

---

## Service Split (In Progress)

The repo includes service scaffolds and an API project for production scale (not integrated into the core demo):

- API: `services/api/` (NestJS project) and `services/api/server.js` (demo health stub)
- Dispatch: `services/dispatch/server.js`
- Routing: `services/routing/server.js`
- Realtime: `services/realtime/server.js`

These are not fully integrated. Use the core demo for end-to-end flows.

---

## Ports & Services

Default ports:

- Core demo server: **8081**
- API (demo stub): **9001**
- Dispatch (scaffold): **9002**
- Routing (scaffold): **9003**
- Realtime (gateway scaffold): **9004**
- Customer web dev server: **8010**
- Expo bundler: **8082**

If a port is busy, update the UI input fields or change the server `PORT` constant.

---

## Configuration

### Core demo server

- Map providers configured via env vars:
  - `MAPBOX_TOKEN`
  - `GOOGLE_MAPS_API_KEY`
  - `OSRM_BASE_URL` (optional)

### Demo UI inputs

- Routing Server URL
- Dispatch Server URL
- Realtime Server URL

---

## Demo Flows

### Dispatch flow

1. Start core server
2. Open `ridendine_v2_live_routing/index.html`
3. Click **Run Live Dispatch**
4. Click **Run Assignments** to reassign drivers

### Customer flow

1. Select an order from dispatch view dropdown
2. Copy order ID into the customer app
3. Track ETA + status + driver position

---

## Troubleshooting

### Port conflicts or “connection refused”

- Run `lsof -i :8081` (or replace `:8081` with `:8010`, `:8082`, etc.) to see if another process already owns a RideNDine port.
- Kill the blocking process with `kill $(lsof -t -i :PORT)` or update the UI/server constants to a free port.
- If traffic still fails, confirm the core server process is still running in `nohup` output or `ps` and check `/tmp/ridendine_core.log` for startup errors.

### WebSocket stability

- Confirm the WebSocket URL in the UI matches the core server port (default `ws://localhost:8081/?token=…`).
- If you see “invalid frame header,” restart the core server and make sure no other server is bound to that port.
- Tail the log `tail -n 50 /tmp/ridendine_core.log` for frame or auth errors, and check that tokens are generated via `POST /api/auth/login` before the WS handshake.

### Mobile/Expo connectivity

- Mobile builds cannot resolve `localhost`; provide your LAN IP via `hostname -I | awk '{print $1}'` and enter `http://<IP>:8081` into the Expo client.
- Ensure firewall/AV software allows incoming connections on 8081.
- Run `npx expo doctor` from `apps/customer-mobile` if the bundle fails to load, and restart the bundler after fixing any reported issues.

### Order/status visibility

- Orders are created from the core demo UI. Make sure you select one from the dropdown before copying the ID into customer apps.
- The customer UI polls the core server every few seconds; if you see stale data, refresh the browser or rerun `Run Live Dispatch` plus `Run Assignments`.

---

## Project Documentation

### Getting Started

- **[DEVELOPMENT.md](DEVELOPMENT.md)** — Complete developer setup guide with prerequisites, Docker setup, and troubleshooting
- **[QUICKSTART.md](QUICKSTART.md)** — Get up and running in 5 minutes
- **[openapi.yaml](openapi.yaml)** — Complete API specification (42 endpoints)

### Architecture & Design

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System architecture, technology stack, service descriptions, deployment architecture
- **[docs/DATABASE.md](docs/DATABASE.md)** — Database schema documentation with ER diagrams, indexes, and migrations
- **[docs/USER_JOURNEYS.md](docs/USER_JOURNEYS.md)** — Complete user flows for customers, chefs, drivers, and admins

### API Documentation

- **[docs/API_INTEGRATION_GUIDE.md](docs/API_INTEGRATION_GUIDE.md)** — **NEW** Comprehensive API integration guide with 25+ code examples (TypeScript, Python, Ruby)
- **[docs/api-client.md](docs/api-client.md)** — API client integration guide with code examples
- **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** — **NEW** Quick reference for common endpoints, errors, and commands
- **[Swagger UI](http://localhost:9001/api/docs)** — Interactive API documentation (when API is running)
- **[05_api_endpoint_specs.md](05_api_endpoint_specs.md)** — Detailed endpoint specifications

### Operational Documentation

- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — **NEW** Complete deployment guide for staging and production (Docker, Kubernetes, ECS)
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** — **NEW** Comprehensive troubleshooting guide (30+ issues with solutions)
- **[docs/RUNBOOK_SERVICE_RESTART.md](docs/RUNBOOK_SERVICE_RESTART.md)** — **NEW** Service restart procedures
- **[docs/RUNBOOK_DATABASE_RECOVERY.md](docs/RUNBOOK_DATABASE_RECOVERY.md)** — **NEW** Database disaster recovery
- **[docs/RUNBOOK_PERFORMANCE_DEGRADATION.md](docs/RUNBOOK_PERFORMANCE_DEGRADATION.md)** — **NEW** Performance troubleshooting
- **[docs/RUNBOOK_SCALING.md](docs/RUNBOOK_SCALING.md)** — **NEW** Scaling procedures
- **[docs/RUNBOOK_EMERGENCY_PROCEDURES.md](docs/RUNBOOK_EMERGENCY_PROCEDURES.md)** — **NEW** Emergency response procedures

### Reference

- **[docs/GLOSSARY.md](docs/GLOSSARY.md)** — Complete glossary of domain terms and technical concepts
- **[docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** — **NEW** Quick reference for developers
- **[AGENTS.md](AGENTS.md)** — Agent roles and implementation status
- **[CLAUDE.md](CLAUDE.md)** — Project conventions and build commands

### Planning Documents

- **[DEVELOPMENTPLAN.md](DEVELOPMENTPLAN.md)** — Full 16-week production roadmap
- **[BACKEND_DEVELOPMENT_PLAN.md](BACKEND_DEVELOPMENT_PLAN.md)** — Backend features and security implementation
- **[09_backend_architecture.md](09_backend_architecture.md)** — Backend architecture overview

## Database

**Status:** ✅ Complete and operational

- **PostgreSQL 16** with PostGIS extension
- **10 migrations** applied (001-010)
- **25+ tables** with comprehensive indexes
- **Seed data** available for testing

**Quick commands:**

```bash
npm run db:up        # Start PostgreSQL + Redis via Docker
npm run db:migrate   # Apply all migrations
npm run db:seed      # Load test data
npm run db:reset     # Full reset: drop, create, migrate, seed
```

**Access database:**

- Adminer UI: http://localhost:8080
- Connection string: `postgresql://ridendine:ridendine@localhost:5432/ridendine`

### File Edit Convention

Before modifying any file, archive the current version:

```bash
cp file.js "edits/file.js.$(date +%Y-%m-%d_%H-%M-%S).reason"
```

Archived versions are stored in the `edits/` directory.

---

## Roadmap

- Split services behind a gateway
- Postgres schema + migrations
- JWT auth + refresh tokens
- Redis/NATS for realtime scaling
- Driver app (web + mobile)

---

## License

Proprietary / internal demo.
