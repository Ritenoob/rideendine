# AGENTS.md — RideNDine Repo Guidance

This file defines agent roles, skills, and workflows optimized for the RideNDine repo.

## Repo Architecture (Re-analysis)
### Core Demo (Single-Port)
- `ridendine_v2_live_routing/server.js` contains:
  - Auth (role-scoped tokens)
  - GPS ingestion + latest location
  - Routing proxy (OSRM/Mapbox/Google)
  - Dispatch + batching
  - Pricing + reliability scoring
  - Alerts + summary metrics
  - WebSocket realtime
- `ridendine_v2_live_routing/index.html` is the main dispatch UI

### Customer Apps
- `apps/customer-web/` simple HTML tracker
- `apps/customer-web-react/` React-based customer tracker
- `apps/customer-mobile/` Expo RN customer app (deep links + map)

### Service Split (Scaffold)
- `services/api/`, `services/dispatch/`, `services/routing/`, `services/realtime/` are scaffolds

### Docs (Source of Truth)
- `README.md` (full ops/runbook)
- `09_backend_architecture.md` (service split plan)
- `10_customer_app_plan.md` (customer app roadmap)
- `05_api_endpoint_specs.md` (API baseline)
- `02_database_schema.md` (DB baseline)

---

## Required Safety Rule (Repo Convention)
- **Every edit must create a timestamped backup and a short “why” note.**
  - Format: `filename.bak.YYYY-MM-DD_HH-MM-SS.reason`
  - Note must describe what changed and why.

---

# Agent Roles

## 1) Core Demo Agent (ridendine_v2_live_routing)
**Focus:** Maintain single-core demo server + UI
**Primary files:**
- `ridendine_v2_live_routing/index.html`
- `ridendine_v2_live_routing/server.js`

**Responsibilities:**
- Keep WebSocket feed stable
- Fix routing/dispatch UI
- Maintain ports and defaults (currently 8081)

---

## 2) Customer Web Agent
**Focus:** Customer web tracking UX
**Primary files:**
- `apps/customer-web/index.html`
- `apps/customer-web-react/app.js`
- `apps/customer-web-react/style.css`

**Responsibilities:**
- Map + ETA + status timeline
- WebSocket reliability

---

## 3) Customer Mobile Agent (Expo)
**Focus:** Mobile tracking UX
**Primary files:**
- `apps/customer-mobile/App.js`
- `apps/customer-mobile/app.json`

**Responsibilities:**
- Deep linking
- Live tracking + map
- Device IP networking

---

## 4) Backend Split Agent (services/)
**Focus:** Production-scale service split
**Primary files:**
- `services/api/server.js`
- `services/dispatch/server.js`
- `services/routing/server.js`
- `services/realtime/server.js`
- `services/shared/contracts.js`

**Responsibilities:**
- Maintain service contracts
- Routing providers
- Dispatch scoring logic

---

## 5) Docs & Architecture Agent
**Focus:** Keep repo docs aligned with code
**Primary files:**
- `README.md`
- `09_backend_architecture.md`
- `10_customer_app_plan.md`
- `05_api_endpoint_specs.md`
- `02_database_schema.md`

---

# Skills (Custom / Suggested)

## Skill: “Port Orchestration”
**Use when:** ports collide (8081, 8082, 9002…)
**Workflow:**
- Check with `lsof -i :PORT`
- Pick next available port
- Update UI defaults + save settings
- Restart required services only

## Skill: “WebSocket Diagnostics”
**Use when:** invalid frame header / auth failed / no markers
**Workflow:**
- Verify server listening
- Confirm ws URL matches UI
- Inspect `/tmp/ridendine_*.log`
- Validate payload sizes and frame encoding

## Skill: “Backup Compliance”
**Use when:** any file edit
**Workflow:**
- Create `.bak` copy with timestamp + reason
- Then apply patch/change

## Skill: “Expo Deploy Aid”
**Use when:** mobile tests fail
**Workflow:**
- Use LAN IP instead of localhost
- Confirm deep links in `app.json`
- Run `expo doctor`

## Skill: “Doc Sync”
**Use when:** behavior changes
**Workflow:**
- Update README + architecture notes
- Keep ports, URLs, and flows in sync

---

# MCP Servers
None configured. Add here if introduced.

---

# Script Hooks (Recommended)
- `scripts/run-core.sh` → start core demo server (8081)
- `scripts/run-web.sh` → start customer web server
- `scripts/run-mobile.sh` → `expo start`

---

# Operational Defaults
- Core demo server: **8081**
- Customer web server: **8010**
- Expo bundler: **8082**
- Dispatch/Routing services: **9002/9003** (optional)

---

# Notes
- Many backups exist; keep unless asked to prune.
- `apps/customer-mobile/node_modules` is present (Expo scaffold).
- Use absolute paths in instructions when possible.
