# RideNDine Backend Services (Prototype Split)

This directory documents the stand-alone services that model what a production RideNDine backend could look like once the monolith core demo is split apart. Each service stays lightweight today for experimentation; the core `ridendine_v2_live_routing/` demo on port 8081 remains the operational surface for end-to-end playback.

| Service | Status | Port | Run Command | Purpose |
|---------|--------|------|-------------|---------|
| API | NestJS WIP + stub | 9001 | `cd services/api && npm run start:dev` (WIP); `node services/api/server.js` (demo stub) | REST + auth gateway for orders, drivers, payments. |
| Dispatch | Prototype (standalone) | 9002 | `node services/dispatch/server.js` | Driver scoring, batching, order assignment. |
| Routing | Prototype (standalone) | 9003 | `node services/routing/server.js` | Provider abstraction for OSRM/Mapbox/Google + ETA. |
| Realtime | Prototype (standalone) | 9004 | `node services/realtime/server.js` | WebSocket/HTTP proxy to offload live telemetry. |
| Shared | Utilities | — | — | Contracts, types, and helper logic consumed by the other services. |

## Quick start (demo stubs)

Run each service independently to experiment with its domain:

```bash
node services/api/server.js
node services/dispatch/server.js
node services/routing/server.js
node services/realtime/server.js
```

Each stub exposes a small HTTP surface (health + domain-specific endpoints) and logs enough telemetry to observe its behavior via `curl` or Postman.

## NestJS API (work in progress)

1. `cd services/api`
2. `npm install` (first-time only)
3. `npm run start:dev`

The NestJS project is scaffolded for a future production API but currently serves only health checks and placeholder controllers. The stub server (`services/api/server.js`) remains the more stable, runnable piece for demos.

## Integration guidance

- These services are **not yet wired together** or hooked into the core dispatch UI. The plan is to layer them behind a gateway that proxies to the existing monolith until they can replace its internals.
- Use `services/shared/contracts.js` to keep payload shapes aligned if you experiment with cross-service calls.
- The `ridendine_v2_live_routing` demo UI can point at these services via its configuration inputs, but expect gaps (missing auth, partial endpoints).

## Notes & next steps

- The split-services stack is referenced by the overall roadmap (see root `README.md`); it's intended to prove each bounded context before scaling.  
- Future priorities: hook `dispatch` + `routing` to the API, stabilize the `realtime` proxy, and add Redis/NATS for message passing across services.  
- When you update a service, copy the file into `edits/` (per AGENTS instructions) before editing the implementation or README; the `services/README` explains the big picture for your teammates.
