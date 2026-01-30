# RideNDine Backend Services (Scaffold)

This folder splits the backend into focused services that can scale independently.

## Services
- api: Core REST API, auth, orders, customers, cooks
- dispatch: Assignment engine, batching, scoring
- routing: Routing/ETA provider abstraction and caching
- realtime: WebSocket/SSE gateway for live updates
- shared: Common utilities and data contracts

## Run (dev)
Each service is a minimal Node server for now. Run with:

```
node services/api/server.js
node services/dispatch/server.js
node services/routing/server.js
node services/realtime/server.js
```

## Next
Replace these stubs with real frameworks (Express/Fastify/Nest) and add a DB connection.
