# CLAUDE.md — RideNDine

Project context and conventions for Claude agents working on RideNDine.

---

## Project Overview

**RideNDine** is a home kitchen food delivery platform connecting:
- **Customers** → order food from local home chefs
- **Home Chefs** → prepare and sell homemade meals
- **Drivers** → deliver orders from chefs to customers
- **Platform** → handles dispatch, payments, tracking

**Current State:** Working demo with scaffolded microservices architecture.

---

## Implementation Status

| Layer | Status | Notes |
|-------|--------|-------|
| Core Demo | **Working** | Full-featured single-server demo on port 8081 |
| Customer Apps | **Working** | React web + Expo mobile prototypes |
| Service Scaffolds | Partial | Logic exists, not integrated |
| Database | Not started | Schema defined in docs, no implementation |
| Auth | Demo only | Hardcoded tokens, no JWT/refresh |
| Payments | Not started | Stripe Connect architecture defined |

See [AGENTS.md](../AGENTS.md) for detailed component status and run commands.

---

## Documentation Index

| Document | Purpose | Status |
|----------|---------|--------|
| [README.md](../README.md) | Quick start, troubleshooting | Current |
| [AGENTS.md](../AGENTS.md) | Agent roles, skills, file mappings | Current |
| [DEVELOPMENTPLAN.md](../DEVELOPMENTPLAN.md) | 16-week production roadmap | Aspirational |
| [01_stripe_connect_architecture.md](../01_stripe_connect_architecture.md) | Payment flow design | Planned |
| [02_database_schema.md](../02_database_schema.md) | PostgreSQL schema | Planned |
| [03_commission_settlement_contract.md](../03_commission_settlement_contract.md) | Revenue split rules | Planned |
| [04_developer_sprint_roadmap.md](../04_developer_sprint_roadmap.md) | Sprint breakdown | Planned |
| [05_api_endpoint_specs.md](../05_api_endpoint_specs.md) | REST API endpoints | Partial |
| [06_cooco_partner_interface.md](../06_cooco_partner_interface.md) | Delivery partner integration | Planned |
| [08_webhook_architecture.md](../08_webhook_architecture.md) | Webhook events | Planned |
| [09_backend_architecture.md](../09_backend_architecture.md) | Service split design | Planned |
| [10_customer_app_plan.md](../10_customer_app_plan.md) | Customer app phases | Partial |

---

## Project Conventions

### File Edit Protocol
Before modifying any file:
```bash
# 1. Archive to edits/ directory
cp file.js "edits/file.js.$(date +%Y-%m-%d_%H-%M-%S).reason"

# 2. (Optional) Create notes for major changes
echo "Description" > edits/file.js.$(date +%Y-%m-%d)_notes.txt

# 3. Make changes to original
```

### Code Standards
- **Language:** JavaScript/Node.js (backend), React/React Native (frontend)
- **Formatting:** Prettier (see IDE config)
- **No TypeScript yet** — planned for production phase
- **Comments:** Only where logic isn't self-evident

### Documentation Standards
- Keep docs aligned with actual code state
- Mark aspirational content clearly (Planned/Aspirational)
- Update ports/URLs after any changes

---

## Development Phases

From [DEVELOPMENTPLAN.md](../DEVELOPMENTPLAN.md):

| Phase | Weeks | Focus | Current Status |
|-------|-------|-------|----------------|
| 1. Foundation | 1-2 | Infrastructure, Database, Auth | Not started |
| 2. Core Features | 3-6 | Chef, Orders, Driver, Real-time | Demo only |
| 3. Frontend | 7-10 | Customer, Chef, Driver apps | Prototypes exist |
| 4. Admin & Polish | 11-12 | Admin panel, Reviews | Not started |
| 5. Testing & Security | 13-14 | Coverage, Security audit | Not started |
| 6. Launch | 15-16 | Production deploy, Beta | Not started |

**Current Position:** Pre-Phase 1 (working demo, no production infrastructure)

---

## Architecture Overview

### Current (Demo Mode)
```
ridendine_v2_live_routing/server.js (port 8081)
├── All features in one server
├── In-memory state (demo_state.json)
├── Hardcoded auth tokens
└── No database
```

### Target (Production Mode)
```
┌─────────────────────────────────────────┐
│           API Gateway / LB              │
├─────────────────────────────────────────┤
│  Auth  │  API  │ Dispatch │  Realtime  │
│  Svc   │  Svc  │   Svc    │    Svc     │
├─────────────────────────────────────────┤
│  PostgreSQL  │  Redis  │  Event Bus   │
└─────────────────────────────────────────┘
```

---

## Key Directories

```
ridendine_v2_live_routing/   → Working demo (start here)
apps/customer-web-react/     → React customer tracker
apps/customer-mobile/        → Expo RN customer app
services/                    → Microservice scaffolds
database/                    → Empty (schema in docs only)
packages/api-client/         → SDK scaffold (docs only)
edits/                       → Archived file versions
agents/                      → Agent configuration (this file)
```

---

## Quick Reference

### Ports
| Port | Service |
|------|---------|
| 8081 | Core demo server |
| 8010 | Customer web (dev) |
| 8082 | Expo bundler |
| 9001-9004 | Service scaffolds |
| 5432 | PostgreSQL (docker) |
| 6379 | Redis (docker) |

### Commands
```bash
# Start core demo
node ridendine_v2_live_routing/server.js

# Start customer web
python3 -m http.server 8010 --directory apps/customer-web-react

# Start mobile
cd apps/customer-mobile && npx expo start

# Start database (no schema yet)
docker-compose up
```

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `MAPBOX_TOKEN` | Mapbox routing API |
| `GOOGLE_MAPS_API_KEY` | Google Routes API |
| `OSRM_BASE_URL` | Self-hosted OSRM |

---

## Working With This Repo

1. **Always read before writing** — understand current state
2. **Archive before editing** — use `edits/` directory
3. **Check AGENTS.md** — for agent roles and file ownership
4. **Verify against code** — docs may be aspirational
5. **Update docs after changes** — keep README/AGENTS.md current

---

## Next Priority Actions

Based on current state and DEVELOPMENTPLAN.md:

1. **Database Layer** — Implement schema from `02_database_schema.md`
2. **Auth System** — JWT + refresh tokens
3. **Service Integration** — Wire scaffolds together
4. **API Service** — Replace stub with real implementation
