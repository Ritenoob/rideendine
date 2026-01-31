# RideNDine V2 Live Routing Demo

**Status:** Fully functional live dispatch + customer tracking experience.

## Overview
This folder contains the main demo experience that powers the live routing UI (`index.html`) and the backend server (`server.js`). It simulates a real dispatch operation with:

- Auth generation (`POST /api/auth/login`) and scoped tokens.
- GPS ingestion from simulated drivers.
- Routing proxy that can call OSRM/Mapbox/Google.
- Assignment, batching, pricing, and reliability scoring logic.
- A WebSocket feed for customers and dispatchers (`ws://localhost:8081/?token=...`).
- The UI dashboard with Leaflet, driver animation, and order controls.

It is the canonical surface for RideNDine demos (port 8081 by default) and is the primary stack referenced by the customer apps.

## Running the core server

```bash
cd ridendine_v2_live_routing
nohup node server.js >/tmp/ridendine_core.log 2>&1 &
```

Optional: read `/tmp/ridendine_core.log` for runtime logs and errors.

Default port: `8081` (change by setting `PORT=` before launching, e.g., `PORT=8091 node server.js`).

## Running the UI

1. Open `ridendine_v2_live_routing/index.html` in your browser.
2. The UI exposes fields for:
   - Dispatch server URL (default `http://localhost:8081`)
   - Routing server URL
   - Realtime/WebSocket URL
3. Use **Run Live Dispatch** to start simulated drivers; use **Run Assignments** to reassign them mid-flow.
4. Copy an order ID from the dropdown to track it in customer apps.

## Configuration
- `MAPBOX_TOKEN`, `GOOGLE_MAPS_API_KEY`, and `OSRM_BASE_URL` control which routing providers the server hits.  
- `demo_state.json` persists simulated drivers/cooks/orders between runs.
- The UI also respects `REALTIME_SERVER_URL` when you want to proxy WebSocket traffic through `services/realtime`.

## Notes
- Authentication tokens are minted via `/api/auth/login` and are required for both HTTP and WebSocket clients.  
- The dispatch logic already includes pricing, batching, reliability scoring, and alert generation; examine `server.js` for heuristics.  
- WebSocket endpoints stream driver positions, order updates, and alert events for customers and admins.

## Troubleshooting checklist
- If nothing happens when dispatching, confirm `server.js` is running and inspect `/tmp/ridendine_core.log`.  
- `WebSocket invalid frame header` often means another process owns port 8081; use `lsof -i :8081`.  
- Mobile apps require your LAN IP (not `localhost`) for `http://<IP>:8081`; run `hostname -I | awk '{print $1}'`.  
- The UI can switch between routing servers—point it at `services/routing` for provider tests.

## Next upgrades
- Replace the static data with real database/state (see `database/` under development).  
- Extract dispatch/routing/realtime into their own services (tracking in root README) while keeping this folder as a fallback demo.  
- Enhance `demo_state.json` persistence options and add seed data generators for new cities.
