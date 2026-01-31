# AGENTS.md — RideNDine

Agent guidance for the RideNDine delivery platform repository.

---

## Implementation Status (sources of truth)

Primary operational sources: this file and [README.md](README.md). Planning docs are aspirational unless marked current.

| Component | Status | Port | Run Command |
|-----------|--------|------|-------------|
| Core Demo Server | **Working** | 8081 | `node ridendine_v2_live_routing/server.js` |
| Demo UI | **Working** | — | Open `ridendine_v2_live_routing/index.html` |
| Customer Web (React) | **Working prototype** | 8010 | `python3 -m http.server 8010 --directory apps/customer-web-react` |
| Customer Mobile (Expo) | **Working prototype** | 8082 | `cd apps/customer-mobile && npx expo start` |
| Dispatch Service | Prototype (not integrated) | 9002 | `node services/dispatch/server.js` |
| Routing Service | Prototype (not integrated) | 9003 | `node services/routing/server.js` |
| Realtime Gateway | Prototype (not integrated) | 9004 | `node services/realtime/server.js` |
| API Service | NestJS WIP + demo stub | 9001 | `cd services/api && npm run start:dev` (WIP) / `node services/api/server.js` (stub) |
| Database | Empty | 5432 | `docker-compose up` (no schema) |
| API Client SDK | Docs only | — | Not implemented |

---

## Safety Rule

> **All file edits require archiving to `edits/` directory:**
> ```bash
> cp file.js "edits/file.js.$(date +%Y-%m-%d_%H-%M-%S).reason"
> ```

---

## Repo Structure (working + prototypes)

```
ridendine_v2_live_routing/    # CORE DEMO (fully functional)
├── server.js                 # 1050 lines - auth, GPS, routing, dispatch, WS
├── index.html                # 1062 lines - interactive map UI
└── demo_state.json           # Persisted demo state

apps/
├── customer-web-react/       # React web tracker (working prototype)
├── customer-mobile/          # Expo RN tracker (working prototype)
├── customer-web/             # Legacy static demo
└── (other planned apps in roadmap only)

services/                     # Service split prototypes (NOT INTEGRATED)
├── api/                      # NestJS WIP + demo stub server.js
├── dispatch/server.js        # Scoring prototype
├── routing/server.js         # Provider prototype
├── realtime/server.js        # WS proxy prototype
└── shared/                   # Contracts

database/                     # EMPTY (docker-compose exists, no schema)
packages/api-client/          # DOCS ONLY (no implementation)
edits/                        # Archived file versions
docs/                         # Architecture/plan documents (mix of current + aspirational)
```

---

## Agent Roles

### 1. Core Demo Agent
**Scope:** `ridendine_v2_live_routing/`
**Status:** Fully functional

| File | Lines | Contains |
|------|-------|----------|
| `server.js` | 1050 | Auth, GPS ingestion, routing proxy, dispatch, batching, pricing, reliability scoring, WebSocket |
| `index.html` | 1062 | Leaflet map, driver animation, order controls, dashboard |

**Key APIs:**
- `POST /api/auth/login` → token generation
- `GET /api/dispatch` → full state snapshot
- `WebSocket /?token=...` → real-time updates
- `POST /api/assign` → dispatch logic

**Responsibilities:**
- WebSocket stability
- Routing/dispatch UI fixes
- Port 8081 management

---

### 2. Customer Apps Agent
**Scope:** `apps/customer-web-react/` + `apps/customer-mobile/`
**Status:** Working prototypes

| App | Entry | Features |
|-----|-------|----------|
| Web React | `app.js` (131 lines) | Leaflet map, ETA polling, status timeline |
| Mobile Expo | `App.js` (264 lines) | React Native Maps, deep linking |

**Dependencies:** Requires core server on 8081 (mobile needs LAN IP)

**Responsibilities:**
- Map + ETA + status timeline
- WebSocket reconnection logic
- Deep link handling (`ridendine://track?orderId=...`)

---

