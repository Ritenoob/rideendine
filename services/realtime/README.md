# Realtime Gateway

**Status:** Prototype (WebSocket proxy + Redis pub/sub)

## Purpose
This gateway simulates the realtime fabric between dispatchers, drivers, and customers. It authenticates via JWT, manages WebSocket subscriptions, proxies location updates through Redis channels, and exposes helper HTTP endpoints for health and broadcasting.

## Running locally

```bash
node services/realtime/server.js
```

- Listens on `PORT` (default `9004`) for HTTP + WebSocket traffic.  
- Also uses `REDIS_URL` (default `redis://localhost:6379`) to publish/subscribe to `order:*`, `driver:*`, and `notification:*` channels.

## Environment
- `PORT` / `REALTIME_PORT` — HTTP & WebSocket port (defaults to 9004).  
- `REDIS_URL` / `REDIS_TLS` — connection for pub/sub.  
- `JWT_SECRET` — shared secret used to verify tokens (`"rideNDine-secret-key-change-in-production"` by default).  
- `CORE_BASE` is not explicitly required today, but future versions may proxy HTTP traffic back to the legacy core server.

## HTTP endpoints
- `GET /health` → returns connection stats plus Redis status.  
- `GET /stats` → returns uptime + client counts.  
- `POST /broadcast` → `{ channel, message }` publishes to Redis so subscribed WebSockets receive the payload.

## WebSocket behavior
- URL must include `?token=...`; tokens are currently created by the core demo (`/api/auth/login`).  
- Once authenticated, clients auto-subscribe based on role (drivers get `driver:<id>`, dispatchers/admins get `order:*`, etc.).  
- Supported inbound message types:
  - `subscribe` / `unsubscribe` (channels array)  
  - `driver:location` (drivers send their GPS updates, which are published back via Redis)  
  - `ping` → responds with `pong`

## Redis pub/sub
- Subscribes to patterns `order:*`, `driver:*`, `notification:*`.  
- Publications (e.g., driver locations) are forwarded to WebSocket subscribers and logged via the `RedisPubSub` helper.

## Notes
- This service is meant for experimentation and to mimic how a dedicated realtime layer would work in production.  
- Because it depends on Redis, run a local instance (`docker-compose up` includes Redis) before starting this gateway.  
- Extend `services/realtime/server.js` to support additional message types (e.g., `order:update`) as the backend matures.
