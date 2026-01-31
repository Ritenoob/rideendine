# Dispatch Service

**Status:** Prototype (standalone service)

## Purpose
This service mimics the driver assignment engine. It uses haversine distance plus optional reliability scores to pick the best driver for each cook/order pair, making it easy to experiment with batching and scoring logic before wiring it into the full stack.

## Ports & Run
- Port: `9002` (configurable via `PORT` env var)
- Run:

  ```bash
  node services/dispatch/server.js
  ```

## Endpoints
- `GET /health` → status object `{ ok: true, service: "dispatch" }`.
- `GET /healthz?stage=...` → echoes query params so you can exercise telemetry probes.
- `POST /assign`
  - Accepts payload `{ orders, drivers, cooks, driverScores }`.
  - `orders` should include `cookId`.
  - `drivers` should include `{ id, lat, lng }`.
  - `cooks` should include `{ id, lat, lng }`.
  - `driverScores` is an optional map of driver IDs to reliability scores (0–100).
  - Responds with `{ assignments: [{ orderId, driverId, score }, ...] }`.

## Scoring
Distance is converted to kilometers via the Haversine formula, and reliability scores (default 50) are combined with distance to generate a simple score: `reliability - distance * 8`. The highest scoring driver is assigned per order.

## Notes
- This service is not yet wired to the core demo or API service; use the `/assign` endpoint inside scripts, Postman, or as a reference when fragmenting the main dispatch logic.  
- When you expand it, consider returning batching metadata, support for driver availability, and rate limiting for production readiness.  
- Keep the README in sync with `services/README.md` and the root documentation so teammates understand which port to hit during tests.
