# API Service (NestJS + Demo Stub)

**Status:** NestJS project in progress; lightweight stub used for current demos.

## Purpose
The API service is intended to become the authenticated entry point for Dispatch, Driver, and Customer clients. It will eventually surface endpoints for orders, drivers, pricing, and live telemetry while providing JWT authentication/refresh. Today, the NestJS project under `services/api/src` is scaffolded but not wired into the rest of RideNDine, so we lean on the very small `server.js` stub for stability.

## Ports & Environment
- Default port: `9001` (respect the `PORT` env var when running the stub).  
- No required environment variables yet, but future work will include DB/Redis URLs and secrets for JWT signing.

## Run the demo stub

```bash
node services/api/server.js
```

**Endpoints**
- `GET /health` → `{ ok: true, service: "api" }`
- `GET /me` → returns `{ role: "dispatch", userId: "demo" }` for prototyping

The stub enables UI components and customer apps to fetch a predictable payload without the full NestJS stack.

## Run the NestJS project (work in progress)

```bash
cd services/api
npm install
npm run start:dev
```

This command boots the NestJS application (`src/main.ts`). Currently the controllers only return placeholders; the primary benefit is getting the TypeScript/NestJS infrastructure ready for future endpoints.

## Notes for contributors
- The NestJS source lives in `services/api/src`: add modules, controllers, and providers there as the API surface expands.  
- Update or extend `services/api/server.js` only for lightweight mocks—the NestJS app is the eventual production code path.  
- Keep the per-service README aligned with `services/README.md` and the root `README.md` so operators understand which port to hit during demos.  
- Archive this README before editing (`cp services/api/README.md edits/services-api-README.md.$(date ...).reason`) to keep history compliant with AGENTS rules.
