# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RideNDine is a multi-role delivery platform connecting customers, home chefs, and drivers. The repository has two operational modes:

1. **Core Demo (Working)** - Single-server demo in `ridendine_v2_live_routing/` with all features (auth, GPS, routing, dispatch, WebSocket) in one Node.js server
2. **Split Services (In Progress)** - NestJS-based microservices in `services/` that are scaffolded but not fully integrated

**Sources of truth:** README.md and AGENTS.md are operational references; other planning docs (DEVELOPMENTPLAN.md, numbered docs) are aspirational.

## Build & Development Commands

```bash
# Install dependencies (npm workspaces monorepo)
npm install

# Linting and formatting
npm run lint                    # ESLint on all .ts/.js files
npm run format                  # Prettier format all files
npm run format:check            # Check formatting without changes

# Run all services concurrently (split services mode)
npm run dev

# Run individual services
npm run dev:api                 # NestJS API service (port 9001)
npm run dev:dispatch            # Dispatch service (port 9002)
npm run dev:routing             # Routing service (port 9003)
npm run dev:realtime            # Realtime gateway (port 9004)

# Build all workspaces
npm run build

# Run all tests across workspaces
npm run test
```

### API Service Commands (services/api/)

```bash
cd services/api
npm run start:dev               # Development with watch mode
npm run start:debug             # Debug mode
npm run build                   # Build for production
npm run test                    # Run Jest tests
npm run test:watch              # Watch mode
npm run test:cov                # Coverage report
npm run test:e2e                # End-to-end tests
```

### Docker Commands

```bash
# Docker Compose (Full Stack)
npm run docker:build            # Build all service images
npm run docker:build:nocache    # Clean build without cache
npm run docker:up               # Start all services (attached)
npm run docker:up:detached      # Start in background
npm run docker:down             # Stop all services
npm run docker:restart          # Restart all services
npm run docker:logs             # View logs from all services
npm run docker:ps               # Check container status
npm run docker:clean            # Remove containers, volumes, images

# Individual services
docker-compose build api        # Build specific service
docker-compose restart api      # Restart specific service
docker-compose logs -f api      # Follow logs for service
```

### Database Commands

```bash
npm run db:up                   # Start Postgres + Redis containers
npm run db:down                 # Stop database containers
npm run db:migrate              # Apply all SQL migrations (local)
npm run db:migrate:docker       # Run migrations in Docker container
npm run db:seed                 # Seed test data
npm run db:reset                # Full reset: down, up, migrate, seed
```

### Core Demo (Quick Start)

```bash
# Start core demo server
node ridendine_v2_live_routing/server.js

# Open demo UI
xdg-open ridendine_v2_live_routing/index.html

# Customer web (React prototype)
python3 -m http.server 8010 --directory apps/customer-web-react

# Customer mobile (Expo)
cd apps/customer-mobile && npm install && npx expo start
```

## Architecture

### Monorepo Structure

```
ridendine_v2_live_routing/     # Working single-server demo (port 8081)
├── server.js                  # ~1050 lines: auth, GPS, routing, dispatch, WS
├── index.html                 # Interactive map UI
└── demo_state.json            # Persisted demo state

services/                      # Microservice scaffolds (NOT INTEGRATED)
├── api/                       # NestJS API (auth, users, orders, etc.)
├── dispatch/                  # Assignment + batching logic
├── routing/                   # Provider abstraction (OSRM/Mapbox/Google)
└── realtime/                  # WebSocket gateway

apps/                          # Frontend applications
├── customer-web-react/        # React web tracker (working prototype)
├── customer-mobile/           # Expo RN app (working prototype)
├── chef-dashboard/            # Chef management (scaffold)
├── driver-mobile/             # Driver app (scaffold)
└── admin-web/                 # Admin panel (scaffold)

database/
├── migrations/                # SQL migrations (001-005)
├── seeds/                     # Test data
└── init/                      # Docker init scripts

packages/
└── shared/                    # Shared contracts and types
```

### NestJS API Structure (services/api/src/)

Modular architecture with feature-based directories:

- `auth/` - JWT authentication, guards
- `users/` - User management
- `chefs/` - Chef profiles, menu management
- `orders/` - Order lifecycle
- `drivers/` - Driver management
- `dispatch/` - Assignment logic
- `stripe/` - Payment integration
- `realtime/` - WebSocket gateway
- `common/` - Shared decorators, pipes, filters

### Port Reference

| Port | Service                 |
| ---- | ----------------------- |
| 8081 | Core demo server        |
| 9001 | API service (NestJS)    |
| 9002 | Dispatch service        |
| 9003 | Routing service         |
| 9004 | Realtime gateway        |
| 8010 | Customer web dev server |
| 8082 | Expo bundler            |
| 5432 | PostgreSQL              |
| 6379 | Redis                   |
| 8080 | Adminer (DB UI)         |

## File Edit Convention

**Before modifying any file, archive the current version:**

```bash
cp file.js "edits/file.js.$(date +%Y-%m-%d_%H-%M-%S).reason"
```

Archived versions are stored in the `edits/` directory.

## TypeScript Configuration

- Target: ES2022
- Strict mode enabled with all strict flags
- Path alias: `@ridendine/shared/*` → `services/shared/*`
- Decorators enabled for NestJS
- Test files excluded from compilation (\*.spec.ts)

## Environment Variables

Key variables (see `.env.example` for full list):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` / `REFRESH_TOKEN_SECRET` - Auth secrets
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payment integration
- `MAPBOX_TOKEN` / `GOOGLE_MAPS_API_KEY` - Routing providers

## Key API Endpoints (Core Demo)

- `POST /api/auth/login` - Token generation
- `GET /api/dispatch` - Full state snapshot
- `POST /api/assign` - Dispatch logic
- `WebSocket /?token=...` - Real-time updates

## Week 2 Documentation (NEW - 2026-01-31)

**Comprehensive API & Operations Documentation:**

- [docs/API_INTEGRATION_GUIDE.md](docs/API_INTEGRATION_GUIDE.md) - Complete API integration guide (900+ lines, 25+ examples)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deployment procedures for all environments (1000+ lines)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - 30+ common issues with solutions (700+ lines)
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Quick reference for developers

**Operational Runbooks:**

- [docs/RUNBOOK_SERVICE_RESTART.md](docs/RUNBOOK_SERVICE_RESTART.md) - Graceful service restart procedures
- [docs/RUNBOOK_DATABASE_RECOVERY.md](docs/RUNBOOK_DATABASE_RECOVERY.md) - Database disaster recovery
- [docs/RUNBOOK_PERFORMANCE_DEGRADATION.md](docs/RUNBOOK_PERFORMANCE_DEGRADATION.md) - Performance troubleshooting
- [docs/RUNBOOK_SCALING.md](docs/RUNBOOK_SCALING.md) - Horizontal and vertical scaling
- [docs/RUNBOOK_EMERGENCY_PROCEDURES.md](docs/RUNBOOK_EMERGENCY_PROCEDURES.md) - Critical incident response

## Testing

Tests use Jest with ts-jest transform. Run from service directories:

```bash
# Single test file
cd services/api && npm run test -- path/to/file.spec.ts

# Watch specific file
cd services/api && npm run test:watch -- path/to/file.spec.ts
```

## Troubleshooting

```bash
# Find process on port
lsof -i :8081

# Kill process on port
kill $(lsof -t -i :8081)

# Check all RideNDine ports
lsof -i :8081 -i :9001 -i :9002 -i :9003 -i :9004

# View core server logs
tail -f /tmp/ridendine_core.log

# Get LAN IP for mobile testing
hostname -I | awk '{print $1}'
```
