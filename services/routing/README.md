# Routing Service

**Status:** Prototype (standalone service)

## Purpose
This service encapsulates the routing/ETA domain. It can delegate to OSRM, Mapbox, or Google Routes depending on the requested provider, returning distance, duration, and decoded geometry in a consistent shape.

## Ports & Run
- Port: `9003` (override with `PORT` env var if needed).  
- Run:

  ```bash
  node services/routing/server.js
  ```

## Supported providers
- **OSRM** (default) — uses `router.project-osrm.org` or your `OSRM_BASE_URL`.  
- **Mapbox** — requires `MAPBOX_TOKEN`.  
- **Google Routes** — requires `GOOGLE_MAPS_API_KEY` and sends requests to `routes.googleapis.com`.

## Endpoints
- `GET /health` → `{ ok: true, service: "routing" }`.  
- `POST /route` — accepts:
  ```json
  {
    "provider": "osrm" | "mapbox" | "google",
    "profile": "driving" | "walking" | "cycling",
    "coordinates": [
      { "lat": number, "lng": number },
      ...
    ]
  }
  ```
  Returns `{ provider, distanceMeters, durationSeconds, geometry }` (geometry is `[lat, lng]` pairs).

## Configuration
- `MAPBOX_TOKEN` (required for Mapbox requests).
- `GOOGLE_MAPS_API_KEY` (required for Google Routes requests).
- `OSRM_BASE_URL` (optional; defaults to `https://router.project-osrm.org`).

## Notes
- The service decodes Mapbox/Google polylines so downstream clients get simple `[lat, lng]` arrays.  
- This is not yet wired into the API or dispatch layers—point the core demo or customer apps at port 9003 manually to test alternative routing before integrating.  
- The per-provider helpers live in `services/routing/server.js`; you can add caching or rate limiting there as you wrap production providers.