### 3. Backend Services Agent
**Scope:** `services/`
**Status:** Scaffolds with logic (NOT INTEGRATED)

| Service | Port | Lines | Implementation |
|---------|------|-------|----------------|
| `dispatch/server.js` | 9002 | 113 | Haversine scoring, driver assignment |
| `routing/server.js` | 9003 | 223 | OSRM/Mapbox/Google providers |
| `realtime/server.js` | 9004 | 84 | HTTP/WS proxy to core |
| `api/server.js` | 9001 | 28 | Stub (health check only) |

**Missing:** Inter-service communication, database integration, auth

**Responsibilities:**
- Maintain service contracts (`shared/contracts.js`)
- Provider abstraction
- Future: Wire services together with Redis/NATS

---

### 4. Docs Agent
**Scope:** All `*.md` files
**Status:** Mix of accurate ops docs + aspirational plans (see accuracy column)

| Doc | Purpose | Accuracy |
|-----|---------|----------|
| `README.md` | Ops runbook | Current |
| `DEVELOPMENTPLAN.md` | 16-week roadmap | Aspirational |
| `09_backend_architecture.md` | Service split plan | Aspirational |
| `02_database_schema.md` | SQL schema | Not implemented |
| `05_api_endpoint_specs.md` | API baseline | Partial match |
| `docs/architecture-overview.md` | Current vs planned architecture | Current (states gaps) |
| `docs/repository-structure.md` | Proposed repo layout | Draft/aspirational |
| `docs/project-setup-plan.md` | Setup process | Draft |

**Responsibilities:**
- Keep README aligned with code
- Update port/URL references after changes

---

## Skills

### Port Diagnostics
**Trigger:** Port collision or connection refused

```bash
# Find what's using a port
lsof -i :8081

# Kill process on port
kill $(lsof -t -i :8081)

# Check all RideNDine ports
lsof -i :8081 -i :8010 -i :8082 -i :9001 -i :9002 -i :9003 -i :9004
```

---

### WebSocket Troubleshooting
**Trigger:** Invalid frame header, auth failed, no markers

1. **Verify server running:**
   ```bash
   curl http://localhost:8081/health
   ```

2. **Check logs:**
   ```bash
   tail -f /tmp/ridendine_core.log
   ```

3. **Validate WS URL in UI matches server port**

4. **Check payload size** (large payloads can cause frame errors)

---

### Expo Mobile Debugging
**Trigger:** Mobile app can't connect

1. **Get LAN IP:**
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. **Update server URL in app to:** `http://<LAN_IP>:8081`

3. **Verify firewall allows 8081:**
   ```bash
   sudo ufw allow 8081
   ```

4. **Run Expo diagnostics:**
   ```bash
   cd apps/customer-mobile && npx expo-doctor
   ```

---

### File Edit Protocol
**Trigger:** Before any file modification

```bash
# 1. Archive current version
cp target.js "edits/target.js.$(date +%Y-%m-%d_%H-%M-%S).reason"

# 2. Create notes file (optional for major changes)
echo "Description of changes" > edits/target.js.$(date +%Y-%m-%d)_notes.txt

# 3. Make edits to original file
```

---

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `MAPBOX_TOKEN` | Core server | Mapbox routing API |
| `GOOGLE_MAPS_API_KEY` | Core server | Google Routes API |
| `OSRM_BASE_URL` | Core server | Self-hosted OSRM (optional) |

---

## Quick Start

```bash
# 1. Start core server
node ridendine_v2_live_routing/server.js &

# 2. Open demo UI
xdg-open ridendine_v2_live_routing/index.html

# 3. (Optional) Start customer web
python3 -m http.server 8010 --directory apps/customer-web-react &

# 4. (Optional) Start mobile
cd apps/customer-mobile && npm install && npx expo start
```

---

## Notes

- Core server persists state to `demo_state.json`
- Archived files stored in `edits/` directory
- Services in `services/` are NOT wired together yet
- Database layer is empty (docker-compose exists but no schema)
- `packages/api-client/` is documentation only
