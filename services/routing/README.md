# Routing Service

**Status:** Prototype (standalone service)

## Purpose
Provides routing and ETA via OSRM/Mapbox/Google providers.

## Run (dev)
```
node services/routing/server.js
```

## Endpoints
- `GET /health`
- `POST /route` — accepts `{ provider, profile, coordinates }`

## Environment Variables
- `MAPBOX_TOKEN`
- `GOOGLE_MAPS_API_KEY`
- `OSRM_BASE_URL` (optional)

## Notes
- Not yet wired to the core demo or API service.
- Defaults to OSRM if no provider is specified.
