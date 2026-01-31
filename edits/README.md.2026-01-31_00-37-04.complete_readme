# RideNDine

RideNDine is a multi-role delivery platform demo with live routing, dispatch, pricing, reliability scoring, and customer tracking. This repo contains the V2 live routing demo, a partial backend service split, and working customer app prototypes (web + mobile). This README and AGENTS.md are the operational sources of truth; planning docs are aspirational unless marked current.

---

## Table of Contents
- Overview
- Features
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

## Status at a Glance
| Component | Status | Notes |
|-----------|--------|-------|
| Core demo server + UI | Working | Use for end-to-end flows |
| Customer web (React) | Working prototype | Static host via python http.server |
| Customer mobile (Expo) | Working prototype | Requires LAN IP to reach core demo |
| Service split (api/dispatch/routing/realtime) | Prototypes, not integrated | API is NestJS WIP + stub; others are Node prototypes |
| Database | Empty | docker-compose exists, no schema/migrations applied |

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
1) Start core server
2) Open `ridendine_v2_live_routing/index.html`
3) Click **Run Live Dispatch**
4) Click **Run Assignments** to reassign drivers

### Customer flow
1) Select an order from dispatch view dropdown
2) Copy order ID into the customer app
3) Track ETA + status + driver position

---

## Troubleshooting
**Nothing happens after clicking “Run Live Dispatch”**
- Confirm core server is running on the port shown in UI
- Check `/tmp/ridendine_core.log`

**WebSocket invalid frame header**
- Ensure the core server is the only process on that port
- Restart the server

**Mobile cannot connect**
- Use your computer’s LAN IP, not localhost
- Ensure firewall allows port 8081

---

## Project Documentation

For detailed documentation, see:

- **[AGENTS.md](AGENTS.md)** — Agent roles, skills, implementation status, run commands
- **[agents/CLAUDE.md](agents/CLAUDE.md)** — Project context, conventions, development phases
- **[docs/architecture-overview.md](docs/architecture-overview.md)** — Current vs target architecture, boundaries, data flows
- **[docs/project-setup-plan.md](docs/project-setup-plan.md)** — Realistic MVP timeline and quality gates
- **[docs/repository-structure.md](docs/repository-structure.md)** — Proposed structure and operational considerations
- **[DEVELOPMENTPLAN.md](DEVELOPMENTPLAN.md)** — Full 16-week production roadmap

## Database
- No schema applied; database is empty. docker-compose exists but is not seeded.

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
